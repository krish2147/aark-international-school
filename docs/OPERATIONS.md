# Operations: configuration, backups, restore and rollback

## 0. Project state as checked on 10 Oct 2026 (Vercel project `aark-international-school`)

- Node.js version: 24.x (meets the ≥ 20 requirement).
- The existing public Blob store's `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` apply to **Production and Preview**, so a Preview can currently write production content. Section 4 fixes this.
- `GMAIL_USER` and `SCHOOL_RECEIVING_EMAIL` (both `admissions@theaarkinternational.com`) and `ADMIN_*` apply to Production, Preview and Development. `GMAIL_APP_PASSWORD` is not set, which is why the live form returns 500.
- theaarkinternational.com mail is Google Workspace (MX → aspmx.l.google.com), so a Gmail App Password works for that mailbox.
- Production admin content is empty: every `/api/content/*` returns no items and there are no `content/versions/`.

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set Production and Preview **separately**. Preview must never point at production storage or the school's real inbox.

| Variable | Needed for | Who supplies it | Production | Preview |
| --- | --- | --- | --- | --- |
| `GMAIL_USER` | Sending enquiry emails | School: the Gmail/Workspace address that sends | School's address | A test Gmail |
| `GMAIL_APP_PASSWORD` | Same | School: 16-character App Password for that address (Google Account → Security → 2-Step Verification → App passwords) | Real | Test account's |
| `SCHOOL_RECEIVING_EMAIL` | Where enquiries arrive (defaults to `GMAIL_USER`) | School: admissions inbox | Real | Test inbox |
| `BLOB_ENQUIRY_READ_WRITE_TOKEN` | Saving enquiries | Vercel: added when a **private** Blob store is connected with prefix `BLOB_ENQUIRY` and "Add a read-write token env var" ticked | Production store | A separate test store |
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

1. Take Preview off production storage: on `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` and the three `BLOB_ENQUIRY_*` variables, untick **Preview** so they apply to Production only.
2. Take Preview off the school inbox: on `GMAIL_USER` and `SCHOOL_RECEIVING_EMAIL`, untick **Preview** (and Development).
3. Connect a **separate** test Blob store (public, prefix `BLOB`) and a separate **private** test store (prefix `BLOB_ENQUIRY`, read-write token ticked) to **Preview only**.
4. Optional, to test a real email failure: add Preview-only `GMAIL_USER` = any made-up address and `GMAIL_APP_PASSWORD` = any made-up text. Gmail rejects the sign-in, so enquiries show "Email failed" with Retry. Never use real credentials here.
5. Redeploy the branch's Preview (Deployments → the branch deployment → Redeploy) so it picks up the new variables.
6. Open the Preview URL and check:
    - one visit and one admission enquiry appear in Admin → Enquiries;
    - submitting the same form twice stores it once;
    - with the made-up Gmail values the admin shows "Email failed" and "Retry email" works as a retry;
    - add, edit and delete a gallery entry, then restore an older version from Content History.
7. Run `npm test` and `npm run test:e2e` locally before merging.

## 5. Rolling back

- **Code:** Vercel → Deployments → the previous production deployment → Promote to Production (instant). Or revert the merge commit on `main`.
- **Data compatibility:** rolling back the code is safe. The previous code reads `content/db.json`, which this release never changes, so it shows the content from before versioning. Saves made after this release live in `content/versions/` and are ignored by older code. Restore them by re-deploying this release, or copy the newest version's JSON over `content/db.json` (only after downloading both).
- **Enquiries** live only in the private store and are untouched by a rollback. The older code just stops writing new ones there.

## 6. Retention

Enquiries are kept until deleted from the private store. Agree a retention period with the school (for example, 24 months after the admission decision) and record it in the privacy notice.
