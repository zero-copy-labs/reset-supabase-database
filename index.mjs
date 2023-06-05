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
const publicFunctions = `SELECT
    routine_name
FROM 
    information_schema.routines
WHERE 
    routine_type = 'FUNCTION'
AND
    routine_schema = 'public';
`

async function dropView(name, c) {
	core.info(`Drop View: ${name}`);

	return c.query(`DROP VIEW IF EXISTS "${name}" CASCADE;`)
}

async function dropFunction(name, c) {
	core.info(`Drop Function: ${name}`);

	return c.query(`DROP FUNCTION IF EXISTS "${name}" CASCADE;`)
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
	if(u.rows.length > 0) {
		core.info(`Found User : ${email} deleting...`);
		return c.query(`DELETE FROM "auth"."users" WHERE email = '${email}';`)
	}
	core.info(`Delete User: ${email} not found, skipping...`);
	return true;
}

async function deleteBucket(id, c) {
	core.info(`Delete Bucket: ${id}`);
	
	const u = await c.query(`SELECT id FROM "storage"."buckets" WHERE id = '${id}';`)
	if(u.rows.length > 0) {
		core.info(`Found Bucket: ${id} deleting...`);
		await c.query(`DELETE FROM "storage"."objects" WHERE bucket_id = '${id}';`)
		return c.query(`DELETE FROM "storage"."buckets" WHERE id = '${id}';`)
	}
	core.info(`Delete Bucket: ${id} not found, skipping...`);
	return true;
}

async function run() {
	const users = core.getInput('users').split(',');
	const buckets = core.getInput('buckets').split(',');

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
		return dropType(num.enum_name, c);
	})

	// Find all Functions in the public schema
	const { rows: funcs }= await c.query(publicFunctions)
	
	// Delete all the included functions 
	await forEachSeries(funcs, async (func) => {
		return dropFunction(func.routine_name, c);
	})

	// Delete all the included users
	await forEachSeries(users, async (user) => {
		return deleteUser(user, c);
	})

	// Clear the migrations table
	await c.query(`TRUNCATE "supabase_migrations"."schema_migrations";`)

	// Clear out the buckets
	await forEachSeries(buckets, async (bucket) => {
		return deleteBucket(bucket, c);
	})
	
	await c.end()
}

try {
	run();
} catch (error) {
	core.setFailed(error.message);
}
