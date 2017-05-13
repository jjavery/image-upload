
const path = require('path');
const crypto = require('crypto');

const gm = require('gm');
const mime = require('mime');
const async = require('async');
const multer = require('multer');
const fileStore = require('fs-blob-store');

const defaultProcesses = {
	large: {
		contain: true,
		width: 1280,
		height: 1280,
		mediaType: 'image/jpeg',
		quality: 75
	},
	small: {
		cover: true,
		width: 128,
		height: 128,
		mediaType: 'image/jpeg',
		quality: 75
	}
};

/**
 * Express middleware to process and store image uploads.
 */
function imageUpload(options) {
	options = options || {};

	const fieldName = options.fieldName || 'image';

	const store = options.store || fileStore(options.fileStorePath);
	const storeName = options.storeName || options.store ? '' : 'filestore';
	const storeUrl = options.storeUrl || '/files';

	const pathRegExp = new RegExp(options.pathMatch || '(...).*');
	const pathReplace = options.pathReplace || '$1/$&';

	const processes = (options.processes ? Object.assign({}, options.processes) : null) || defaultProcesses;

	Object.keys(processes).forEach(name => {
		const process = processes[name];
		process.name = name;
		process.extension = mime.extension(process.mediaType);
	});

	const multerSingle = multer().single(fieldName);

	return (req, res, next) => {

		req.body = req.body || {};

		multerSingle(req, res, err => {
			if (err) { return next(err); }

			if (!req.file) { return next(); }

			const buffer = req.file.buffer;

			const hash = createHash(buffer, 'sha1', 'hex');

			req.body.filename = req.file.originalname;
			req.body.hash = hash;
			req.body.files = [];

			async.eachLimit(processes, 1, (process, callback) => {
				const filePath = createFilePath(pathRegExp, pathReplace, hash, process);
				const url = `${storeUrl}/${filePath}`;

				req.body.files.push({
					store: storeName,
					process: process.name,
					key: filePath,
					url: url
				});

				const writeStream = store.createWriteStream(filePath);

				writeStream.once('error', callback);
				writeStream.once('finish', callback);

				processImage(buffer, writeStream, process);

			}, next);
		});

	}
}

function createFilePath(pathRegExp, pathReplace, hash, process) {
	const dirPath = hash.replace(pathRegExp, pathReplace);
	const filePath = `${dirPath}/${process.name}.${process.extension}`;

	return filePath;
}

function createHash(buffer, algorithm, encoding) {
	const hash = crypto.createHash(algorithm);

	hash.update(buffer);

	return hash.digest(encoding);
}

/**
 * Process an input image and produce an output image.
 * @param {ReadableStream|Buffer|string} input - The image to read from.
 * @param {WritableStream|Buffer|string} output - The stream, buffer, or file path to write to.
 * @param {Object} process - Image processing options.
 * @param {function} callback - Called when image processing is complete. Not called if output is a stream.
 */
function processImage(input, output, process, callback) {
	process = process || {};
	const cover = process.cover || false;
	const contain = process.contain || false;
	const gravity = process.gravity || 'Center';
	const width = process.width || 1024;
	const height = process.height || 1024;
	const extension = process.extension || '.jpeg';
	const quality = process.quality || 75;
	const strip = process.strip === false ? false : true;

	const image = gm(input);

	image.setFormat(extension);
	image.quality(quality);
	image.autoOrient();

	if (cover) {
		// Image will be scaled and cropped to fit width and height while
		// preserving aspect ratio
		image.geometry(width, height, '^');
		image.gravity(gravity);
		image.crop(width, height);
	}

	if (contain) {
		// Image will be scaled to fit within width and height while preserving
		// aspect ratio
		image.geometry(width, height, '>');
	}

	if (strip) {
		// Remove EXIF and other metadata
		image.strip();
		image.noProfile();
	}

	if (typeof output == 'string') {
		image.write(output, callback);
	}
	else if (isStream(output)) {
		image.stream().pipe(output);
	}
	else {
		image.toBuffer(callback);
	}
}

function isStream(obj) {
	return obj != null && typeof obj == 'object' && typeof obj.pipe == 'function';
}

module.exports = imageUpload;
