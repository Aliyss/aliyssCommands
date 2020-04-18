const converterFind = require('../../../aliyssConverter/converterFind')
const merge = require('deepmerge');
const propertyNames = require("../../builders/propertyNames");

/*Local Functions*/

function embedding(member) {
	return {
		title: exports.help.name + ": " + member.context.username,
		description: null,
		color: 14755960,
		footer: null
	}
}

exports.information = {
	bot: function(member) {
		return {
			fields: [
				{
					name: "_\n_**Bot?**".padEnd(24, `~`).replace(/~/g, "⠀"),
					value: `\`\`${member.bot}\`\``,
					inline: true
				},
			]
		}
	}
}

exports.help = {
	name: "User",
	description: "Returns Pong and maybe a bit more information to the swiftness of the client.",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	let member;

	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);
	
	if (args.length > 0) {
		try {
			member = await converterFind.userByChannelGroup(args.join(cmd.splitter), _instance, cmd.channelGroup)
		} catch (e) {
			console.log(e)
		}
	} else {
		member = await converterFind.userByChannelGroup(cmd.author.id, _instance, cmd.channelGroup)
	}
	
	let base_embed = embedding(member);
	return await merge(base_embed, await exports.information[function_name](member))
};