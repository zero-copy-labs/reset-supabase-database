import * as core from '@actions/core';
import { forEachSeries } from 'modern-async';

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


async function deleteUserById(id, label, c) {
    core.info(`Found User : ${label} deleting...`);
    return c.query(`DELETE FROM "auth"."users" WHERE id = $1;`, [id]);
}

async function deleteAllUsers(c) {
    core.info('Delete All Users: querying every row in auth.users...');

    const { rows } = await c.query(`SELECT id, email, phone FROM "auth"."users";`);
    if (rows.length === 0) {
        core.info('Delete All Users: no users found, skipping...');
        return;
    }

    await forEachSeries(rows, async (row) => {
        const label = row.email || row.phone || row.id;
        return deleteUserById(row.id, label, c);
    });
}

export default async function run(users, c, allUsers = false) {
	if (allUsers) {
		return deleteAllUsers(c);
	}

	await forEachSeries(users, async (user) => {
        return deleteUser(user, c);
    })
}
