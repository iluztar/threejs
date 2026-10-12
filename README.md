# Sirpeltric · BG references (Three.js)

Six background scenes for the Sirpeltric journey through anime history, built in Three.js and rendered **flat 2D**
(Chiikawa / Kirby style): flat colour fills, one even ink line, banded sky, per-object depth tint. Background only — no characters.

Open `index.html` (or any `bgN-*/bgN-*.html`) by double-click. Internet is needed once for the Three.js CDN.

## In a scene
- **Space** play / pause · **← →** one frame (Shift = 1 s) · **1–9** jump to shot
- **G** guides · **H** clean view (picture only) · **F** fullscreen · **?** shortcuts
- Config menu (top right) → *look*: shading `flat 2d` (default) / `flat + cel shadow` / `soft 3d toon (old)`, sky bands,
  depth tint steps, line width, preview quality (`auto` keeps it light; exports are always full 4K).
- Export bar: long panorama PNG (colour · lineart · base colour), ZIP with one PNG per element, 3D `.glb` for Blender.

## Editing
Sources live in `_src/` (`core.js` = shared engine, `bgN.js` = scenes, `template.html` = page UI, `prompts/`).
After editing run:

```
php build.php
```

It rebuilds every `bgN-*/bgN-*.html`, the `*-prompt.md` files and `index.html`.
`bgN-*/preview.jpg` (the thumbnails on the index) are screenshots of each scene in clean view (**H**).

## Publishing (GitHub Pages)
The site is fully static. In the repo: *Settings → Pages → Deploy from a branch → `main` / root*.
It is then served at `https://<owner>.github.io/<repo>/` (here: `https://iluztar.github.io/threejs/`).
`.nojekyll` is included so files are served as-is.
