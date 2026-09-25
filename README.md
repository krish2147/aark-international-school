# AARK International School Website

Admissions-focused showcase website for AARK International School, Sevasi, Vadodara.

## Design note
The V2 homepage redesign (Figma) is a UI/UX upgrade only — it keeps AARK's
original logo and wordmark exactly as supplied (`assets/aark-full-logo.png`,
preserved at its native aspect ratio, not redrawn/recolored/cropped) in the
nav and footer, both in code and in the Figma source file. It is not a
rebrand.

## Current build
- Responsive shared navigation and mobile menu
- Continuous Learning Journey from Nursery to Grade 12
- Admissions 2026–27 information and FAQ structured data
- Campus, student life, curriculum, careers and parent-resource pages
- Campus visit and admissions enquiry interactions
- Canonical/Open Graph metadata across public pages
- robots.txt and sitemap.xml
- Temporary web imagery with graceful fallbacks, ready to be replaced by final school photography
- Admin panel (`/admin.html`) to manage staff, gallery, popup events, schemes and fees without touching code

## Before production launch
1. Replace temporary imagery with approved AARK photography — see `PHOTOS_NEEDED.md` and `assets/photo-manifest.json`.
2. Set `GMAIL_USER` / `GMAIL_APP_PASSWORD` (and optionally `SCHOOL_RECEIVING_EMAIL`) as environment variables on the Vercel project — see `.env.example`. Without these, `api/enquiry.js` returns a 500 on every submission.
3. Set up the admin panel — see "Admin panel setup" below. Without this, `/admin.html` can't be used at all.
4. Confirm that https://theaarkinternational.com/ is the final production domain before launch; canonical and sitemap URLs currently target it.
5. Add the final downloadable 2026–27 fee PDF when supplied.
6. Reconfirm current fees, admission dates, policies and contact information with the school before publishing — see `NEEDED_FROM_SCHOOL.md` for the full content checklist (testimonials, staff directory, transport info, gallery, etc.).

## Enquiry form backend
`api/enquiry.js` is a Vercel serverless function that emails form submissions via Gmail (using `nodemailer`). It requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` to be set as environment variables — copy `.env.example` for the full list and where to get each value.

## Admin panel setup
The admin panel at `/admin.html` lets a signed-in admin manage:
- **Gallery** — add/edit/delete event photos
- **Staff** — add/edit/delete staff directory entries (name, role, photo, bio)
- **Popup Events** — a site-wide popup banner (e.g. "Admissions Open"), shown once per visitor session when marked active
- **Schemes** — admission offers/schemes shown on the Admissions page when marked active
- **Fees** — the fee table on the Admissions page

It's built on **Vercel Blob** (for both uploaded photos and a small JSON content store) rather than a full database, since a single-admin school site doesn't need more than that. Setup, once, in the Vercel dashboard:

1. **Create the Blob store**: Project → Storage → Create Database → Blob → connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically — you don't type this one in.
2. **Set admin credentials**: add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` as environment variables (see `.env.example` for how to generate the session secret). Pick your own username/password — there's no default.
3. Redeploy. Then sign in at `yourdomain.com/admin.html`.

Public pages (`gallery.html`, `staff.html`, `admissions.html`, and the site-wide popup) fetch this content client-side and fall back to their existing static placeholder content if nothing has been added yet — so the site works normally before the admin panel is set up, and before any content is added through it.

**Known limitations to be aware of:** this is a single-admin setup (one shared login, no per-user accounts or audit log), there's no rate-limiting on the login endpoint, and photo uploads are capped at 3MB each (a Vercel serverless function body-size limit, not a Blob limit) — ask the school to send reasonably sized photos, or compress before uploading.

Start locally with `index.html`.
