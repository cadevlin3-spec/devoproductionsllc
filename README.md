# Devo Productions — Website

Marketing site for **Devo Productions LLC** — Mobile DJ for weddings & events, plus church sound consulting & training.

Static site (plain HTML/CSS/JS, no build step). Hosted on **Cloudflare Pages**, deployed automatically from GitHub
(`cadevlin3-spec/devoproductionsllc`, branch `main`). Cloudflare serves clean URLs: `/services` → `services.html`.

## Pages
```
index.html      /            Home: hero, services overview, about teaser, how it works, gallery strip
services.html   /services    #dj  #church  #training  (deep-linkable sections)
about.html      /about       Cade's story + values
gallery.html    /gallery     Filterable photo grid + lightbox
book.html       /book        Contact options + inquiry form (Web3Forms). /book?type=wedding|event|church|training preselects the service
links.html      /links       Link-in-bio page for Instagram (points at the pages above)
404.html                     Not-found page
css/site.css                 Shared styles (brand colors at the top in :root — accent is --accent)
js/site.js                   Shared behavior: mobile menu, scroll reveal, anchor landing
img/                         Web-optimized photos
favicon.svg / favicon-512.png
serve.ps1                    Local preview helper (Windows) — not deployed
```
Header, footer and the "Got a date?" band are repeated in each page. If you change one, change them all
(search for `<header class="site">` / `<footer class="site">`).

## Preview locally (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
# then open http://localhost:8123  (clean URLs like /services work, same as Cloudflare)
```

## Make a change & publish
1. Edit the page (or swap images in `img/`).
2. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Describe your change"
   git push
   ```
3. Cloudflare Pages rebuilds and goes live automatically in ~30 seconds.

## Contact form
Uses **Web3Forms** (key is in `book.html`, search `WEB3FORMS_ACCESS_KEY`). Submissions go to the inbox registered with that key.

## Links
- Booking calls: https://calendly.com/devoproductionsllc/30min
- Instagram: https://www.instagram.com/devoproductionsllc
- Link-in-bio: https://devoproductionsllc.com/links
