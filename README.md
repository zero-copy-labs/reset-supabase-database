# Action to reset a Supabase Database 

## Inputs

### `connectionString`

**Required** e.g. `postgres://user:password@host:5432/database`.

### `users`

e.g. `user@test.com,user2@test.com`. Ignored if `deleteAllUsers` is `true`.

### `deleteAllUsers`

`true` or `false` (default `false`). Deletes every row in `auth.users` instead of the
named `users` list. Only `public`-schema tables reference `auth.users` by foreign key,
and those are already dropped earlier in the reset, so this is safe once nothing else
in the run still expects a `public` row pointing at a deleted user.

Use this for seed-managed environments (dev, staging) where every auth user is
recreated by the seed script and there are no real end users to preserve. The named
`users` list can only delete rows that match a given email — an email-less row (e.g.
a portal phone-only login, `auth.users.email IS NULL`) can never be targeted by it and
will accumulate indefinitely across resets, which can later collide with a seed trying
to assign that same phone number to a newly (re)created user.

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
