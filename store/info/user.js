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
	id: function(member) {
		return {
			fields: [
				{
					name: "_\n_**ID**",
					value: `\`\`${member.id}\`\``,
					inline: true
				}
			]
		}
	},
	avatar: function(member) {
		return {
			thumbnail: null,
			image: {
				url: member.avatarUrl + "?size=2048"
			},
		}
	},
	nickname: function (member) {
		return {
			fields: [
				{
					name: "_\n_**Nickname**",
					value: `\`\`${member.nickname ? member.nickname : 'No Nickname'}\`\``,
					inline: true
				}
			]
		}
	},
	roles: function(member) {
		return {
			fields: [
				{
					name: `_\n_**Roles** (\`\`${member.roles.length}\`\`)`,
					value: member.roles.length > 0 ? member.roles.join(' \`\`|\`\` ') : '\`\`No roles found.\`\`'
				}
			]
		}
	},
	username: function (member) {
		return {
			fields: [
				{
					name: "_\n_**Username**",
					value: `\`\`${member.fullname}\`\``,
					inline: true
				}
			]
		}
	},
	sentiment: function(member) {
		return {
			fields: [
				{
					name: "_\n_**Sentiment**",
					value: `\`\`${ member.context.sentiment ? member.context.sentiment.toString().substring(0,4) : 0 }\`\``,
					inline: true
				},
			]
		}
	},
	bot: function(member) {
		return {
			fields: [
				{
					name: "_\n_**Bot?**",
					value: `\`\`${member.bot}\`\``,
					inline: true
				},
			]
		}
	},
	info: function (member) {

		let override_embed = {
			description: null,
			timestamp: null,
			thumbnail: {
				url: member.avatarUrl
			}
		};
		
		let emptyEmbed = {
			fields: [{
				name: "_\n_",
				value: `_\n_`,
				inline: true
			}]
		}

		let embed_arr = [
			this.bot(member),
			this.sentiment(member),
			emptyEmbed,
			this.nickname(member),
			this.username(member),
			emptyEmbed,
			this.id(member),
			this.roles(member),
			override_embed
		];

		return merge.all(embed_arr);
	}
}

exports.help = {
	name: "User",
	description: "Returns Pong and maybe a bit more information to the swiftness of the client.",
	arguments: [],
	optional: [],
	information: Object.keys(exports.information)
};

exports.run = async (cmd, _instance) => {
	let member;

	let { args, function_name } = propertyNames.getPropertyName(exports.information, cmd.usableContent);
	
	if (args.length > 0) {
		member = await converterFind.userByChannelGroup(args.join(cmd.splitter), _instance, cmd.channelGroup)
	} else {
		member = await converterFind.userByChannelGroup(cmd.author.id, _instance, cmd.channelGroup)
	}
	
	let base_embed = embedding(member);
	return await merge(base_embed, await exports.information[function_name](member))
};