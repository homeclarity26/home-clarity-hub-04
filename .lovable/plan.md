

## Plan: Quick Creator Access

There's one user in the database (`adamkilgore83@gmail.com`) with a `client` role. The fastest path is a single database migration that inserts a `creator` role for this user so they get redirected to `/admin` on login.

### Steps

1. **Run a migration** to insert a `creator` role for the existing user:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('f7e21bf1-6c61-4c62-bfab-9f4b77fc4fe2', 'creator')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

2. **No code changes needed** — the existing `AuthContext` already fetches roles and the `RootRedirect` component sends creators to `/admin`.

After this migration, logging in with `adamkilgore83@gmail.com` will land on the admin dashboard. The existing `client` role stays so the account can also view the client portal if needed.

