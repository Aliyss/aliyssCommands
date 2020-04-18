/*Local Functions*/

exports.help = {
	name: "Knowledge",
	description: "Returns Pong and maybe a bit more information to the swiftness of the client.",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	let input = cmd.usableContent.join(cmd.splitter)
	
	
	
	return input;
};