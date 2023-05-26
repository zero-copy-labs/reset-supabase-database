import * as core from '@actions/core';
import * as github from '@actions/github';
import { to } from 'await-to-js';
import _ from 'lodash';
import axios from "axios";
import { mapSeries } from 'modern-async';
import * as pg from 'pg'
const { Client } = pg;


async function run() {
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
}


try {
	run();
} catch (error) {
	core.setFailed(error.message);
}
