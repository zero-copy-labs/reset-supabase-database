# Action to reset a Supabase Database 

## Inputs

### `connectionString`

**Required** e.g. `postgres://user:password@host:5432/database`.

### `users`

**Required** e.g. `user@test.com,user2@test.com`.

## Example usage

```yaml
uses: zero-copy-labs/reset-supabase-database@main
with:
  connectionString: 'postgres://user:password@host:5432/database'
  users: 'user@test.com,user2@test.com'
```
