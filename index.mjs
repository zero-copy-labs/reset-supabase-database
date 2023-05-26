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

const enums = `select nums.enum_name from (
select n.nspname as enum_schema,  
       t.typname as enum_name,  
       e.enumlabel as enum_value
from pg_type t 
   join pg_enum e on t.oid = e.enumtypid  
   join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
where n.nspname = 'public'
) as nums
GROUP BY nums.enum_name
;
`

async function dropView(name, c) {
	core.info(`Drop View: ${name}`);

	return c.query(`DROP VIEW IF EXISTS "${name}" CASCADE;`)
}

async function dropTable(name, c) {
	core.info(`Drop Table: ${name}`);

	return c.query(`DROP TABLE IF EXISTS "${name}" CASCADE;`)
}

async function dropType(name, c) {
	core.info(`Drop Type : ${name}`);

	return c.query(`DROP TYPE IF EXISTS "${name}" CASCADE;`)
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

	// Find all Enums  in the public schema
	const { rows: nums }= await c.query(enums)
	
	// Delete all the included enums 
	await forEachSeries(nums, async (num) => {
		return dropType(num, c);
	})

	// Delete all the included users
	await forEachSeries(users, async (user) => {
		return deleteUser(user, c);
	})

	// Clear the migrations table
	await c.query(`TRUNCATE "supabase_migrations"."schema_migrations";`)
	
	await c.end()
}

try {
	run();
} catch (error) {
	core.setFailed(error.message);
}
