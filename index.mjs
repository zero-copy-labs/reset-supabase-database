import * as core from '@actions/core';
import * as github from '@actions/github';
import { to } from 'await-to-js';
import _ from 'lodash';
import axios from "axios";
import { forEachSeries } from 'modern-async';
import * as pg from 'pg';
const { Client } = pg.default;

const tablesAndViews = `
SELECT table_name, table_type FROM information_schema.tables 
WHERE table_schema = 'public';
`

async function dropView(name, c) {
	core.info(`Drop View: ${name}`);

	return c.query(`DROP VIEW IF EXISTS "${name}" CASCADE;`)
}

async function dropTable(name, c) {
	core.info(`Drop Table: ${name}`);

	return c.query(`DROP TABLE IF EXISTS "${name}" CASCADE;`)
}

async function deleteUser(email, c) {
	core.info(`Delete User : ${email}`);
	
	const u = await c.query(`SELECT email FROM "auth"."users" WHERE email = '${email}';`)
	if(u.length > 0) {
		return c.query(`DELETE FROM "auth"."users" WHERE email = "${email}";`)
	}
	return true;
}

async function run() {
	const users = core.getInput('users').split(',');
	const c = new Client({
		connectionString: core.getInput('connectionString'),
	});
	await c.connect()

	// Find all tables and views in the public schema
	const { rows: tables }= await c.query(tablesAndViews)

	// Delete them tables or views
	await forEachSeries(tables, async (table) => {
		if(table.table_type === 'VIEW') {
			return dropView(table.table_name, c);
		}
		return dropTable(table.table_name, c);
	})

	// Delete all the included users
	await forEachSeries(users, async (user) => {
		return deleteUser(user, c);
	})
	
	await c.end()
}

try {
	run();
} catch (error) {
	core.setFailed(error.message);
}
