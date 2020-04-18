const nlp = require('compromise')

exports.getCompromise = (content) => {
	return nlp(content)
}