import * as core from '@actions/core';
import { forEachSeries } from 'modern-async';

const publicFunctions = `SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS args
FROM
    pg_proc p
JOIN
    pg_namespace n ON n.oid = p.pronamespace
WHERE
    n.nspname = 'public'
AND
    p.prokind = 'f';
`;

async function dropFunction(func, c) {
	const signature = `"${func.schema_name}"."${func.function_name}"(${func.args})`;
	core.info(`Drop Function: ${signature}`);

	return c.query(`DROP FUNCTION IF EXISTS ${signature} CASCADE;`);
}

export default async function run(c) {
	const { rows: funcs } = await c.query(publicFunctions);

	await forEachSeries(funcs, async (func) => {
		return dropFunction(func, c);
	});
}
