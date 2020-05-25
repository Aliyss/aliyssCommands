/* Global Packages */
const https = require("https");
const http = require("http");

exports.getData = (url) => {
	let client = https;
	if (url.startsWith('http:')) {
		client = http
	}
	return new Promise(((resolve, reject) => {
		client.get(url, (resp) => {
			let data = '';

			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				resolve(data);
			});

		}).on('error', (err) => {
			reject(err.message)
		});
	}))
}

exports.postData = (url, input) => {

	let inputData = JSON.stringify(input)

	const options = {
		hostname: url,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': inputData.length
		}
	}

	let client = https;
	if (url.startsWith('http:')) {
		client = http
	}
	
	return new Promise(((resolve, reject) => {
		const req = client.request(options, (resp) => {
			let data = '';
			
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				resolve(data);
			});

		}).on('error', (err) => {
			reject(err.message)
		});
		
		req.write(inputData);

		req.end();
	}))
}

exports.putData = (url, input) => {

	let urlSplit = url.split('/')
	let urlHostname = urlSplit[2]
	urlSplit.shift()
	urlSplit.shift()
	urlSplit.shift()
	let urlPath = '/' + urlSplit.join('/')
	let inputData = JSON.stringify(input)

	const options = {
		hostname: urlHostname,
		path: urlPath,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		agent: new https.Agent({
			rejectUnauthorized: false,
		}),
	}

	let client = https;
	if (url.startsWith('https:')) {
		client = http
	}

	return new Promise(((resolve, reject) => {
		const req = client.request(options, (resp) => {
			let data = '';

			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				resolve(data);
			});

		}).on('error', (err) => {
			reject(err.message)
		});

		req.write(inputData);

		req.end();

	}))
}