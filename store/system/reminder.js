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
		
		for (let i = 0; i < cmd.entities.length; i++) {
			if (cmd.entities[i].entity === 'datetime') {
				date = new Date(cmd.entities[i].resolution.values[0].timex)
				diffDate += Math.abs(currentDate - date);
				srcText += cmd.entities[i].sourceText + ' '
			}
			if (cmd.entities[i].entity === 'duration') {
				date = addIso8601Period(cmd.entities[i].resolution.values[0].timex)
				diffDate += Math.abs(currentDate - date);
				srcText += cmd.entities[i].sourceText + ' '
			}
		}
		
		date = new Date((currentDate).getTime() + diffDate);

		if (date && srcText) {
			let newJob = new CronJob(date, () => {
				cmd.send(`Reminder: ${cmd.usableContent.join(cmd.splitter)}`)
			})

			newJob.start();

			return 'Will send reminder ' + srcText + '!'
		}
		
		return "Yikes can't do it. Sry."

	}
	
	return "I am too lazy to do this without NLP Integration."
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