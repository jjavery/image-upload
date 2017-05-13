
const fs = require('fs');
const assert = require('chai').assert;
const request = require('request');
const express = require('express');

const imageUpload = require('../');

const app = express();

app.listen(3000);

describe('image-upload', () => {

	it('uploads an image', done => {
		app.post('/upload', imageUpload({ fileStorePath: __dirname + '/fixtures/public/files' }), (req, res) => {
			assert.isNotNull(req.body.files);
			assert.isArray(req.body.files);
			assert.equal(req.body.files.length, 2);

			done();
		});

		const options = {
			formData: {
				image: fs.createReadStream(__dirname + '/fixtures/image.jpg')
			}
		};

		request.post('http://localhost:3000/upload', options, err => err && done(err));
	});
});

