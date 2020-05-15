/*Local Functions*/

exports.help = {
	name: "Ping",
	description: "Returns Pong and maybe a bit more information to the swiftness of the client.",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	let content = "";
	
	if (cmd.usableContent.length > 0) {
		if (cmd.usableContent[0] !== 'everyone' && cmd.usableContent[0] !== 'here') {
			return `Okiii, let's ping <@${cmd.usableContent[0]}>`
		}
	}
	
	let m = await cmd.send('Pinging...')
	if (!m.createdTimestamp) {
		if (!m.timestamp) {
			m.createdTimestamp = new Date().getTime();
		} else {
			m.createdTimestamp = m.timestamp;
		}
	}
	let time = m.createdTimestamp - cmd.createdTimestamp;
	content += "Response Time: " + (time) + "ms.";
	if (_instance.client.ws && _instance.client.ws.ping) {
		content += "\nAPI Latency: " + Math.round(_instance.client.ws.ping) + "ms."
	}
	return content;
};