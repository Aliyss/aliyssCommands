/* Global Packages */
const merge = require('deepmerge');
const Color = require('color');
const stc = require('string-to-color');

const { propertyNames } = require('../../builders');
const webrequest = require("../../modules/webrequest");

async function changeLight (mainData, args, fullHue, type='lights_override', data) {
	let hueGroup;
	let typePassed;
	let typeHit;
	
	if ('groups'.startsWith(type)) {
		typePassed = 'groups'
		typeHit = 'action'
		args.shift()
	} else if ('lights'.startsWith(type)) {
		typePassed = 'lights'
		typeHit = 'state'
		args.shift()
	} else {
		typePassed = 'lights'
		typeHit = 'state'
	}

	if (fullHue.context['hue' + typePassed]) {
		hueGroup = fullHue.context['hue' + typePassed].toLowerCase()
	}

	if (!hueGroup || (args[0] && parseInt(args[0]) && args[0].length <= 1 && args[0] !== '0')) {
		hueGroup = args[0]
		args.shift()
		fullHue.context['hue' + typePassed] = hueGroup
	}

	if (!hueGroup) {
		throw new Error(`No ${type.split('_')[0]} has been defined.`)
	}
	
	if (!data) {
		return { hueGroup, typeHit, typePassed, args }
	}
	
	let response = await webrequest.putData(fullHue.fullHueLink + `/${typePassed}/` + hueGroup + `/${typeHit}/`, data)

	return { response, hueGroup, typeHit, typePassed, args }
}

function getXY(colors){

	let red = colors[0]
	let green = colors[1]
	let blue = colors[2]
	
	if (red > 0.04045){
		red = Math.pow((red + 0.055) / (1.0 + 0.055), 2.4);
	}
	else red = (red / 12.92);

	if (green > 0.04045){
		green = Math.pow((green + 0.055) / (1.0 + 0.055), 2.4);
	}
	else green = (green / 12.92);

	if (blue > 0.04045){
		blue = Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4);
	}
	else blue = (blue / 12.92);

	let X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
	let Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
	let Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
	let x = X / (X + Y + Z);
	let y = Y / (X + Y + Z);
	return [x,y];

}

function xyBriToRgb(xy, bri=245)
{
	let x = xy[0];
	let y = xy[1];
	let z = 1.0 - x - y;

	let Y = bri / 255.0; // Brightness of lamp
	let X = (Y / y) * x;
	let Z = (Y / y) * z;
	let r = X * 1.612 - Y * 0.203 - Z * 0.302;
	let g = -X * 0.509 + Y * 1.412 + Z * 0.066;
	let b = X * 0.026 - Y * 0.072 + Z * 0.962;
	r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
	g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
	b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
	let maxValue = Math.max(r, g, b);
	r /= maxValue;
	g /= maxValue;
	b /= maxValue;
	r = r * 255;   if (r < 0) { r = 255 };
	g = g * 255;   if (g < 0) { g = 255 };
	b = b * 255;   if (b < 0) { b = 255 };

	r = Math.round(r).toString(16);
	g = Math.round(g).toString(16);
	b = Math.round(b).toString(16);

	if (r.length < 2)
		r="0"+r;
	if (g.length < 2)
		g="0"+g;
	if (b.length < 2)
		b="0"+r;
	let rgb = "#" + r + g + b;

	return rgb;
}

exports.information = {
	color: async function (mainData, args, fullHue) {
		let { hueGroup, typeHit, typePassed, args: newArgs } = await changeLight(mainData, args, fullHue, args[0])

		if (!newArgs.join(' ')) {
			throw new Error('Define a Color.')
		}

		let lightBrightness = await webrequest.putData(fullHue.fullHueLink + `/${typePassed}/` + hueGroup + `/${typeHit}/`, {
			xy: getXY(Color(stc(newArgs.join(' '))).rgb().array())
		})

		return {
			fields: [
				{
					name: `_\n_**Color (${newArgs[0]})**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value: `**${mainData[typePassed][hueGroup].name}**`,
					inline: true
				}
			],
			color: Color(stc(newArgs.join(' '))).rgbNumber()
		}
	},
	brightness: async function (mainData, args, fullHue) {
		let { hueGroup, typeHit, typePassed, args: newArgs } = await changeLight(mainData, args, fullHue, args[0])
		
		if (!newArgs[0]) {
			throw new Error('Define a Brightness higher than 9 or add your light number.')
		} else if (parseInt(newArgs[0]) > 254) {
			throw new Error('Brightness must be lower than 255.')
		}
		
		let lightBrightness = await webrequest.putData(fullHue.fullHueLink + `/${typePassed}/` + hueGroup + `/${typeHit}/`, {
			bri: parseInt(newArgs[0])
		})
		
		return {
			fields: [
				{
					name: `_\n_**Brightness (${newArgs[0]})**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value: `**${mainData[typePassed][hueGroup].name}**`,
					inline: true
				}
			],
			color: Color(xyBriToRgb(mainData[typePassed][hueGroup][typeHit].xy)).rgbNumber()
		}
	},
	switch: async function (mainData, args, fullHue) {

		let { hueGroup, typeHit, typePassed } = await changeLight(mainData, args, fullHue, args[0])

		let groupFlash = await webrequest.putData(fullHue.fullHueLink + `/${typePassed}/` + hueGroup + `/${typeHit}/`, {
			on: !mainData[typePassed][hueGroup][typeHit].on
		})

		return {
			fields: [
				{
					name: `_\n_**Switching (${!mainData[typePassed][hueGroup][typeHit].on ? 'On' : 'Off'})**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value: `**${mainData[typePassed][hueGroup].name}**`,
					inline: true
				}
			],
			color: Color(xyBriToRgb(mainData[typePassed][hueGroup][typeHit].xy)).rgbNumber()
		}
	},
	flash: async function (mainData, args, fullHue) {
		
		let { hueGroup, typeHit, typePassed } = await changeLight(mainData, args, fullHue, args[0], { alert: "lselect" })

		return {
			fields: [
				{
					name: "_\n_**Flashing**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: `**${mainData[typePassed][hueGroup].name}**`,
					inline: true
				}
			],
			color: Color(xyBriToRgb(mainData[typePassed][hueGroup][typeHit].xy)).rgbNumber()
		}
	},
	state: function (mainData) {

		let lightsInfo = ''
		for (let [key, value] of Object.entries(mainData['lights'])) {
			lightsInfo += `**${value.name}**: ${value.state.on ? 'On' : 'Off'}\n`
		}

		let groupsInfo = ''
		for (let [key, value] of Object.entries(mainData['groups'])) {
			groupsInfo += `**${value.name}**: ${value.state.all_on ? 'All On' : 'All Off'}\n`
		}
		
		return {
			fields: [
				{
					name: "_\n_**Lights**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: lightsInfo.trim(),
					inline: true
				},
				{
					name: "_\n_**Groups**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: groupsInfo.trim(),
					inline: true
				}
			],
			color: Color(xyBriToRgb(mainData['groups']['1']['action'].xy)).rgbNumber()
		}
	},
	info: function (mainData, args, fullHue) {
		let override_embed = {
			description: null
		};

		let embed_arr = [
			this.state(mainData, args, fullHue),
			override_embed
		];

		return merge.all(embed_arr)
	},
}

exports.help = {
	name: "Hue Lights",
	description: "Control your hue lights.",
	arguments: [],
	optional: ['{url}', '{username}'],
	information: Object.keys(this.information)
};

exports.run = async (cmd, _instance) => {

	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);

	let hueLink = ''
	let hueUsername = ''
	let context = _instance.users[cmd.author.id].context

	if (_instance.users[cmd.author.id].context.hueLink) {
		hueLink = _instance.users[cmd.author.id].context.hueLink.toLowerCase()
	}
	
	if (_instance.users[cmd.author.id].context.hueUsername) {
		hueUsername = _instance.users[cmd.author.id].context.hueUsername
	}

	if (args[0] && !hueLink) {
		hueLink = args[0].toLowerCase();
		args.shift();
	}

	if (args[0] && !hueUsername) {
		hueUsername = args[0];
		args.shift();
	}

	if (!hueLink) {
		throw new Error('No link provided.')
	}

	if (!hueUsername) {
		throw new Error('No username provided.')
	}
	
	if (hueLink.endsWith('/')) {
		hueLink = hueLink.substring(0, hueLink.length-1)
	}

	if (!hueLink.endsWith('/api')) {
		hueLink += '/api'
	}

	let fullHueLink = hueLink + '/' + hueUsername;
	let mainData = await webrequest.getData(fullHueLink);

	if (!mainData) {
		throw new Error('Server is unreachable.')
	}

	if (!JSON.parse(mainData)) {
		throw new Error('No Information for given Request found.')
	}

	mainData = JSON.parse(mainData)

	if (!_instance.users[cmd.author.id].context.hueLink) {
		_instance.users[cmd.author.id].context.hueLink = hueLink
	}

	if (!_instance.users[cmd.author.id].context.hueUsername) {
		_instance.users[cmd.author.id].context.hueUsername = hueUsername
	}

	let base_embed = embedding(mainData);

	return {
		embed: await merge(base_embed, await exports.information[function_name](mainData, args, { fullHueLink, context }))
	}

}

const embedding = (mainData) => {
	return {
		title: 'Philips Hue',
		description: null,
		color: Color(xyBriToRgb(mainData['groups']['1']['action'].xy)).rgbNumber(),
		footer: {
			text: "Api Version: " + mainData["config"]["apiversion"]
		}
	}
}

