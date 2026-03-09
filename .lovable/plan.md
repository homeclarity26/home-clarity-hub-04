
## Plan: Enable Auto-Confirm for Development

**Goal**: Skip email verification so you can sign up and immediately access the portal for testing.

### Implementation

Use the `cloud--configure_auth` tool to enable auto-confirm for email signups. This allows:
- Sign up with any email/password
- Immediately logged in without email verification
- Full access to test all portal features

### Steps
1. Configure auth to enable `autoConfirmEmail: true`
2. You can then sign up at `/signup` and be instantly logged in

**Note**: This should be disabled before production deployment.
