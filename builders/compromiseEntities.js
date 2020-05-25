const nlp = require('compromise')

exports.getCompromise = (content) => {
	let additionalWords = {
		'US': 'Country'
	}
	return nlp(content, additionalWords)
}

exports.getPlaces = (cmd, args) => {
	let compromisedContent = this.getCompromise(cmd.content)
	let places = compromisedContent.places().json()
	if (places && places[0]) {
		places = places[0].terms
		if (places.length > 0) {
			args = [];
			for (let i = 0; i < places.length; i++) {
				args.push(places[i].text)
			}
		}
	} else {
		throw new Error('No Information for given Country found.')
	}
	
	return args
}