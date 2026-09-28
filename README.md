# AnNT — Editorial Achievement Portfolio

A static blue-and-ivory portfolio inspired by the supplied editorial composition. The original reference remains unchanged at `assets/editorial-reference.jpg` and is credited on the home page. Every included photograph and achievement is visibly marked as placeholder or demo content.

## Preview and test

There is no build step. From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Browser tests use Playwright:

```bash
npm install
npx playwright install chromium
npm test
```

The suite covers desktop and phone layouts, newest-five ordering, the complete archive, pointer/wheel/keyboard/touch/button controls, reduced motion, missing images, empty data, direct and unknown detail URLs, no JavaScript, and a simulated `/AnNT.github.io/` project path.

## Edit the portfolio

All data-driven content lives in [`content.js`](content.js). Editing it updates the home and reusable achievement page without a build. The short fallback strings in `index.html` and `achievement.html` are deliberately duplicated for visitors without JavaScript (or when the application script fails); update those too whenever the identity, archive purpose, or sample-entry fallback changes.

- `profile` controls the name, short biography, role, note, GitHub, LinkedIn, and CV. A link with `url: ''` becomes a visibly disabled control, so never add a made-up destination.
- `gallery.intro` and `gallery.items` control the personal photo section. Replace each `image`, `alt`, `title`, and `caption`, then set `placeholder: false` when it is real content.
- `achievements` is sorted newest-first by its ISO `date`. Each item needs a unique URL-safe `id`, `title`, `category`, display `year`, summary, story, optional facts/links, and image metadata. Set `placeholder: false` only for a real milestone.
- The home filmstrip uses the newest five records. “View all” reveals every record. Each stable detail URL is `achievement.html?id=YOUR_ID`.

Landscape and portrait images are composed with `object-fit: cover`; missing files reveal a text fallback. Keep paths relative, such as `assets/my-photo.jpg`, so root and project-subpath publishing both work. Do not overwrite or crop `assets/editorial-reference.jpg`.

## Publish with GitHub Pages

The site is designed to publish from the repository root. In **Settings → Pages**, select **Deploy from a branch**, then the intended branch and `/ (root)`. All CSS, scripts, images, home links, and detail links use relative URLs.

After publishing, check the home page and a direct route such as `achievement.html?id=first-steps`. Deployment is intentionally not automated by this repository.
