# Operations: configuration, backups, restore and rollback

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set Production and Preview **separately**. Preview must never point at production storage or the school's real inbox.

| Variable | Needed for | Who supplies it | Production | Preview |
| --- | --- | --- | --- | --- |
| `GMAIL_USER` | Sending enquiry emails | School: the Gmail/Workspace address that sends | School's address | A test Gmail |
| `GMAIL_APP_PASSWORD` | Same | School: 16-character App Password for that address (Google Account → Security → 2-Step Verification → App passwords) | Real | Test account's |
| `SCHOOL_RECEIVING_EMAIL` | Where enquiries arrive (defaults to `GMAIL_USER`) | School: admissions inbox | Real | Test inbox |
| `ENQUIRY_BLOB_READ_WRITE_TOKEN` | Saving enquiries | Vercel: added when a **private** Blob store is connected with prefix `ENQUIRY` | Production store | A separate test store |
| `BLOB_READ_WRITE_TOKEN` | Admin content + photos (public store) | Vercel: existing store | Existing store | A separate test store |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin sign-in | Krish | Existing | Different values |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Spam check + parent confirmation emails | Cloudflare dashboard (free) | Optional | Cloudflare test keys |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limits | Vercel Marketplace → Upstash (free tier) | Optional | Optional |

Never paste these values into GitHub, chat, email or screenshots. Rotating `ADMIN_SESSION_SECRET` signs every admin out.

The Node.js version must be 20 or newer (`package.json` → `engines`), because nodemailer 10 and @vercel/blob 2 require it. Check Project → Settings → General → Node.js Version before merging.

## 2. Before deploying backend changes: back up admin content

1. Vercel → Storage → the public Blob store → Browser.
2. Download `content/db.json` and every file under `content/versions/`, if any exist.
3. Keep the files somewhere private with the date in the folder name.

This release never modifies or deletes `content/db.json`. The first admin save after deployment creates `content/versions/000001.json`. The download is a second safety net, not the only one.

## 3. Restoring admin content

- **From the admin panel:** Content History → Restore on any version. This creates a new version identical to the chosen one; nothing is deleted. Version 0 is the original `content/db.json`.
- **Manually, if the panel is unavailable:** upload the backed-up JSON to the Blob store as `content/versions/<next number, 6 digits>.json` (for example, `000012.json` if `000011.json` is the newest). The site reads the highest number.

## 4. Testing on a Preview deployment

1. Connect a **separate** test Blob store (public) and a separate **private** test store with prefix `ENQUIRY` to the Preview environment only.
2. Set Preview-only Gmail variables for a test account, and set `SCHOOL_RECEIVING_EMAIL` to a test inbox.
3. Push the branch, then open the Preview URL:
    - submit one visit and one admission enquiry and check they appear in Admin → Enquiries and in the test inbox;
    - unset the Preview Gmail password, redeploy, submit again: the parent still sees success, and the admin shows "Email failed" with a working "Retry email";
    - add, edit and delete a gallery entry, then restore an older version from Content History.
4. Run `npm test` and `npm run test:e2e` locally before merging.

## 5. Rolling back

- **Code:** Vercel → Deployments → the previous production deployment → Promote to Production (instant). Or revert the merge commit on `main`.
- **Data compatibility:** rolling back the code is safe. The previous code reads `content/db.json`, which this release never changes, so it shows the content from before versioning. Saves made after this release live in `content/versions/` and are ignored by older code. Restore them by re-deploying this release, or copy the newest version's JSON over `content/db.json` (only after downloading both).
- **Enquiries** live only in the private store and are untouched by a rollback. The older code just stops writing new ones there.

## 6. Retention

Enquiries are kept until deleted from the private store. Agree a retention period with the school (for example, 24 months after the admission decision) and record it in the privacy notice.
