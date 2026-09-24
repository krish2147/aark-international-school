# Real photography needed before launch

Every photo on the site is currently a generic Unsplash stock image — 13 unique
photos reused across `index.html`, `about.html`, `campus-detail.html` and
`student-life.html`. None of them show the actual AARK campus, staff or
students. This is the top item blocking a real launch.

## What's needed

See `assets/photo-manifest.json` for the full list with exact current URLs and
which files each one appears in. In short, AARK needs to supply:

| Photo | Where it's used |
|---|---|
| Campus exterior / front gate | Homepage hero, About page |
| Students working together indoors | Homepage, About, Student Life |
| Nursery-age child in an activity | Learning Journey (homepage) |
| Kindergarten children playing | Learning Journey (homepage) |
| Grade 1–2 student, literacy activity | Learning Journey (homepage) |
| Grade 3–5 project/STEM classroom | Learning Journey (homepage) |
| Grade 6–8 classroom | Learning Journey (homepage) |
| Grade 9–10 students collaborating | Learning Journey (homepage) |
| Grade 11–12 senior student | Learning Journey (homepage) |
| Classroom interior | Homepage, About, Campus page |
| AI & Robotics lab | Homepage, About, Campus page |
| Swimming pool / sports facility | Homepage, About, Campus page |
| Arts / music room | Homepage, About, Campus page |

Photo consent: since several of these show identifiable children, confirm the
school has photo-release consent on file for any student appearing in a photo
before it's used publicly.

## How to swap them in once photos arrive

1. Upload the real photos somewhere hosted (school's CDN, Vercel Blob, or drop
   files into a new `assets/photos/` folder in this repo).
2. Open `assets/photo-manifest.json` and fill in `replacement_url_or_path` for
   each entry — a full URL or a relative path like `assets/photos/campus-gate.jpg`.
3. Run `node scripts/swap-photos.js`. It replaces every occurrence of each
   stock URL, across every page, in one pass — safe to re-run as more photos
   come in.
4. Spot-check the pages afterward; alt text was written for the stock photos
   and may need a small wording pass once the real photo is in place.
