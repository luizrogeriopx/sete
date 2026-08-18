# Plan - Fix Blank Screen on Password Change Redirect

The user reports a blank screen when redirected to `/trocar-senha` after their first login as an admin. This usually indicates a routing loop, a hydration mismatch in the auth gate, or a race condition where the auth state is not fully loaded when the component renders.

## User Review Required

> [!IMPORTANT]
> I will simplify the auth check logic and ensure the redirect happens only after the user session is confirmed, which should solve the white screen issue.

## Proposed Changes

### Auth & Routing

#### [src/routes/_authenticated/route.tsx]
- Simplify the `beforeLoad` logic to ensure metadata checks only happen when the user is definitely loaded.
- Add a fallback to the component to handle cases where `beforeLoad` redirects might not trigger immediately on client-side navigation.

#### [src/routes/_authenticated/trocar-senha.tsx]
- Add a loading state to the component to prevent rendering until `useAuth` has resolved the user data.
- Ensure it handles the case where it might be reached before the Supabase session is fully hydrated in the hook.

#### [src/routes/auth.tsx]
- Review the post-login redirect to ensure it includes the `must_change_password` check logic or relies correctly on the gate in `/_authenticated/route.tsx`.

### Verification Plan

- Test login with a user having `must_change_password: true`.
- Verify the redirect to `/trocar-senha` happens instantly without a blank screen.
- Verify that refreshing the page on `/trocar-senha` correctly maintains the state.
