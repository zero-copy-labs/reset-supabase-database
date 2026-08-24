# Action to reset a Supabase Database 

## Inputs

### `connectionString`

**Required** e.g. `postgres://user:password@host:5432/database`.

### `users`

e.g. `user@test.com,user2@test.com`.

### `buckets`

e.g. `public,content`. Deleted via the Supabase Storage API, so `supabaseUrl` and
`serviceRoleKey` are required if this is set (Supabase blocks direct SQL deletes on
`storage.objects`/`storage.buckets` to avoid orphaning files in the object store).

### `supabaseUrl`

Supabase project URL, e.g. `https://xyz.supabase.co`. Required when `buckets` is set.

### `serviceRoleKey`

Supabase service role key. Required when `buckets` is set.

### `extensions`

e.g. `content-lib,welcome`.

### `schemas`

List of additional schemas to drop (with CASCADE) e.g. `audit,custom`.

## Example usage

```yaml
uses: zero-copy-labs/reset-supabase-database@main
with:
  connectionString: 'postgres://user:password@host:5432/database'
  users: 'user@test.com,user2@test.com'
  buckets: 'public,content'
  supabaseUrl: 'https://xyz.supabase.co'
  serviceRoleKey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  extensions: 'content-lib,welcome'
  schemas: 'audit,custom'
```
