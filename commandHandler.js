
exports.store = async (cmd, _instance) => {
	let commandInfo;
	try {
		commandInfo = await searcher(cmd, _instance)
	} catch (e) {
		commandInfo = "``⛔ Error: " + e.message + "``"
	}
	
	if (!commandInfo) {
		return;
	}
	
	if (commandInfo && typeof commandInfo === 'object' && commandInfo.constructor === Object) {
		commandInfo = {embed: commandInfo}	
	}
	
	return commandInfo
}

// TODO: Fix this to work. Potentially fix searcher too.
const matcher = async (cmd, _instance) => {

	let text = cmd.cleanContent;
	let arr = text.match(/({(?:{??[^{]*?}))/g);

	if (arr && arr.length >= 1) {
		let full_temp = arr[0].replace(/{/g, "").replace(/}/g, "").split(" ");
		options.return_type = "string";
		let val = await searcher(client, full_temp, options, message);
		text = replaceNth(text,/({(?:{??[^{]*?}))/g, count => count === 1,() => `${val}`);
		await matcher(client, text.split(cmd.splitter))
	} else {
		options.return_type = "embed";
		await searcher(cmd, _instance);
	}
	
};

const searcher = async (cmd, _instance) => {
	
	const files = _instance.commandHandler.files;

	let filteredFiles = files.filter(item => {
		if (item.includes("owner")) {
			if (_instance.owners && _instance.owners.includes(cmd.author.id)) {
				return item
			}
		} else {
			return item
		}
	});

	const used_file = parser(_instance, filteredFiles, cmd.arrayContent);

	if (used_file.matched === 0) {
		return;
	}

	if (used_file.filename.endsWith("help.js")) {
		used_file.additional = files
		cmd.usableAdditional = used_file.additional
	}
	
	cmd.usableContent = used_file.args;
	
	return await runFile(used_file.filename, cmd, _instance);
	
};

const parser = (_instance, files, full_args) => {

	let used_file = {
		filename: "",
		matched: 0
	};

	for (let i = 0; i < files.length; i++) {
		let currentFile = files[i];
		for (let j = 0; j < _instance.commandHandler.explicits.length; j++) {
			currentFile = currentFile.replace(`/+${_instance.commandHandler.explicits[i]}`, '')
			currentFile = currentFile.replace(`/-${_instance.commandHandler.explicits[i]}`, '')
		}
		
		let files_arr = currentFile.split('/')

		let start = true;
		let end = false;
		let args = full_args.slice();
		let matched = 0;

		while (args.length !== 0 && start === true) {

			for (let j = 0; j < files_arr.length; j++) {

				if (files_arr[j] === _instance.type) {

				} else if (files_arr[j].startsWith(args[0])) {
					args.shift();
					matched++;
					end = true
				} else if (end === true) {
					start = false
				} else {
					start = false
				}
			}

		}

		if (used_file.matched < matched && (helpFile(files[i]).arguments.length <= args.length)) {
			used_file = {
				filename: files[i],
				matched: matched,
				args: args
			};
		}
	}

	return used_file
}

const helpFile = (file) => {
	
	let commandFile = require(file);
	return commandFile.help;

}

const runFile = async (file, cmd, _instance) => {
	let commandFile = require(file);
	return await commandFile.run(cmd, _instance);
}