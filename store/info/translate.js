const translate = require("@vitalets/google-translate-api");
const merge = require('deepmerge');
const { propertyNames } = require('../../builders');

function embedding(result) {
	return {
		title: exports.help.name,
		description: null,
		color: 16776960,
		footer: null
	}
}

exports.information = {
	from: function (result) {
		return {
			fields: [
				{
					name: `_\n_**From: ${result.from_x}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value: result.search,
					inline: true
				}
			]
		}
	},
	to: function (result) {
		return {
			fields: [
				{
					name: `_\n_**To: ${result.to}**`.padEnd(24, `~`).replace(/~/g, "⠀"),
					value: 	result.output.text.replace(/ `/g, "`"),
					inline: true
				}
			]
		}
	},
	info: async function (result) {
		let override_embed = {

		};

		let embed_arr = [
			this.from(result),
			this.to(result),
			override_embed
		];

		return merge.all(embed_arr);
	}
};

exports.help = {
	name: "Translation",
	description: "Translates the given text.",
	overRideArguments: true,
	arguments: ["[text]"],
	optional: ["<from:ISO> <to:ISO>"],
	information: Object.keys(exports.information)
};

exports.run = async (cmd, _instance) => {
	
	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);

	let to = "en";
	if (/to:/.test(args[args.length-1]) && args[args.length-1].split(":")[1]) {
		to = args[args.length-1].split(":")[1];
		args.pop()
	}

	let from_x = "";
	if (/from:/.test(args[args.length-1]) && args[args.length-1].split(":")[1]) {
		from_x = args[args.length-1].split(":")[1];
		args.pop()
	}

	let search = args.join(" ");
	
	if (!search && cmd.quotedMessage && cmd.quotedMessage.content) {
		search = cmd.quotedMessage.content;
	}

	let result = {
		text: "An error has occured.",
		search: search
	};

	if (from_x !== "") {
		result.output = await translate(`${search}`, {from: from_x, to: to}).then(res => {
			return res
		}).catch(err => {
			return err
		});
	} else {
		result.output = await translate(`${search}`, {to: to}).then(res => {
			return res
		}).catch(err => {
			return err
		});
	}
	
	result.to = to;
	result.from_x = result.output.from.language.iso;

	let base_embed = embedding(result);

	return await merge(base_embed, await exports.information[function_name](result));

};