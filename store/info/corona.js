/* Global Packages */
const merge = require('deepmerge');

const webrequest = require("../~modules/webrequest");

const hiddenKeys = ['world']
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
						"\n**New Recovered:** " + (mainData['todayRecovered'] ? mainData['todayRecovered'] : 'No Info'),
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
						"**Active:** " + (mainData['cases'] - (mainData['recovered'] + mainData['deaths'])) +
						"\n**Critical:** " + mainData['critical'],
					inline: true
				}
			]
		}
	},
	list: function (mainData) {
		let field_val = [];

		for (let n = 0; n < 10; n++) {
			field_val.push({
				name: `_\n_**${n + 1}. ${mainData[n].country}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
				value: "Cases: " + mainData[n]['cases'],
				inline: false
			})
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

	if (cmd.usableContent[0] || function_name === 'list') {
		addition = 'countries'
		arg = cmd.usableContent.join(" ").toLowerCase()
	}
	
	let mainData = await webrequest.getData(`https://corona.lmao.ninja/${addition}`)

	if (!mainData) {
		throw new Error('Server is unreachable.')	
	} else if (!JSON.parse(mainData)) {
		throw new Error('Server Information is invalid.')
	}
	
	mainData = JSON.parse(mainData)
	
	if (addition === 'all') {
		function_name = 'total'
	}
	
	if (function_name !== 'list' && addition === 'countries'){
		mainData = mainData.filter((el) => {
			return el['country'].toLowerCase() === arg;
		})[0]
	}

	if (!mainData) {
		throw new Error('Invalid Country as Input.')
	}
	
	let base_embed = embedding(mainData);
	
	return await merge(base_embed, await information[function_name](mainData))
	
}

const embedding = (mainData) => {
	return {
		title: 'Information to COVID-19',
		description: null,
		color: 3093208,
		footer: null
	}
}

