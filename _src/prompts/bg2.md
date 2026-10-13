# BACKGROUND 2 · EARTH ZOOM OUT + GLOBE 360° (storyboard scenes 7–9)
**Era (brief):** Sc 7–8 = **base** kawaii style · Sc 9 = the red wave passes → **1950s** first-colour features (Toei: Hakujaden 1958, Magic Boy 1959), with the globe as a **gouache storybook painting**. The era dropdown offers base · 1950s only.
**Deadline (plan):** week 2 · Fri 16 Oct 2026.

## Shots
1. **Sc 7–8 · jump & fall** (base): from the characters' spot on the dome, the camera follows the jump path (an invisible point) over the dome edge and drops toward the sea. A clear lane (no buildings or trees, 10 units wide) runs from the dome to the sea so the camera never passes through anything. → Panorama: a tall vertical strip of the fall (near-orthographic, no smear).
2. **Zoom out** (base): one continuous move street → city → coastline → continent → globe. Log-scale speed: distance = exp(lerp(ln 30, ln 4200, ease(t))); the camera's up vector blends from the local ground normal to world up, so the globe ends upright. → Single 4K frames (no camera travel to stitch).
3. **Sc 9 · red wave → 1950s**: the globe framed, the red wave sweeps and the whole picture becomes 1950s gouache.
4. **Globe 360° turntable** (1950s): a locked camera, one turn per 24 s, clouds on their own shell turning ×1.15 faster, a soft day/night terminator, warm night-light dots on the dark side, a soft atmosphere rim. → **Panorama: one long strip of the turning globe**: centre-column slices of a near-orthographic view (camera 60,000 units away, narrow lens) while the globe turns, i.e. the globe surface unrolled, ready for a 2D pan behind a round mask. The clouds are stitched with the land; slide the cloud layer (its own element PNG) 15% faster when compositing.

## The world (kawaii + 1950s gouache)
- An upright globe (R 1000), equirectangular **CanvasTexture** painted procedurally: recognisable but simplified continents with soft, rounded coastlines (drawn from coarse lon/lat outlines, blurred and thresholded for round edges), flat colour areas (greens, sand deserts, pale ochre, white poles), teal-blue sea, paper / gouache grain.
- **Land and sea are separate meshes** (a land shell just above the sea sphere, alpha-masked), so they export as separate PNGs. **Coastlines get lineart** (the land shell writes an id colour in the normal pass).
- The **city** sits on a temperate east coast (≈ 40° N), in a local frame on the globe surface. It is a small 1950s advanced-city island in the same language as BG 1: the cream dome where the characters jump, low/mid-rise blocks with windows and rooftop water tanks, a few modest towers, leafy round trees (light LOD) — every building, house, tower and tree takes the ground height of the domed island top at its own spot (base sunk a little, walls run down to it, no gaps) — a beach ring, three harbour piers on posts down into the sea and six boats sitting half in the water (the sea is the globe, so its surface drops by d² / 2R away from the island centre). Small round **islands** nearby (Kirby Everbay Coast map) for the coastline beat.
- **Space**: deep navy-teal, never pitch black; soft round stars (Points); the **Moon** as a cute cream sphere with a few soft crater discs (Doraemon *Moon Exploration* 2019).
- Sky colour blends with altitude: Kirby sky blue near the ground → navy in space.

## Turning the globe by hand
In the two globe shots (red wave → 1950s and the 360° turntable) the viewer can drag / swipe right on the picture to turn the globe (left / right) and tilt it (up / down, ±0.9 rad); it glides on a little after release, double-click / double-tap resets. The turntable keeps playing on top of it. Free view orbits the globe centre in these shots.

## Depth planes (FG · MG · BG · far)
- FG (street run of Sc 7, darkest): bushes, rocks, tall grass and lamp posts along both sides of the lane (x ±2.2–3.8) and two tall trees hanging over it, so they sweep past the lens.
- MG (< 40): the street, the dome top, the characters' lane.
- BG (< 160): houses, coast; far: sea and sky. Globe shots use the planet's own depth (no planes).

## Elements in the ZIP
foreground · sky · sea · land · night-lights · clouds · atmosphere · stars · moon · island · boats · dome · rocks · grass · flowers · city · trees · islands

## Palettes
- 1950s: #2F4A5C #6E9C9A #D9C7A0 #C0704B #F2E6CF.
- Space / photos: #020203 #1B2D50 #4F4F4F #6E6E6E #ADACB1 #CDCFD5.
- We Bare Bears wide shots (muted, so the globe reveal pops): #49675C #8FBCC6 #37493C #8C9899 #5D7364 #8BB0CA.

## References read on the board
NASA Top of Atmosphere, Apollo 8 Earthrise (colour and B&W), Blue Marble Western Hemisphere, ISS limb at sunset, Apollo 17 Blue Marble, LRO Earthrise over Compton crater (proportion and light only) · Porco Rosso (golden clouds from the air) · Kirby Forgotten Land world map (city island from above) and Everbay Coast map (islands in clean flat colour) · Doraemon Earth & Moon · Eames *Powers of Ten* (the classic zoom) · NASA SVS rotating globes (turntable, clouds, day/night).
