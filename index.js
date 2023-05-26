const core = require('@actions/core');
const { Client } = require('pg');
const wait = require('./wait');

async function run() {
	try {

		const client = new Client({
			connectionString: core.getInput('connectionString'),
		});
		await client.connect()

		const res = await client.query('SELECT $1::text as message', ['Hello world!'])
		console.log(res.rows[0].message) // Hello world!
		await client.end()


		core.info(`Waiting ${res.rows[0].message} milliseconds ...`);
/*
		core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
		await wait(parseInt(ms));
		core.info((new Date()).toTimeString());

		core.setOutput('time', new Date().toTimeString());
*/
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
