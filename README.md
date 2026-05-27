# Eternal Bloom

Live: https://eternal-bloom-demo.vercel.app/

A scroll-driven perfume product page. The bottle is an SVG illustration that pans and zooms as you scroll through each section of the fragrance story.

## What it includes

- Scroll-linked pan and zoom on the bottle illustration
- Fragrance notes sections: top, heart, and base notes
- Ingredient hotspots on the bottle with sourcing details on hover
- Size selector (50ml, 100ml, 10ml Travel) and a slide-out cart drawer
- Reveal section at the end of the scroll

## How to run it

No setup needed. Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then go to `http://localhost:8080`.

## Deploying to Vercel

**With the Vercel CLI:**

```bash
npm i -g vercel
vercel
```

When prompted, leave the build command blank and set the output directory to `.`

**From the Vercel dashboard:**

1. Push this folder to a GitHub repo
2. Import the repo at vercel.com
3. Set the root directory to the folder containing `index.html`
4. Leave the build command blank and the output directory as `.`
5. Hit deploy
