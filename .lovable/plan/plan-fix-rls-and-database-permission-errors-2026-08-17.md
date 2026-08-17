# Plan: Fix RLS and Database Permission Errors

The application is showing a "Something went wrong" error on the home page due to a `permission denied for function is_staff` error. This happened after migrating security-sensitive functions to a `private` schema. The `public.is_staff` wrapper function exists but lacks the necessary permissions for the `authenticated` role to execute it, and the `private` schema itself might not be accessible.

## Proposed Changes

### Database Migrations

#### 1. Fix Permissions for Security Functions
- Create a new migration to grant `USAGE` on the `private` schema to `authenticated` and `service_role`.
- Explicitly grant `EXECUTE` on `private.has_role` and `private.is_staff` to `authenticated` and `service_role`.
- Ensure `public.has_role` and `public.is_staff` (the wrapper functions) also have `EXECUTE` granted to `authenticated`.
- Verify the `search_path` is correctly set for these functions to resolve `private` schema calls.

### Verification Plan

- Run a headless browser test to verify that the home page loads without the "Something went wrong" error.
- Check the console logs in the browser test for any remaining permission errors.
- Verify that a logged-in user can still access protected resources that rely on these RLS functions.
