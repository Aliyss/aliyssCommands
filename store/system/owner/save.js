/*Local Functions*/

exports.help = {
	name: "Save Data",
	description: "Saves all the data to the chosen Database",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	return {
		content: await _instance.saveUsers()
	}
};