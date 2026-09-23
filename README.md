# AARK International School Website

Admissions-focused showcase website for AARK International School, Sevasi, Vadodara.

## Current build
- Responsive shared navigation and mobile menu
- Continuous Learning Journey from Nursery to Grade 12
- Admissions 2026–27 information and FAQ structured data
- Campus, student life, curriculum, careers and parent-resource pages
- Campus visit and admissions enquiry interactions
- Canonical/Open Graph metadata across public pages
- robots.txt and sitemap.xml
- Temporary web imagery with graceful fallbacks, ready to be replaced by final school photography

## Before production launch
1. Replace temporary imagery with approved AARK photography — see `PHOTOS_NEEDED.md` and `assets/photo-manifest.json`.
2. Set `GMAIL_USER` / `GMAIL_APP_PASSWORD` (and optionally `SCHOOL_RECEIVING_EMAIL`) as environment variables on the Vercel project — see `.env.example`. Without these, `api/enquiry.js` returns a 500 on every submission.
3. Confirm that https://theaarkinternational.com/ is the final production domain before launch; canonical and sitemap URLs currently target it.
4. Add the final downloadable 2026–27 fee PDF when supplied.
5. Reconfirm current fees, admission dates, policies and contact information with the school before publishing — see `NEEDED_FROM_SCHOOL.md` for the full content checklist (testimonials, staff directory, transport info, gallery, etc.).

## Enquiry form backend
`api/enquiry.js` is a Vercel serverless function that emails form submissions via Gmail (using `nodemailer`). It requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` to be set as environment variables — copy `.env.example` for the full list and where to get each value.

Start locally with `index.html`.
