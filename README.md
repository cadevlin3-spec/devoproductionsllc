# Devo Productions — Website

Marketing site for **Devo Productions LLC** — Mobile DJ for weddings & events, plus church sound consulting & training.

Static site (plain HTML/CSS/JS, no build step). Hosted on **Cloudflare Pages**, deployed automatically from this GitHub repo.

## Structure
```
index.html        The entire site (HTML + CSS + JS in one file)
favicon.svg       Site icon / badge logo (Logo 3)
favicon-512.png   PNG icon for social/Apple devices
img/              Web-optimized photos used on the site
serve.ps1         Local preview helper (Windows) — not deployed
```

## Preview locally (Windows)
Double-click `index.html`, or run a local server:
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
# then open http://localhost:8123
```

## Make a change & publish
1. Edit `index.html` (or swap images in `img/`).
2. Commit and push:
   ```bash
   git add -A
   git commit -m "Describe your change"
   git push
   ```
3. Cloudflare Pages rebuilds and goes live automatically in ~30 seconds.

## Contact form setup (one-time)
The form uses **Web3Forms** (free). To turn it on:
1. Go to https://web3forms.com → enter `devoproductionsllc@gmail.com` → an **access key** is emailed to you.
2. In `index.html`, find `WEB3FORMS_ACCESS_KEY` and paste the key between the quotes.
3. Commit & push. Form submissions now arrive in your inbox.

Until the key is added, the form politely tells visitors to email or book a call instead.

## Links
- Booking calls: https://calendly.com/devoproductionsllc/30min
- Linktree: https://linktr.ee/devoproductionsllc
