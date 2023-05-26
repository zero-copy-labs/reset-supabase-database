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

	// Drop the database
	const res = await client.query('DROP DATABASE IF EXISTS postgres WITH (FORCE);')
	core.info(`Drop Result: ${res.rows[0].message}`);
	console.log(res.rows[0].message)


	// Create the database
	const res2 = await client.query('CREATE DATABASE postgres WITH OWNER postgres;')
	core.info(`Create Result: ${res2.rows[0].message}`);
	console.log(res2.rows[0].message)
	

	await client.end()


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
