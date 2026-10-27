# Operations: configuration, backups, restore and rollback

## 0. Project state as checked on 11 Oct 2026 (Vercel project `aark-international-school`)

- Node.js version: 24.x (meets the ≥ 20 requirement).
- Production has the public content store (`BLOB_*`), the private enquiry store (`BLOB_ENQUIRY_*`), `ADMIN_*`, `GMAIL_USER` and `SCHOOL_RECEIVING_EMAIL`. `GMAIL_APP_PASSWORD` is still to be added, so enquiries are saved but marked "Email not set up" until it is (then use Retry email in Admin → Enquiries).
- There are no `PREVIEW_` settings: the Preview test stores and test logins were removed after testing. Preview deployments therefore cannot save, email or sign in (they fail closed) and never touch production data. Section 4 explains how to set Preview testing up again if it is ever needed.
- theaarkinternational.com mail is Google Workspace (MX → aspmx.l.google.com), so a Gmail App Password works for that mailbox.
- A copy of `content/db.json` was downloaded before the release (section 2).

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Production uses the names below. Preview uses the **same names with a `PREVIEW_` prefix** (for example `PREVIEW_BLOB_READ_WRITE_TOKEN`) and ignores the production names; see section 4.

| Variable | Needed for | Who supplies it | Production | Preview (`PREVIEW_` + name) |
| --- | --- | --- | --- | --- |
| `GMAIL_USER` | Sending enquiry emails | School: the Gmail/Workspace address that sends | School's address | A test Gmail |
| `GMAIL_APP_PASSWORD` | Same | School: 16-character App Password for that address (Google Account → Security → 2-Step Verification → App passwords) | Real | Test account's |
| `SCHOOL_RECEIVING_EMAIL` | Where enquiries arrive (defaults to `GMAIL_USER`) | School: admissions inbox | Real | Test inbox |
| `BLOB_ENQUIRY_READ_WRITE_TOKEN` | Saving enquiries | Vercel: added when a **private** Blob store is connected with prefix `BLOB_ENQUIRY` and "Add a read-write token env var" ticked | Production store | A separate test store |
| `BLOB_READ_WRITE_TOKEN` | Admin content + photos (public store) | Vercel: existing store | Existing store | A separate test store |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin sign-in | Krish | Existing | Different values |
| `ANTHROPIC_API_KEY` | Sahay, the website assistant (`api/chat.js`) | Krish: Claude API key from console.anthropic.com (set a monthly spend limit there) | Real | **Same name, same key** (the assistant only reads published facts, so there is nothing to isolate) |
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

## 4. Testing on a Preview deployment (optional; not set up at the moment)

Preview deployments (`VERCEL_ENV=preview`) read **only `PREVIEW_`-prefixed settings** for storage, email and admin sign-in (`api/_lib/storageEnv.js`). A production variable that is also attached to Preview is ignored there, so a Preview cannot touch production content, enquiries, the school mailbox or the real admin login. With no `PREVIEW_` setting, that feature is simply "not configured" on Preview.

1. Create Blob store `aark-content-preview` (**Public**), connect it with prefix **`PREVIEW_BLOB`** and tick "Add a read-write token env var". This creates `PREVIEW_BLOB_READ_WRITE_TOKEN`.
2. Create Blob store `aark-enquiries-preview` (**Private**), connect it with prefix **`PREVIEW_BLOB_ENQUIRY`** and tick "Add a read-write token env var". This creates `PREVIEW_BLOB_ENQUIRY_READ_WRITE_TOKEN`.
3. Optional, to test an email failure: add Preview-only `PREVIEW_GMAIL_USER` = `preview-test@example.com` and `PREVIEW_GMAIL_APP_PASSWORD` = `not-a-real-password`. Gmail rejects that made-up account, so enquiries show "Email failed" with Retry.
4. For admin tests: add Preview-only `PREVIEW_ADMIN_USERNAME`, `PREVIEW_ADMIN_PASSWORD` and `PREVIEW_ADMIN_SESSION_SECRET` (test values, never the real ones).
5. Tidy-up (recommended, not required for safety): untick Preview on `BLOB_*`, `BLOB_ENQUIRY_*`, `GMAIL_USER`, `SCHOOL_RECEIVING_EMAIL` and `ADMIN_*`, and untick Production on the `PREVIEW_*` variables.
6. Redeploy the branch's Preview (Deployments → the branch deployment → ⋯ → Redeploy) so it picks up the new variables.
7. On the Preview, check:
    - visit and admission enquiries appear in Admin → Enquiries;
    - submitting the same form twice stores it once;
    - "Email failed" + "Retry email" works;
    - add, edit and delete a gallery entry, then restore an older version from Content History.
8. Run `npm test` and `npm run test:e2e` locally before merging.

## 5. Rolling back

- **Code:** Vercel → Deployments → the previous production deployment → Promote to Production (instant). Or revert the merge commit on `main`.
- **Data compatibility:** rolling back the code is safe. The previous code reads `content/db.json`, which this release never changes, so it shows the content from before versioning. Saves made after this release live in `content/versions/` and are ignored by older code. Restore them by re-deploying this release, or copy the newest version's JSON over `content/db.json` (only after downloading both).
- **Enquiries** live only in the private store and are untouched by a rollback. The older code just stops writing new ones there.

## 6. Retention

Enquiries are kept until deleted from the private store. Agree a retention period with the school (for example, 24 months after the admission decision) and record it in the privacy notice.

## 7. Website assistant (Sahay)

- **Free by default.** Sahay answers from the built-in answer bank `assets/js/sahay-answers.js` (English, Hindi and Gujarati), matched in the visitor's browser. No AI, no running cost, no server call. **When fees, dates, contact details or admission rules change on the site, update that file too.** Each topic lists its trigger words and its answer in all three languages; questions it can't match get the school's phone number.
- **Optional AI upgrade.** If `ANTHROPIC_API_KEY` is set in Vercel, `/api/public-config` reports `assistantAi: true` and questions the answer bank can't match go to `api/chat.js` (Claude Opus 5.5, low effort, facts from `api/_lib/schoolKnowledge.js`, prompt-cached). Remove the key and Sahay goes back to free mode on the next deploy.
- AI guards: same-origin only; 800 characters per question; 12 questions per 10 minutes and 60 per day per visitor; 1,500 per day across the site. Set a monthly spend limit in the Anthropic console as the final cap.
- Conversations are not stored on the server; the visitor's browser keeps them only until the tab closes.

## 8. Handover additions (October 2026)

**Job applications.** The Careers page has its own form. Applications arrive in the school inbox with the subject "Job Application — <role> — <name>", appear in the admin under Enquiries (marked "Job application", with the experience note), and are included in the CSV. Applicants are asked to email their CV to info@theaarkinternational.com.

**Privacy notice.** `privacy.html` explains what the forms collect and how long it is kept (enquiries up to two academic years, applications up to one year). Every form links to it. If the school changes how it handles data, update this page.

**WhatsApp button.** Bottom-left on every public page; opens a chat with +91 99091 15550. The number must have WhatsApp (or WhatsApp Business) installed. To change it, edit the `wa.me/` number in `script.js`.

**Visitor statistics.** The pages already load Vercel Web Analytics. To start collecting: Vercel → project → Analytics → Enable. It is cookie-free, so no cookie banner is needed.

**Spam protection on forms (Turnstile).** Optional but recommended once the site gets traffic:
1. Cloudflare dashboard → Turnstile → Add site (domain: the live domain) → copy the Site Key and Secret Key.
2. Vercel → project → Settings → Environment Variables → add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (Production) → Redeploy.
Forms show the check automatically; confirmation emails to parents start once it is on.

**Old WordPress addresses.** `vercel.json` forwards every page of the old site (e.g. `/about-us/`, `/admission/…`, `/career-opportunities-…/`, `/mandatory-disclosure/`) to its new page, and the old theme's demo pages to the homepage. These take effect only once the domain points at Vercel.

**Photos.** Site photos are WebP in two sizes (`name.webp` up to 1280 px, `name-640.webp` for phones). To replace a photo, keep both files and the same names.

**Still needed from the school.**
- PDFs for the Mandatory Public Disclosure page (affiliation letter, NOC, recognition certificate, building and fire safety certificates, water and sanitation certificate, self-certification, SMC and PTA lists, fee structure). CBSE requires these to be viewable on the website.
- Staff details (optional): add them in the admin under Staff; they replace the Principal and Counsellor cards automatically.
- Transport routes (optional): currently the page asks parents to call the office.
