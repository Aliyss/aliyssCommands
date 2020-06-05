const webrequest = require("./webrequest");
const googleAuthentication = require('../../config/keys/googleAuthentication.json')

exports.getData = async (query) => {
	let knowledgeURL = `https://kgsearch.googleapis.com/v1/entities:search?key=${googleAuthentication.knowledge}` + query
	return await webrequest.getData(knowledgeURL)
}