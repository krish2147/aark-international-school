# ARK demo: production architecture boundary

This repository is a client-demo website, not a finished school information system. The public website and sensitive admission records should be deployed as logically separate trust zones even if they share a domain.

## Already present

- Server-side bcrypt password verification for the existing single-admin CMS.
- Signed HttpOnly, Secure-in-production, SameSite=Strict session cookie.
- Server-side authorization checks on protected CMS mutations and private lists.
- Mongoose schemas and field length limits; no database credentials or private keys in client code.
- Escaping for data rendered by the existing CMS dashboard.
- Honest demo-only admission document/payment flow; files and payment data are not transmitted.
- Deployment headers for content-type sniffing, framing, referrer and browser feature restrictions.

## Required before production

- Replace the single-admin account with individual identities and server-enforced roles: Director, Admin/Office Staff, and Content Editor. Apply least privilege to every endpoint and record-level action.
- Require phishing-resistant 2FA or TOTP for Director accounts, with secure recovery and session revocation.
- Add a shared, persistent rate limiter and bot protection to login, enquiry, tour, application and upload endpoints.
- Add explicit CSRF protection to authenticated mutations (SameSite cookies remain a useful additional control).
- Store admission data in a restricted database separate from public CMS content. Encrypt backups, test restores, define retention/deletion, and minimize data returned to lists.
- Implement uploads through short-lived signed URLs to private object storage. Verify MIME type and file signature, enforce size limits, rename objects, scan for malware, and authorize every download.
- Create immutable audit events for authentication, record access, permission changes, admission status changes, exports and payment events.
- Validate and normalize every field on the server with an allowlist. Add approved output encoding and a deployment-tested Content Security Policy.
- Use HTTPS only, rotate environment secrets, scope service accounts, monitor errors, and document incident response.

## Payment integration boundary

The current “Proceed to Payment” button is a non-transactional demo. A future Razorpay-style integration should:

1. Create an application on the authenticated/validated server and generate an opaque public reference.
2. Create the payment order server-side using environment-held credentials; never expose a payment secret in browser code.
3. Send only the public checkout key and server-created order ID to the browser.
4. Verify the payment signature and amount server-side, process idempotent webhooks, and keep a separate payment ledger.
5. Treat successful payment as fee receipt only—not admission confirmation—and reconcile/refund from authorized workflows.

Real gateway credentials, the confirmed application fee, tax treatment, refund policy and reconciliation rules are still required.
