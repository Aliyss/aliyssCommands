/*Local Functions*/

exports.help = {
	name: "Send Stuff to WhatsApp",
	description: "This dows not work.",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	await _instance.allInstances.find(item => { return item.id === "WAPI_aliyss"}).client.sendMessage(cmd.channel.id, cmd.message.content)
	return { message: true }
};