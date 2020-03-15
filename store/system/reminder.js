/*Local Functions*/

exports.information = {
	me: function (mainData) {
		
	},
	info: function (mainData) {
		let override_embed = {
			description: null,
			timestamp: null,
			thumbnail: null,
		};

		let embed_arr = [
			override_embed
		];
		return merge.all(embed_arr)
	},
}

exports.help = {
	name: "Reminder",
	description: "Will remind you of whatever you need to be reminded by.",
	arguments: ["[Time]"],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {
	
	let mainData = cmd.usableContent;
	
	let information = this.information;

	let function_name = "info";

	let propertyNames = Object.keys(information).filter(function (propertyName) {
		return propertyName.indexOf(cmd.usableContent[0]) === 0;
	});

	if (propertyNames.length !== 0) {
		function_name = propertyNames[0];
		cmd.usableContent.shift()
	} else {
		function_name = "info";
	}

	let base_embed = embedding(mainData);

	return await merge(base_embed, await information[function_name](mainData))
};

const embedding = (mainData) => {
	return {
		title: 'Reminder to ' + mainData['Country,Other'],
		description: null,
		color: 3093208,
		footer: null
	}
}