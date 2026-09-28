# AnNT — Personal Archive

A static GitHub Pages portfolio shaped as a soft blue-and-ivory editorial scrapbook. The supplied reference image is published unchanged at `assets/editorial-reference.jpg` and appears on the home page. Achievement and gallery entries in this version are visibly labelled as demo or placeholder content.

## Run and test locally

There is no build step:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. To run the browser coverage:

```bash
npm install
npx playwright install chromium
npm test
```

The tests cover desktop and mobile layouts, keyboard activation, carousel controls, reduced motion, unavailable images, direct and unknown detail URLs, no-JavaScript rendering, and a simulated `/AnNT.github.io/` project path.

## Replace the content

All personal, photo, and achievement data lives in [`content.js`](content.js). No rebuild is required after editing it.

- `profile`: change the display name, role line, introduction, note, and public links. Leave a URL as an empty string to keep its control visibly disabled. The included LinkedIn and CV entries intentionally have no fake destinations.
- `gallery.items`: replace `image`, `alt`, `title`, and `caption`. Set `placeholder: false` after adding a real personal image. Common landscape and portrait ratios are accepted through `object-fit: cover`; missing files show a styled fallback.
- `achievements`: use a unique URL-safe `id`, then edit the summary, full story, facts, optional links, and image metadata. Set `placeholder: false` only when the content describes a real, verified milestone. A card automatically links to `achievement.html?id=YOUR_ID`.
- Add or remove array items freely. The home rail and reusable detail page read the same data.

Keep image paths relative, such as `assets/my-photo.jpg`, so the site works both at a domain root and under `/AnNT.github.io/`. The neutral SVG files in `assets/` are safe placeholders to overwrite by changing the paths in `content.js`; the original supplied JPEG should not be cropped or overwritten.

The short no-JavaScript copy in `index.html` and `achievement.html` is a resilience fallback, not a second content store. Update it only if the overall purpose of the site changes.

## GitHub Pages

The repository is served directly from the root of `main`. In **Settings → Pages**, choose **Deploy from a branch**, `main`, and `/ (root)`. Keep `.nojekyll` tracked. Every internal URL is relative, including the stylesheet, scripts, detail links, favicon, reference JPEG, and placeholder art.

After deploying, verify both the home page and a direct detail URL such as `achievement.html?id=first-steps`.
