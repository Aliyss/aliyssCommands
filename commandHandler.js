const watch = require("node-watch");

exports.store = async (cmd, _instance) => {
	let commandInfo;
	let error = false
	try {
		if (!cmd.isCommand) {
			commandInfo = await nlpCheck(cmd, _instance)
		} else {
			commandInfo = await searcher(cmd, _instance)
		}
	} catch (e) {
		commandInfo = "``⛔ Error: " + e.message + "``"
		error = e.message
	}
	
	if (!commandInfo || error) {
		return {command: commandInfo, error: error};
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
			if (_instance.layout.owners && _instance.layout.owners.includes(cmd.author.id)) {
				return item
			}
		} else {
			return item
		}
	});

	const used_file = parser(_instance, filteredFiles, cmd.arrayContent);

	if (used_file.matched === 0) {
		return await nlpCheck(cmd, _instance)
	}

	if (used_file.filename.endsWith("help.js")) {
		used_file.additional = files
		cmd.usableAdditional = used_file.additional
	}
	
	cmd.usableContent = used_file.args;

/*	watch(__dirname + used_file.filename.replace('.', ''), (event, filename) => {
		if (filename) {
			delete require.cache[require.resolve(used_file.filename)];
		}
	});*/
	
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

		files_arr.shift();
		files_arr.shift();
		
		let start = true;
		let end = false;
		let args = full_args.slice();
		let matched = 0;

		while (args.length !== 0 && start === true) {

			for (let j = 0; j < files_arr.length; j++) {

				if (files_arr[j] === _instance.type) {

				} else if (files_arr[j].startsWith(args[0]) && args[0] !== "") {
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

		if (used_file.matched < matched && (helpFile(files[i]).arguments.length <= args.length || helpFile(files[i]).overRideArguments)) {
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

const nlpCheck = async (cmd, _instance) => {
	if (!_instance.nlp) {
		return;
	}
	return await nlpProcess(cmd, _instance)
}

const nlpProcess = async (cmd, _instance) => {
	
	let options = {}

	if (!cmd.isCommand && (!_instance.layout.nlp.no_prefix && !_instance.layout.nlp.on_command)) {
		return;
	}
	
	if (!_instance.users[cmd.author.id].context) {
		_instance.users[cmd.author.id].context = {}
	}

	if (!_instance.users[cmd.author.id].sentimentLog) {
		_instance.users[cmd.author.id].sentimentLog = [0]
	}

	if (!cmd.isCommand && _instance.layout.nlp.no_prefix) {
		cmd.cleanContent = cmd.content;
	}

	_instance.users[cmd.author.id].context.sentiment = _instance.users[cmd.author.id].sentimentLog.reduce(
		(a,b) => a + b, 0) / _instance.users[cmd.author.id].sentimentLog.length
	
	const response = await _instance.nlp.process('', cmd.cleanContent.trim(), _instance.users[cmd.author.id].context)
	
	if (response && response.intent === 'None') {
		throw new Error('No response found.')
	}
	
	if (!cmd.isCommand && !response.intent.startsWith('command.')) {
		if (_instance.layout.nlp.no_prefix > response.score) {
			throw new Error('Response Text scored too low.')
		}
	}

	for (let i = 0; i < response.entities.length; i++) {
		_instance.users[cmd.author.id].context[response.entities[i].entity] = response.entities[i].resolution.value
	}
	
	if (response.intent.startsWith('command.')) {
		if (!cmd.isCommand && _instance.layout.nlp.on_command > response.score) {
			throw new Error('Response Command scored too low.')
		} else {
			cmd.arrayContent = [response.intent.split('.')[1]]
			cmd.entities = response.entities;
			//let tempResponse = await searcher(cmd, _instance);
			//console.log(tempResponse)
		}
	}
	
	if (!response.answer) {
		throw new Error('No response answer found')
	}
	
	if (response.sentiment.score !== 0) {
		_instance.users[cmd.author.id].sentimentLog.push(response.sentiment.score)
	}
	
	return response.answer
}