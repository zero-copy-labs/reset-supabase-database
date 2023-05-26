import * as core from '@actions/core';
import * as github from '@actions/github';
import { to } from 'await-to-js';
import _ from 'lodash';
import axios from "axios";
import { mapSeries } from 'modern-async';
import * as pg from 'pg';
const { Client } = pg.default;
console.log(Client);
console.log(pg);

const TerminateDbSqlFmt = `
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres';
-- Wait for WAL sender to drop replication slot.
DO 'BEGIN WHILE (
	SELECT COUNT(*) FROM pg_replication_slots WHERE database = ''postgres''
) > 0 LOOP END LOOP; END';`

const SetRole = `SET ROLE postgres;`

async function run() {
	const c = new Client({
		connectionString: core.getInput('connectionString'),
	});
	await c.connect()
	
	// Disconnect clients
	const resD = await c.query('ALTER DATABASE postgres ALLOW_CONNECTIONS false;')
	core.info(`Disconnect Result: ${resD.rows[0].message}`);
	console.log(resD.rows[0].message)

	// Terminate connections 
	const resDD = await c.query(TerminateDbSqlFmt)
	core.info(`Terminate Result: ${resDD.rows[0].message}`);
	console.log(resDD.rows[0].message)

	// Drop the database
	const res = await c.query('DROP DATABASE IF EXISTS postgres WITH (FORCE);')
	core.info(`Drop Result: ${res.rows[0].message}`);
	console.log(res.rows[0].message)

	// Create the database
	const res2 = await c.query('CREATE DATABASE postgres WITH OWNER postgres;')
	core.info(`Create Result: ${res2.rows[0].message}`);
	console.log(res2.rows[0].message)
	
// @TODO - Restart DB

	// Initial Schema
	// SET_POSTGRES_ROLE

	await c.end()


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
