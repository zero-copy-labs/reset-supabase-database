import * as core from '@actions/core';
import { forEachSeries } from 'modern-async';
import axios from 'axios';

async function deleteBucket(id, c, storageClient) {
    core.info(`Delete Bucket: ${id}`);

    const u = await c.query(`SELECT id FROM "storage"."buckets" WHERE id = '${id}';`)
    if(u.rows.length > 0) {
        core.info(`Found Bucket: ${id} deleting...`);
        // Supabase blocks direct SQL deletes on storage.objects/storage.buckets
        // (protect_delete trigger) to avoid orphaning files in the object store.
        // Go through the Storage API instead, which cleans up both the metadata
        // and the underlying file data.
        await storageClient.post(`/storage/v1/bucket/${id}/empty`, {});
        return storageClient.delete(`/storage/v1/bucket/${id}`);
    }
    core.info(`Delete Bucket: ${id} not found, skipping...`);
    return true;
}

export default async function run(buckets, c, supabaseUrl, serviceRoleKey) {
    if (buckets.length === 0 || (buckets.length === 1 && buckets[0] === '')) {
        return;
    }

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('supabaseUrl and serviceRoleKey inputs are required to delete buckets via the Storage API.');
    }

    const storageClient = axios.create({
        baseURL: supabaseUrl,
        headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
        },
    });

    await forEachSeries(buckets, async (bucket) => {
        return deleteBucket(bucket, c, storageClient);
    })
}
