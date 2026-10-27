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
  City (2026-10-26, user wants it like Atlantis in Stargate: one connected, symmetric base, never bridged islands):
  a twelve-sided hub deck (`HUB_R`) a step above six identical piers 60 degrees apart (`ARMS`, `PIER_L/W/WING`,
  extruded decks in a pier frame u/v with a wing either side). Hub spires stand on the west half only; the east
  half stays low under the landing glider's climb-out. Piers: flight (0 deg: landing runway at `RZ` and the
  catapult track at `CAT_Z` side by side, hangars, control tower; the user wants runways in one section), rectenna,
  residential, arcology, foundry, and an enclosed shipyard (basin cut through the deck, walls, translucent roof,
  a lift gate between two towers, gantry; the viewer-facing wall is a glass curtain so the refit Leviathan at
  `HARBOR` shows). The basin runs out through the pier's square tip as a channel to the sea (user: the end must be a
  door to the ocean). The Leviathan stays in for refit (user: show work instead of sailing out): the hall gantry
  moves between spots on two Leviathans in the hall, lowers a plate and welding sparks flicker (`HARBOR.yard`).
  Scale (2026-10-26, user: the city is New York-sized and a Leviathan is about two carriers, ~660 m): every Leviathan
  is `LEV_S` 0.45 (about a twentieth of the city's width; towers stay exaggerated), and the harvest sweep, cats,
  drones and plastic shrink with it. No docks stick out of the city: Leviathans berth inside the bay between the
  foundry and shipyard piers (`BERTHS`, one in scaffolding), jib cranes on the decks (`CRANES`, `dockCranes`) swing
  containers onto them, and small supply ships and tugs (`makeShip`, half scale) moor round the bay.
  The shipyard hall is sized to its two ships (`BASIN` 34-52, half-width 3.4, walls 5 high) with a fabrication shop
  beside it and small containers on the wings. Ship models use `hullGeo` (pointed bows toward +z): Leviathans have
  pointed main hull and outriggers plus glowing drone pads, sweep drones (`makeCat`) pointed twin hulls, and the
  underwater harvest drones are finned torpedoes with a sensor eye.
  farm sits in the bay between the flight and rectenna piers. Whites are toned down (ceramic #e3e8ee, hemi 0.88)
  after the user found the city too bright. Towers use `tower()`: one striped glazing mesh (`M.bands`, alpha-map
  stripes) instead of stacked bands, to keep the mesh count down. The mainland sits at the map edge (coast ~x -300,
  `landH`/`coastAt`, in the `hills` group, hidden only above y 80) since the elevator is in open ocean; loop 1
  crosses it at a faster cruise (`gl.cruise`), framed by the "Mainland" stop (AETH//01-H; harvesters and reef are
  I and J). Terrain base colours are deliberately dark because the light rig washes flat colour toward white.
  Elevator anchor and tether length (2026-10-26, user): the tether base is a tiered anchor tower after the Ace
  Combat space elevator (`TIERS`, garden terraces, ribs, crown with the power emitter; `ANCHOR_TOP` ~40), with six
  buttresses in line with the piers so the city reads as growing out of it. Hub spires stand at r 17.5-19.5 and stay
  under ~26 so the anchor is the tallest thing in the city; Aura Core sits on the hub at `AURA`. Midway is at
  `MIDWAY_Y` 84 and the Apex at `APEX_Y` 172 so the tether has room (the user found it cramped). City life (the
  user wants it to feel lived in, and green): maglev trains on the hub ring rail, trams on three pier spines,
  ferries shuttling out through three bays, quadcopter drones (`cityDrones`) hopping between waypoints at y 30-39
  with spinning rotors, beacons and some parcels (the user wants drones for the high-tech feel, not flying cars), tree rows along piers, green roofs on
  low-rise and tower tops.
  Burned island (2026-10-26, user: too close to the city): `IC` is out in the south-west corner (-210, 190), off
  the mainland coast. Irregular outline (`ISLE_R`), beach and cliff body extruded from it, seeding tiles as columns
  terraced to `isleH` (central hill and shoulder), charred snags that fall away as tiles green, and a restoration
  camp facing the city. Seeds land via `tileAt`. All gliders cruise at 48 above y 14 so the long legs don't drag;
  the mainland route crosses the coast near the town (z ~150) and meets the island from the coast.
  Map controls (2026-10-26, user): drag pans on the ground plane, Ctrl + scroll or pinch zooms toward the cursor,
  right-drag / Shift-drag / two-finger twist rotates (vertical right-drag tilts), plus `.mapctl` buttons (zoom,
  rotate 45 deg, reset) and keys + - Q E 0 via `mapAction`. Plain scroll only zooms once the map has been pressed
  (until the pointer leaves), otherwise it scrolls the page and flashes `#map-hint`, so the full-height model never
  traps scrolling. `cam.az/el/zoom` ease toward their goals; `basis()` rebuilds the view axes, and `frameStop`
  frames against the goal orientation, so stops work from any turn. Zoom 0.16-10, pan clamped to +/-360; the ocean
  is 1,800 wide and the shadow box widens when zoomed out so no edge shows.
  Scale pass (2026-10-26, user asked to fix scaling and placement): the Leviathan gyre `G` (200, -150) and the reef
  `R0` (165, 195) sit well out to sea instead of hugging the city; Angels are scale 1 (0.9 parked and hanging) and
  drones 0.65 so neither dwarfs the towers; background islets are small green islands with beaches; place tags hide
  when zoomed far out (`tagsOn`); nothing in orbit casts shadows on the sea.
  Reef (2026-10-27, user: more colour and area): a shallow sandy shelf (`REEF_R`, `SHELF` 2.5) with ~120 corals in
  four shapes (brain, branching, fan, tube; `CORAL_GEO`, `PARTS`) and reef colours (`REEF_COLS`); bleached ones are
  white until the drones restore them. Corals and fish use `M.coral`, transparent but fully opaque with renderOrder 3
  so they draw after the water layer and keep their colour, plus a slight glow in their own colour. Seagrass beds,
  rocks and two fish schools; three reef drones (scale 0.4) patrol the shelf; the vent sits just off it.
  Leviathans as carriers and campuses (2026-10-27, user: they carry their own aircraft like a carrier and are a
  small city at sea): side decks over the outriggers make one broad top; starboard is a flight deck with markings,
  parked jets (`makeJet`) and a control island; port is a campus of habitat blocks with lit windows, green roofs, a
  slim tower, lawn and trees. The two harvesting ships (`carriers`) each fly a jet round `CIRCUIT` (ship-local
  touch-and-go loop) and have two tenders circling; docked clones carry the same deck with parked aircraft. Page copy
  (harvest card, systems tab, fleet profile and its drawing) mentions the air wing and campus.
  City scale (2026-10-27, user: aircraft were massive, make the city bigger; this supersedes earlier numbers): the
  whole Earth Port city builds into `cityG`, scaled by `CITY_K` 1.6 (a `home` default parent switches to it while
  the city, wave farm and city life are built, so all city numbers stay in city units; `ck()` converts a city point
  to world units for the glider runway routes, the catapult/strip checks and the sled). Ships inside the city use
  `LEV_BASE` 0.45 under the group; at sea `LEV_S` = 0.45 x 1.6, and the harvest sweep grows with it. Angels are
  scale 0.7 (0.65 hanging/parked), carrier jets half size, city drones 0.42 in city units. The anchor crown is
  `ANCHOR_W` (~63) in world units, so Midway moved to `MIDWAY_Y` 120, the Apex to `APEX_Y` 220 and L1 to y 200. The
  second harvester (`lev2`) holds station (it used to follow the first and jumped once a lap).
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
- To scale (2026-10-27): the user agreed the 3D model stays "not to scale" for legibility (keep the order city >
  Leviathan > Angel > drone, and keep each scene internally consistent). True sizes live in the fleet section's
  `.to-scale` strip: Angel (~50 m, bomber class, the user's figure) beside a B-2 at 52 m; a Leviathan (~660 m) beside
  a 333 m carrier; the Earth Port footprint (~780 km² with its bays) inside an area-true circle for all of NYC (783
  km²) beside Manhattan (59 km²). Each drawing is to scale with its own scale bar.
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
