/* Global Packages */
const glob = require("glob");

/* Local Packages */
const commandHandler = require("./commandHandler");

exports.command = async (cmd, _instance) => {
	
	if (!_instance.commandHandler) {
		_instance.commandHandler = await this.addCommandHandler([_instance.type, _instance.name])
	}
	
	if (!cmd.isPrefixed && !cmd.layout.nlp) {
		return;
	}
	
	return await commandHandler.store(cmd, _instance);
	
}

exports.addCommandHandler = async (explicits=[], options) => {
	if (!options) {
		options = {
			cwd: __dirname,
			ignore: []
		}
	}
	
	let commandHandler = {
		locationStore: './store',
		files: [],
		explicits: explicits
	}
	
	const files = glob.sync(`${commandHandler.locationStore}/**/*.js`, options);

	const filteredFiles = files.filter((item) => {
		// Ignore system files and folders
		if (item.includes(`/~`)) {
		// Exclude or include explicits files and folders
		} else if (item.includes(`/-`) || (item.includes('/+'))) {
			if (itemReflexivity(item.split('/'), explicits)) {
				return item;
			}
		// Include remaining files and folders
		} else {
			return item;
		}
	});
	
	commandHandler.files = filteredFiles;
	
	return commandHandler
}

let itemReflexivity = (splitItem, explicits) => {
	
	let questionable;
	let usable = false;
	for (let i = 0; i < splitItem.length; i++) {
		if (splitItem[i].startsWith('+') || splitItem[i].startsWith('-')) {
			questionable = splitItem[i]
			splitItem.splice(i+1)
			break;
		}
	}
	
	if (!questionable) {
		return true;
	}

	for (let i = 0; i < explicits.length; i++) {
		if (questionable.startsWith(`+${explicits[i]}`)) {
			usable = true;
			break;
		} else if (questionable.startsWith(`-${explicits[i]}`)) {
			usable = false;
			break;
		}
	}
	
	if (!usable) {
		return usable;
	} else {
		return itemReflexivity(splitItem, explicits);
	}
	
	
}