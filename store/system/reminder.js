const { CronJob } = require('cron');

/*Local Functions*/

exports.help = {
	name: "Reminder",
	description: "Reminds user at specified time.",
	arguments: [],
	optional: [],
	information: Object.keys({})
};

exports.run = async (cmd, _instance) => {

	if (_instance.nlp) {

		const response = await _instance.nlp.process('en', cmd.cleanContent.trim(), _instance.users[cmd.author.id].context)

		cmd.entities = response.entities;

		let date;
		let srcText = '';
		
		let currentDate = new Date();
		let diffDate = 0;
		let cmdText = cmd.usableContent.join(cmd.splitter)
		
		for (let i = 0; i < cmd.entities.length; i++) {
			if (cmd.entities[i].entity === 'datetime') {
				date = new Date(cmd.entities[i].resolution.values[0].timex)
				diffDate += (date - currentDate);
				srcText += cmd.entities[i].sourceText + ' '
			} else if (cmd.entities[i].entity === 'duration' || cmd.entities[i].entity === 'set') {
				date = addIso8601Period(cmd.entities[i].resolution.values[0].timex)
				diffDate += (date - currentDate);
				srcText += cmd.entities[i].sourceText + ' '
			} else if (cmd.entities[i].entity === 'date') {
				let dateX = cmd.entities[i].resolution.date
				let year = dateX.getFullYear()
				let month = dateX.getMonth()
				let day = dateX.getDate()
				currentDate.setFullYear(year)
				currentDate.setMonth(month)
				currentDate.setDate(day)
				diffDate = 0
				srcText += cmd.entities[i].sourceText + ' '
			} else if (cmd.entities[i].entity === 'daterange' || cmd.entities[i].entity === 'datetimerange') {
				let dateStart = cmd.entities[i].resolution.start
				let dateEnd = cmd.entities[i].resolution.end
				if (dateStart.getTime() < currentDate.getTime()) {
					diffDate = (dateEnd - currentDate) / 2
				} else {
					diffDate += (dateStart - currentDate);
				}
				srcText += cmd.entities[i].sourceText + ' '
			}
		}
		
		date = new Date((currentDate).getTime() + diffDate);

		if (date < currentDate) {
			throw new Error('Date and Time is set in the past. How am I supposed to remind you.')
		} else if (date && srcText) {
			let newJob = new CronJob(date, () => {
				cmd.send(`<@${cmd.author.id}>\n\nReminder: ${cmdText}`)
			})
			
			try {
				newJob.start();
			} catch (e) {
				throw new Error('I was probably stuck in the debugger... Help me please! Alice is being mean.')
			}
			

			return {
				content: 'Will send reminder ' + srcText.trim() + '!'
			}
		}
		
		return {
			content: "Yikes can't do it. Sry."
		}
	}
	
	return {
		content: "I am too lazy to do this without NLP Integration."
	}
};

// This is completely stolen. I couldn't be bothered to write it on my own. Thanks StackOverflow person.
function addIso8601Period(period /*:string */, ago /*: bool? */, anchor /*: Date? */) {
	var re = /^P((?<y>\d+)Y)?((?<m>\d+)M)?((?<d>\d+)D)?(T((?<th>\d+)H)?((?<tm>\d+)M)?((?<ts>\d+(.\d+)?)S)?)?$/;
	var match = re.exec(period);
	var direction = ago || false ? -1 : 1;
	anchor = new Date(anchor || new Date());
	anchor.setFullYear(anchor.getFullYear() + (match.groups['y'] || 0) * direction);
	anchor.setMonth(anchor.getMonth() + (match.groups['m'] || 0) * direction);
	anchor.setDate(anchor.getDate() + (match.groups['d'] || 0) * direction);
	anchor.setHours(anchor.getHours() + (match.groups['th'] || 0) * direction);
	anchor.setMinutes(anchor.getMinutes() + (match.groups['tm'] || 0) * direction);
	anchor.setSeconds(anchor.getSeconds() + (match.groups['ts'] || 0) * direction);
	return anchor;
}