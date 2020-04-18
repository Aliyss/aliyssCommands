/* Global Packages */
const merge = require('deepmerge');
const { propertyNames } = require('../../builders');

const webrequest = require("../../modules/webrequest");
const { compromiseEntities } = require("../../builders");

exports.information = {
	total: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Total**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: 
						"**Cases:** " + mainData['cases'] +
						"\n**Deaths:** " + mainData['deaths'] +
						"\n**Recovered:** " + mainData['recovered'],
					inline: true
				}
			]
		}
	},
	new: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**New**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"**New Cases:** " + mainData['todayCases'] +
						"\n**New Deaths:** " + mainData['todayDeaths'] +
						"\n**New Recovered:** " + (mainData['todayRecovered'] ? mainData['todayRecovered'] : 'Unsupported'),
					inline: true
				}
			]
		}
	},
	other: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Other**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"**Active:** " + mainData['active'] +
						"\n**Critical:** " + mainData['critical'] +
						"\n**Tests:** " + mainData['tests'],
					inline: true
				}
			]
		}
	},
	million: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Per Million**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"\n**Cases/1M People:** " + mainData['casesPerOneMillion'] +
						"\n**Deaths/1M People:** " + mainData['deathsPerOneMillion'] +
						"\n**Tests/1M People:** " + mainData['testsPerOneMillion'],
					inline: true
				}
			]
		}
	},
	list: function (mainData, arg) {

		mainData.sort((a, b) => b['cases'] - a['cases']);
		
		mainData = mainData.map((el, i) => {
			el['index'] = i
			return el
		});
		
		let field_val = [];

		for (let n = 0; n < 5; n++) {
			field_val.push({
				name: `_\n_**${n + 1}. ${mainData[n]['country']}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
				value: 
					"**Cases:** " + mainData[n]['cases'] + 
					"\n**Cases/1M People** " + mainData[n]['casesPerOneMillion'],
				inline: false
			})
		}
		
		if (arg) {
			mainData = mainData.filter((el) => {
				return el['country'].toLowerCase() === arg;
			})[0]
			if (mainData && mainData['index'] >= 5) {
				field_val.push({
					name: `_\n_**${mainData['index'] + 1}. ${mainData['country']}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"**Cases:** " + mainData['cases'] +
						"\n**Cases/1M People** " + mainData['casesPerOneMillion'],
					inline: false
				})
			}
			
		}
		
		return {
			fields: field_val,
		}	
	},
	info: function (mainData) {
		let override_embed = {
			description: null
		};

		let embed_arr = [
			this.total(mainData),
			this.new(mainData),
			this.other(mainData),
			this.million(mainData),
			override_embed
		];

		return merge.all(embed_arr)
	},
}

exports.help = {
	name: "Corona Info",
	description: "Gets information about the Corona Virus.",
	arguments: [],
	optional: ['{CountryName}'],
	information: Object.keys(this.information)
};

exports.run = async (cmd, _instance) => {

	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);

	let addition = 'all'
	
	let arg = ''

	if (_instance.users[cmd.author.id].context.coronaLocation) {
		addition = 'countries'
		arg = _instance.users[cmd.author.id].context.coronaLocation.toLowerCase()
	}

	if (cmd.nlp) {
		let compromisedContent = compromiseEntities.getCompromise(cmd.content)
		let places = compromisedContent.places().json()
		if (places) {
			places = places[0].terms
			if (places.length > 0) {
				args = [];
				for (let i = 0; i < places.length; i++) {
					args.push(places[i].text)
				}
			}
		}
	}

	if (function_name === 'list') {
		addition = 'countries'
	}

	let search = arg;
	
	if (args[0]) {
		addition = 'countries'
		arg = args.join(" ").toLowerCase();
		search = arg;
		if ((arg === 'all' || arg === 'world') && function_name !== 'list') {
			search = ''
		}
	}

	if (function_name === 'list') {
		search = ''
	}
	
	let mainData = await webrequest.getData(`https://corona.lmao.ninja/v2/` + addition + "/" + search)

	if (!mainData || mainData.length <= 50) {
		throw new Error('Server is unreachable.')
	}
	
	if (!JSON.parse(mainData)) {
		throw new Error('No Information for given Country found.')
	}

	mainData = JSON.parse(mainData)
	
	if (search !== '') {
		if (!_instance.users[cmd.author.id].context.coronaLocation) {
			_instance.users[cmd.author.id].context.coronaLocation = arg
		}
	} else if (function_name !== 'list') {
		let secData = await webrequest.getData(`https://corona.lmao.ninja/v2/all`)
		if (!secData || secData.length <= 50) {
			throw new Error('Server is unreachable.')
		}

		if (!JSON.parse(secData)) {
			throw new Error('No Information for given Country found.')
		}

		secData = JSON.parse(secData)
		tempData = mainData.reduce(function(previousValue, currentValue) {
			return {
				['country'] : 'the World',
				['cases'] : previousValue['cases'] + currentValue['cases'],
				['deaths'] : previousValue['deaths'] + currentValue['deaths'],
				['recovered'] : previousValue['recovered'] + currentValue['recovered'],
				['todayCases'] : previousValue['todayCases'] + currentValue['todayCases'],
				['todayDeaths'] : previousValue['todayDeaths'] + currentValue['todayDeaths'],
				['todayRecovered'] : previousValue['todayRecovered'] + currentValue['todayRecovered'],
				['active'] : previousValue['active'] + currentValue['active'],
				['critical'] : previousValue['critical'] + currentValue['critical'],
				['tests'] : previousValue['tests'] + currentValue['tests']
			}
		});
		mainData = { ...secData, ...tempData }
	} else if (function_name === 'list') {
		mainData['country'] = 'the World'
	}
	
	if (!mainData['country']) {
		throw new Error('No Information for given Country found.')
	}
	
	let base_embed = embedding(mainData);
	
	return await merge(base_embed, await exports.information[function_name](mainData, arg))
	
}

const embedding = (mainData) => {
	return {
		title: 'Information to COVID-19 for ' + mainData['country'],
		description: null,
		color: 3093208,
		footer: {
			text: "Last Updated"
		},
		timestamp: mainData['updated'] ? mainData['updated'] : "No Info",
		thumbnail: {
			url: mainData['countryInfo'] ? mainData['countryInfo']['flag'] : null
		}
	}
}

