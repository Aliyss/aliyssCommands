/* Global Packages */
const merge = require('deepmerge');
const tableToJson = require('tabletojson');

const webrequest = require("../~modules/webrequest");

exports.information = {
	total: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Total**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: 
						"**Cases:** " + mainData['TotalCases'] +
						"\n**Deaths:** " + mainData['TotalDeaths'] +
						"\n**Recovered:** " + mainData['TotalRecovered'],
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
						"**New Cases:** " + (mainData['NewCases'] ? mainData['NewCases'] : 0) +
						"\n**New Deaths:** " + (mainData['NewDeaths'] ? mainData['NewDeaths'] : 0) +
						"\n**New Recovered:** " + (mainData['NewRecovered'] ? mainData['NewRecovered'] : 'Unsupported'),
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
						"**Active:** " + mainData['ActiveCases'] +
						"\n**Critical:** " + mainData['Serious,Critical'] +
						"\n**Cases/1M People:** " + mainData['Tot Cases/1M pop'],
					inline: true
				}
			]
		}
	},
	list: function (mainData, arg) {
		let field_val = [];

		for (let n = 0; n < 5; n++) {
			field_val.push({
				name: `_\n_**${n + 1}. ${mainData[n]['Country,Other']}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
				value: 
					"**Cases:** " + mainData[n]['TotalCases'] + 
					"\n**Cases/1M People** " + mainData[n]['Tot Cases/1M pop'],
				inline: false
			})
		}
		
		if (arg) {
			mainData = mainData.filter((el) => {
				return el['Country,Other'].toLowerCase() === arg;
			})[0]
			if (mainData && mainData['index'] >= 5) {
				field_val.push({
					name: `_\n_**${mainData['index'] + 1}. ${mainData['Country,Other']}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"**Cases:** " + mainData['TotalCases'] +
						"\n**Cases/1M People** " + mainData['Tot Cases/1M pop'],
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
			description: null,
			timestamp: null,
			thumbnail: null,
		};

		let embed_arr = [
			this.total(mainData),
			this.new(mainData),
			this.other(mainData),
			override_embed
		];

		return merge.all(embed_arr)
	},
}

exports.help = {
	name: "Corona",
	description: "Gets information about the Corona Virus.",
	arguments: [],
	optional: ['{CountryName}'],
	information: Object.keys(this.information)
};

exports.run = async (cmd, _instance) => {
	
	let information = this.information;

	let function_name = "info";
	
	let propertyNames = Object.keys(information).filter(function (propertyName) {
		return propertyName.indexOf(cmd.usableContent[0]) === 0;
	});

	if (propertyNames.length !== 0) {
		function_name = propertyNames[0];
		cmd.usableContent.shift()
	} else {
		function_name = "info";
	}

	let addition = 'all'
	
	let arg = ''

	if (_instance.users[cmd.author.id].context.coronaLocation) {
		addition = 'countries'
		arg = _instance.users[cmd.author.id].context.coronaLocation
	}

	if (function_name === 'list') {
		addition = 'countries'
	}
	
	if (cmd.usableContent[0]) {
		addition = 'countries'
		arg = cmd.usableContent.join(" ").toLowerCase()
		if ((arg === 'all' || arg === 'world') && function_name !== 'list') {
			addition = 'all'
		}
	}
	
	let mainData = await webrequest.getData(`https://mafuyu.kireisubs.org/`)

	if (!mainData && mainData.length <= 100) {
		throw new Error('Server is unreachable.')	
	}
	
	mainData = tableToJson.convert(mainData);

	mainData = mainData[0].map((el, i) => {
		el['TotalCases'] = el['TotalCases'] ? parseInt(el['TotalCases'].replace(/,/g, '')) : 0
		el['TotalDeaths'] = el['TotalDeaths'] ? parseInt(el['TotalDeaths'].replace(/,/g, '')) : 0
		el['TotalRecovered'] =  el['TotalRecovered'] ? parseInt(el['TotalRecovered'].replace(/,/g, '')) : 0
		el['NewCases'] = el['NewCases'] ? parseInt(el['NewCases'].replace(/,/g, '')) : 0
		el['NewDeaths'] = el['NewDeaths'] ? parseInt(el['NewDeaths'].replace(/,/g, '')) : 0
		el['NewRecovered'] = el['NewRecovered'] ? parseInt(el['NewRecovered'].replace(/,/g, '')) : 0
		el['ActiveCases'] = el['ActiveCases'] ? parseInt(el['ActiveCases'].replace(/,/g, '')) : 0
		el['Serious,Critical'] = el['Serious,Critical'] ? parseInt(el['Serious,Critical'].replace(/,/g, '')) : 0
		el['Tot Cases/1M pop'] = el['Tot Cases/1M pop'] ? parseFloat(el['Tot Cases/1M pop'].replace(/,/g, '')) : 0
		el['index'] = i;
		return el
	})
	
	if (addition === 'all') {
		mainData = mainData.reduce(function(previousValue, currentValue) {
			return {
				['Country,Other'] : 'the World',
				['TotalCases'] : previousValue['TotalCases'] + currentValue['TotalCases'],
				['TotalDeaths'] : previousValue['TotalDeaths'] + currentValue['TotalDeaths'],
				['TotalRecovered'] : previousValue['TotalRecovered'] + currentValue['TotalRecovered'],
				['NewCases'] : previousValue['NewCases'] + currentValue['NewCases'],
				['NewDeaths'] : previousValue['NewDeaths'] + currentValue['NewDeaths'],
				['NewRecovered'] : previousValue['NewRecovered'] + currentValue['NewRecovered'],
				['ActiveCases'] : previousValue['ActiveCases'] + currentValue['ActiveCases'],
				['Serious,Critical'] : previousValue['Serious,Critical'] + currentValue['Serious,Critical'],
				['Tot Cases/1M pop'] : 'Unsupported',
			}
		});
	}
	
	if (function_name !== 'list' && addition === 'countries'){
		mainData = mainData.filter((el) => {
			return el['Country,Other'].toLowerCase() === arg;
		})[0]
		if (!mainData) {
			throw new Error('No Information for given Country found.')
		}
		if (!_instance.users[cmd.author.id].context.coronaLocation) {
			_instance.users[cmd.author.id].context.coronaLocation = arg
		}
	} else {
		mainData['Country,Other'] = 'the World'
	}
	
	let base_embed = embedding(mainData);
	
	return await merge(base_embed, await information[function_name](mainData, arg))
	
}

const embedding = (mainData) => {
	return {
		title: 'Information to COVID-19 for ' + mainData['Country,Other'],
		description: null,
		color: 3093208,
		footer: null
	}
}

