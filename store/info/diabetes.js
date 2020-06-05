/* Global Packages */
const { MessageAttachment, MessageEmbed } = require("discord.js");

const merge = require('deepmerge');
const { propertyNames } = require('../../builders');

const { webrequest, chart } = require("../../modules");
const asciichart = require ('asciichart');

if (global.CanvasGradient === undefined) {
	global.CanvasGradient = function() {};
}


exports.information = {
	current: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Current Blood Sugar**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: 
						"**mmol/L:** " + (mainData["bgs"][0]['sgv']) +
						"\n**mg/dL:** " + (parseInt(mainData["bgs"][0]['sgv']) * 18),
					inline: true
				}
			]
		}
	},
	trend: function (mainData) {
		return {
			fields: [
				{
					name: "_\n_**Current Trend**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"**Direction:** " + (mainData["bgs"][0]['direction']) +
						"\n**Trend:** " + (mainData["bgs"][0]['trend']),
					inline: true
				}
			]
		}
	},
	graph: function (graphData, args, _instance) {

		let s = []
		let l = []
		for (let i = 0; i < graphData.length; i++) {
			s.push((graphData[i]['sgv'] / 18));
			let dateBG = new Date(graphData[i]['date'])
			l.push(("0" + dateBG.getHours()).slice(-2) + ':' + ("0" + dateBG.getMinutes()).slice(-2))
		}
		let image = chart.getChart(s.reverse(), l.reverse(), 'BG')
		const file = new MessageAttachment(image, 'name.png');

		return {
			embed: {
				image: {
					url: "attachment://name.png"
				}
			},
			files: [file]
		}
	},
	deprecated_graph: function (graphData) {
		let s = new Array(graphData.length)
		let x = new Array(graphData.length)
		for (let i = 0; i < graphData.length; i++) {
			s[i] = (graphData[i]['sgv'] / 18)
			x[i] = 7
		}
		let startDate = new Date(graphData[graphData.length - 1]['date'])
		let endDate = new Date(graphData[0]['date'])
		let startDateStr = ("0" + startDate.getHours()).slice(-2) + ':' + ("0" + startDate.getMinutes()).slice(-2)
		let endDateStr = ("0" + endDate.getHours()).slice(-2) + ':' + ("0" + endDate.getMinutes()).slice(-2)
		return {
			fields: [
				{
					name: `_\n_**Graph (${startDateStr} - ${endDateStr})**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value:
						"```\n" + asciichart.plot ([s.reverse()], {
							padding: '     ',
							height: 10
						}) + "\n```",
					inline: true
				}
			]
		}
	},
	info: function (mainData) {
		let override_embed = {
			description: null
		};

		let embed_arr = [
			this.current(mainData),
			this.trend(mainData),
			override_embed
		];

		return merge.all(embed_arr)
	},
}

exports.help = {
	name: "Diabetes Info",
	description: "Gets information from your saved nightscout.",
	arguments: [],
	optional: ['{url}'],
	information: Object.keys(this.information)
};

exports.run = async (cmd, _instance) => {

	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);
	
	let arg = ''

	if (_instance.users[cmd.author.id].context.diabetesLink) {
		arg = _instance.users[cmd.author.id].context.diabetesLink.toLowerCase()
	}
	
	if (args[0]) {
		arg = args.join(" ").toLowerCase();
	}
	
	if (arg.endsWith('/')) {
		arg = arg.substring(0, -1)
	}
	
	if (!arg) {
		throw new Error('No valid link provided.')
	}

	let mainData;
	if (function_name === 'graph' || function_name === 'deprecated_graph') {
		mainData = await webrequest.getData(arg + '/api/v1/entries.json?count=30' )
	} else {
		mainData = await webrequest.getData(arg + '/pebble' )
	}
	 

	if (!mainData) {
		throw new Error('Server is unreachable.')
	}
	
	if (!JSON.parse(mainData)) {
		throw new Error('No Information for given Country found.')
	}

	mainData = JSON.parse(mainData)

	if (!_instance.users[cmd.author.id].context.diabetesLink) {
		_instance.users[cmd.author.id].context.diabetesLink = arg
	}
	
	let base_embed = embedding(mainData);
	
	let returnObj = await exports.information[function_name](mainData, arg, _instance)
	
	if (returnObj.embed) {
		returnObj.embed = await merge(base_embed, returnObj.embed)
		return returnObj
	}

	returnObj = await merge(base_embed, returnObj)
	return {
		embed: returnObj
	}
	
	
}

const embedding = (mainData) => {
	return {
		title: 'Diabetes Information',
		description: null,
		color: 16711680,
		footer: {
			text: "Last Updated"
		},
		timestamp: mainData["bgs"] ? mainData["bgs"][0]['datetime'] : "No Info",
	}
}

