
const converterFind = require('../../../aliyssConverter/converterFind')
const merge = require('deepmerge');
const propertyNames = require("../../builders/propertyNames");
const { knowledge } = require("../../modules")

/*Local Functions*/

function embedding(member) {
	return {
		title: exports.help.name + ": " + (member.context ? member.context.username : member.username),
		description: null,
		color: 14755960,
		footer: member.footer || null
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
				url: member.avatarUrl
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
			timestamp: null,
			description: member.description || null,
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

		return merge.all(embed_arr)
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
		try {
			member = await converterFind.userByChannelGroup(args.join(cmd.splitter), _instance, cmd.channelGroup)
		} catch (e) {
			let knowledgeQuery = '&limit=1&types=Person&query=' + args.join(cmd.splitter)
			let tempMember = JSON.parse(await knowledge.getData(knowledgeQuery))['itemListElement'][0]
			member = {
				id: '000000000000000000',
				avatarUrl: tempMember.result.image.contentUrl,
				username: tempMember.result.name,
				fullname: tempMember.result.name,
				nickname: tempMember.result.name.split(' ')[0],
				roles: tempMember.result['@type'],
				context: {
					sentiment: tempMember.resultScore / 1000,
					username: tempMember.result.name
				},
				bot: false,
				description: tempMember.result.detailedDescription.articleBody,
				footer: {
					url: tempMember.result.url || null,
					text: tempMember.result.description
				},
			}
		}
	} else {
		member = await converterFind.userByChannelGroup(cmd.author.id, _instance, cmd.channelGroup)
	}
	
	let base_embed = embedding(member);
	return {
		embed: await merge(base_embed, await exports.information[function_name](member)),
		options: {"allowedMentions": { "roles" : [], "users": []}}
	}
};