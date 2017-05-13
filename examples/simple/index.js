const express = require('express');
const imageUpload = require('../../');

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
