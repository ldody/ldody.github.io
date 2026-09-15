# One-time setup: add the actual font files

I couldn't download the real Inter / JetBrains Mono font files from inside
this sandbox (no internet access here), so `css/fonts.css` is wired up and
ready, but the two folders below are currently empty. The site will still
work without them — it'll just quietly fall back to the metric-matched
fallback font (fix #2) forever, which honestly looks fine, so this step is
optional. But for the real fonts, here's the two-minute version:

## Easiest method: Google Fonts "Get font" button

1. Go to https://fonts.google.com/specimen/Inter and https://fonts.google.com/specimen/JetBrains+Mono
2. Click "Get font" → "Download all" on each. You'll get a .zip with `.ttf` files.
3. Convert the ones you need to `.woff2` (ttf doesn't work directly — use
   https://cloudconvert.com/ttf-to-woff2, or if you have Node/Python locally,
   any `ttf2woff2` CLI works too).
4. Rename and drop the converted files here so the paths match exactly:

```
assets/webfonts/inter/inter-400.woff2   (Regular)
assets/webfonts/inter/inter-500.woff2   (Medium)
assets/webfonts/inter/inter-600.woff2   (SemiBold)
assets/webfonts/inter/inter-700.woff2   (Bold)
assets/webfonts/jetbrains-mono/jetbrains-mono-400.woff2  (Regular)
assets/webfonts/jetbrains-mono/jetbrains-mono-500.woff2  (Medium)
```

## Faster method (if you're comfortable with a terminal)

`google-webfonts-helper` packages the already-converted woff2 files directly:

```bash
curl -L -o inter.zip "https://gwfh.mranftl.com/api/fonts/inter?download=zip&subsets=latin&variants=regular,500,600,700&formats=woff2"
curl -L -o jbm.zip   "https://gwfh.mranftl.com/api/fonts/jetbrains-mono?download=zip&subsets=latin&variants=regular,500&formats=woff2"
```

Unzip, then rename each file to match the names above.

That's it — nothing else in the site needs to change. `css/fonts.css`
already points at these exact paths.
