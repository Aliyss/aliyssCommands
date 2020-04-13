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

	let date = new Date();
	date.setSeconds(date.getSeconds()+60);

	let newJob = new CronJob(date, () => {
		cmd.send('Hello')
	})
	
	newJob.start();
	
	return 'Will send reminder in a minute.'
};