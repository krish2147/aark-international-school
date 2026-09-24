# Content checklist for AARK before launch

Items the site can't be "complete" without, because they require real
information only the school has. Send this to AARK as a request list.

## 1. Photography
See `PHOTOS_NEEDED.md` — 13 photo slots need real campus/student images plus
confirmation of photo-release consent for any identifiable student.

## 2. Parent testimonials
The old site's testimonials were placeholder Lorem Ipsum text and were not
carried over. To add a real "What Parents Say" section, we need actual
quotes, each with:
- Parent's name (or "Parent of Grade X student" if they prefer anonymity)
- The quote itself
- Written consent to publish it with their name

## 3. Staff directory — page built, admin panel ready
`staff.html` is live (nav: Community → Our Staff). It now shows sample
placeholder entries until real staff are added through the **admin panel**
(`/admin.html` → Staff tab) — no code changes needed once that's set up
(see README's "Admin panel setup"). Per staff member: name, role/subject,
photo, and a one-line bio.

## 4. Transport / bus routes — page built, needs real data
`transport.html` is live (nav: Community → Transport). The explanatory text
is real (mirrors the admissions FAQ: the school doesn't own the buses; the
admissions team shares the transport facilitator's contact details). The
route table is still placeholder rows — need the actual route list, stops,
approximate pickup times, and the facilitator's contact details. (Routes
aren't in the admin panel yet — still a manual HTML edit.)

## 5. Photo gallery — page built, admin panel ready
`gallery.html` is live (nav: Community → Gallery), structured around the
real 2026–27 calendar events (Swimming Expo, Annual Function, Annual Sports
Day, Annual Result Day) pulled from `circulars.html`. Real event photos can
now be uploaded directly through the **admin panel** (`/admin.html` →
Gallery tab) — the placeholder cards are replaced automatically once photos
are added.

## 8. Admin panel — new capability
AARK (or Krish) can now log in at `/admin.html` to manage the Gallery,
Staff directory, a site-wide popup announcement banner (e.g. "Admissions
Open"), admission Schemes/offers, and the Fees table — all without a code
change. See README's "Admin panel setup" for the one-time setup steps
(Blob storage + admin credentials).

## 6. Fee PDF
`README.md` already flags this: the final downloadable 2026–27 fee structure
PDF, once AARK issues it, should replace/supplement the in-page fee table on
`admissions.html`.

## 7. Reconfirm before publishing
Fees, admission dates, staff counts, and the disclosure figures added on
`disclosures.html` (principal credentials, staff strength, infrastructure
stats) were sourced from the old site's live pages. AARK should confirm these
are still current before this goes live, since a school's compliance/fee
page being wrong is a real problem, not just a typo.
