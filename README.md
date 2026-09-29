# AnNT — Poster Portfolio

A static, blue-and-ivory personal portfolio that adapts the composition of the supplied square poster into a website. The home page maps achievements to the narrow left contact sheet and AnNT's identity, photographs, biography, and links to the large right feature poster. The unchanged source artwork is published as [`reference_pic.jpg`](reference_pic.jpg); it is a visual reference, not portfolio content.

## Preview and test

There is no build step. From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Run the Playwright suite with:

```bash
npm install
npx playwright install chromium
npm test
```

The tests cover the desktop poster proportions, mobile reflow, newest-five ordering, complete archive, button/wheel/keyboard/touch input, paused and reduced motion, missing and empty media, direct achievement routes, no-JavaScript content, and a simulated `/AnNT.github.io/` deployment path.

## Edit the portfolio

All data-driven content lives in [`content.js`](content.js). Editing it updates both the home poster and reusable achievement detail page without a build.

- `profile` controls the name, biography, role, note, GitHub, LinkedIn, and CV. An empty URL renders a disabled label; do not add an invented destination.
- `gallery.intro` and `gallery.items` control the layered photo field. Replace each placeholder's `image`, `alt`, `title`, and `caption`, then set `placeholder: false` when it is real personal media.
- `achievements` is sorted newest-first by ISO `date`. The newest five become the contact-sheet frames; `archive.html` lists every record. Each record needs a unique URL-safe `id`, title, category, year, summary, story, and image metadata; facts and links are optional.
- Stable detail URLs use `achievement.html?id=YOUR_ID`. Keep asset and page paths relative so both root and project-subpath hosting work.

The fallback content in `index.html` and `achievement.html` remains available without JavaScript. Update those short strings when changing the identity or sample-entry fallback. Missing images reveal a styled cyanotype text fallback.

Do not edit, crop, or recompress `reference_pic.jpg`. It must remain byte-identical to the user-supplied source.

## Publish with GitHub Pages

Publish from the repository root. In **Settings → Pages**, choose **Deploy from a branch**, then the intended branch and `/ (root)`. After publishing, check the home page and a direct URL such as `achievement.html?id=first-steps` beneath the project path.
