# BACKGROUND 1 · WORLD REVEAL: THE 360° TURN (storyboard scenes 3–4)
**Era (brief):** Sc 3–4 = **1960s** TV limited animation. (Sc 5 turns 1945 B&W and Sc 6 bleeds back to colour; this file covers only the 360° turn, so the era dropdown offers 1960s · 1945 · base colour.)
**Deadline (plan):** week 1 · Fri 9 Oct 2026.

## The shot: only the 360° turn
- Follow the team's own test ("convert mp4 to threejs.html"): the camera **orbits** the characters (radius 7, height 1.7 with a ±0.1 bob, looking at (0, 1.05, 0)) on top of a cream dome. One full 360° per **24 s loop**, vertical FOV 45°.
- Dome = a sphere cap, R 40 (centre at y −40, cap angle 0.9 rad), ground at y −12. The characters' spot (r < 2.6) stays empty and calm.
- Snow's 360° diagram (Discord, 2 Oct): only the 3 **blue** panels are drawn; the **red** panels at the far left and right are a smear that the artist does **by hand**. So: **no motion blur and no smear wall** in the scene. A small screen-only minimap shows the blue/red panels and where the camera points (blue centre panel = the middle of the loop).
- **Export = one long, seamless 360° panorama strip**: a camera turning in place at the dome centre (same height 1.7, pitch and 45° lens as the orbit) is stitched slice by slice, so nothing can break. The orbit's depth comes back from the per-element PNGs (dome / rocks / trees in front slide faster than the city). There is no separate 3-panel export.

## The city: an advanced city of the 1960s (not Tokyo rules)
New York / Chicago / London feel, drawn kawaii and pastel:
- **Downtown** (facing the blue centre panel): a FEW Art Deco setback towers with a rounded crown and short spire (≈ 30–38 units) and a few International Style office slabs with window grids (7–10 floors). Tall but rare, and always inside the frame.
- **Mid-rise** brick/stone blocks, 5–9 floors, with cornices, windows on all sides, **wooden rooftop water tanks on legs** (classic 1960s New York), rooftop sign frames, AC boxes and antennas.
- **Row houses** (3–4 floors, flat roof, cornice) in the inner ring; **shops** (2 floors, coloured awning, vertical neon sign) along the main roads; **suburban houses** with rounded gable roofs, chimneys and small trees at the edge.
- Streets: the team's 8-unit alley grid (cream ground, white alleys), two ring roads and four avenues, all outlined (id colour). A river with three bridges behind the dome. Rounded 60s cars (some yellow cabs) and buses on the ring roads; utility poles with sagging wires only in the outer suburban ring; lamp posts and benches around the dome foot; street trees along the avenues.
- **Landmark** (GUI): an Art Deco spire tower (default) or a round 1962-style observation needle, on the right third of the blue centre view, sized to fit the frame.
- Building heights must look natural and varied (low houses → mid blocks → a few towers), never one flat height, and never plain boxes: always windows and rooftop life.
- **Open sky above the city**: max floors by ring (near the dome 3–4, middle ring 6, downtown 7; Art Deco towers ≈ 22–26 units plus the crown; the landmark ≈ 35 units), so every roof stays well below the top of the frame. Windows are flat panels (no thickness), so their lines never double.

## The hill (dome) is never bare
Dense enough to read in every frame: ≈340 Chiikawa dashes and ≈220 tufts (ink lines), plus ≈80 rocks (1–3 rounded lavender-grey stones), fallen logs with a light cut-end ring, stumps, dead branches, grass clumps (5 soft blades), small flowers (pink / yellow / white / lilac with a yellow centre), bushes and the team test's round trees. Everything stays clear of the characters' spot.

## Horizon and sky
Two rings of lavender triangle ridges (#B9B6D4 / #D3D0E6). Dynamic, outlined white clouds: big cumulus, medium clusters and small puffs at varied distances (200–290) and heights (between the ridge tops ≈7° and 15° above the horizon, minus their own size), so they stay **whole** inside the frame and never look copy-pasted. They drift slowly. Light presets: team test (soft day, default), golden hour, blue hour. Cream fog (#F2F1DE) for depth.

## Palettes
- Team test pastels: #F4E3C1 #F7D2C4 #CFE8D5 #D9D3EE #CDE4F2 #FBEAB0 · greens #A6D6A0 #B8E2A9 #93CF95 · dome #F6EFD4 · ground #EBE5C9 · ink #8A6B64.
- 1960s grade: #1F3A68 #3E7CB1 #F2C14E #D94A38 #F4F1E8 (posterised, flat).

## Depth planes (FG · MG · BG · far)
- FG (< 5 from the lens, darkest): real objects near the orbit — three big trees planted just outside it (r ≈ 10) whose low crowns reach in over the camera path (the turn passes under them), and a ring of rocks, stumps, bushes, tall grass and logs at r 4.6–6.2, never taller than the line to the characters' feet. Every frame of the turn shows different FG.
- MG (< 60): the dome with its rocks, logs, tufts and flowers, the park trees and the characters' spot.
- BG (< 240): the city rings, landmark tower.
- far: lavender ridges and clouds, lightest.

## Elements in the ZIP
foreground · sky · ground · river · dome · rocks · logs · grass · flowers · city · houses · trees · landmark · poles · cars · street · hills · clouds

## References read on the board
Snow's 360° diagram and quick 3D mockup (dome layout only; ignore the 2 spheres) · the team's city test · Kirby Cappy Town / Waddle Dee Town / Downtown Grassland · Doraemon city views (Tamagawa riverbank, Nobita's town from above) · We Bare Bears SF plates (simple blocks, muted colour) · aerial photos of Osaka, Hong Kong, Singapore and Venice (how a city stacks into depth, rivers, waterfronts) · Chiikawa field and Kirby pixel scenes (simple style).
