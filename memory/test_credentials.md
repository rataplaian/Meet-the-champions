# Test credentials — Meet Champion

Demo passwords are set by `supabase/scripts/create_demo_users.mjs`.
They only exist AFTER running that script against a live Supabase project.

## Universal password (demo only)
`MeetChampion!123`

## Accounts

| Email                          | Role      | Notes                            |
|--------------------------------|-----------|----------------------------------|
| admin@meetchampion.local       | admin     | Full access to admin panel       |
| fan1@meetchampion.local        | fan       | Books calls                      |
| fan2@meetchampion.local        | fan       | Books calls                      |
| champ1@meetchampion.local      | champion  | Approved, has open slots         |
| champ2@meetchampion.local      | champion  | Approved, has open slots         |
| champ3@meetchampion.local      | champion  | PENDING VIP verification         |

## How to create these users

```bash
# From repo root, with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env:
node supabase/scripts/create_demo_users.mjs
```

The script is idempotent — safe to re-run.
