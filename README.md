# image-upload

[Express](https://expressjs.com) middleware to process and store image uploads.

* Integrates with any [abstract-blob-store](https://github.com/maxogden/abstract-blob-store).
* Uses [fs-blob-store](https://github.com/mafintosh/fs-blob-store) if none is provided.
* Handles `multipart/form-data` with [multer](https://github.com/expressjs/multer).
* Image processing by [gm](https://github.com/aheckmann/gm) and therefore [GraphicsMagick](http://www.graphicsmagick.org) must be installed. `brew install graphicsmagick` on a Mac with [Homebrew](https://brew.sh) installed.

```javascript
const express = require('express');
const imageUpload = require('image-upload');

const app = express();

app.use(express.static(__dirname + '/public'));

const imageUploadOptions = {
	fieldName: 'image',
	fileStorePath: __dirname + '/public/files',
	processes: {
		thumbnail: {
			cover: true,
			width: 128,
			height: 128,
			mediaType: 'image/jpeg',
			quality: 75
		},
		medium: {
			contain: true,
			width: 512,
			height: 512,
			mediaType: 'image/jpeg',
			quality: 75
		},
		large: {
			contain: true,
			width: 1280,
			height: 1280,
			mediaType: 'image/jpeg',
			quality: 75
		}
	}
};

app.post('/images', imageUpload(imageUploadOptions), (req, res) => {
	res.send(req.body.files.map(file =>
		`<h1 style="margin-top:50px;">${file.process}:</h1>
		<h2>${file.url}</h2>
		<img src="${file.url}"/>`
	).join(''));
});

app.listen(3000);
```
