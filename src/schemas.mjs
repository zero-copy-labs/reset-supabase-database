import * as core from '@actions/core';
import { forEachSeries } from 'modern-async';

async function dropSchema(name, c) {
	core.info(`Drop Schema: ${name}`);
	return c.query(`DROP SCHEMA IF EXISTS "${name}" CASCADE;`);
}

export default async function run(schemas, c) {
	const filtered = schemas.filter(s => s && s.trim());
	await forEachSeries(filtered, async (schema) => {
		return dropSchema(schema.trim(), c);
	});
}
