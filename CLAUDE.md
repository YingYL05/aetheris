# Aetheris

Concept landing site for the Aetheris Initiative, a fictional planetary-restoration organization (space elevator,
L1 sunshade, seeding gliders, ocean cleanup). Source brief: the user's PDF "Aetheris Initiative Corporate Overview &
Architecture" (doc ref AETH-CORE-2026). Latest version (2026-10-25) is 7 pages: §14 Earth Port as a ~780 km²
mega-city archipelago and the Angel flight cycle, §15 Leviathan-class ships, §16 the Apex Station at GEO (asteroid
core, orbital labs, parasol forges, interstellar drydock, Kessler debris fleet). The Apex Station has its own model
stop, page section (#apex) and a live debris counter.
Second brief (2026-10-26): "Angel-Class Launch Sequence & Trajectory". Primary launch is the mag-drop: gliders hang
from EM rail mounts under Midway (30 km, below 12 hPa), free-fall along the tether, tether inductors bend them into a
J-curve that levels out at 25-27 km (3-5 km drop, up to 9.5 G, never below 20 km), scramjets light at Mach 3, cruise
Mach 6. Secondary is a mag-lev catapult on a 3.5 km titanium runway (ejection Mach 1.5+, steep climb). In the model
(2026-10-26, user's spec): Midway sits at `MIDWAY_Y` 58 so the drop has room. Three launch lanes (`LANES`, the
`DROP` profile) each have a rail mount, a linear inductor on the tether, a translucent field "half-pipe" that lights
during the bend and a ring that flashes at the push-out (`laneFx`). Sequence per Angel: hang level on the mount for
the checks (`gl.hold`), pitch nose-down on release (`tFall`), free-fall belly-to-tether, inductor J-curve (`tBend`),
push-out burst (`tPush`, also scramjet ignition `tIgn`, fading by `tBlast`), then cruise. `laneQuat` keeps the belly
toward the tether through the drop; elsewhere gliders use lookAt. Contrails only after ignition, and ANGEL-08 on
the east-runway catapult with a sled. Climbers ride the +x / -z sides of the tether, clear of the lanes. Page: section #launch (05), which also has a plan-view anatomy
drawing of an Angel (`.anatomy`) and the "vertical maglev" drop / bend / push-out explainer. Apex, Accord, Open access are 06-08.
Canister release at 1,000 m (main brief) still happens over the target after the high cruise. Its section 11 is the page outline; keep
copy and figures consistent with it. When versions or sections disagree, the newest and most specific text wins:
Mach 6+, Leviathans are 500+ m and number 64 (they are "the Whales"; the small boats in the model are sweep drones),
Leviathans replace the spar-buoy hubs as research sub-hubs (moon pools, manned subs, hydrothermal vents).

- `index.html`: the whole site in one complete HTML document (doctype, utf-8 charset). Three.js r128 from cdnjs is
  the only dependency.
- Run: `python -m http.server 4392` in this folder, then http://127.0.0.1:4392/. The user wants this project on
  localhost only (2026-10-25): don't republish it as an artifact unless asked. An old artifact copy exists at
  https://claude.ai/artifact/QagTVDZE4HUintYKJ4GHk6 (version 6, now stale).
- Hosting (2026-10-26): private repo github.com/YingYL05/aetheris; Cloudflare Workers Builds deploys every push to
  `main` at https://aetheris.yingyuul05.workers.dev/ (the share link for the user's friends). The whole repo folder
  is the asset directory, so `.assetsignore` keeps everything but `index.html` off the public site (it was serving
  these notes and `.git`, whose history has the author email). Add any new non-public file to it.
- Aesthetic (redesign 2026-10-25): Endfield idiom, but deliberately NOT like Foreman's landing (user's request; the
  earlier version felt clunky and too close). "Orbital telemetry": cool-grey page (#eceff3) with white cards (`--surface`) layered on it, one deep-navy section (telemetry, `.band.dark`, which redefines the tokens), hairline rules
  instead of boxed cards, chamfered corners (`.cut`), slanted tags (`.ptag`), big outlined section numerals, a
  thin-line orbit diagram in the hero, full-bleed 3D model. Type: Saira at wide stretch (display), Inter (body),
  IBM Plex Mono (labels, numbers). Colour: navy ink #0f172a for text and the primary button; Stratosphere Blue
  #0284c7 only for lines, active states, "permission." and the 3D vehicles (#0ea5e9). Avoid Foreman's motifs:
  "+" grid, hatched text, corner brackets, hazard stripes, dashed SEC labels, dark nameplate footer, orange accents,
  Space Grotesk. Same trademark care as Foreman: no Endfield/Arknights names, logos, art or fonts.
  Don't name classes `.foot` inside sections; the footer owns it.
- Accessibility target WCAG 2.2 AA. Passed axe-core 4.10 plus manual checks on 2026-10-25: contrast pairs measured
  (lowest text pair 4.66:1, faint labels on the button grey), keyboard (skip link, roving-focus tabs with arrow keys for systems and endpoints, arrow
  keys on the 3D stage), a header "Pause motion" toggle that freezes the 3D sim, orbit animation and telemetry
  (2.2.2), status announcements via `#sr-status`, 320px reflow, 24px targets. axe still flags the outlined section
  numerals and footer wordmark: decorative and aria-hidden with a 6.2:1 outline, so ignore. Never make `#mcard` a
  live region; its counter updates every second.
- Miniature layout (2026-10-25, modelled on the Emons reel the user shared): zones are far apart and anchored by
  `P`, `IC`, `G`, `R0`, `L1P` at the top of the stops code; each stop frames one zone tightly so the camera glides
  between them. The ocean is 840 units wide with fog in the page colour, so no edge ever shows; the sun's shadow box
  follows the camera. The user found the earlier tabletop version too clumped, so don't pull zones back together.
  Upscale (2026-10-26, user asked for bigger, more detailed models): the stage fills the viewport under the header,
  `frameStop` frames each stop at 0.74 of its `ext` (overview 0.88), and the vehicles carry detail: `makeGlider`
  (ceramic spine, swept wings with glowing leading edges `M.glow`, ventral frame and intake, twin fins),
  `makeClimber`, Midway rail beams and clamps, Leviathan windows, mast and crane, finned subs.
  Bigger operation (2026-10-26, user): `CITY` has an outer ring of districts (arcology towers, foundry with sawtooth
  halls and stacks, harbor with gantry cranes and a Leviathan in refit at `HARBOR`, two more city islands), each
  bridged to its nearest district; towers run taller. West of the burned island is a mainland coast (`landH`,
  `coastAt`: beach, field patchwork, forest, ridge, small town, pier, lighthouse) in the `hills` group, which hides
  only above y 80. Loop 1 crosses it on the way out, and the "Mainland" stop (AETH//01-H; harvesters and reef are
  now I and J) frames the crossing. Terrain base colours are deliberately dark because the light rig washes flat
  colour toward white.
  The wave farm (anchor `WF`, south of the core) must read as connected infrastructure: strings, buoys, collector
  platform, cables to the city, and its "Wave farm · power" tag.
- Topography (user, 2026-10-25): wanted as a subtle add-on, never the signature. Unlike Foreman's full-bleed ink
  contours, Aetheris uses bathymetric (sea-floor) contours in blue, as local patches that fade outward, with a
  couple of depth soundings. The user then asked for them a bit more prominent (the page felt empty), so there are
  four patches alternating sides down the page: hero bottom-left (`.bathy-light.bl`, kept in the margin so it
  never runs behind the subheading or buttons), telemetry top-right (`.bathy`), Accord right edge
  (`.bathy-light.tr` inside `.tex-host`), footer seamount by the Earth Port marker. Every fourth ring is a
  heavier index contour (`.ix`). Don't spread them into full-section backgrounds.
- Texture kit (2026-10-25; the user liked Foreman's texture density but the motifs must stay Aetheris's own):
  masked dot-matrix fields (`.tex-dots` + `.dots-l/-r/-c`, and `.hero::before` radiating from the orbit), scanlines
  on dark surfaces (`.band.dark::after`, `.response`), tick rulers on every `.sec-head` rule (`--tick`,
  `--tick-major`), a dotted drafting grid in `.drawing`, and fixed film grain (`body::after`, 5% multiply).
  Counterparts, not copies, of Foreman's "+" grid, halftone, dimension lines and blueprint grid. Second pass (user
  asked for "a bit more"): stronger dots and grain (7%), tick strips along the top of white cards and under the
  model bar, and rotated `.gutter` margin labels per section (shown only above 1400px wide).
- Footer: a decorative sinusoidal lat/long graticule (`.graticule`, generated paths, central meridian 94°E so the
  Earth Port marker at 1.8°N 140.2°W lands right of the wordmark). If you change those coordinates, regenerate the
  paths and keep them matching the fleet GeoJSON.
- Polish (2026-10-25 refine pass): header scroll-progress line (`.progress`, `--p`) and scroll-spy `aria-current`
  on nav links; reveal-on-scroll (`.rv`/`.in`) applied only to elements that start below the fold, never under
  reduced motion; side-card content fades in per stop; white cards lift on hover; favicon, description and
  theme-color in the head. The distant hills (`hills` group) hide when the camera target is above y 50.
- Miniature: isometric ortho camera, stops in `STOPS`. Blue marks everything that moves (climbers, gliders,
  harvesters, subs). The island regrows as gliders seed it; harvesters clear gyre plastic; subs restore coral. Those
  counters feed the telemetry cards, the event log and the API sample responses. Telemetry is simulated; the
  footer says the project is fictional. Keep that label.
