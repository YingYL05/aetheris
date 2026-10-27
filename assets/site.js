(() => {
  const $ = (s) => document.querySelector(s);
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowMQ = matchMedia('(max-width: 760px)');
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const minus = (s) => s.replace('-', '−');

  // Shared simulation counters (the model feeds them, the telemetry section reads them)
  // Screen-reader announcements and the page-wide motion pause (WCAG 2.2.2)
  const announce = (t) => { const el = document.getElementById('sr-status'); el.textContent = ''; setTimeout(() => (el.textContent = t), 30); };
  let paused = false;
  const motionBtn = document.getElementById('motion');
  motionBtn.addEventListener('click', () => {
    paused = !paused;
    motionBtn.setAttribute('aria-pressed', paused);
    document.documentElement.classList.toggle('motion-paused', paused);
    announce(paused ? 'Motion paused' : 'Motion resumed');
  });

  // Hooks the live model fills in when it's on the page. Elsewhere the fleet feed is a stand-in: eight Angels on
  // plausible tracks near Earth Port's longitude.
  let goStop = null, updateLiveHook = () => {};
  let fleetFeatures = () => Array.from({ length: 8 }, (_, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [+(-140.2 - i * 1.7 + Math.random() * 0.2).toFixed(4), +(1.8 + i * 0.9 - Math.random() * 0.2).toFixed(4)] },
    properties: { id: `ANGEL-${String(i + 1).padStart(2, '0')}`, mach: +(6 + Math.random() * 0.4).toFixed(2), altitude_m: 26000 + Math.round(Math.random() * 1000), dispersing: false }
  }));
  const put = (sel, v, asHTML) => { const el = $(sel); if (el) el[asHTML ? 'innerHTML' : 'textContent'] = v; };

  const sim = { debris: 0, panels: 0, tilesRegrown: 0, tilesTotal: 0, seeds: 0, plastic: 0, coral: 0, airborne: 0, climbUp: 0, forecast: 51204, tilt: 0 };

  // ---------- Scroll progress, active nav, reveal on scroll ----------
  const head = document.querySelector('.site-head');
  let progTick = false;
  const progress = () => {
    progTick = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    head.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  };
  addEventListener('scroll', () => { if (!progTick) { progTick = true; requestAnimationFrame(progress); } }, { passive: true });
  progress();
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
      navLinks.forEach((a) => { if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'true'); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((sec) => spy.observe(sec));
  // Only content that starts below the fold is hidden for the reveal, so the first screen is always complete
  if (!reduceMQ.matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.sec-head, .metrics, .feed, .sys, .profile, .apex > *, .kessler, .pillar, .council, .api, .access > *, .lede, .jcurve, .launch-metrics, .anatomy > figure').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      const sibs = [...el.parentElement.children].filter((c) => c.matches('.profile, .pillar, .access > *, .apex > *'));
      if (sibs.length > 1) el.style.transitionDelay = `${sibs.indexOf(el) * 90}ms`;
      el.classList.add('rv');
      reveal.observe(el);
    });
  }

  // ---------- Event feed ----------
  const feed = $('#feed');
  const stamp = () => new Date().toISOString().slice(11, 19);
  function log(who, msg) {
    if (!feed) return;
    const li = document.createElement('li');
    li.innerHTML = `<time>${stamp()}</time><span><b>${who}</b> · ${msg}</span>`;
    feed.prepend(li);
    while (feed.children.length > 7) feed.lastChild.remove();
  }
  log('AURA', 'Forecast loop nominal · 14,000 vectors');
  log('L1', 'Parasol trim held · Council setpoint 1.200%');
  log('SPIRE', 'Climber C-2 handoff at GEO');

  // ---------- Systems tabs ----------
  const SYSTEMS = [
    { tab: 'Earth Port Spire', stop: 'spire', dim: '36,000 km · platform to GEO',
      title: 'A ribbon to orbit, anchored at sea',
      body: 'A continuous carbon nanotube ribbon runs from the anchor tower at the heart of Earth Port to beyond geostationary orbit, held in tension by an asteroid counterweight. Maglev climbers ride its dual tracks on laser-beamed power and recover 99.8% of their energy.',
      specs: [['Material', 'Crystalline carbon-boron nanotube ribbon'], ['Counterweight', 'Apex Station: captured asteroid at GEO'], ['Climbers', 'Magnetic levitation, laser power beaming'], ['Energy recovery', '99.8%'], ['Delivery cost', '$0.18/kg']] },
    { tab: 'Angel Fleet', stop: 'angels', dim: '30 km launch · 1,000 m release',
      title: 'Seeding burned land from the edge of space',
      body: 'Gliders drop from the Stratosphere Port into a magnetic J-curve, light their hydrogen scramjets at Mach 3 and cruise at Mach 6 to damaged biomes. At 1,000 m they release barometric micro-canisters that carry everything a burned forest floor needs to restart, then glide home on solar wings.',
      specs: [['Fleet', '48 Angel-class gliders, ceramic-white composite'], ['Propulsion', 'Hydrogen fuel-cell scramjets out (Mach 6+), solar glide back'], ['Reach', 'Any point on Earth in under two hours'], ['Payload', 'Fungal spore matrices, mycorrhizae, auxin and gibberellin catalysts, native soil microbiota'], ['Flagship', 'Angel-Zero, tandem passenger craft']] },
    { tab: 'Oceanic Harvesters', stop: 'harvest', dim: 'Gyres to abyss',
      title: 'Cleaning the gyres, rebuilding the reefs',
      body: 'Sixty-four Leviathan-class trimarans, each about twice the length of an aircraft carrier, sweep the gyres with electromagnetic nets and forge the catch into drone parts. Their hives launch thousands of drones that clean, restore reef and map the abyss, and their upper decks are small cities for international research crews, with an air wing that flies off the deck like a carrier’s.',
      specs: [['Fleet', '64 Leviathan-class trimarans, 500+ m'], ['Sweep', 'Electromagnetic nets, acoustic-vortex drones'], ['Reef work', 'Micro-welding heat-tolerant polyps'], ['Research', 'Moon pools, manned submersibles, hydrothermal vents']] },
    { tab: 'Aura Core AI', stop: 'aura', dim: '100 ms forecast loop',
      title: 'An intelligence that keeps its distance',
      body: 'Aura runs the planetary forecast, sets the parasol and seeder schedules, and defends the platform without lethal force. Its persona is modeled on the founder’s late partner. Both keep strict operational and emotional boundaries so neither biases the other.',
      specs: [['Forecasting', '14,000 satellite vectors, continuous'], ['Defense', 'Phased-array RF jamming, ECM, acoustic water barriers'], ['Intercept', 'Automated, 100%'], ['Gateway', 'Public telemetry to universities, zero cost']] }
  ];
  const tabsEl = $('#tabs'), panel = $('#tabpanel');
  let tabIdx = 0;
  function renderTab() {
    [...tabsEl.children].forEach((b, i) => { b.setAttribute('aria-selected', i === tabIdx); b.tabIndex = i === tabIdx ? 0 : -1; });
    const s = SYSTEMS[tabIdx];
    panel.setAttribute('aria-labelledby', `tab-${tabIdx}`);
    panel.innerHTML = `
      <div>
        <span class="mono kicker">System 0${tabIdx + 1}</span>
        <h3 style="margin-top:8px">${s.title}</h3>
        <p>${s.body}</p>
        <button class="btn sm" type="button" data-show="${s.stop}">Show in the live model <span class="arrow" aria-hidden="true">→</span></button>
      </div>
      <div>
        <div class="dim-wrap"><div class="dim mono"><span>${s.dim}</span></div></div>
        <dl class="specs">${s.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      </div>`;
  }
  if (tabsEl) SYSTEMS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `tab-${i}`; b.textContent = s.tab;
    b.setAttribute('aria-controls', 'tabpanel');
    b.addEventListener('click', () => { tabIdx = i; renderTab(); });
    b.addEventListener('keydown', (e) => {
      const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown', back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
      if (!fwd && !back) return;
      e.preventDefault();
      tabIdx = (tabIdx + (fwd ? 1 : -1) + SYSTEMS.length) % SYSTEMS.length;
      renderTab(); tabsEl.children[tabIdx].focus();
    });
    tabsEl.appendChild(b);
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-show]');
    if (!b) return;
    // Fly the camera on the model page; from any other page, open the model page at that stop
    if (!goStop) { location.href = 'model.html#' + b.dataset.show; return; }
    $('#model').scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'start' });
    goStop(b.dataset.show);
  });
  if (tabsEl) renderTab();

  // ---------- Open APIs ----------
  const ENDPOINTS = [
    { path: '/api/v1/telemetry/climate', desc: 'Surface mean, CO₂ saturation, L1 occlusion', meta: 'JSON · real-time 1 Hz',
      body: () => JSON.stringify({ timestamp: new Date().toISOString().slice(0, 19) + 'Z', surface_mean_delta_c: +temp.toFixed(3), co2_saturation_ppm: 421.7, l1_shade_occlusion_pct: +occl.toFixed(3), reseeded_ha: Math.round(hectares), plastic_captured_mt: Math.round(plastic) }, null, 2) },
    { path: '/api/v1/fleet/angelflight', desc: 'GPS, Mach velocity, dispersal logs', meta: 'GeoJSON stream',
      body: () => JSON.stringify({ type: 'FeatureCollection', features: fleetFeatures() }, null, 2) },
    { path: '/api/v1/accord/manifesto', desc: 'Accord text, signatories, council minutes', meta: 'Markdown / PDF',
      body: () => `# The Earth Port Accord\n\n## Pillar 1 · Neutral Commons\nEarth Port is recognized as a demilitarized global scientific asset.\nSovereign aggression is prohibited.\n\n## Pillar 2 · Climate Council\nRotating seats for 140+ nations, indigenous ecological councils\nand independent atmospheric scientists. The Council sets the L1\nshade angle and regional cooling by consensus.\n\n## Pillar 3 · Open Space Access\nPayloads for verified scientific and environmental missions fly\nat marginal energy cost ($0.18/kg), recorded on a distributed\nlaunch ledger managed by Aura Core.\n` }
  ];
  const epEl = $('#endpoints'), resp = $('#resp');
  let ep = 0;
  function renderEp() {
    [...epEl.children].forEach((b, i) => { b.setAttribute('aria-selected', i === ep); b.tabIndex = i === ep ? 0 : -1; });
    resp.setAttribute('aria-labelledby', `ep-${ep}`);
    $('#resp-meta').textContent = ENDPOINTS[ep].meta;
    resp.textContent = ENDPOINTS[ep].body();
  }
  if (epEl) ENDPOINTS.forEach((e, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `ep-${i}`;
    b.setAttribute('aria-controls', 'resp');
    b.innerHTML = `<code><span class="verb">GET</span>${e.path}</code><span>${e.desc}</span>`;
    b.addEventListener('click', () => { ep = i; renderEp(); });
    b.addEventListener('keydown', (ev) => {
      const fwd = ev.key === 'ArrowDown' || ev.key === 'ArrowRight', back = ev.key === 'ArrowUp' || ev.key === 'ArrowLeft';
      if (!fwd && !back) return;
      ev.preventDefault();
      ep = (ep + (fwd ? 1 : -1) + ENDPOINTS.length) % ENDPOINTS.length;
      renderEp(); epEl.children[ep].focus();
    });
    epEl.appendChild(b);
  });
  document.querySelectorAll('[data-endpoint]').forEach((b) => b.addEventListener('click', () => {
    ep = +b.dataset.endpoint; renderEp();
    $('#apis').scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  }));
  if (epEl) $('#copy').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const done = (t) => { btn.textContent = t; announce(t); setTimeout(() => (btn.textContent = 'Copy response'), 1600); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(resp); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected, press Ctrl+C'); };
    try { navigator.clipboard.writeText(resp.textContent).then(() => done('Copied'), fallback); } catch { fallback(); }
  });

  // Payload quote
  function quote() {
    const kg = Math.max(0, Math.floor(+$('#payload-kg').value || 0));
    const ok = $('#verified').checked;
    $('#quote-cost').textContent = ok ? '$' + fmt(kg * 0.18, kg * 0.18 < 100 ? 2 : 0) : 'Not eligible';
    $('#quote-note').textContent = ok ? `${fmt(kg)} kg at $0.18/kg` : 'Accord pricing covers verified missions only';
  }
  if ($('#quote-form')) {
    $('#quote-form').addEventListener('input', quote);
    $('#quote-form').addEventListener('submit', (e) => e.preventDefault());
    quote();
  }

  // ---------- Telemetry ----------
  let temp = -0.42, occl = 1.2, hectares = 14.2e6, plastic = 42000;
  const hist = { temp: [], ha: [], plastic: [], l1: [] };
  function bars(id, arr) {
    const el = document.getElementById(id);
    if (!el) return;
    const min = Math.min(...arr), max = Math.max(...arr), span = max - min || 1;
    el.innerHTML = arr.map((v) => `<i style="height:${(20 + (v - min) / span * 80).toFixed(0)}%"></i>`).join('');
  }
  function tick() {
    const moving = !reduceMQ.matches && !paused;
    if (moving) {
      temp = -0.42 + (Math.random() - 0.5) * 0.006;
      occl = 1.2 + sim.tilt * 0.4;
      sim.forecast += 10;
      if (!goStop && Math.random() < 0.35) sim.debris++;   // no live model here: keep the debris tally moving
    }
    [['temp', temp], ['ha', hectares], ['plastic', plastic], ['l1', occl]].forEach(([k, v]) => { hist[k].push(v); if (hist[k].length > 24) hist[k].shift(); });
    put('#m-temp', `${minus(temp.toFixed(3))}<small>°C</small>`, true);
    put('#ro-temp', minus(temp.toFixed(3)));
    put('#m-ha', `${(hectares / 1e6).toFixed(3)}<small>M ha</small>`, true);
    put('#m-plastic', `${fmt(plastic, 1)}<small>MT</small>`, true);
    put('#m-l1', `${occl.toFixed(3)}<small>%</small>`, true);
    bars('b-temp', hist.temp.map((v) => -v)); bars('b-ha', hist.ha); bars('b-plastic', hist.plastic); bars('b-l1', hist.l1);
    put('#feed-clock', stamp() + ' UTC');
    put('#k-debris', fmt(sim.debris));
    if (resp && ep !== 2) resp.textContent = ENDPOINTS[ep].body();
    updateLiveHook();
  }

  // ---------- Live model (model page only) ----------
  function initModel() {
    // ---------- Model stops ----------
    // Zone anchors. Spread wide so the camera glides between areas instead of seeing one crowded tabletop.
    const P = { x: 0, z: 0 };       // Earth Port core
    const IC = { x: -210, z: 190 };   // burned island, out in the south-west corner off the mainland coast
    const G = { x: 200, z: -150 };   // Leviathan gyre, well out to sea
    const R0 = { x: 165, z: 195 };   // reef and Abyss mission, out to sea on the other side
    const L1P = { x: -64, y: 200, z: -64 };
    const APEX_Y = 220;    // Apex Station: the top of the model's tether
    const MIDWAY_Y = 120;   // well above the anchor tower's crown (~63) so the drop has room
    // The Earth Port city is built in its own units and scaled up by this as one group (cityG), so ships at sea and
    // aircraft keep sensible proportions against a city the size of New York
    const CITY_K = 1.6;   // Stratosphere Port: high enough above the city for the whole mag-drop to play out
    const STOPS = [
      { id: 'overview', short: 'Overview', focus: [P.x - 3, 8, P.z - 6], ext: [190, 124],
        code: 'AETH//01', title: 'The whole operation, in miniature',
        body: 'A mega-city anchored in the equatorial Pacific feeds a tether to orbit, a stratospheric launch port, a seeding fleet and an ocean cleanup fleet. Pick a system to fly to it.',
        specs: [['Anchor', 'Earth Port mega-city, international waters'], ['Fleets', '48 Angel seeders · 64 Leviathans'], ['Status', 'Operational']],
        live: () => ['Seeders airborne', `${sim.airborne} of 8 shown`] },
      { id: 'port', short: 'Earth Port', focus: [P.x + 32, 3, P.z - 3], ext: [156, 100], pin: [P.x - 26, 12, P.z + 8],
        code: 'AETH//01-A', title: 'Earth Port mega-city',
        body: 'An artificial archipelago of titanium and ceramic, about the size of New York City, anchored in the calmest stretch of the equatorial Pacific. The model shows its heart: a raised hub around the tether anchor and the piers that grow out of it.',
        specs: [['Footprint', '~780 km², artificial archipelago'], ['Foundries', 'Lower-deck printing bays: shade panels to scramjet parts'], ['Flight pier', 'Titanium runway and mag-lev catapult side by side'], ['Power', 'Orbital microwave beaming, wave motion, OTEC'], ['Supply', 'Off-grid, no external fuel lines']],
        live: () => ['Climbers on tether', '4'] },
      { id: 'aura', short: 'Aura Core', focus: [P.x + 17.6, 5, P.z + 10.4], ext: [46, 31], pin: [P.x + 17.6, 8.8, P.z + 10.4],
        code: 'AETH//01-B', title: 'Aura Core · AETHER-OS',
        body: 'The intelligence that runs the system. It forecasts planetary weather, tilts the L1 shade, dispatches seeders and guards the platform without lethal force.',
        specs: [['Forecasting', '14,000 satellite vectors, 100 ms loop'], ['Defense', 'RF jamming, ECM, acoustic water barriers'], ['Persona', 'Modeled on the founder’s late partner'], ['API', 'Open access, zero cost']],
        live: () => ['Forecast cycle', fmt(sim.forecast)] },
      { id: 'spire', short: 'Spire', focus: [P.x, MIDWAY_Y / 2 + 4, P.z], ext: [70, 146], pin: [P.x + 1.5, MIDWAY_Y * 0.7, P.z],
        code: 'AETH//01-C', title: 'The Spire tether',
        body: 'A carbon nanotube ribbon from the anchor tower at the heart of the city to geostationary orbit, held taut by the Apex Station’s asteroid counterweight. Maglev climbers ride it on laser-beamed power.',
        specs: [['Length', '36,000 km to GEO'], ['Tracks', 'Dual ascender tracks, fiber-optic telemetry core'], ['Throughput', 'Thousands of metric tons per week'], ['Cost', '$0.18/kg to orbit']],
        live: () => ['Climbers ascending', `${sim.climbUp} of 4`] },
      { id: 'strato', short: 'Stratosphere Port', focus: [P.x - 9, MIDWAY_Y - 6, P.z + 3], ext: [62, 42], pin: [P.x + 4, MIDWAY_Y + 3, P.z - 3],
        code: 'AETH//01-D', title: 'Stratosphere Port (Midway)',
        body: 'A station on the tether at 30 km. Angels hang from electromagnetic rail mounts underneath, then drop along the tether into a magnetic slingshot that never dips below 20 km.',
        specs: [['Altitude', '30 km (100,000 ft), below 12 hPa'], ['Mounts', 'EM rail mounts, hydraulic backup clamps'], ['Launch', 'Hang level, pitch nose-down, free-fall, inductor J-curve, push-out'], ['Fleet', '48 Angel-class seeders']],
        live: () => ['Seeders airborne', `${sim.airborne} of 8 shown`] },
      { id: 'apex', short: 'Apex Station', focus: [P.x + 14, APEX_Y - 2, P.z - 2], ext: [88, 56], pin: [P.x - 12, APEX_Y + 2, P.z + 4],
        code: 'AETH//01-E', title: 'Apex Station · GEO counterweight',
        body: 'The station whose mass keeps the tether taut. A captured asteroid at its centre is mined in zero gravity; around it sit labs, parasol forges, a drydock for a generation ship and the fleet that clears orbital debris.',
        specs: [['Anchor', 'Captured near-Earth asteroid at 36,000 km'], ['Mining', 'Rare-earth metals and silicates'], ['Labs', 'Long-term habitats under the Accord'], ['Forges', 'New L1 parasol panels, no launch cost'], ['Drydock', 'Generation ship under construction']],
        live: () => ['Debris captured this visit', `${sim.debris}`] },
      { id: 'l1', short: 'L1 Parasol', focus: [L1P.x, L1P.y, L1P.z], ext: [48, 34], pin: [L1P.x, L1P.y + 1, L1P.z],
        code: 'AETH//01-F', title: 'L1 Solar Parasol',
        body: 'A thin-film reflector parked between the Sun and Earth. The Climate Council sets its angle; Aura holds it there.',
        specs: [['Area', '1.8 million km²'], ['Material', 'Thin-film metamaterial mesh'], ['Effect', 'Diffuses 1.2% of solar irradiance'], ['Supply', 'New panels from the Apex Station forges'], ['Distance', '~1.5 million km (not to scale)']],
        live: () => ['Shade trim', `${sim.tilt >= 0 ? '+' : '−'}${Math.abs(sim.tilt).toFixed(3)}°`] },
      { id: 'angels', short: 'Angel Fleet', focus: [IC.x + 4, 5, IC.z], ext: [84, 56], pin: [IC.x, 9, IC.z - 4],
        code: 'AETH//01-G', title: 'Angel-class seeders',
        body: 'Gliders fly out at Mach 6+ on hydrogen, leaving only a water-vapor trail, and release canisters 1,000 m above burned land. They glide home on solar wings, then dock on the Midway rail or land on an Earth Port runway. Watch the island turn green.',
        specs: [['Fleet', '48 autonomous gliders, ceramic-white composite'], ['Outbound', 'Mag-drop J-curve to 26 km, scramjets at Mach 3, cruise Mach 6+'], ['Return', 'Solar glide on metamaterial wings, electric turbines'], ['Payload', 'Fungal spore matrices and mycorrhizae, growth bio-catalysts, native soil microbiota'], ['Recovery', 'Rail docking at 30 km, or a runway landing for servicing']],
        live: () => ['Island regrown', `${sim.tilesTotal ? Math.round(sim.tilesRegrown / sim.tilesTotal * 100) : 0}%`] },
      { id: 'mainland', short: 'Mainland', focus: [-280, 2, 160], ext: [150, 96], pin: [-300, 4, 150],
        code: 'AETH//01-H', title: 'Over the mainland coast',
        body: 'Seeding routes cross the mainland at cruise altitude, over coastal towns, farmland and the ridge behind them, then swing back out to sea and drop to 1,000 m over the burn scar. All they leave behind is a water-vapor trail.',
        specs: [['Cruise', 'Mach 6 in the upper stratosphere, above weather and air traffic'], ['Trail', 'Water vapor only'], ['Map', 'Coast and ridge shown, not to scale']],
        live: () => ['Seeders airborne', `${sim.airborne} of 8 shown`] },
      { id: 'harvest', short: 'Harvesters', focus: [G.x, 0, G.z], ext: [54, 37], pin: [G.x, 3, G.z],
        code: 'AETH//01-I', title: 'Leviathan-class harvesters',
        body: 'A Leviathan sweeps the gyre with an electromagnetic net and forges the catch into drone parts and coral-seed scaffolds. Sweep drones from its hive vacuum microplastics with acoustic vortexes. Each one is a small city at sea, with its own air wing.',
        specs: [['Fleet', '64 Leviathan-class trimarans, 500+ m'], ['Air wing', 'Aircraft flown off its own deck, like a carrier'], ['Campus', 'Homes, labs and gardens for a crew the size of a small town'], ['Net', 'Kilometer-wide sweep: macro-plastics, ghost nets, chemical pollutants'], ['Forge', 'Onboard 3D-printing foundries'], ['Hive', 'Thousands of drones: launch, recharge, data offload']],
        live: () => ['Captured this visit', `${sim.plastic} specks`] },
      { id: 'reef', short: 'Reef & Abyss', focus: [R0.x - 4, -2, R0.z + 2], ext: [54, 36], pin: [R0.x, -1, R0.z],
        code: 'AETH//01-J', title: 'Reef restoration & the Abyss mission',
        body: 'Drones from the Leviathans micro-weld heat-tolerant polyps onto bleached reef. A research Leviathan holds station while scientists dive a manned submersible from its moon pool to a hydrothermal vent.',
        specs: [['Reef drones', 'Micro-welding heat-tolerant polyps'], ['Sub-hub', 'Pressurized research campus, labs, observation lounges'], ['Crew', 'International teams aboard for months'], ['Dives', 'Manned submersibles via internal moon pools']],
        live: () => ['Coral restored this visit', `${sim.coral}`] }
    ];

    const stage = $('#stage'), mcard = $('#mcard'), dock = $('#dock'), pinsEl = $('#pins');
    let current = 0;

    function renderCard() {
      const s = STOPS[current];
      const [ll, lv] = s.live();
      mcard.innerHTML = `
        <span class="code mono">${s.code}</span>
        <h3>${s.title}</h3>
        <p>${s.body}</p>
        <dl class="specs">${s.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <div class="live-line mono"><span>${ll}</span><b id="live-val">${lv}</b></div>
        <div class="row">
          ${current ? `<button class="btn sm" type="button" data-go="${current - 1}">Previous</button>` : ''}
          <button class="btn sm primary" type="button" data-go="${(current + 1) % STOPS.length}">${current === STOPS.length - 1 ? 'Back to overview' : current ? 'Next system' : 'Start the tour'}</button>
        </div>
        ${current ? '' : '<span class="hint mono">Pick a system, or drag the map to explore</span>'}`;
    }
    function updateLive() {
      const el = $('#live-val');
      if (el) el.textContent = STOPS[current].live()[1];
    }
    mcard.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });

    STOPS.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = i ? `<span class="mono">${String(i).padStart(2, '0')}</span>${s.short}` : s.short;
      b.addEventListener('click', () => go(i));
      dock.appendChild(b);
    });
    const pins = STOPS.map((s, i) => {
      if (!s.pin) return null;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pin';
      b.setAttribute('aria-label', `Show ${s.title}`);
      b.innerHTML = `<span class="ring" aria-hidden="true"></span><span class="name mono" aria-hidden="true">${s.short}</span>`;
      b.addEventListener('click', () => go(i));
      pinsEl.appendChild(b);
      return b;
    });
    const TAGS = [
      { text: '30 km · Midway', at: [P.x + 13, MIDWAY_Y * 0.72, P.z] },
      { text: 'Wave farm · power', at: [P.x + 86, 2.4, P.z + 38] },
      { text: 'Foundry pier', at: [P.x - 32, 22, P.z - 56] },
      { text: 'Shipyard · Leviathan refit', at: [P.x + 32, 19, P.z - 58] },
      { text: 'Leviathan berths', at: [P.x, 11, P.z - 74] },
      { text: 'Flight pier · runway + catapult', at: [P.x + 90, 5, P.z - 16] },
      { text: '↑ Apex Station · GEO 36,000 km', at: [P.x + 1.5, MIDWAY_Y + 14, P.z] },
      { text: 'L1 · ~1.5M km · not to scale', at: [L1P.x, L1P.y - 6, L1P.z] }
    ].map((t) => { const el = document.createElement('span'); el.className = 'tag mono'; el.setAttribute('aria-hidden', 'true'); el.textContent = t.text; pinsEl.appendChild(el); return { ...t, el }; });

    function sync() {
      [...dock.children].forEach((b, i) => b.setAttribute('aria-pressed', i === current));
      pins.forEach((b, i) => b && b.setAttribute('aria-pressed', i === current));
      const a = dock.children[current];
      if (a) dock.scrollTo({ left: a.offsetLeft - dock.clientWidth / 2 + a.clientWidth / 2, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    }
    let frameStop = null, mapAction = null;
    function go(i) {
      current = (i + STOPS.length) % STOPS.length;
      renderCard(); sync();
      announce(`Showing ${STOPS[current].title}`);
      if (frameStop) frameStop(current, reduceMQ.matches);
    }
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(current + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(current - 1); }
      else if (e.key === 'Escape' || e.key === 'Home') go(0);
      else if (mapAction && mapAction(e.key)) e.preventDefault();
    });
    renderCard(); sync();
    goStop = (id) => go(STOPS.findIndex((s) => s.id === id));
    updateLiveHook = updateLive;


    // ---------- 3D model ----------
    if (!window.THREE) { $('#fallback').hidden = false; return; }
    const T = THREE;

    const PAL = {
      light: {
        bg: 0xe3e8ee, seabed: 0xdcd6c9, seabedSide: 0xc9c2b3, water: 0x2563c4, waterOp: 0.52, land: 0xe7e2d6, sand: 0xefe9dc,
        green: 0xb7d8ae, burnt: 0x8a817a, crown: 0x86b97f, stump: 0x5b534d, ceramic: 0xe3e8ee, trim: 0xc2cbd6, steel: 0x7b8899,
        tether: 0x9aa8b8, accent: 0x0ea5e9, glass: 0x7c90a6, coralDead: 0xf4f1ea, coral: 0xf29a7a, plastic: 0xf1f5f9,
        shade: 0x7dd3fc, shadeOp: 0.42, line: 0x0369a1, hemi: 0.88, sun: 0.72, glow: 0
      },
      dark: {
        bg: 0x0b1220, seabed: 0x1f2633, seabedSide: 0x161c27, water: 0x0e4a6b, waterOp: 0.6, land: 0x334155, sand: 0x3b4352,
        green: 0x3f7350, burnt: 0x1a1817, crown: 0x4c8a5a, stump: 0x0d0c0c, ceramic: 0x9aa7b8, trim: 0x475569, steel: 0x8796aa,
        tether: 0xa5b4c6, accent: 0x38bdf8, glass: 0x0f172a, coralDead: 0x6b7280, coral: 0xf0876a, plastic: 0xe2e8f0,
        shade: 0x38bdf8, shadeOp: 0.3, line: 0x7dd3fc, hemi: 0.45, sun: 0.6, glow: 0.55
      }
    };

    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    stage.prepend(renderer.domElement);

    const scene = new T.Scene();
    const S = 70;
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, -600, 1200);
    const ELEV = 30 * Math.PI / 180, AZ = 45 * Math.PI / 180;
    const hemi = new T.HemisphereLight(0xffffff, 0xaab4c0, 0.85);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xffffff, 0.85);
    sun.position.set(-35, 130, 75);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 520 });
    const SUN_OFF = new T.Vector3(-35, 130, 75);
    scene.add(sun.target);
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun);

    const M = {};
    ['seabed', 'seabedSide', 'land', 'sand', 'ceramic', 'trim', 'steel', 'tether', 'accent', 'glass', 'stump'].forEach((k) => {
      M[k] = new T.MeshStandardMaterial({ roughness: k === 'glass' ? 0.3 : 0.85, metalness: k === 'steel' ? 0.25 : 0 });
    });
    M.water = new T.MeshStandardMaterial({ transparent: true, roughness: 0.25, depthWrite: false });
    M.shade = new T.MeshStandardMaterial({ transparent: true, side: T.DoubleSide, roughness: 0.2, metalness: 0.4, depthWrite: false });
    M.beam = new T.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
    M.vortex = new T.MeshBasicMaterial({ transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false });
    M.inst = new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
    M.crown = new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
    M.park = new T.MeshStandardMaterial({ roughness: 0.95 });   // lawns and green roofs
    M.glow = new T.MeshBasicMaterial();   // the Angels' bio-luminescent skin
    const lineMat = new T.LineBasicMaterial();

    const world = new T.Group();
    scene.add(world);
    const shade = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    // Where box/cyl/tower/trees go by default: the world, or the scaled city group while the city is being built
    const cityG = new T.Group();
    cityG.scale.setScalar(CITY_K);
    world.add(cityG);
    let home = world;
    const ck = (x, y, z) => [x * CITY_K, y * CITY_K, z * CITY_K];   // a city-unit point in world units
    function box(w, h, d, mat, x, y, z, parent = home) {
      const m = shade(new T.Mesh(new T.BoxGeometry(w, h, d), mat));
      m.position.set(x, y + h / 2, z); parent.add(m); return m;
    }
    function cyl(rt, rb, h, mat, x, y, z, seg = 20, parent = home) {
      const m = shade(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat));
      m.position.set(x, y + h / 2, z); parent.add(m); return m;
    }
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // Ocean: wide enough that its edge never enters the frame; fog fades the distance into the page
    const L = 900, DEPTH = 7;
    box(L * 2, 3, L * 2, M.seabedSide, 0, -DEPTH - 3, 0).material = [M.seabedSide, M.seabedSide, M.seabed, M.seabedSide, M.seabedSide, M.seabedSide];
    const water = new T.Mesh(new T.BoxGeometry(L * 2, DEPTH, L * 2), M.water);
    water.position.y = -DEPTH / 2;
    water.renderOrder = 2;
    world.add(water);

    // ----- Burned island: an irregular coastline with a beach and low cliffs, stepped hills built from the seeding
    // tiles, charred snags where it burned, and a small restoration camp on the shore facing the city -----
    const ISLE_R = (a) => 21 + Math.sin(a * 3 + 1) * 4 + Math.sin(a * 5 + 2) * 2.5 + Math.sin(a * 7) * 1.5;
    const inIsland = (x, z) => Math.hypot(x - IC.x, z - IC.z) < ISLE_R(Math.atan2(z - IC.z, x - IC.x)) - 1;
    const TOP = 1.2;
    // Ground height: a central hill and a lower shoulder, in half-unit steps so the tiles terrace
    function isleH(x, z) {
      const dx = x - IC.x, dz = z - IC.z, f = Math.hypot(dx, dz) / ISLE_R(Math.atan2(dz, dx));
      const h = TOP + Math.max(0, 1 - f * f) * 4.5 + Math.max(0, 1 - Math.hypot(dx - 8, dz + 5) / 9) * 2.5;
      return Math.round(h * 2) / 2;
    }
    const isleShape = (grow) => new T.Shape(Array.from({ length: 72 }, (_, k) => {
      const a = k / 72 * Math.PI * 2, r = ISLE_R(a) + grow;
      return new T.Vector2(Math.cos(a) * r, Math.sin(a) * r);
    }));
    [[2.6, 0.4, M.sand], [0.2, TOP, M.land]].forEach(([grow, top, mat]) => {
      const g = new T.ExtrudeGeometry(isleShape(grow), { depth: DEPTH + top, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(Math.PI / 2); g.translate(0, top, 0);
      const m = shade(new T.Mesh(g, mat)); m.position.set(IC.x, 0, IC.z); world.add(m);
    });
    const tiles = [], tileMap = new Map();
    for (let i = -16; i <= 16; i++) for (let j = -16; j <= 16; j++) {
      const x = IC.x + i * 2, z = IC.z + j * 2;
      if (!inIsland(x, z)) continue;
      const t = { x, z, h: isleH(x, z), hits: 0, grow: rand() < 0.22 ? 1 : 0, growing: false };
      tileMap.set(`${i},${j}`, t); tiles.push(t);
    }
    const tileAt = (x, z) => tileMap.get(`${Math.round((x - IC.x) / 2)},${Math.round((z - IC.z) / 2)}`);
    sim.tilesTotal = tiles.length;
    sim.tilesRegrown = tiles.filter((t) => t.grow === 1).length;
    const tileMesh = new T.InstancedMesh(new T.BoxGeometry(1.96, 1, 1.96), M.inst, tiles.length);
    const crownMesh = new T.InstancedMesh(new T.IcosahedronGeometry(0.85, 0), M.crown, tiles.length);
    const stumpMesh = new T.InstancedMesh(new T.CylinderGeometry(0.08, 0.17, 1, 5), M.stump, tiles.length);
    tileMesh.receiveShadow = true; tileMesh.castShadow = true; crownMesh.castShadow = true; stumpMesh.castShadow = true;
    world.add(tileMesh, crownMesh, stumpMesh);
    const mtx = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pv = new T.Vector3(), col = new T.Color(), col2 = new T.Color();
    tiles.forEach((t) => { t.jx = (rand() - 0.5) * 0.6; t.jz = (rand() - 0.5) * 0.6; t.s = 0.8 + rand() * 0.5; t.rot = rand() * 6; t.v = 0.9 + rand() * 0.2; });
    let pal = PAL.light;
    function drawTile(i) {
      const t = tiles[i], g = t.grow;
      // Each tile is a column from the island body up to its terrace height, so the hills step
      const hh = t.h - TOP + 0.1;
      mtx.compose(pv.set(t.x, TOP - 0.1 + hh / 2, t.z), q.identity(), sc.set(1, hh, 1));
      tileMesh.setMatrixAt(i, mtx);
      tileMesh.setColorAt(i, col.setHex(pal.burnt).lerp(col2.setHex(pal.green), g).multiplyScalar(t.v));
      q.setFromAxisAngle(pv.set(0, 1, 0), t.rot);
      const cs = Math.max(g, 0.001) * t.s;
      mtx.compose(pv.set(t.x + t.jx, t.h + 0.1 + 1.3 * cs, t.z + t.jz), q, sc.set(cs * 1.2, cs * 1.6, cs * 1.2));
      crownMesh.setMatrixAt(i, mtx);
      // Charred snags stand where it burned and fall away as the ground greens
      const ss = Math.max(1 - g, 0.001);
      mtx.compose(pv.set(t.x - t.jx, t.h + 0.8 * ss * t.s, t.z - t.jz), q, sc.set(1, 1.6 * ss * t.s, 1));
      stumpMesh.setMatrixAt(i, mtx);
    }
    function drawTiles() {
      tiles.forEach((_, i) => drawTile(i));
      tileMesh.instanceMatrix.needsUpdate = true; crownMesh.instanceMatrix.needsUpdate = true; stumpMesh.instanceMatrix.needsUpdate = true;
      if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
    }

    {
      const a0 = Math.atan2(P.z - IC.z, P.x - IC.x), r0 = ISLE_R(a0) - 4.5;
      const cx = IC.x + Math.cos(a0) * r0, cz = IC.z + Math.sin(a0) * r0, gy = isleH(cx, cz) + 0.05;
      const camp = new T.Group(); camp.position.set(cx, gy, cz); camp.rotation.y = -a0; world.add(camp);
      cyl(1.8, 1.8, 0.12, M.trim, 0, 0, -3, 24, camp);
      cyl(1.9, 1.9, 0.06, M.glow, 0, 0.12, -3, 24, camp);
      box(2.6, 1.4, 1.8, M.ceramic, -0.8, 0, 2.4, camp);
      box(2.3, 0.08, 1.5, M.park, -0.8, 1.4, 2.4, camp);
      for (let k = 0; k < 3; k++) box(0.9, 0.06, 2.4, M.glass, -3.2 - k * 1.2, 0.5, 1, camp).rotation.z = 0.5;
      [[1.8, 3.6], [-4.8, -2.2]].forEach(([u, v]) => {
        cyl(0.05, 0.05, 3.2, M.steel, u, 0, v, 5, camp);
        box(0.18, 0.12, 0.18, M.glow, u, 3.2, v, camp);
      });
      box(7, 0.25, 1.2, M.trim, 4.5, -gy + 0.35, 0.8, camp);
    }

    home = cityG;
    // ----- Earth Port Anchor -----
    const DECK = 2.4;
    cyl(8.6, 8.6, 1.2, M.trim, P.x, -5.2, P.z, 6).rotation.y = Math.PI / 6;
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      cyl(0.9, 0.9, 5.4, M.ceramic, P.x + Math.cos(a) * 7, -4.2, P.z + Math.sin(a) * 7, 12);
    }
    const deck = cyl(10, 10, 1.4, M.ceramic, P.x, 1, P.z, 6);
    deck.rotation.y = Math.PI / 6;
    cyl(10.1, 10.1, 0.3, M.trim, P.x, 1.6, P.z, 6).rotation.y = Math.PI / 6;
    // Flight pier lines: landing runway and mag-lev catapult track, side by side (built with the piers)
    const RZ = P.z + 4.5, CAT_Z = P.z - 4.5;

    // Earth Port mega-city: satellite islands of the archipelago, bridged to the core
    // Earth Port mega-city as one connected structure, in the Atlantis manner: a raised hub ring around the core and
    // long piers growing out of it, each its own district. The water between piers forms sheltered bays.
    const parkTrees = [];
    let HARBOR = null;
    const stripeCv = document.createElement('canvas');
    stripeCv.width = 2; stripeCv.height = 16;
    { const c2 = stripeCv.getContext('2d'); c2.fillStyle = '#000'; c2.fillRect(0, 0, 2, 16); c2.fillStyle = '#fff'; c2.fillRect(0, 0, 2, 5); }
    const stripeTex = new T.CanvasTexture(stripeCv);
    stripeTex.wrapS = stripeTex.wrapT = T.RepeatWrapping; stripeTex.magFilter = T.NearestFilter;
    M.bands = new T.MeshStandardMaterial({ alphaMap: stripeTex, alphaTest: 0.5, roughness: 0.3 });
    // A glass tower: ceramic shaft, banded glazing as one mesh (the stripes come from the alpha map), roof cap, plant, mast
    function tower(x, z, w, h, base, parent = home) {
      box(w, h, w, M.ceramic, x, base, z, parent);
      const gh = h - 1.2, g = new T.BoxGeometry(w + 0.08, gh, w + 0.08), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * gh / 1.6);
      const glz = new T.Mesh(g, M.bands);
      glz.position.set(x, base + 0.6 + gh / 2, z); glz.receiveShadow = true; parent.add(glz);
      box(w + 0.14, 0.3, w + 0.14, M.trim, x, base + h, z, parent);
      box(w * 0.4, 0.7, w * 0.3, M.trim, x - w * 0.15, base + h + 0.3, z + w * 0.15, parent);
      box(w * 0.45, 0.08, w * 0.45, M.park, x + w * 0.2, base + h + 0.3, z - w * 0.05, parent);
      if (h > 12) cyl(0.05, 0.05, 2 + h * 0.06, M.steel, x + w * 0.28, base + h + 0.3, z - w * 0.28, 5, parent);
    }
    function lowRise(x, z, w, d, h, base, parent) {
      box(w, h, d, M.ceramic, x, base, z, parent);
      box(w * 0.4, 0.5, d * 0.4, M.trim, x, base + h, z, parent);
      box(w - 0.3, 0.08, d - 0.3, M.park, x, base + h, z, parent);
      if (h > 2) box(w + 0.05, 0.32, d + 0.05, M.glass, x, base + h * 0.55, z, parent);
    }
    const HUB_R = 23, HUB_TOP = 1.9, ARM_TOP = 1.6;
    // Hub: a twelve-sided ring deck a step above the piers, the tallest spires standing round the core
    cyl(HUB_R, HUB_R, HUB_TOP - 0.2, M.ceramic, P.x, 0.2, P.z, 12);
    cyl(HUB_R + 0.15, HUB_R + 0.15, 0.3, M.trim, P.x, HUB_TOP - 0.45, P.z, 12);
    for (let k = 0; k < 12; k++) { const a = (k + 0.5) * Math.PI / 6; cyl(0.9, 0.9, DEPTH + 0.3, M.ceramic, P.x + Math.cos(a) * 18, -DEPTH, P.z + Math.sin(a) * 18, 10); }
    for (let k = 0; k < 12; k++) {
      const a = (k + 0.5) * Math.PI / 6, r = 17.5 + (k % 2) * 2, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
      const deg = (a * 180 / Math.PI) % 360;
      if (deg < 80 || deg > 280) {
        // East half: terminals and parks, low under the landing glider's climb-out
        if (k % 2) { cyl(3.2, 3.2, 0.08, M.park, x, HUB_TOP, z, 20); for (let t = 0; t < 7; t++) { const ta = rand() * 6.28, tr = rand() * 2.4; parkTrees.push([x + Math.cos(ta) * tr, HUB_TOP + 0.05, z + Math.sin(ta) * tr, 0.55 + rand() * 0.4]); } }
        else lowRise(x, z, 3.6, 2.8, 2 + rand() * 1.6, HUB_TOP, home);
        continue;
      }
      tower(x, z, 3 + rand() * 1.2, 12 + rand() * 12, HUB_TOP);
    }
    // Elevator anchor, after the Ace Combat space elevator: a tiered tower on the core whose six buttresses sweep down
    // into the hub in line with the piers, so the city reads as growing out of it. Garden terraces where the tiers
    // step in, ribs up the shaft, running lights down the buttresses; the tether leaves from the crown.
    const TIERS = [[6.4, 4.8, 9], [4.8, 3.5, 10], [3.5, 2.5, 10], [2.5, 1.6, 9]];   // bottom radius, top radius, height
    let ty = DECK;
    TIERS.forEach(([rb, rt, h], i) => {
      cyl(rt, rb, h, M.ceramic, P.x, ty, P.z, 24);
      const rg = rb + (rt - rb) * 0.62 + 0.06;
      cyl(rg, rg, 0.8, M.glass, P.x, ty + h * 0.58, P.z, 24);
      for (let k = 0; k < 6; k++) {
        const a = (k + 0.5) * Math.PI / 3, rib = new T.Group();
        rib.position.set(P.x, ty, P.z); rib.rotation.y = -a; home.add(rib);
        box(0.4, h, 0.5, M.trim, (rb + rt) / 2 + 0.1, 0, 0, rib).rotation.z = Math.atan2(rb - rt, h);
      }
      ty += h;
      if (i < TIERS.length - 1) {
        cyl(rt + 1, rt + 1, 0.35, M.trim, P.x, ty - 0.2, P.z, 24);
        cyl(rt + 0.9, rt + 0.9, 0.08, M.park, P.x, ty + 0.15, P.z, 24);
        for (let t = 0; t < 10; t++) { const a = t / 10 * Math.PI * 2 + i; parkTrees.push([P.x + Math.cos(a) * (rt + 0.5), ty + 0.2, P.z + Math.sin(a) * (rt + 0.5), 0.35 + rand() * 0.15]); }
      }
    });
    const ANCHOR_TOP = ty;   // the tether and the climbers start from the crown
    const ANCHOR_W = ANCHOR_TOP * CITY_K;   // the crown's height in world units
    const crown = new T.Mesh(new T.TorusGeometry(2.1, 0.4, 10, 32), M.trim);
    crown.rotation.x = Math.PI / 2; crown.position.set(P.x, ANCHOR_TOP + 0.5, P.z); shade(crown); home.add(crown);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; box(0.3, 3.4, 1.4, M.ceramic, P.x + Math.cos(a) * 1.3, ANCHOR_TOP, P.z + Math.sin(a) * 1.3).rotation.y = -a; }
    cyl(1.7, 1.7, 0.25, M.glow, P.x, ANCHOR_TOP + 1.2, P.z, 24);
    const emitter = cyl(0.4, 0.6, 1.2, M.steel, P.x + 2.6, ANCHOR_TOP, P.z - 1.2, 10);
    const BUTTRESS = [[5.6, DECK], [5.6, DECK + 15], [7.6, DECK + 11.5], [11.5, DECK + 6.5], [16.5, HUB_TOP + 2.6], [22.6, HUB_TOP], [22.6, HUB_TOP - 0.3], [5.6, HUB_TOP - 0.3]];
    const butGeo = new T.ExtrudeGeometry(new T.Shape(BUTTRESS.map(([u, y]) => new T.Vector2(u, y))), { depth: 1.4, bevelEnabled: false });
    butGeo.translate(0, 0, -0.7);
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, but = shade(new T.Mesh(butGeo, [M.ceramic, M.trim]));
      but.position.set(P.x, 0, P.z); but.rotation.y = -a; home.add(but);
      [[8, DECK + 9.9], [11.5, DECK + 6.7], [15, HUB_TOP + 3.4], [19, HUB_TOP + 1.6]].forEach(([u, y]) => box(0.3, 0.14, 1.5, M.glow, P.x + Math.cos(a) * u, y, P.z + Math.sin(a) * u).rotation.y = -a);
    }
    // Aura Core moves out onto the hub, between the flight and rectenna piers
    const AURA = { x: P.x + Math.cos(Math.PI / 6) * 13, z: P.z + Math.sin(Math.PI / 6) * 13 };
    const aura = new T.Mesh(new T.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass);
    aura.position.set(AURA.x, HUB_TOP, AURA.z); shade(aura); home.add(aura);
    const auraRing = new T.Mesh(new T.TorusGeometry(2.3, 0.12, 8, 32), M.accent);
    auraRing.rotation.x = Math.PI / 2; auraRing.position.set(AURA.x, HUB_TOP + 0.1, AURA.z); home.add(auraRing);
    // Hub ring line for the city's maglev trains, running through the buttress feet
    const ringRail = new T.Mesh(new T.TorusGeometry(22.2, 0.14, 6, 96), M.trim);
    ringRail.rotation.x = Math.PI / 2; ringRail.position.set(P.x, HUB_TOP + 0.05, P.z); home.add(ringRail);
    // Piers: six identical decks 60 degrees apart, a wing either side, so the hull reads as one symmetric base.
    // Each carries a district: flight (both runways), rectenna, residential, arcology, foundry, enclosed shipyard.
    const PIER_L = 60, PIER_W = 18, PIER_WING = 6;
    const ARMS = [[0, 'flight'], [60, 'rectenna'], [120, 'city'], [180, 'arcology'], [240, 'foundry'], [300, 'shipyard']];
    M.canopy = new T.MeshStandardMaterial({ transparent: true, opacity: 0.14, roughness: 0.15, depthWrite: false, color: 0xcfe4f2 });
    let sled = null;
    const tramPiers = [];
    ARMS.forEach(([a, kind]) => {
      const L = PIER_L, w = PIER_W, B = PIER_WING;
      const ang = a * Math.PI / 180, ux = Math.cos(ang), uz = Math.sin(ang);
      const toWorld = (u, v) => [P.x + ux * u - uz * v, P.z + uz * u + ux * v];   // pier frame: u out along it, v across
      const grp = new T.Group();
      grp.position.set(P.x, 0, P.z); grp.rotation.y = -ang; home.add(grp);
      const w2 = w / 2;
      // The shipyard's basin runs out through a square tip as a channel to the sea
      const BASIN = [34, 52, 3.4];   // sized to two Leviathans nose to tail
      const tip = kind === 'shipyard'
        ? [[L, -w2], [L, -BASIN[2]], [BASIN[0], -BASIN[2]], [BASIN[0], BASIN[2]], [L, BASIN[2]], [L, w2]]
        : [[L - w2 * 1.2, -w2], [L, -w2 * 0.3], [L, w2 * 0.3], [L - w2 * 1.2, w2]];
      const pts = [[16, -w2], [0.5 * L, -w2], [0.56 * L, -w2 - B], [0.8 * L, -w2 - B], [0.86 * L, -w2], ...tip,
        [0.86 * L, w2], [0.8 * L, w2 + B], [0.56 * L, w2 + B], [0.5 * L, w2], [16, w2]];
      const deckShape = new T.Shape(pts.map(([u, v]) => new T.Vector2(u, v)));
      const deckGeo = new T.ExtrudeGeometry(deckShape, { depth: ARM_TOP - 0.2, bevelEnabled: false });
      deckGeo.rotateX(Math.PI / 2); deckGeo.translate(0, ARM_TOP, 0);
      grp.add(shade(new T.Mesh(deckGeo, [M.ceramic, M.trim])));
      for (let u = 26; u < L - 3; u += 9) [-1, 1].forEach((sv) => cyl(0.8, 0.8, DEPTH + 0.3, M.ceramic, u, -DEPTH, sv * (kind === 'shipyard' ? 7.4 : 4), 10, grp));
      [-1, 1].forEach((sv) => cyl(0.8, 0.8, DEPTH + 0.3, M.ceramic, 0.68 * L, -DEPTH, sv * (w2 + B / 2), 10, grp));
      if (kind !== 'flight' && kind !== 'shipyard') box(L - 24, 0.04, 0.3, M.trim, (L + 22) / 2, ARM_TOP, 0, grp);
      if (kind === 'city' || kind === 'arcology' || kind === 'foundry') {
        // Tram line down the spine, and tree rows along both edges
        box(L - 26, 0.06, 1.1, M.steel, (L + 22) / 2, ARM_TOP, 0, grp);
        tramPiers.push({ grp, L });
        for (let u = 22; u < L - 8; u += 3.2) [-1, 1].forEach((sv) => { const [x, z] = toWorld(u, sv * (w2 - 0.8)); parkTrees.push([x, ARM_TOP + 0.05, z, 0.45 + rand() * 0.2]); });
      }
      const wingPark = (sv) => {
        const pu = 0.68 * L, pv = sv * (w2 + B / 2);
        cyl(B * 0.55, B * 0.55, 0.08, M.park, pu, ARM_TOP, pv, 20, grp);
        for (let t = 0; t < 9; t++) {
          const ta = rand() * 6.28, tr = rand() * B * 0.45, [x, z] = toWorld(pu + Math.cos(ta) * tr, pv + Math.sin(ta) * tr);
          parkTrees.push([x, ARM_TOP + 0.05, z, 0.55 + rand() * 0.45]);
        }
      };
      if (kind === 'city' || kind === 'arcology') {
        // Towers either side of the spine, tallest near the hub; low-rise between them
        const tall = kind === 'arcology';
        let side = 1;
        for (let u = 27; u < L - 6; u += tall ? 5.5 : 6.5) {
          const fall = 1.25 - (u / L) * 0.55, tw = tall ? 3 + rand() * 1.4 : 2.4 + rand() * 1;
          tower(u, side * w2 * 0.5, tw, (tall ? 16 + rand() * 14 : 8 + rand() * 9) * fall, ARM_TOP, grp);
          if (tall && rand() < 0.6) tower(u + 2, -side * w2 * 0.5, tw * 0.85, (12 + rand() * 10) * fall, ARM_TOP, grp);
          else lowRise(u + 1, -side * w2 * 0.5, 3 + rand() * 1.4, 2.6, 1.4 + rand() * 2.4, ARM_TOP, grp);
          side = -side;
        }
        wingPark(1);
        for (let u = 0.6 * L; u < 0.78 * L; u += 4.4) lowRise(u, -(w2 + B / 2), 3.4, 3.6, 1.2 + rand() * 1.6, ARM_TOP, grp);
      } else if (kind === 'foundry') {
        // Printing bays: two long halls under sawtooth roofs, a gantry over the yard, and two stacks venting clean heat
        const u0 = 25, u1 = L - 12, len = u1 - u0;
        [-3.4, 3.4].forEach((v) => {
          box(len, 3.6, 4.4, M.ceramic, (u0 + u1) / 2, ARM_TOP, v, grp);
          box(len + 0.06, 0.4, 4.46, M.glass, (u0 + u1) / 2, ARM_TOP + 2, v, grp);
          for (let u = u0 + 1.3; u < u1; u += 2.6) {
            const tooth = shade(new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 4.4, 3), M.trim));
            tooth.rotation.x = Math.PI / 2; tooth.position.set(u, ARM_TOP + 3.95, v); grp.add(tooth);
          }
        });
        [-3.4, 3.4].forEach((v) => {
          cyl(0.75, 1, 12, M.ceramic, L - 7, ARM_TOP, v, 14, grp);
          cyl(0.8, 0.8, 0.5, M.glow, L - 7, ARM_TOP + 11.6, v, 14, grp);
        });
        [-1, 1].forEach((k) => box(0.5, 8, 0.5, M.trim, 21, ARM_TOP, k * (w2 - 1), grp));
        box(0.7, 0.6, w, M.trim, 21, ARM_TOP + 8, 0, grp);
      } else if (kind === 'shipyard') {
        // Enclosed shipyard: walls round the basin, a translucent roof on ribs, a lift gate to the sea channel, and a
        // gantry on rails. A Leviathan sits inside for refit (added with the fleet) while the gantry works on it.
        const [u0, u1, hv] = BASIN, um = (u0 + u1) / 2, len = u1 - u0, H = 5;
        const [hx, hz] = toWorld(um, 0);
        HARBOR = { x: hx, z: hz, yaw: Math.atan2(ux, uz), ux, uz, prev: 0 };
        // The far wall is solid; the side facing the viewer is a glass curtain over a low base, so the ship shows
        box(len + 1.2, H, 0.6, M.ceramic, um, ARM_TOP, -(hv + 0.3), grp);
        box(len + 1.2, 0.5, 0.6, M.glass, um, ARM_TOP + H * 0.6, -(hv + 0.32), grp);
        box(len + 1.2, 1.4, 0.6, M.ceramic, um, ARM_TOP, hv + 0.3, grp);
        const curtain = new T.Mesh(new T.BoxGeometry(len + 1.2, H - 1.4, 0.2), M.canopy);
        curtain.position.set(um, ARM_TOP + 1.4 + (H - 1.4) / 2, hv + 0.3); curtain.renderOrder = 3; grp.add(curtain);
        for (let u = u0 - 0.3; u <= u1 + 0.4; u += 3) box(0.25, H - 1.4, 0.3, M.trim, u, ARM_TOP + 1.4, hv + 0.3, grp);
        [-1, 1].forEach((sv) => box(len + 1.2, 0.3, 0.9, M.steel, um, ARM_TOP + H, sv * (hv + 0.3), grp));
        box(0.6, H, hv * 2 + 1.2, M.ceramic, u0 - 0.3, ARM_TOP, 0, grp);
        // Sea gate: a lift door between two gate towers, rising into the header to let the ship out
        [-1, 1].forEach((sv) => box(1, H + 4, 1, M.ceramic, u1 + 0.3, ARM_TOP, sv * (hv + 0.8), grp));
        box(1.2, 0.8, hv * 2 + 2.6, M.trim, u1 + 0.3, ARM_TOP + H + 3.2, 0, grp);
        // Fabrication shop along the far side of the hall, where hull sections are built before they go in
        box(len, 3, 3.6, M.ceramic, um, ARM_TOP, -(hv + 2.4), grp);
        box(len + 0.06, 0.4, 3.66, M.glass, um, ARM_TOP + 1.7, -(hv + 2.4), grp);
        box(len - 1, 0.08, 3, M.park, um, ARM_TOP + 3, -(hv + 2.4), grp);
        const gate = box(0.5, H + 1.6, hv * 2 + 0.2, M.trim, u1 + 0.3, -0.4, 0, grp);
        const gateBand = new T.Mesh(new T.BoxGeometry(0.54, 0.3, hv * 2 + 0.24), M.accent);
        gateBand.position.y = -(H + 1.6) / 2 + 2.4; gate.add(gateBand);
        HARBOR.gate = gate; HARBOR.gateY = gate.position.y;
        const roof = new T.Mesh(new T.BoxGeometry(len + 1.2, 0.2, hv * 2 + 1.2), M.canopy);
        roof.position.set(um, ARM_TOP + H + 0.5, 0); roof.renderOrder = 3; grp.add(roof);
        for (let u = u0 + 1; u < u1; u += 3) box(0.3, 0.4, hv * 2 + 1.2, M.trim, u, ARM_TOP + H + 0.3, 0, grp);
        // Gantry: the bridge runs along the hall, the trolley across it, and the hoist lowers hull plates onto the ship
        const gBridge = box(1, 0.8, hv * 2, M.steel, um - 4, ARM_TOP + H - 1.4, 0, grp);
        const gTrolley = box(1.4, 0.8, 1.4, M.accent, um - 4, ARM_TOP + H - 2.2, 1.5, grp);
        const gCable = box(0.06, 1, 0.06, M.steel, um - 4, 0, 1.5, grp);
        const gLoad = box(3, 0.22, 2, M.trim, um - 4, 0, 1.5, grp);
        const sparks = [[-6, 1.1, 1], [-3, 0.9, -1.1], [3.5, 1.2, 0.9], [6.5, 0.9, -1]].map(([du, y, v]) => box(0.22, 0.22, 0.22, M.glow, um + du, y, v, grp));
        HARBOR.yard = { gBridge, gTrolley, gCable, gLoad, sparks, um, top: ARM_TOP + H - 2.2 };
        const STACK = [M.trim, M.glass, M.steel];
        [-1, 1].forEach((sv) => {
          for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) box(1.6, 0.6 + Math.floor(rand() * 3) * 0.6, 0.8, STACK[(i + j) % 3], 0.58 * L + i * 1.9, ARM_TOP, sv * (w2 + 1.2 + j * 1.1), grp);
        });
        tower(24, 0, 3, 9 + rand() * 4, ARM_TOP, grp);
      } else if (kind === 'flight') {
        // Flight pier: the landing runway on one side, the mag-lev catapult track on the other, hangars and an apron
        // on the wings, and a control tower. The pier runs along +x, so its frame is the world frame here.
        box(38, 0.12, 3.4, M.steel, 43, ARM_TOP, RZ, grp);
        [-1.5, 1.5].forEach((dv) => box(38, 0.05, 0.14, M.ceramic, 43, ARM_TOP + 0.12, RZ + dv, grp));
        for (let u = 26; u < 62; u += 2.6) box(1.2, 0.05, 0.16, M.ceramic, u, ARM_TOP + 0.12, RZ, grp);
        box(34, 0.12, 3, M.steel, 43, ARM_TOP, CAT_Z, grp);
        box(33, 0.06, 0.5, M.accent, 43, ARM_TOP + 0.12, CAT_Z, grp);
        sled = box(1.8, 0.35, 1.3, M.accent, 27, ARM_TOP + 0.12, CAT_Z, grp);
        [-1, 1].forEach((sv) => {
          box(9, 3.6, 4.6, M.ceramic, 45, ARM_TOP, sv * 12.2, grp);
          box(9.1, 0.3, 4.7, M.trim, 45, ARM_TOP + 3.6, sv * 12.2, grp);
          box(0.1, 2.8, 3.6, M.glass, 40.45, ARM_TOP, sv * 12.2, grp);
        });
        box(6, 0.06, 4.6, M.trim, 36, ARM_TOP, 12.2, grp);
        tower(35, -12.2, 2, 6, ARM_TOP, grp);
        box(3, 1.2, 3, M.glass, 35, ARM_TOP + 6.3, -12.2, grp);
        box(3.3, 0.3, 3.3, M.trim, 35, ARM_TOP + 7.5, -12.2, grp);
      } else if (kind === 'rectenna') {
        // Rectenna field: receivers for orbital microwave power beaming, across the pier and its wings
        for (let u = 25; u < L - 3; u += 4) for (let v = -12; v <= 12; v += 3.6) {
          if (Math.abs(v) > w2 - 1 && (u < 0.56 * L + 1 || u > 0.8 * L - 1)) continue;
          cyl(0.12, 0.12, 0.8, M.steel, u, ARM_TOP, v, 6, grp);
          const dish = cyl(1.2, 1.2, 0.12, M.trim, u, ARM_TOP + 0.75, v, 16, grp);
          dish.rotation.x = -0.5; dish.rotation.z = 0.5;
        }
      }
    });
    // Leviathan berths inside the city: the bay between the foundry and shipyard piers is the harbor. Ships moor
    // along the foundry pier's wing and the shipyard pier's tip; jib cranes on the decks swing containers from stacks
    // onto them. Positions are in each pier's frame (u out along it, v across), turned into world coordinates.
    const pierAt = (deg, u, v) => { const a = deg * Math.PI / 180; return [P.x + Math.cos(a) * u - Math.sin(a) * v, P.z + Math.sin(a) * u + Math.cos(a) * v]; };
    const pierYaw = (deg) => { const a = deg * Math.PI / 180; return Math.atan2(Math.cos(a), Math.sin(a)); };
    const BERTHS = [{ deg: 240, u: 41, v: 17.4, scaffold: true }, { deg: 300, u: 55, v: -11.5, scaffold: false }];
    const STK = [M.trim, M.glass, M.steel];
    // Cranes: pier, crane position, pick direction (toward its stack) and drop direction (toward the ship), as (du, dv)
    const CRANES = [[240, 39.5, 13.2, [-1, 0], [0, 1]], [240, 43.5, 13.2, [1, 0], [0, 1]], [300, 53, -7.4, [1, 0], [0, -1]]];
    const dockCranes = CRANES.map(([deg, u, v, pick, drop], i) => {
      const h = 6, R = 4, [x, z] = pierAt(deg, u, v), base = new T.Group();
      base.position.set(x, ARM_TOP + h, z); home.add(base);
      box(0.6, h, 0.6, M.ceramic, 0, -h, 0, base);
      box(1, 0.7, 1, M.trim, 0, -0.35, 0, base);
      const jib = new T.Group(); base.add(jib);
      box(6.2, 0.32, 0.42, M.ceramic, 1.6, 0.35, 0, jib);
      box(1.3, 0.7, 0.8, M.steel, -1.6, 0.15, 0, jib);   // counterweight
      const cable = box(0.04, 1, 0.04, M.steel, R, 0, 0, jib);
      const load = box(0.8, 0.7, 1.6, STK[i % 3], R, 0, 0, jib);
      // World direction of a pier-frame step, then the jib angle that points there (rotation y maps +x to (cos a, -sin a))
      const dir = ([du, dv]) => { const [px, pz] = pierAt(deg, u + du, v + dv); return Math.atan2(-(pz - z), px - x); };
      const [sx, sz] = pierAt(deg, u + pick[0] * R, v + pick[1] * R);
      for (let k = 0; k < 2; k++) box(0.8, 0.7, 1.6, STK[(i + k) % 3], sx, ARM_TOP + k * 0.7, sz).rotation.y = pierYaw(deg) - Math.PI / 2;
      let a0 = dir(pick), a1 = dir(drop);
      if (a1 - a0 > Math.PI) a1 -= Math.PI * 2; else if (a0 - a1 > Math.PI) a1 += Math.PI * 2;
      return { jib, cable, load, h, a0, a1, ph: i * 5.3 };
    });

      // Scenery trees (city parks and distant islands): lollipop crowns on thin trunks
    function plantTrees(list, parent = home) {
      const crowns = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), M.crown, list.length);
      const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.1, 0.12, 1, 6), M.trim, list.length);
      crowns.castShadow = true;
      list.forEach(([x, y, z, k], i) => {
        mtx.compose(pv.set(x, y + 1.5 * k, z), q.identity(), sc.set(0.75 * k, 0.95 * k, 0.75 * k)); crowns.setMatrixAt(i, mtx);
        mtx.compose(pv.set(x, y + 0.5 * k, z), q.identity(), sc.set(1, k, 1)); trunks.setMatrixAt(i, mtx);
      });
      parent.add(crowns, trunks);
    }
    plantTrees(parkTrees);
    home = world;
    // Distant islets: small green islands with beaches, scattered far out so the ocean has depth
    const hillTrees = [];
    const hills = new T.Group();
    world.add(hills);
    M.islet = new T.MeshStandardMaterial({ color: 0x7c9a5e, roughness: 0.95, flatShading: true });
    [[150, -280, 22], [320, -40, 18], [280, 230, 20], [-40, -330, 20], [40, 330, 16]].forEach(([x, z, r]) => {
      const beach = shade(new T.Mesh(new T.CylinderGeometry(r * 1.08, r * 1.16, 0.7, 24), M.sand));
      beach.scale.z = 0.85; beach.position.set(x, -0.3, z); hills.add(beach);
      const mound = shade(new T.Mesh(new T.IcosahedronGeometry(r, 1), M.islet));
      mound.scale.set(1, 0.24, 0.85); mound.position.set(x, -1.5, z); hills.add(mound);
      for (let k = 0; k < 22; k++) {
        const a = rand() * Math.PI * 2, f = rand() * 0.6, d = f * r;
        hillTrees.push([x + Math.cos(a) * d, -1.5 + r * 0.24 * (1 - f * f) - 0.5, z + Math.sin(a) * d * 0.85, 1 + rand() * 0.7]);
      }
    });
    plantTrees(hillTrees, hills);
    // Mainland coast west of the burned island: beach, farmland, forest and a ridge that a seeding route crosses.
    // Heights come from a few sines; offshore it shelves down under the water to the seabed.
    const coastAt = (z) => -300 + Math.sin(z * 0.045) * 7 + Math.sin(z * 0.11 + 1.3) * 3.5;
    function landH(x, z) {
      const inland = coastAt(z) - x;
      if (inland < 0) return Math.max(-DEPTH - 0.5, inland * 1.1);
      const roll = Math.sin(x * 0.07 + z * 0.05) * 1.6 + Math.sin(x * 0.13 - z * 0.09 + 2) * 1.1 + Math.sin(z * 0.21) * 0.5;
      const ridge = Math.max(0, 1 - Math.abs(x + 362 - Math.sin(z * 0.03) * 10) / 26);
      return Math.min(inland * 0.3, 1) + Math.max(0, roll) * Math.min(1, inland / 22) + ridge * ridge * (17 + Math.sin(z * 0.17) * 4 + Math.sin(z * 0.41) * 2);
    }
    const LX0 = -560, LX1 = -270, LZ0 = -420, LZ1 = 420;
    const landGeo = new T.PlaneGeometry(LX1 - LX0, LZ1 - LZ0, 73, 210);
    landGeo.rotateX(-Math.PI / 2);
    landGeo.translate((LX0 + LX1) / 2, 0, (LZ0 + LZ1) / 2);
    {
      const lp = landGeo.attributes.position, lc = new Float32Array(lp.count * 3), cl = new T.Color();
      for (let i = 0; i < lp.count; i++) {
        const x = lp.getX(i), z = lp.getZ(i);
        const e = Math.max(0, Math.min(1, (x - LX0) / 30, (z - LZ0) / 30, (LZ1 - z) / 30));   // sink the far edges into the fog
        const y = landH(x, z) * e + (-DEPTH - 0.5) * (1 - e);
        lp.setY(i, y);
        // Base colours sit darker than they read: the light rig is tuned for white ceramic and lifts flat ground a lot
        cl.setHex(y < 0 ? 0x8c8270 : y < 0.5 ? 0xb0a37e : y < 2.8 ? 0x7c9a5c : y < 8 ? 0x5f8550 : y < 15 ? 0x857c6f : 0xd6d9de);
        lc[i * 3] = cl.r; lc[i * 3 + 1] = cl.g; lc[i * 3 + 2] = cl.b;
      }
      landGeo.setAttribute('color', new T.BufferAttribute(lc, 3));
      landGeo.computeVertexNormals();
    }
    hills.add(shade(new T.Mesh(landGeo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }))));
    // Field patchwork on the coastal plain, forest on the slopes, a small town with a pier and a lighthouse
    const fields = [];
    for (let n = 0; n < 1500 && fields.length < 150; n++) {
      const z = -190 + rand() * 420, x = coastAt(z) - 6 - rand() * 44, y = landH(x, z);
      if (y < 0.7 || y > 3.2 || (z > 136 && z < 176 && x > coastAt(z) - 16) || fields.some((f) => Math.abs(f.x - x) < 4.6 && Math.abs(f.z - z) < 3.8)) continue;
      fields.push({ x, y, z, w: 3.4 + rand() * 1.4, d: 2.6 + rand() * 1.2, a: (rand() - 0.5) * 0.4, c: [0x8fa85a, 0x6f9a4c, 0xb09d58, 0x648f47][Math.floor(rand() * 4)] });
    }
    const fieldMesh = new T.InstancedMesh(new T.BoxGeometry(1, 0.4, 1), M.inst, fields.length);
    fieldMesh.receiveShadow = true;
    const UP = new T.Vector3(0, 1, 0);
    fields.forEach((f, i) => {
      mtx.compose(pv.set(f.x, f.y + 0.05, f.z), q.setFromAxisAngle(UP, f.a), sc.set(f.w, 1, f.d));
      fieldMesh.setMatrixAt(i, mtx); fieldMesh.setColorAt(i, col.setHex(f.c));
    });
    hills.add(fieldMesh);
    const forest = [];
    for (let n = 0; n < 3000 && forest.length < 360; n++) {
      const z = -210 + rand() * 460, x = coastAt(z) - 4 - rand() * 100, y = landH(x, z);
      if (y > 2.6 && y < 10) forest.push([x, y - 0.2, z, 0.7 + rand() * 0.45]);
    }
    plantTrees(forest, hills);
    for (let n = 0, built = 0; n < 300 && built < 28; n++) {
      const z = 140 + rand() * 28, x = coastAt(z) - 2.5 - rand() * 12, y = landH(x, z);
      if (y < 0.4 || y > 2.6) continue;
      const w = 1.3 + rand() * 1.1, d = 1.2 + rand(), h = 0.9 + rand() * 1.8;
      box(w, h, d, M.ceramic, x, y - 0.3, z, hills);
      box(w + 0.1, 0.2, d + 0.1, M.trim, x, y - 0.3 + h, z, hills);
      built++;
    }
    box(9, 0.3, 1.2, M.trim, coastAt(156) + 3.5, 0.2, 156, hills);
    cyl(0.45, 0.65, 4.5, M.ceramic, coastAt(176) - 1.2, landH(coastAt(176) - 1.2, 176) - 0.2, 176, 10, hills);
    cyl(0.55, 0.55, 0.6, M.glow, coastAt(176) - 1.2, landH(coastAt(176) - 1.2, 176) + 4.3, 176, 10, hills);
    home = cityG;
    // Wave farm off the south island: four strings of articulated floats (wave-motion generators) with power
    // joints and mooring buoys, cabled to a collector platform and on to the city grid
    const floats = [];
    const WF = { x: P.x + 47, z: P.z + 27 };
    const ROWS = 4, SEGS = 6, GAP = 3.6, PITCH = 2.2;
    const cable = (x0, z0, x1, z1) => {
      const c = box(Math.hypot(x1 - x0, z1 - z0), 0.14, 0.2, M.steel, (x0 + x1) / 2, 0.02, (z0 + z1) / 2);
      c.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    };
    const stringEnd = WF.x + 1.6 + (SEGS - 1) * PITCH + 1.6;
    for (let row = 0; row < ROWS; row++) {
      const z = WF.z + row * GAP;
      for (let k = 0; k < SEGS; k++) {
        const x = WF.x + 1.6 + k * PITCH;
        const f = shade(new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 1.8, 12), M.accent));
        f.rotation.z = Math.PI / 2; f.position.set(x, 0.15, z); f.userData.ph = k * 0.9 + row * 0.6;
        home.add(f); floats.push(f);
        if (k) cyl(0.34, 0.34, 0.5, M.steel, x - PITCH / 2, -0.1, z, 10).rotation.z = Math.PI / 2;
      }
      [WF.x, stringEnd].forEach((x) => {
        cyl(0.5, 0.5, 0.9, M.ceramic, x, -0.35, z, 12);
        cyl(0.52, 0.52, 0.22, M.trim, x, 0.3, z, 12);
      });
    }
    // Collector platform at the west end, a spine cable down the buoys, and a feeder to the island
    const CX = WF.x - 3.2, CZ = WF.z + (ROWS - 1) * GAP / 2;
    for (let k = 0; k < 3; k++) cyl(0.3, 0.3, DEPTH + 0.2, M.ceramic, CX + Math.cos(k * 2.1) * 1.1, -DEPTH, CZ + Math.sin(k * 2.1) * 1.1, 8);
    cyl(2, 2, 0.5, M.ceramic, CX, 0.4, CZ, 6);
    box(1.6, 1, 1.2, M.trim, CX, 0.9, CZ);
    cyl(0.08, 0.08, 1.6, M.steel, CX + 0.9, 0.9, CZ - 0.6, 6);
    cable(WF.x, WF.z, WF.x, WF.z + (ROWS - 1) * GAP);
    cable(CX + 1.8, CZ, WF.x, CZ);
    cable(CX - 1.8, CZ, P.x + 35, CZ);

    // ----- City life: maglev trains round the hub, trams on the piers, ferries in the bays, drones overhead -----
    function makeCars(n, parent = home) {
      return Array.from({ length: n }, () => {
        const c = new T.Group();
        box(1.5, 0.55, 0.75, M.accent, 0, 0, 0, c);
        box(1.3, 0.2, 0.78, M.glass, 0, 0.25, 0, c);
        parent.add(c); return c;
      });
    }
    const trains = [0, 1].map((k) => ({ cars: makeCars(4), a: k * Math.PI, dir: k ? -1 : 1 }));
    const trams = tramPiers.map((tp, k) => ({ ...tp, cars: makeCars(2, tp.grp), ph: k * 1.7 }));
    M.wake = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
    const ferries = [90, 150, 210].map((deg, k) => {
      const g = new T.Group();
      box(1.3, 0.5, 3.2, M.ceramic, 0, -0.2, 0, g);
      box(1.34, 0.12, 3.24, M.accent, 0, 0.12, 0, g);
      box(1, 0.6, 1.4, M.glass, 0, 0.3, -0.2, g);
      const wake = new T.Mesh(new T.PlaneGeometry(1.2, 4), M.wake);
      wake.rotation.x = -Math.PI / 2; wake.position.set(0, 0.03, -3.4); g.add(wake);
      home.add(g);
      return { g, a: deg * Math.PI / 180, ph: k * 2.1 };
    });
    // Quadcopter drones: they hop between waypoints over the city, hover a moment at each, and some carry a parcel
    const rotorGeo = new T.CylinderGeometry(0.42, 0.42, 0.04, 12);
    const droneWaypoint = () => {
      const a = rand() * Math.PI * 2, r = 12 + rand() * 44;
      return new T.Vector3(P.x + Math.cos(a) * r, 30 + rand() * 9, P.z + Math.sin(a) * r);
    };
    const cityDrones = Array.from({ length: 12 }, (_, k) => {
      const m = new T.Group(), rotors = [];
      box(0.55, 0.2, 0.55, M.ceramic, 0, -0.1, 0, m);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        const arm = box(0.95, 0.07, 0.1, M.trim, sx * 0.34, 0, sz * 0.34, m); arm.rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4;
        const rotor = new T.Mesh(rotorGeo, M.accent); rotor.position.set(sx * 0.68, 0.08, sz * 0.68); m.add(rotor); rotors.push(rotor);
      });
      const light = box(0.14, 0.08, 0.14, M.glow, 0, 0.1, 0, m);
      if (k % 3 === 0) box(0.4, 0.34, 0.4, M.trim, 0, -0.62, 0, m);   // parcel
      m.scale.setScalar(0.42);   // small beside the towers (the city group scales them up)
      m.rotation.order = 'YXZ';   // yaw toward the next stop, then pitch
      home.add(m);
      const from = droneWaypoint();
      m.position.copy(from);
      return { m, rotors, light, from, to: droneWaypoint(), t: rand(), hold: 0, dur: 4 + rand() * 4 };
    });

    home = world;
    // ----- Spire tether + climbers + beam -----
    const TOPY = APEX_Y - 2;   // the tether ends at the Apex Station
    cyl(0.22, 0.22, TOPY - ANCHOR_W, M.tether, P.x, ANCHOR_W, P.z, 8).castShadow = true;
    function makeClimber(ox, oz) {
      const g = new T.Group();
      box(1.4, 2.4, 1.4, M.accent, 0, -1.2, 0, g);
      box(1.44, 0.4, 1.44, M.glass, 0, 0.3, 0, g);
      box(1.5, 0.2, 1.5, M.ceramic, 0, 1.2, 0, g);
      box(1.5, 0.2, 1.5, M.ceramic, 0, -1.4, 0, g);
      [-0.8, 0.6].forEach((y) => box(0.6, 0.3, 0.6, M.steel, -Math.sign(ox) * 0.95, y, -Math.sign(oz) * 0.95, g));
      const dish = cyl(0.5, 0.2, 0.25, M.trim, 0, 1.4, 0, 12, g);
      dish.rotation.z = -0.5;
      world.add(g); return g;
    }
    const climbers = [0, 1, 2, 3].map((k) => {
      const off = k % 2 === 0 ? [1.05, 0] : [0, -1.05];
      return { m: makeClimber(...off), y: ANCHOR_W + 2 + k * (TOPY - ANCHOR_W - 8) / 4, up: k % 2 === 0, off };
    });
    const beam = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1, 6, 1, true), M.beam);
    world.add(beam);

    // ----- Stratosphere Port at "30 km" -----
    const SY = MIDWAY_Y;
    cyl(4.6, 4.6, 0.7, M.ceramic, P.x, SY, P.z, 32);
    const ring = new T.Mesh(new T.TorusGeometry(5.6, 0.55, 10, 40), M.trim);
    ring.rotation.x = Math.PI / 2; ring.position.set(P.x, SY + 0.35, P.z); shade(ring); world.add(ring);
    box(3, 1.4, 2.2, M.ceramic, P.x + 2, SY + 0.7, P.z - 1.5);
    box(2.2, 1.1, 2.2, M.ceramic, P.x - 2.2, SY + 0.7, P.z + 1.2);
    for (let k = 0; k < 4; k++) { const sp = box(5.6, 0.2, 0.2, M.trim, P.x, SY + 0.3, P.z); sp.rotation.y = k * Math.PI / 4; }
    cyl(3.9, 2.6, 0.8, M.trim, P.x, SY - 0.8, P.z, 24);
    cyl(1.7, 1.9, 1.6, M.ceramic, P.x, SY + 0.7, P.z, 20);
    cyl(1.75, 1.75, 0.35, M.glass, P.x, SY + 1.5, P.z, 20);
    [0, Math.PI].forEach((a) => {
      const r = box(3.6, 0.08, 1.4, M.glass, P.x + Math.cos(a) * 3.4, SY + 2.1, P.z + Math.sin(a) * 3.4);
      r.rotation.y = -a; r.rotation.x = 0.3;
    });
    const ringWin = new T.Mesh(new T.TorusGeometry(5.6, 0.57, 8, 48), M.glass);
    ringWin.rotation.x = Math.PI / 2; ringWin.scale.set(1, 1, 0.3); ringWin.position.set(P.x, SY + 0.35, P.z); world.add(ringWin);
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, x = P.x + Math.cos(a) * 6.5, z = P.z + Math.sin(a) * 6.5;
      box(1.3, 1, 1.3, M.ceramic, x, SY - 0.15, z).rotation.y = -a;
      box(1.34, 0.3, 1.34, M.glass, x, SY + 0.35, z).rotation.y = -a;
    }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; box(0.16, 0.12, 0.16, M.glow, P.x + Math.cos(a) * 6.2, SY + 0.85, P.z + Math.sin(a) * 6.2); }
    cyl(0.07, 0.07, 3, M.steel, P.x + 0.9, SY + 1.85, P.z + 0.9, 6);
    cyl(0.45, 0.1, 0.2, M.trim, P.x + 0.9, SY + 4.8, P.z + 0.9, 12);
    // Dimension line: deck to Midway
    const dimPts = [];
    const DX = P.x + 13;
    dimPts.push(new T.Vector3(DX, DECK, P.z), new T.Vector3(DX, SY, P.z));
    [DECK, SY].forEach((y) => dimPts.push(new T.Vector3(DX - 1, y, P.z), new T.Vector3(DX + 1, y, P.z)));
    world.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(dimPts), lineMat));

    // ----- L1 Parasol (high above, not to scale) -----
    const parasol = new T.Group();
    const disc = new T.Mesh(new T.CylinderGeometry(14, 14, 0.15, 6), M.shade);
    parasol.add(disc);
    parasol.add(new T.LineSegments(new T.EdgesGeometry(new T.CylinderGeometry(14, 14, 0.15, 6)), lineMat));
    const hub = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 0.8, 12), M.ceramic); parasol.add(hub);
    parasol.position.set(L1P.x, L1P.y, L1P.z);
    parasol.lookAt(new T.Vector3(L1P.x, L1P.y, L1P.z).add(SUN_OFF.clone().normalize()));
    parasol.rotateX(Math.PI / 2);
    world.add(parasol);

    // ----- Apex Station at GEO (brief §16): asteroid core, lab ring, drydock, forge, Kessler sweepers -----
    const AP = new T.Vector3(P.x, TOPY + 2, P.z);
    const apex = new T.Group();
    apex.position.copy(AP);
    world.add(apex);
    M.rock = new T.MeshStandardMaterial({ roughness: 0.95, flatShading: true, color: 0x8d8780 });
    M.debris = new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true, color: 0x6b7280 });
    const rockGeo = new T.IcosahedronGeometry(5.5, 1);
    {
      // Lumpy but crack-free: the same position always gets the same offset
      const pa = rockGeo.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        const h = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5;
        const k = 0.8 + 0.32 * (h - Math.floor(h));
        pa.setXYZ(i, x * k, y * k * 0.85, z * k);
      }
      rockGeo.computeVertexNormals();
    }
    const rock = shade(new T.Mesh(rockGeo, M.rock));
    apex.add(rock);
    [[3.6, 2.4, 1.2], [-2.8, 3.2, -2.4], [1, -3.8, 3.4]].forEach(([x, y, z]) => box(1.2, 0.8, 1.2, M.accent, x, y, z, apex));
    const labRing = new T.Mesh(new T.TorusGeometry(11, 0.8, 10, 48), M.ceramic);
    labRing.rotation.x = Math.PI / 2; shade(labRing); apex.add(labRing);
    const outerRing = new T.Mesh(new T.TorusGeometry(16, 0.35, 8, 64), M.trim);
    outerRing.rotation.x = Math.PI / 2; shade(outerRing); apex.add(outerRing);
    for (let k = 0; k < 4; k++) { const sp = box(32, 0.3, 0.3, M.trim, 0, -0.15, 0, apex); sp.rotation.y = k * Math.PI / 4; }
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, x = Math.cos(a) * 11, z = Math.sin(a) * 11;
      const lab = box(2.6, 1.8, 2, M.ceramic, x, -0.9, z, apex); lab.rotation.y = -a;
      const band = box(2.65, 0.45, 2.05, M.glass, x, -0.1, z, apex); band.rotation.y = -a;
    }
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 6 + k * Math.PI / 2;
      const w = box(4.4, 0.06, 1.8, M.glass, Math.cos(a) * 13.6, 0.5, Math.sin(a) * 13.6, apex); w.rotation.y = -a;
    }
    // Interstellar drydock: scaffolding for a generation ship, part-plated, off the outer ring
    const drydock = new T.Group();
    drydock.position.set(28, 0, -4);
    apex.add(drydock);
    [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([y, z]) => box(26, 0.3, 0.3, M.trim, 0, y - 0.15, z, drydock));
    for (let x = -13; x <= 13; x += 2.6) {
      [-2, 2].forEach((z) => box(0.25, 4, 0.25, M.trim, x, -2, z, drydock));
      [-2, 2].forEach((y) => box(0.25, 0.25, 4, M.trim, x, y - 0.125, 0, drydock));
    }
    box(9, 4.2, 4.2, M.ceramic, -8.5, -2.1, 0, drydock);
    box(9.1, 0.5, 4.25, M.accent, -8.5, -0.6, 0, drydock);
    box(4, 0.4, 0.4, M.trim, -15, -0.2, 0, drydock);
    // Parasol forge: finished panels stream from the station toward L1
    const FORGE_A = AP.clone().add(new T.Vector3(-12, 1, -12)), FORGE_B = new T.Vector3(L1P.x, L1P.y, L1P.z);
    const panels = [0, 1, 2, 3, 4].map((k) => {
      const m = shade(new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.12, 6), M.shade));
      world.add(m); return { m, t: k / 5 };
    });
    // Kessler remediation: debris on loose orbits, sweeper drones that capture it
    const debris = Array.from({ length: 26 }, () => {
      const m = shade(new T.Mesh(new T.IcosahedronGeometry(0.35 + Math.random() * 0.35, 0), M.debris));
      world.add(m);
      return { m, r: 20 + Math.random() * 16, a: Math.random() * Math.PI * 2, w: 0.05 + Math.random() * 0.08, y: (Math.random() - 0.5) * 10, on: true, back: 0 };
    });
    const sweepers = [0, 1, 2].map((k) => {
      const m = shade(new T.Mesh(new T.OctahedronGeometry(0.8, 0), M.accent));
      m.scale.set(1, 0.6, 1.6); world.add(m);
      return { m, r: 22 + k * 6, a: k * 2.1, w: 0.32 - k * 0.05, y: (k - 1) * 3, id: `S-0${k + 1}` };
    });

    // Nothing in orbit casts on the sea: with the shadow box widened for zoomed-out views, the Apex rings and the
    // parasol would otherwise print shadows far out on the water
    [apex, parasol, ...panels.map((p) => p.m), ...debris.map((d) => d.m), ...sweepers.map((sw) => sw.m)].forEach((o) => o.traverse((c) => { c.castShadow = false; }));

    // ----- Angel gliders -----
    // Nose is +z. Ceramic-white spine, swept metamaterial wings with bio-luminescent leading edges, the ventral
    // bio-metallic frame that the tether inductors push on, its scramjet intake, and twin canted fins.
    const WING = [[0, 1.6], [2.6, -0.8], [2.5, -1.15], [0.8, -0.85], [0, -1.25], [-0.8, -0.85], [-2.5, -1.15], [-2.6, -0.8]];
    const wingGeo = new T.ExtrudeGeometry(new T.Shape(WING.map(([x, z]) => new T.Vector2(x, z))), { depth: 0.08, bevelEnabled: false });
    wingGeo.rotateX(Math.PI / 2); wingGeo.translate(0, 0.04, 0);
    const spineGeo = new T.CylinderGeometry(0.17, 0.3, 3.2, 10); spineGeo.rotateX(Math.PI / 2);
    const noseGeo = new T.ConeGeometry(0.17, 0.8, 10); noseGeo.rotateX(Math.PI / 2);
    function edge(x0, z0, x1, z1, mat, y, parent) {
      const m = new T.Mesh(new T.BoxGeometry(Math.hypot(x1 - x0, z1 - z0), 0.05, 0.1), mat);
      m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); parent.add(m);
    }
    const podGeo = new T.CylinderGeometry(0.13, 0.13, 1, 8); podGeo.rotateX(Math.PI / 2);
    function makeGlider(scale = 0.7) {
      const g = new T.Group();
      g.add(shade(new T.Mesh(wingGeo, M.accent)));
      const spine = shade(new T.Mesh(spineGeo, M.ceramic)); spine.position.set(0, 0.12, 0.05); g.add(spine);
      const nose = shade(new T.Mesh(noseGeo, M.ceramic)); nose.position.set(0, 0.12, 2.05); g.add(nose);
      box(0.62, 0.22, 1.9, M.steel, 0, -0.26, -0.15, g);
      box(0.5, 0.14, 0.06, M.glass, 0, -0.22, 0.82, g);
      [-1, 1].forEach((sx) => {
        edge(0.25 * sx, 1.35, 2.55 * sx, -0.78, M.glow, 0.06, g);
        const fin = box(0.07, 0.75, 0.75, M.ceramic, 0.42 * sx, 0.1, -0.95, g);
        fin.rotation.z = -0.35 * sx;
        const pod = shade(new T.Mesh(podGeo, M.ceramic)); pod.position.set(1.15 * sx, -0.12, -0.25); g.add(pod);
        box(0.05, 0.4, 0.45, M.ceramic, 2.52 * sx, 0.04, -0.98, g).rotation.z = -0.25 * sx;
        box(0.12, 0.08, 0.12, M.glow, 2.58 * sx, 0.05, -0.78, g);
      });
      g.scale.setScalar(scale);
      world.add(g); return g;
    }
    // Mag-drop (launch brief §1). Each lane is a vertical plane out from the tether. The Angel hangs level on a rail
    // mount, pitches nose-down on release, free-falls belly-to-tether, is bent through the J-curve by the tether's
    // linear inductors, gets a last push outward at the bottom, then cruises off. Profile is (distance from the
    // tether, height), not to scale.
    const toIsle = new T.Vector2(IC.x - P.x, IC.z - P.z).normalize();
    const HANG_R = 6, LEVEL = SY - 12.5;
    const DROP = [[HANG_R, SY - 1.6], [HANG_R, SY - 3.4], [HANG_R, SY - 6.2], [HANG_R + 0.4, SY - 8.8], [HANG_R + 1.7, SY - 10.9],
      [HANG_R + 3.9, SY - 12.1], [HANG_R + 7, LEVEL], [HANG_R + 13, LEVEL], [HANG_R + 24, LEVEL + 0.4]];
    const LANES = [-0.62, 0.62, 0].map((a) => new T.Vector3(toIsle.x * Math.cos(a) - toIsle.y * Math.sin(a), 0, toIsle.x * Math.sin(a) + toIsle.y * Math.cos(a)));
    const atLane = (li, d, y) => [P.x + LANES[li].x * d, y, P.z + LANES[li].z * d];
    const route = (pts) => new T.CatmullRomCurve3(pts.map(([x, y, z]) => new T.Vector3(x, y, z)), true, 'centripetal');
    const loops = [
      route([
        ...DROP.map(([d, y]) => atLane(0, d, y)),
        [IC.x + 44, 42, IC.z - 12], [IC.x + 18, 16, IC.z - 14], [IC.x + 10, 7, IC.z - 10], [IC.x - 10, 6.5, IC.z - 4], [IC.x - 6, 7, IC.z + 12],
        [IC.x + 14, 16, IC.z + 18], [-40, SY * 0.72, 34], atLane(0, HANG_R + 16, SY - 4), atLane(0, HANG_R + 3, SY - 1.4)
      ]),
      // Out over the mainland: across the coast, the farmland and the ridge, then back out to sea to seed
      route([
        ...DROP.map(([d, y]) => atLane(1, d, y)),
        [-120, 44, 20], [-300, 42, 96], [-368, 38, 150], [-330, 26, 214], [IC.x - 16, 8, IC.z + 8], [IC.x, 6.5, IC.z],
        [IC.x + 12, 7, IC.z - 10], [IC.x + 22, 30, IC.z - 4], [-46, SY * 0.7, 6], atLane(1, HANG_R + 16, SY - 4), atLane(1, HANG_R + 3, SY - 1.4)
      ])
    ];
    // Per lane: the inductor on the tether, the rail mount under Midway, the field it throws (a translucent
    // half-pipe that brightens while an Angel is in the bend) and a ring that flashes at the push-out
    const laneFx = LANES.map((dir, li) => {
      const yaw = -Math.atan2(dir.z, dir.x);
      box(0.3, SY - 2.6 - LEVEL, 1.1, M.trim, P.x + dir.x * 0.5, LEVEL, P.z + dir.z * 0.5).rotation.y = yaw;
      for (let y = LEVEL + 0.5; y < SY - 3.2; y += 1.3) box(0.24, 0.7, 1.2, M.accent, P.x + dir.x * 0.72, y, P.z + dir.z * 0.72).rotation.y = yaw;
      box(4.6, 0.3, 0.5, M.trim, P.x + dir.x * HANG_R, SY - 0.45, P.z + dir.z * HANG_R).rotation.y = yaw;
      [-1.3, 1.3].forEach((o) => box(0.28, 0.8, 0.28, M.steel, P.x + dir.x * (HANG_R + o), SY - 1.25, P.z + dir.z * (HANG_R + o)));
      const jc = new T.CatmullRomCurve3(DROP.slice(1, 8).map(([d, y]) => new T.Vector3(...atLane(li, d, y))), false, 'centripetal');
      const lat = new T.Vector3(-dir.z, 0, dir.x), f = new T.Vector3(), u = new T.Vector3(), pos = [], idx = [], rungs = [], N = 40;
      for (let k = 0; k <= N; k++) {
        const c = jc.getPointAt(k / N); jc.getTangentAt(k / N, f);
        c.addScaledVector(u.crossVectors(lat, f).normalize(), -1);   // the field sits between the belly and the tether
        const a = c.clone().addScaledVector(lat, 2.2), b = c.clone().addScaledVector(lat, -2.2);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k);
        if (k % 4 === 0) rungs.push(a, b);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      const mat = new T.MeshBasicMaterial({ transparent: true, opacity: 0.07, side: T.DoubleSide, depthWrite: false });
      world.add(new T.Mesh(geo, mat));
      const lmat = new T.LineBasicMaterial({ transparent: true, opacity: 0.2 });
      world.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(rungs), lmat));
      const ring = new T.Mesh(new T.RingGeometry(1.3, 1.7, 32), new T.MeshBasicMaterial({ transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
      ring.position.set(...atLane(li, HANG_R + 7, LEVEL)); ring.lookAt(ring.position.clone().add(dir)); ring.visible = false;
      world.add(ring);
      return { mat, lmat, ring, glow: 0, t0: -1e9 };
    });
    [LEVEL - 0.6, SY - 3].forEach((y) => cyl(0.85, 0.85, 0.5, M.ceramic, P.x, y, P.z, 16));
    // Attitude through the drop: nose along f, belly toward the tether (or down once level)
    const latV = new T.Vector3(), upV = new T.Vector3(), xV = new T.Vector3(), tanV = new T.Vector3(), basisM = new T.Matrix4();
    const qHang = new T.Quaternion(), qLane = new T.Quaternion();
    function laneQuat(dir, f, out) {
      latV.set(-dir.z, 0, dir.x);
      upV.crossVectors(latV, f).normalize();
      xV.crossVectors(upV, f).normalize();
      return out.setFromRotationMatrix(basisM.makeBasis(xV, upV, f));
    }
    const smooth = (x) => x * x * (3 - 2 * x);
    // Water-vapor contrail, laid only on the outbound scramjet leg
    const TRAIL = 30;
    const trailMat = new T.PointsMaterial({ size: 2.5, sizeAttenuation: false, color: 0x94a3b8, transparent: true, opacity: 0.7, depthWrite: false });
    function makeTrail() {
      const pos = new Float32Array(TRAIL * 3).fill(-99);
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      world.add(new T.Points(geo, trailMat));
      return { pos, geo, i: 0, acc: 0 };
    }
    const gliders = [];
    loops.forEach((curve, li) => [0, 1, 2].forEach((k) => {
      const t = (k / 3 + li * 0.16) % 1;
      gliders.push({ g: makeGlider(), trail: makeTrail(), curve, t, out: t < 0.45, id: `ANGEL-${String(li * 3 + k + 1).padStart(2, '0')}`, seeding: false, acc: 0, lane: li, cruise: 48 });
    }));
    const parked = makeGlider(0.65 * CITY_K);
    parked.position.set(...ck(36, ARM_TOP + 0.45, RZ + 7.7));
    parked.rotation.y = -Math.PI / 2;
    // ANGEL-07 takes the second recovery option: a horizontal landing on the mega-city runway
    const landCurve = route([
      ...DROP.map(([d, y]) => atLane(2, d, y)),
      [IC.x + 44, 42, IC.z - 10], [IC.x + 18, 16, IC.z - 12], [IC.x + 12, 7, IC.z - 10], [IC.x - 10, 6.5, IC.z],
      [IC.x - 4, 7, IC.z + 14], [-110, 30, 130], [-40, 30, 112], ck(70, 10, 62), ck(96, 6, 30), ck(84, 4, RZ + 2), ck(62, ARM_TOP + 0.6, RZ),
      ck(42, ARM_TOP + 0.6, RZ), ck(28, ARM_TOP + 0.6, RZ), ck(16, 10, RZ - 6), ck(22, 30, -30), [P.x + 6, 62, P.z - 22],
      atLane(2, HANG_R + 16, SY - 4), atLane(2, HANG_R + 3, SY - 1.4)
    ]);
    gliders.push({ g: makeGlider(), trail: makeTrail(), curve: landCurve, t: 0.35, out: false, id: 'ANGEL-07', seeding: false, acc: 0, land: true, landed: false, lane: 2, cruise: 48 });
    // ANGEL-08 uses the secondary method: the mag-lev catapult on the east runway, then a steep climb
    const catCurve = new T.CatmullRomCurve3([
      ck(27, 2.2, CAT_Z), ck(42, 2.2, CAT_Z), ck(58, 2.5, CAT_Z), ck(68, 9, CAT_Z - 0.5), ck(74, 22, CAT_Z - 4),
      [P.x + 66, SY - 5, P.z - 30], [P.x + 30, SY - 5, P.z - 36], [-30, SY - 6, -10], [-50, 60, 4], [IC.x + 22, 18, IC.z - 20], [IC.x + 10, 7, IC.z - 8],
      [IC.x - 10, 6.5, IC.z + 2], [IC.x - 2, 7, IC.z + 14], [IC.x + 18, 16, IC.z + 18], [-20, 56, 46], [40, 20, 36], ck(96, 8, 4),
      ck(80, 5, CAT_Z), ck(60, 2.4, CAT_Z), ck(44, 2.2, CAT_Z), ck(29, 2.2, CAT_Z - 0.3)
    ].map(([x, y, z]) => new T.Vector3(x, y, z)), true, 'centripetal');
    gliders.push({ g: makeGlider(), trail: makeTrail(), curve: catCurve, t: 0.62, out: false, id: 'ANGEL-08', seeding: false, acc: 0, cat: true, launching: false, cruise: 48 });
    // Route markers: where the pitch-over ends, the bend starts, the push-out fires and its burst fades. Scramjets
    // light at the push-out (Mach 3 at the base of the J), or for the catapult at stratospheric insertion.
    const firstT = (curve, test) => { for (let t = 0; t < 0.6; t += 0.0005) if (test(curve.getPointAt(t))) return t; return 0.05; };
    const fromTether = (p) => Math.hypot(p.x - P.x, p.z - P.z);
    gliders.forEach((gl) => {
      if (gl.cat) { gl.tIgn = firstT(gl.curve, (p) => p.y > SY - 6.5); return; }
      gl.dir = LANES[gl.lane]; gl.hold = 0;
      gl.tFall = firstT(gl.curve, (p) => p.y < SY - 3.6);
      gl.tBend = firstT(gl.curve, (p) => p.y < SY - 8);
      gl.tPush = gl.tIgn = firstT(gl.curve, (p) => fromTether(p) > HANG_R + 7);
      gl.tBlast = firstT(gl.curve, (p) => fromTether(p) > HANG_R + 24);
    });
    // Angels waiting on Midway's rail mounts, nose out, each under its own mount
    [1.9, 3.1, 4.3].forEach((rot) => {
      const dx = toIsle.x * Math.cos(rot) - toIsle.y * Math.sin(rot), dz = toIsle.x * Math.sin(rot) + toIsle.y * Math.cos(rot);
      const hang = makeGlider(0.65);
      hang.position.set(P.x + dx * HANG_R, SY - 1.6, P.z + dz * HANG_R);
      hang.lookAt(P.x + dx * 12, SY - 1.6, P.z + dz * 12);
      box(4.6, 0.3, 0.5, M.trim, P.x + dx * HANG_R, SY - 0.45, P.z + dz * HANG_R).rotation.y = -Math.atan2(dz, dx);
      [-1.3, 1.3].forEach((o) => box(0.28, 0.8, 0.28, M.steel, P.x + dx * (HANG_R + o), SY - 1.25, P.z + dz * (HANG_R + o)));
    });


    // Seed particles
    const SEEDS = 260;
    const seedPos = new Float32Array(SEEDS * 3), seeds = [];
    for (let i = 0; i < SEEDS; i++) { seeds.push({ live: false, vx: 0, vy: 0, vz: 0 }); seedPos[i * 3 + 1] = -99; }
    const seedGeo = new T.BufferGeometry();
    seedGeo.setAttribute('position', new T.BufferAttribute(seedPos, 3));
    const seedMat = new T.PointsMaterial({ size: 3, sizeAttenuation: false, color: 0x22c55e });
    world.add(new T.Points(seedGeo, seedMat));
    let seedCursor = 0;
    function spawnSeed(p) {
      const i = seedCursor = (seedCursor + 1) % SEEDS, s = seeds[i];
      s.live = true; s.vx = (Math.random() - 0.5) * 2.4; s.vz = (Math.random() - 0.5) * 2.4; s.vy = -1.5;
      seedPos[i * 3] = p.x; seedPos[i * 3 + 1] = p.y - 0.4; seedPos[i * 3 + 2] = p.z;
    }

    // ----- Harvesters, gyre plastic -----
    const gyre = new T.CatmullRomCurve3(Array.from({ length: 12 }, (_, k) => {
      const a = k / 12 * Math.PI * 2, r = 8.6 + Math.sin(a * 2) * 1.8;
      return new T.Vector3(G.x + Math.cos(a) * r, 0.1, G.z + Math.sin(a) * r * 0.8);
    }), true);
    // A hull with a pointed bow toward +z: width, length, height; sits from y 0 to y height
    function hullGeo(W, Lh, Hh) {
      const b = Lh / 2, t = b - Math.min(Lh * 0.2, W * 1.4);
      const g = new T.ExtrudeGeometry(new T.Shape([[-W / 2, -b], [W / 2, -b], [W / 2, t], [0, b], [-W / 2, t]].map(([x, y]) => new T.Vector2(x, y))), { depth: Hh, bevelEnabled: false });
      g.rotateX(Math.PI / 2); g.translate(0, Hh, 0);
      return g;
    }
    const hull = (W, Lh, Hh, mat, x, y, z, parent) => { const m = shade(new T.Mesh(hullGeo(W, Lh, Hh), mat)); m.position.set(x, y, z); parent.add(m); return m; };
    // Sweep drone: a small catamaran with pointed twin hulls, a solar deck, a sensor mast and an acoustic vortex ring
    function makeCat() {
      const g = new T.Group();
      [-0.9, 0.9].forEach((x) => { hull(0.6, 3.8, 0.6, M.accent, x, 0, 0, g); box(0.62, 0.12, 3, M.ceramic, x, 0.6, -0.3, g); });
      box(2.4, 0.3, 2.2, M.ceramic, 0, 0.6, -0.2, g);
      box(2.2, 0.08, 1.8, M.glass, 0, 0.92, -0.2, g).rotation.x = 0.15;
      cyl(0.04, 0.04, 1, M.steel, 0, 0.9, 0.8, 5, g);
      box(0.16, 0.12, 0.16, M.glow, 0, 1.9, 0.8, g);
      const v = new T.Mesh(new T.RingGeometry(1.6, 2, 32), M.vortex);
      v.rotation.x = -Math.PI / 2; v.position.y = -0.3; g.add(v);
      g.scale.setScalar(0.72);
      world.add(g); return { g, v };
    }
    const cats = [0, 1, 2].map((k) => ({ ...makeCat(), t: k / 3 }));

    // Leviathan-class mothership: trimaran with sanctuary decks, forge, stern drydock, solar sails and a trailing net
    const outerGyre = new T.CatmullRomCurve3(Array.from({ length: 12 }, (_, k) => {
      const a = k / 12 * Math.PI * 2;
      return new T.Vector3(G.x + Math.cos(a) * 12.2, 0.1, G.z + Math.sin(a) * 9.9);
    }), true);
    const lev = new T.Group();
    hull(2.6, 15, 1.3, M.accent, 0, -0.5, 0, lev);
    hull(1, 10, 0.9, M.accent, -4.2, -0.4, -0.5, lev);
    hull(1, 10, 0.9, M.accent, 4.2, -0.4, -0.5, lev);
    // Drone pads on the aft deck, where the hive launches and recharges its sweep drones
    [[1.5, -3.2], [1.5, 0.3], [-1.6, 0.3]].forEach(([x, z]) => { cyl(0.6, 0.6, 0.05, M.trim, x, 1.15, z, 20, lev); cyl(0.62, 0.62, 0.03, M.glow, x, 1.2, z, 20, lev); });
    // Side decks over the outriggers make the top one broad platform, a small city at sea
    [-1, 1].forEach((sx) => box(2.6, 0.3, 11, M.ceramic, sx * 3.85, 0.85, 0.3, lev));
    // Starboard: a flight deck, flown like a carrier's, with parked aircraft and a small control island
    box(2.5, 0.04, 10.8, M.steel, 3.85, 1.15, 0.3, lev);
    for (let z = -4.6; z < 5.6; z += 1.4) box(0.12, 0.02, 0.6, M.ceramic, 3.85, 1.19, z, lev);
    box(0.5, 0.9, 1.2, M.ceramic, 2.85, 1.15, -0.9, lev);
    box(0.54, 0.3, 1.24, M.glass, 2.85, 1.75, -0.9, lev);
    function makeJet(parent) {
      const j = new T.Group();
      box(0.32, 0.22, 1.5, M.ceramic, 0, 0, 0, j);
      const nose = shade(new T.Mesh(new T.ConeGeometry(0.16, 0.5, 6), M.ceramic)); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.11, 1); j.add(nose);
      box(1.3, 0.05, 0.45, M.accent, 0, 0.08, -0.1, j);
      [-0.14, 0.14].forEach((x) => box(0.04, 0.35, 0.3, M.ceramic, x, 0.2, -0.6, j).rotation.z = x * 2);
      parent.add(j); return j;
    }
    // A carrier jet is about a sixteenth of its ship's length
    [[4.5, -3.6], [4.5, -2.6], [3.4, 4.6], [3.4, 3.8]].forEach(([x, z]) => { const j = makeJet(lev); j.scale.setScalar(0.5); j.position.set(x, 1.19, z); j.rotation.y = 0.6; });
    // Port: the campus. Habitat blocks with lit windows and green roofs, a slim tower, gardens and trees.
    [-3.8, 2.6].forEach((z) => {
      box(1.8, 1.4, 2.2, M.ceramic, -3.85, 1.15, z, lev);
      box(1.84, 0.25, 2.24, M.glass, -3.85, 1.95, z, lev);
      box(0.04, 0.14, 1.8, M.glow, -4.77, 1.6, z, lev);
      box(1.6, 0.06, 2, M.park, -3.85, 2.55, z, lev);
    });
    box(1.2, 3, 1.2, M.ceramic, -3.85, 1.15, -0.6, lev);
    box(1.24, 0.3, 1.24, M.glass, -3.85, 3.3, -0.6, lev);
    box(0.04, 1.6, 0.14, M.glow, -4.46, 1.9, -0.6, lev);
    box(2.4, 0.04, 1.6, M.park, -3.85, 1.15, 4.8, lev);
    [[-3.3, 4.7], [-4.4, 5], [-3.4, 0.9], [-4.4, 0.8], [-3.3, -2]].forEach(([x, z]) => {
      cyl(0.05, 0.07, 0.5, M.trim, x, 1.2, z, 5, lev);
      const crown = shade(new T.Mesh(new T.SphereGeometry(0.38, 8, 6), M.crown)); crown.position.set(x, 1.95, z); lev.add(crown);
    });
    [-3.5, 0.5, 4].forEach((z) => box(9.4, 0.3, 0.8, M.ceramic, 0, 0.45, z, lev));
    box(5, 0.35, 11.5, M.ceramic, 0, 0.8, 0.3, lev);
    box(3.2, 2.2, 4, M.ceramic, 0, 1.15, 3, lev);
    box(3.3, 0.6, 4.1, M.glass, 0, 2.6, 3, lev);
    box(2.6, 0.5, 3, M.ceramic, 0, 3.2, 3.2, lev);
    box(1.8, 1.2, 1.8, M.trim, 0, 1.15, -3.2, lev);
    cyl(0.25, 0.3, 1.6, M.steel, 0.5, 2.35, -3.4, 8, lev);
    box(2.2, 1.2, 0.2, M.glass, 0, -0.1, -7.6, lev);
    cyl(0.9, 0.9, 0.06, M.glass, 0, 1.15, -1.2, 20, lev);
    [[-1.8, -0.2], [1.8, -1.6]].forEach(([x, z]) => {
      box(0.12, 4.2, 0.12, M.steel, x, 1.15, z, lev);
      const sail = box(0.08, 2.4, 2.8, M.glass, x, 2.7, z, lev);
      sail.rotation.y = 0.35;
    });
    [-1.32, 1.32].forEach((x) => box(0.05, 0.28, 12, M.glass, x, -0.05, 0.2, lev));
    [-4.72, 4.72].forEach((x) => box(0.05, 0.22, 8, M.glass, x, -0.1, -0.5, lev));
    box(0.16, 2.2, 0.16, M.steel, 0, 3.7, 3.6, lev);
    box(1.6, 0.12, 0.3, M.trim, 0, 5.2, 3.6, lev);
    cyl(0.35, 0.35, 0.22, M.ceramic, 0, 5.9, 3.6, 12, lev);
    cyl(0.18, 0.22, 1.4, M.trim, 1.9, 1.15, -5, 8, lev);
    const jib = box(0.18, 0.18, 3.4, M.trim, 1.9, 2.45, -6.2, lev); jib.rotation.x = -0.35;
    [-3.2, -4.6].forEach((z) => box(1.4, 0.06, 1.1, M.glass, -1.75, 1.15, z, lev));
    const netPts = [];
    const arc = Array.from({ length: 13 }, (_, k) => {
      const a = Math.PI * k / 12;
      return new T.Vector3(Math.cos(a) * 6, 0.12, -11.5 - Math.sin(a) * 4);
    });
    netPts.push(new T.Vector3(-4.2, 0.12, -5.5), arc[12], new T.Vector3(4.2, 0.12, -5.5), arc[0]);
    for (let k = 0; k < 12; k++) netPts.push(arc[k], arc[k + 1]);
    for (let k = 1; k < 12; k += 2) netPts.push(arc[k], new T.Vector3(0, 0.12, -7.6));
    lev.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(netPts), lineMat));
    // A Leviathan is about twice a carrier (~660 m) against a city ~28 km across, so it sits at roughly a twentieth of
    // the city's width here (towers are exaggerated, ships less so). Every clone below inherits this scale.
    const LEV_BASE = 0.45, LEV_S = LEV_BASE * CITY_K;   // at sea; ships inside the scaled city use LEV_BASE
    lev.scale.setScalar(LEV_S);
    world.add(lev);
    const levState = { t: 0.55 };
    // A second Leviathan sweeps a wider loop, so the gyre reads as a fleet at work
    const lev2 = lev.clone();
    world.add(lev2);
    // Circuit in the ship's own units: roll down the flight deck, climb out over the bow, a wide loop, and back in over
    // the stern for a touch-and-go
    const CIRCUIT = new T.CatmullRomCurve3([[3.85, 1.35, -4], [3.85, 1.4, 0.5], [3.85, 1.8, 5], [3.9, 4.5, 10], [8, 9, 18], [20, 12, 10],
      [24, 12, -8], [14, 9, -22], [5, 5, -16], [3.85, 2.2, -8.5]].map(([x, y, z]) => new T.Vector3(x, y, z)), true, 'centripetal');
    const carriers = [lev, lev2].map((ship, i) => {
      const jet = makeJet(world); jet.scale.setScalar(LEV_S * 0.5);
      const tenders = [0, 1].map((k) => {
        const g = new T.Group();
        box(0.8, 0.4, 2, M.ceramic, 0, -0.2, 0, g);
        box(0.82, 0.1, 2.02, M.accent, 0, 0.12, 0, g);
        box(0.6, 0.4, 0.7, M.glass, 0, 0.2, -0.3, g);
        const wake = new T.Mesh(new T.PlaneGeometry(0.7, 2.4), M.wake); wake.rotation.x = -Math.PI / 2; wake.position.set(0, 0.02, -2.1); g.add(wake);
        g.scale.setScalar(LEV_S); world.add(g);
        return { g, ph: k * Math.PI + i };
      });
      return { ship, jet, tenders, t: i * 0.5 };
    });
    const cp = new T.Vector3(), cn = new T.Vector3();
    if (HARBOR) {
      const refit = lev.clone();
      refit.children.filter((c) => c.isLineSegments).forEach((c) => refit.remove(c));
      refit.scale.setScalar(LEV_BASE);
      refit.position.set(HARBOR.x - HARBOR.ux * 4.1, 0.05, HARBOR.z - HARBOR.uz * 4.1); refit.rotation.y = HARBOR.yaw;
      cityG.add(refit);
      const refit2 = refit.clone();
      refit2.position.set(HARBOR.x + HARBOR.ux * 4.1, 0.05, HARBOR.z + HARBOR.uz * 4.1);
      cityG.add(refit2);
      HARBOR.refit = refit;
    }
    // Leviathans at their berths, one in scaffolding for work, and smaller ships moored round the harbor
    BERTHS.forEach(({ deg, u, v, scaffold }) => {
      const berth = lev.clone();
      berth.children.filter((c) => c.isLineSegments).forEach((c) => berth.remove(c));
      const [x, z] = pierAt(deg, u, v);
      berth.scale.setScalar(LEV_BASE);
      berth.position.set(x, 0.05, z); berth.rotation.y = pierYaw(deg);
      cityG.add(berth);
      if (scaffold) {
        // Built in the ship's own units, so it scales with it
        [[-5.4, -9], [5.4, -9], [-5.4, 9], [5.4, 9]].forEach(([dx, dz]) => box(0.4, 7, 0.4, M.trim, dx, 0, dz, berth));
        [-5.4, 5.4].forEach((dx) => [2.6, 4.8, 7].forEach((y) => box(0.3, 0.3, 18, M.trim, dx, y, 0, berth)));
        [-9, 9].forEach((dz) => box(10.8, 0.3, 0.3, M.trim, 0, 7, dz, berth));
      }
    });
    function makeShip(len, cargo) {
      const g = new T.Group();
      box(1.9, 0.9, len, M.ceramic, 0, -0.5, 0, g);
      box(1.94, 0.18, len + 0.04, M.accent, 0, 0.05, 0, g);
      box(1.5, 1.1, 1.6, M.ceramic, 0, 0.4, -len / 2 + 1.2, g);
      box(1.54, 0.35, 1.64, M.glass, 0, 1.05, -len / 2 + 1.2, g);
      cyl(0.05, 0.05, 1.6, M.steel, 0, 1.5, -len / 2 + 1.2, 5, g);
      if (cargo) for (let k = 0; k < Math.floor(len / 2.4) - 1; k++) box(1.4, 0.7, 1.9, STK[k % 3], 0, 0.4, -len / 2 + 3 + k * 2.2, g);
      g.scale.setScalar(0.5);   // supply ships and tugs, small beside a Leviathan
      cityG.add(g); return g;
    }
    [[240, 27, 10.4, 8, true], [300, 27, -10.4, 5, false], [240, 55, 10.4, 9, true], [300, 46, -16.3, 5, false]].forEach(([deg, u, v, len, cargo]) => {
      const [x, z] = pierAt(deg, u, v), sh = makeShip(len, cargo);
      sh.position.set(x, 0.15, z); sh.rotation.y = pierYaw(deg);
    });
      const wideGyre = new T.CatmullRomCurve3(Array.from({ length: 12 }, (_, k) => {
      const a = k / 12 * Math.PI * 2;
      return new T.Vector3(G.x + Math.cos(a) * 24, 0.1, G.z + Math.sin(a) * 17.6);
    }), true);
    {
      // Holding station, processing its catch
      const p0 = wideGyre.getPointAt(0.3), v0 = wideGyre.getTangentAt(0.3);
      lev2.position.set(p0.x, 0.05, p0.z); lev2.rotation.y = Math.atan2(v0.x, v0.z);
    }
    const drones = [0, 1, 2, 3].map((k) => {
      const m = new T.Group();
      const body = shade(new T.Mesh(new T.SphereGeometry(0.4, 12, 8), M.accent)); body.scale.set(0.8, 0.7, 2); m.add(body);
      box(0.06, 0.5, 0.4, M.ceramic, 0, -0.25, -0.7, m);
      box(0.9, 0.06, 0.35, M.ceramic, 0, -0.03, -0.7, m);
      box(0.2, 0.14, 0.08, M.glow, 0, 0.05, 0.8, m);
      m.scale.setScalar(0.88); world.add(m); return { m, k };
    });
    const netCenter = new T.Vector3();
    const PLASTIC = 70;
    const plasticMesh = new T.InstancedMesh(new T.BoxGeometry(0.2, 0.08, 0.2), M.inst, PLASTIC);
    world.add(plasticMesh);
    const specks = Array.from({ length: PLASTIC }, () => ({ x: 0, z: 0, on: true, back: 0 }));
    function placeSpeck(s) { const a = Math.random() * Math.PI * 2, r = 4.8 + Math.random() * 8; s.x = G.x + Math.cos(a) * r; s.z = G.z + Math.sin(a) * r * 0.8; s.on = true; }
    specks.forEach(placeSpeck);
    function drawSpecks() {
      specks.forEach((s, i) => {
        mtx.compose(pv.set(s.x, 0.04, s.z), q.identity(), sc.setScalar(s.on ? 1 : 0.001));
        plasticMesh.setMatrixAt(i, mtx);
        plasticMesh.setColorAt(i, col.setHex(pal.plastic));
      });
      plasticMesh.instanceMatrix.needsUpdate = true;
      if (plasticMesh.instanceColor) plasticMesh.instanceColor.needsUpdate = true;
    }

    // ----- Reef: a raised sandy shelf with brain, branching, fan and tube corals in reef colours. Bleached corals are
    // white and come back to their colour as the drones restore them. Seagrass, rocks and fish round it out. -----
    const REEF_R = (a) => 15 + Math.sin(a * 3 + 0.5) * 2.5 + Math.sin(a * 5 + 1.7) * 1.5;
    const reefPolar = (x, z) => { const dx = x - R0.x, dz = (z - R0.z) / 0.75; return [Math.hypot(dx, dz), Math.atan2(dz, dx)]; };
    const onReef = (x, z, pad = 1) => { const [d, a] = reefPolar(x, z); return d < REEF_R(a) - pad; };
    const SHELF = 2.5, reefY = -DEPTH + SHELF;   // a shallow reef, a couple of units under the surface
    // A shallow reef seen through clear water: corals and fish draw after the water layer (transparent, but fully
    // opaque) so it doesn't wash them out, and glow a touch in their own colour. The shelf stays tinted, so it still
    // reads as underwater.
    M.coral = new T.MeshStandardMaterial({ roughness: 0.6, transparent: true, opacity: 1 });
    M.coral.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + String.fromCharCode(10) + '  totalEmissiveRadiance += vColor * 0.18;');
    };
    {
      const g = new T.ExtrudeGeometry(new T.Shape(Array.from({ length: 64 }, (_, k) => {
        const a = k / 64 * Math.PI * 2, r = REEF_R(a);
        return new T.Vector2(Math.cos(a) * r, Math.sin(a) * r * 0.75);
      })), { depth: SHELF, bevelEnabled: false });
      g.rotateX(Math.PI / 2); g.translate(0, reefY, 0);
      const shelf = shade(new T.Mesh(g, M.sand)); shelf.position.set(R0.x, 0, R0.z); world.add(shelf);
    }
    const CORAL_GEO = [
      new T.IcosahedronGeometry(0.8, 1),                                                              // brain
      new T.ConeGeometry(0.45, 1.6, 6),                                                               // branching
      (() => { const g = new T.CylinderGeometry(0.9, 0.9, 0.08, 12); g.rotateX(Math.PI / 2); return g; })(),   // fan
      new T.CylinderGeometry(0.2, 0.26, 1.2, 7)                                                       // tube
    ];
    const PARTS = [1, 3, 1, 3];   // branching and tube corals grow in clusters of three
    const REEF_COLS = [0xff5a3c, 0xff3d8b, 0xffc21a, 0x8a4dff, 0x00c9a7, 0xff7a00];
    const corals = [];
    for (let n = 0; n < 2000 && corals.length < 120; n++) {
      const x = R0.x + (rand() - 0.5) * 36, z = R0.z + (rand() - 0.5) * 28;
      if (!onReef(x, z) || corals.some((c) => (c.x - x) ** 2 + (c.z - z) ** 2 < 0.9)) continue;
      corals.push({ x, z, s: 0.45 + rand() * 0.55, type: Math.floor(rand() * 4), col: REEF_COLS[Math.floor(rand() * REEF_COLS.length)], rot: rand() * 6.28, life: rand() < 0.3 ? 1 : 0 });
    }
    const slots = [0, 0, 0, 0];
    corals.forEach((c) => { c.slot = slots[c.type]; slots[c.type] += PARTS[c.type]; });
    const coralMeshes = CORAL_GEO.map((g, t) => {
      const m = new T.InstancedMesh(g, M.coral, Math.max(slots[t], 1));
      m.castShadow = true; m.receiveShadow = true; m.renderOrder = 3; world.add(m); return m;
    });
    const CLUSTER = [[0, 0], [0.35, 0.2], [-0.25, 0.3]];
    function drawCoral() {
      corals.forEach((c) => {
        const m = coralMeshes[c.type], k = c.s;
        col.setHex(pal.coralDead).lerp(col2.setHex(c.col), c.life);
        for (let p = 0; p < PARTS[c.type]; p++) {
          const [ox, oz] = CLUSTER[p], h = 1 - p * 0.2;
          q.setFromAxisAngle(UP, c.rot + p);
          if (c.type === 0) mtx.compose(pv.set(c.x, reefY + 0.4 * k, c.z), q, sc.set(k, 0.7 * k, k));
          else if (c.type === 1) mtx.compose(pv.set(c.x + ox * k, reefY + 0.8 * k * h, c.z + oz * k), q, sc.set(k * 0.8, k * h, k * 0.8));
          else if (c.type === 2) mtx.compose(pv.set(c.x, reefY + 0.85 * k, c.z), q, sc.setScalar(k));
          else mtx.compose(pv.set(c.x + ox * k, reefY + 0.6 * k * h, c.z + oz * k), q, sc.set(k, k * h, k));
          m.setMatrixAt(c.slot + p, mtx); m.setColorAt(c.slot + p, col);
        }
      });
      coralMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    }
    // Seagrass beds just off the shelf, and a few rocks along its edge
    M.grass = new T.MeshStandardMaterial({ color: 0x2fae58, emissive: 0x1b6b34, emissiveIntensity: 0.5, roughness: 0.9, flatShading: true });
    const blades = [];
    for (let n = 0; n < 3000 && blades.length < 220; n++) {
      const a = rand() * Math.PI * 2, r = REEF_R(a) + 0.5 + rand() * 5;
      if (Math.sin(a * 2 + 1) < -0.2) continue;   // in beds, not a full ring
      blades.push([R0.x + Math.cos(a) * r, R0.z + Math.sin(a) * r * 0.75, 0.6 + rand() * 0.9, rand() * 6.28]);
    }
    const grassMesh = new T.InstancedMesh(new T.ConeGeometry(0.08, 1, 4), M.grass, blades.length);
    blades.forEach(([x, z, h, r], i) => {
      mtx.compose(pv.set(x, -DEPTH + h, z), q.setFromAxisAngle(UP, r), sc.set(1.4, h * 2, 1.4));
      grassMesh.setMatrixAt(i, mtx);
    });
    world.add(grassMesh);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2 + rand() * 0.3, r = REEF_R(a) - 0.6;
      const rock = shade(new T.Mesh(new T.IcosahedronGeometry(0.5 + rand() * 0.6, 0), M.rock));
      rock.position.set(R0.x + Math.cos(a) * r, reefY + 0.1, R0.z + Math.sin(a) * r * 0.75); rock.rotation.y = rand() * 6; world.add(rock);
    }
    // Two schools of fish circling over the reef
    const FISH = 30;
    const fishMesh = new T.InstancedMesh(new T.ConeGeometry(0.1, 0.36, 4), M.coral, FISH);
    fishMesh.geometry.rotateX(Math.PI / 2);
    const fish = Array.from({ length: FISH }, (_, i) => ({ school: i % 2, off: rand() * 6.28, dr: (rand() - 0.5) * 2.4, dy: rand() * 0.8, col: i % 2 ? 0xffd21f : 0x1fb8ff }));
    fish.forEach((f, i) => fishMesh.setColorAt(i, col.setHex(f.col)));
    fishMesh.renderOrder = 3;
    world.add(fishMesh);
    const subs = [0, 1, 2].map((k) => {
      const m = new T.Group();
      const hull = shade(new T.Mesh(new T.SphereGeometry(0.75, 14, 10), M.accent));
      hull.scale.set(1, 0.8, 2); m.add(hull);
      const win = shade(new T.Mesh(new T.SphereGeometry(0.4, 12, 8), M.glass)); win.position.set(0, 0.15, 1.15); m.add(win);
      box(0.08, 0.7, 0.6, M.ceramic, 0, 0, -1.3, m);
      box(1.4, 0.08, 0.5, M.ceramic, 0, -0.04, -1.25, m);
      const prop = new T.Mesh(new T.TorusGeometry(0.32, 0.06, 6, 16), M.steel); prop.position.z = -1.65; m.add(prop);
      box(0.12, 0.12, 0.5, M.steel, 0, -0.45, 1.3, m);
      box(0.18, 0.18, 0.18, M.glow, 0, -0.5, 1.6, m);   // micro-welding tip for the polyps
      m.scale.setScalar(0.4);   // reef drones: small beside a Leviathan, about the size of the harvest drones
      world.add(m); return { m, k };
    });
    // Research Leviathan on the Abyss mission: holds station over a hydrothermal vent
    const station = lev.clone();
    station.children.filter((c) => c.isLineSegments).forEach((c) => station.remove(c));
    station.position.set(R0.x - 13, 0.05, R0.z + 6);
    station.rotation.y = Math.PI / 2;
    world.add(station);
    station.updateMatrixWorld();
    const moonPool = new T.Vector3(0, -0.6, -1.2).applyMatrix4(station.matrixWorld);
    const VENT = { x: R0.x - 14, z: R0.z + 12 };   // just off the shelf, on the deep seabed
    [[0, 0, 1.6], [0.8, 0.5, 1.1], [-0.6, 0.6, 0.9]].forEach(([dx, dz, h]) => cyl(0.15, 0.5, h, M.glass, VENT.x + dx, -DEPTH, VENT.z + dz, 7));
    const BUB = 40, bubPos = new Float32Array(BUB * 3), bubPhase = [];
    for (let i = 0; i < BUB; i++) { bubPhase.push(Math.random()); bubPos[i * 3] = VENT.x; bubPos[i * 3 + 2] = VENT.z; }
    const bubGeo = new T.BufferGeometry();
    bubGeo.setAttribute('position', new T.BufferAttribute(bubPos, 3));
    world.add(new T.Points(bubGeo, new T.PointsMaterial({ size: 2, sizeAttenuation: false, color: 0xe0f2fe, transparent: true, opacity: 0.8, depthWrite: false })));
    const manned = new T.Group();
    const hullM = shade(new T.Mesh(new T.SphereGeometry(0.7, 14, 10), M.accent));
    hullM.scale.set(1, 0.85, 1.5); manned.add(hullM);
    const dome = shade(new T.Mesh(new T.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.glass));
    dome.position.set(0, 0.35, 0.5); manned.add(dome);
    manned.scale.setScalar(0.6);
    world.add(manned);
    const ventTop = new T.Vector3(VENT.x - 1, -DEPTH + 2, VENT.z + 1);
    let diveLogged = false;

    // ---------- Theme ----------
    // The site is light-only, like Foreman's landing
    const isDark = () => false;
    function applyTheme() {
      pal = isDark() ? PAL.dark : PAL.light;
      ['seabed', 'seabedSide', 'land', 'sand', 'ceramic', 'trim', 'steel', 'tether', 'accent', 'glass', 'stump'].forEach((k) => M[k].color.setHex(pal[k]));
      M.water.color.setHex(pal.water); M.water.opacity = pal.waterOp;
      M.shade.color.setHex(pal.shade); M.shade.opacity = pal.shadeOp;
      M.beam.color.setHex(pal.accent); M.vortex.color.setHex(pal.accent);
      M.glow.color.setHex(pal.shade);
      M.bands.color.setHex(pal.glass); M.bands.emissive.setHex(pal.accent); M.bands.emissiveIntensity = pal.glow * 0.35;
      laneFx.forEach((f) => { f.mat.color.setHex(pal.accent); f.lmat.color.setHex(pal.accent); f.ring.material.color.setHex(pal.accent); });
      M.crown.color.setHex(pal.crown); M.inst.color.setHex(0xffffff); M.park.color.setHex(0xa9cc93);
      M.accent.emissive.setHex(pal.accent); M.accent.emissiveIntensity = pal.glow * 0.5;
      M.glass.emissive.setHex(pal.accent); M.glass.emissiveIntensity = pal.glow * 0.35;
      lineMat.color.setHex(pal.line);
      scene.background = new T.Color(pal.bg);
      scene.fog = new T.Fog(pal.bg, 360, 620);
      hemi.intensity = pal.hemi; sun.intensity = pal.sun;
      drawTiles(); drawSpecks(); drawCoral();
    }
    applyTheme();

    // ---------- Camera ----------
    const viewDir = new T.Vector3(Math.cos(ELEV) * Math.sin(AZ), Math.sin(ELEV), Math.cos(ELEV) * Math.cos(AZ));
    const fwd = viewDir.clone().negate();
    const right = new T.Vector3().crossVectors(fwd, new T.Vector3(0, 1, 0)).normalize();
    const up = new T.Vector3().crossVectors(right, fwd).normalize();
    const cam = { target: new T.Vector3(), zoom: 1, az: 0, el: ELEV, azGoal: 0, elGoal: ELEV, zoomGoal: null };
    const Y_UP = new T.Vector3(0, 1, 0);
    // View axes for a given turn and tilt; stops frame against the orientation the camera is heading to
    function basis(az, el) {
      const a = AZ + az;
      viewDir.set(Math.cos(el) * Math.sin(a), Math.sin(el), Math.cos(el) * Math.cos(a));
      fwd.copy(viewDir).negate();
      right.crossVectors(fwd, Y_UP).normalize();
      up.crossVectors(right, fwd).normalize();
    }
    let tween = null, W = 1, H = 1;

    frameStop = (i, instant) => {
      basis(cam.azGoal, cam.elGoal);
      const sr = stage.getBoundingClientRect(), dr = dock.getBoundingClientRect();
      let l = 12, r = W - 12, t = 20, b = dr.top - sr.top - 10;
      if (!narrowMQ.matches) l = mcard.getBoundingClientRect().right - sr.left + 16;
      const fw = Math.max(r - l, 120), fh = Math.max(b - t, 120);
      // Frame a bit inside each zone's extent so the models read large; the overview keeps more of its margin
      const [ew, eh] = STOPS[i].ext.map((v) => v * (i ? 0.74 : 0.88));
      const zoom = Math.min(fw / ew, fh / eh) * S / H;
      const u = S / (H * zoom);
      const dx = (l + r) / 2 - W / 2, dy = (t + b) / 2 - H / 2;
      const target = new T.Vector3(...STOPS[i].focus).addScaledVector(right, -dx * u).addScaledVector(up, dy * u);
      cam.zoomGoal = null;
      if (instant) { cam.target.copy(target); cam.zoom = zoom; tween = null; }
      else tween = { from: cam.target.clone(), fromZ: cam.zoom, to: target, toZ: zoom, t0: performance.now(), dur: 1700 };
    };
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    function resize() {
      W = stage.clientWidth; H = stage.clientHeight;
      renderer.setSize(W, H);
      camera.left = -S * W / H / 2; camera.right = S * W / H / 2; camera.top = S / 2; camera.bottom = -S / 2;
      camera.updateProjectionMatrix();
      frameStop(current, true);
    }
    new ResizeObserver(resize).observe(stage);
    resize();

    // ---------- Map controls ----------
    // Drag to move; Ctrl + scroll (or plain scroll once the map is engaged) and pinch to zoom; right-drag, Shift-drag or a
    // two-finger twist to rotate (vertical right-drag tilts). Plain scroll is left to the page until the map has been
    // touched, so the full-height model never traps someone scrolling past it.
    const ZMIN = 0.16, ZMAX = 10, EL_MIN = 0.32, EL_MAX = 1.2, REACH = 360;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const flat = new T.Vector3();
    function panBy(dx, dy) {
      const u = S / (H * cam.zoom);
      flat.set(fwd.x, 0, fwd.z).normalize();
      cam.target.addScaledVector(right, -dx * u).addScaledVector(flat, dy * u / Math.sin(cam.el));
      cam.target.x = clamp(cam.target.x, -REACH, REACH); cam.target.z = clamp(cam.target.z, -REACH, REACH);
    }
    // Zoom keeping the ground under (sx, sy), measured from the stage centre, where it was
    function zoomAt(f, sx = 0, sy = 0) {
      const z0 = cam.zoom, z1 = clamp(z0 * f, ZMIN, ZMAX), du = S / H * (1 / z0 - 1 / z1);
      flat.set(fwd.x, 0, fwd.z).normalize();
      cam.target.addScaledVector(right, sx * du).addScaledVector(flat, -sy * du / Math.sin(cam.el));
      cam.zoom = cam.zoomGoal = z1;
    }
    const rotateBy = (d) => { cam.az += d; cam.azGoal = cam.az; };
    const tiltBy = (d) => { cam.el = cam.elGoal = clamp(cam.el + d, EL_MIN, EL_MAX); };
    const cv = renderer.domElement;
    cv.style.touchAction = 'pan-y';
    const ptrs = new Map();
    let mode = null, engaged = false, pair = null, hintTimer = 0;
    const hintEl = $('#map-hint');
    const hint = () => { hintEl.classList.add('show'); clearTimeout(hintTimer); hintTimer = setTimeout(() => hintEl.classList.remove('show'), 1600); };
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      engaged = true; tween = null; stage.classList.add('grabbing');
      mode = ptrs.size > 1 ? 'pinch' : e.button === 2 || e.shiftKey ? 'rotate' : 'pan';
      pair = null;
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (mode === 'pinch' && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], r = stage.getBoundingClientRect();
        const now2 = { d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        if (pair) {
          zoomAt(now2.d / pair.d, now2.mx - r.left - W / 2, now2.my - r.top - H / 2);
          rotateBy(now2.ang - pair.ang);
          panBy(now2.mx - pair.mx, now2.my - pair.my);
        }
        pair = now2;
      } else if (mode === 'rotate') { rotateBy(-dx * 0.008); tiltBy(dy * 0.004); }
      else if (mode === 'pan') panBy(dx, dy);
    });
    const release = (e) => {
      ptrs.delete(e.pointerId);
      pair = null;
      if (!ptrs.size) { mode = null; stage.classList.remove('grabbing'); }
      else if (mode === 'pinch') mode = 'pan';
    };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    stage.addEventListener('pointerleave', () => { engaged = false; });
    cv.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey && !engaged) { hint(); return; }
      e.preventDefault();
      tween = null;
      const r = stage.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left - W / 2, e.clientY - r.top - H / 2);
    }, { passive: false });
    const mapDo = (act) => {
      tween = null;
      if (act === 'in') cam.zoomGoal = clamp(cam.zoom * 1.5, ZMIN, ZMAX);
      else if (act === 'out') cam.zoomGoal = clamp(cam.zoom / 1.5, ZMIN, ZMAX);
      else if (act === 'left') cam.azGoal += Math.PI / 4;
      else if (act === 'right') cam.azGoal -= Math.PI / 4;
      else if (act === 'reset') {
        // Turn back the short way, untilt, and re-frame the current system
        cam.azGoal = 0; cam.az = Math.atan2(Math.sin(cam.az), Math.cos(cam.az)); cam.elGoal = ELEV;
        frameStop(current, reduceMQ.matches);
      }
    };
    document.querySelectorAll('[data-map]').forEach((b) => b.addEventListener('click', () => mapDo(b.dataset.map)));
    mapAction = (key) => {
      const act = { '+': 'in', '=': 'in', '-': 'out', _: 'out', q: 'left', Q: 'left', e: 'right', E: 'right', 0: 'reset' }[key];
      if (act) mapDo(act);
      return !!act;
    };
    let shadowExt = 110;

    // Fleet GeoJSON from the live glider positions (model space mapped near Earth Port's longitude)
    fleetFeatures = () => gliders.map((gl) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [+(-140.2 + gl.g.position.x * 0.05).toFixed(4), +(1.8 - gl.g.position.z * 0.05).toFixed(4)] },
      properties: { id: gl.id, mach: +(6 + Math.random() * 0.4).toFixed(2), altitude_m: Math.round(gl.g.position.y / SY * 30000), dispersing: gl.seeding }
    }));

    // ---------- Simulation ----------
    const tan = new T.Vector3(), ahead = new T.Vector3();
    let visible = true, last = performance.now(), feedTimer = 0;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

    function step(dt, now) {
      // Shipyard: the gantry moves between spots on the ship, lowers a plate, holds while it's welded, lifts again
      if (HARBOR && HARBOR.yard) {
        const y = HARBOR.yard, c = (now / 1000) % 16, spot = Math.floor(now / 16000) % 3;
        const SPOTS = [[-5.5, 0.6], [4, -0.6], [-2.5, -0.4]], [su, sv] = SPOTS[spot], [pu, pv] = SPOTS[(spot + 2) % 3];
        const mv = smooth(Math.min(1, c / 4));                          // 0-4 s travel from the last spot
        const drop = c < 4 ? 0 : c < 6.5 ? smooth((c - 4) / 2.5) : c < 11 ? 1 : c < 13.5 ? 1 - smooth((c - 11) / 2.5) : 0;
        const u = y.um + pu + (su - pu) * mv, v = pv + (sv - pv) * mv, hookY = y.top - 0.3 - drop * 1.5;
        y.gBridge.position.x = u; y.gTrolley.position.x = u; y.gTrolley.position.z = v;
        y.gCable.position.set(u, (y.top + hookY) / 2, v); y.gCable.scale.y = Math.max(0.05, y.top - hookY);
        y.gLoad.position.set(u, hookY - 0.15, v);
        const welding = c > 6.5 && c < 11;
        y.sparks.forEach((sp, i) => { sp.visible = welding ? Math.random() < 0.6 : (now / 300 + i) % 3 < 0.4; });
      }
      // Dock cranes swing between the container stacks and the ships, hoisting and lowering loads
      dockCranes.forEach((cr) => {
        const c = (now / 1000 + cr.ph) % 16, k = (x) => smooth(Math.min(1, Math.max(0, x)));
        const turn = c < 4 ? 0 : c < 8 ? k((c - 4) / 4) : c < 12 ? 1 : k(1 - (c - 12) / 4);
        cr.jib.rotation.y = cr.a0 + (cr.a1 - cr.a0) * turn;
        const low = c < 2 ? k(c / 2) : c < 4 ? k(1 - (c - 2) / 2) : c >= 8 && c < 10 ? k((c - 8) / 2) : c >= 10 && c < 12 ? k(1 - (c - 10) / 2) : 0;
        const hook = -0.4 - low * (cr.h - 1.6);   // hook height below the jib, down to the deck stacks
        cr.cable.position.y = (0.2 + hook) / 2; cr.cable.scale.y = 0.2 - hook;
        cr.load.position.y = hook - 0.35;
        cr.load.visible = c >= 1 && c < 10;   // picked up at the stack, set down on the ship
      });
      // City traffic    // City traffic
      trains.forEach((tr) => {
        tr.a += dt * 0.22 * tr.dir;
        tr.cars.forEach((c, i) => {
          const a = tr.a - i * 0.075 * tr.dir;
          c.position.set(P.x + Math.cos(a) * 22.2, HUB_TOP + 0.35, P.z + Math.sin(a) * 22.2);
          c.rotation.y = -a + Math.PI / 2;
        });
      });
      trams.forEach((tm) => {
        const u = 24 + (tm.L - 33) * (0.5 - 0.5 * Math.cos(now / 5200 + tm.ph));
        tm.cars.forEach((c, i) => c.position.set(u + i * 1.6, ARM_TOP + 0.35, 0));
      });
      ferries.forEach((f) => {
        const k = now / 9000 + f.ph, r = 27 + 34 * (0.5 - 0.5 * Math.cos(k)), out = Math.sin(k) > 0;
        f.g.position.set(P.x + Math.cos(f.a) * r, 0.15, P.z + Math.sin(f.a) * r);
        f.g.rotation.y = Math.atan2(Math.cos(f.a), Math.sin(f.a)) + (out ? 0 : Math.PI);
      });
      cityDrones.forEach((d, i) => {
        d.rotors.forEach((r) => { r.rotation.y += dt * 40; });
        d.light.visible = (now / 400 + i) % 2 < 1;   // blinking beacon
        if (d.hold > 0) { d.hold -= dt; d.m.position.y = d.from.y + Math.sin(now / 300 + i) * 0.15; return; }
        d.t += dt / d.dur;
        if (d.t >= 1) { d.from.copy(d.to); d.to = droneWaypoint(); d.t = 0; d.hold = 1 + Math.random() * 2; d.dur = 4 + Math.random() * 4; return; }
        const e = d.t * d.t * (3 - 2 * d.t);
        d.m.position.lerpVectors(d.from, d.to, e);
        d.m.position.y += Math.sin(Math.PI * d.t) * 2;   // a little lift between stops
        d.m.rotation.y = Math.atan2(d.to.x - d.from.x, d.to.z - d.from.z);
        d.m.rotation.x = Math.sin(Math.PI * d.t) * 0.25;   // nose down while moving
      });
      // Climbers ride the tether; the lowest ascending one gets the power beam
      let beamTo = null;
      sim.climbUp = 0;
      climbers.forEach((c, k) => {
        c.y += (c.up ? 1 : -1) * dt * 9;
        if (c.up && c.y > TOPY - 4) { c.y = ANCHOR_W + 2; log('SPIRE', `Climber C-${k + 1} handoff at GEO`); }
        if (!c.up && c.y < ANCHOR_W + 2) c.y = TOPY - 4;
        c.m.position.set(P.x + c.off[0], c.y, P.z + c.off[1]);
        if (c.up) { sim.climbUp++; if (!beamTo || c.y < beamTo.y) beamTo = c; }
      });
      if (beamTo) {
        const a = new T.Vector3(...ck(2.6, ANCHOR_TOP + 1.2, -1.2)), b = beamTo.m.position;
        const len = a.distanceTo(b);
        beam.position.copy(a).lerp(b, 0.5);
        beam.scale.set(1, len, 1);
        beam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        M.beam.opacity = 0.35 + Math.sin(now / 90) * 0.15;
      }

      // Gliders fly their loops and seed the island
      sim.airborne = 0;
      gliders.forEach((gl) => {
        const prevT = gl.t, cur = gl.g.position;
        const base = gl.cruise && cur.y > 14 ? gl.cruise : 24;
        let speed = base;
        if (gl.cat && cur.y < 3.2 * CITY_K && cur.x > 25 * CITY_K && Math.abs(cur.z - CAT_Z * CITY_K) < 2.5 * CITY_K) {
          // On the catapult the sled ramps the speed up; on landing the roll-out slows it down
          speed = gl.launching ? 5 + (cur.x / CITY_K - 26) * 2.4 : 4 + (cur.x / CITY_K - 26) * 1.2;
        } else if (!gl.cat && gl.t < gl.tPush) {
          speed = 3 + Math.max(0, SY - 1.6 - cur.y) * 2.8;   // gravity builds speed down the tether and through the bend
        } else if (!gl.cat && gl.t < gl.tBlast) {
          speed = 56 - (56 - base) * (gl.t - gl.tPush) / (gl.tBlast - gl.tPush);   // the push-out, easing into cruise
        }
        if (gl.hold > 0) {
          gl.hold -= dt;
          if (gl.hold <= 0 && Math.random() < 0.5) log(gl.id, 'Released from the rail mount · nose-down drop along the tether');
        } else gl.t = (gl.t + dt * speed / gl.curve.getLength()) % 1;
        if (gl.t < prevT) {
          gl.out = true;
          if (gl.cat) log(gl.id, 'Mag-lev catapult launch · ejected at Mach 1.5 · steep climb');
          else { gl.t = 0; gl.hold = 2.6; }   // docked: hang level on the rail mount through the checks, then drop
        }
        if (!gl.cat) {
          if (gl.hold <= 0 && gl.t >= gl.tFall && gl.t < gl.tPush) laneFx[gl.lane].glow = 1;
          if (prevT < gl.tBend && gl.t >= gl.tBend && Math.random() < 0.35) log(gl.id, 'Tether inductors engaged · J-curve at up to 9.5 G');
          if (prevT < gl.tPush && gl.t >= gl.tPush) laneFx[gl.lane].t0 = now;
        }
        if (prevT < gl.tIgn && gl.t >= gl.tIgn && Math.random() < 0.4) {
          log(gl.id, gl.cat ? 'Stratospheric insertion · cruise corridor reached' : 'Push-out at 26 km · scramjets lit at Mach 3');
        }
        const p = gl.curve.getPointAt(gl.t);
        gl.g.position.copy(p);
        gl.curve.getPointAt((gl.t + 0.004) % 1, ahead);
        if (gl.cat || (gl.hold <= 0 && gl.t >= gl.tPush)) gl.g.lookAt(ahead);
        else if (gl.hold > 0) gl.g.quaternion.slerp(laneQuat(gl.dir, gl.dir, qHang), Math.min(1, dt * 3));
        else {
          // Pitch over from level to nose-down as it falls away from the mount, then follow the J
          laneQuat(gl.dir, gl.curve.getTangentAt(gl.t, tanV), qLane);
          if (gl.t < gl.tFall) gl.g.quaternion.copy(laneQuat(gl.dir, gl.dir, qHang)).slerp(qLane, smooth(gl.t / gl.tFall));
          else gl.g.quaternion.copy(qLane);
        }
        gl.launching = ahead.x > p.x;
        if (p.distanceTo(new T.Vector3(P.x, SY, P.z)) > 9) sim.airborne++;
        const over = inIsland(p.x, p.z) && p.y < 10;
        if (over && !gl.seeding) log(gl.id, 'Canister release over burn scar · 1,000 m');
        if (gl.seeding && !over) gl.out = false;
        if (gl.land) {
          const onStrip = p.y < (ARM_TOP + 1.4) * CITY_K && p.x > 24 * CITY_K && p.x < 63 * CITY_K && Math.abs(p.z - RZ * CITY_K) < 2 * CITY_K;
          if (onStrip && !gl.landed) log(gl.id, 'Runway landing at Earth Port · full servicing');
          gl.landed = onStrip;
        }
        gl.seeding = over;
        const tr = gl.trail;
        tr.acc += dt;
        if (tr.acc > 0.06) {
          tr.acc = 0;
          const j = (tr.i = (tr.i + 1) % TRAIL) * 3;
          // Water-vapor contrail only once the scramjet is lit
          if (gl.out && gl.t > gl.tIgn) { tr.pos[j] = p.x; tr.pos[j + 1] = p.y; tr.pos[j + 2] = p.z; } else tr.pos[j + 1] = -99;
          tr.geo.attributes.position.needsUpdate = true;
        }
        if (over) { gl.acc += dt; while (gl.acc > 0.05) { gl.acc -= 0.05; spawnSeed(p); } }
      });
      laneFx.forEach((f) => {
        f.glow = Math.max(0, f.glow - dt * 1.5);
        f.mat.opacity = 0.07 + f.glow * 0.2; f.lmat.opacity = 0.2 + f.glow * 0.5;
        const k = (now - f.t0) / 700;
        f.ring.visible = k < 1;
        if (k < 1) { f.ring.scale.setScalar(1 + k * 3); f.ring.material.opacity = 0.7 * (1 - k); }
      });
      const cg = gliders.find((g) => g.cat).g.position;
      const onTrack = cg.y < 3.2 * CITY_K && cg.x > 25 * CITY_K && Math.abs(cg.z - CAT_Z * CITY_K) < 2.5 * CITY_K && gliders.find((g) => g.cat).launching;
      sled.position.x = onTrack ? Math.min(cg.x / CITY_K, 58) : 27;   // the sled lives in city units
      let changed = false;
      seeds.forEach((s, i) => {
        if (!s.live) return;
        const o = i * 3;
        s.vy -= 6 * dt;
        seedPos[o] += s.vx * dt; seedPos[o + 1] += s.vy * dt; seedPos[o + 2] += s.vz * dt;
        const t = tileAt(seedPos[o], seedPos[o + 2]);
        if (seedPos[o + 1] <= (t ? t.h : 0) + 0.2) {
          s.live = false; seedPos[o + 1] = -99; sim.seeds++;
          if (t && t.grow === 0 && !t.growing && ++t.hits >= 9) t.growing = true;
        }
      });
      seedGeo.attributes.position.needsUpdate = true;
      tiles.forEach((t, i) => {
        if (!t.growing) return;
        t.grow = Math.min(1, t.grow + dt * 0.6);
        if (t.grow === 1) { t.growing = false; sim.tilesRegrown++; hectares += 140; }
        drawTile(i); changed = true;
      });
      if (changed) {
        tileMesh.instanceMatrix.needsUpdate = true; crownMesh.instanceMatrix.needsUpdate = true; stumpMesh.instanceMatrix.needsUpdate = true;
        if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
      }

      // Harvesters sweep the gyre
      let specksChanged = false;
      cats.forEach((c) => {
        c.t = (c.t + dt * 2.6 / gyre.getLength()) % 1;
        const p = gyre.getPointAt(c.t);
        c.g.position.copy(p);
        gyre.getTangentAt(c.t, tan);
        c.g.rotation.y = Math.atan2(tan.x, tan.z);
        const pulse = 1 + Math.sin(now / 300 + c.t * 20) * 0.25;
        c.v.scale.set(pulse, pulse, pulse);
        specks.forEach((s) => {
          if (s.on && (s.x - p.x) ** 2 + (s.z - p.z) ** 2 < 4.1) {
            s.on = false; s.back = now + 6000 + Math.random() * 8000; sim.plastic++; plastic += 0.4; specksChanged = true;
            if (sim.plastic % 15 === 0) log('SWEEP-0' + (cats.indexOf(c) + 1), `Vortex cycle complete · ${sim.plastic} captures this visit`);
          }
        });
      });
      levState.t = (levState.t + dt * 1.3 / outerGyre.getLength()) % 1;
      const lp = outerGyre.getPointAt(levState.t);
      outerGyre.getTangentAt(levState.t, tan);
      lev.position.set(lp.x, 0.05 + Math.sin(now / 1400) * 0.06, lp.z);
      lev.rotation.y = Math.atan2(tan.x, tan.z);
      lev.updateMatrixWorld();
      netCenter.set(0, 0, -11).applyMatrix4(lev.matrixWorld);
      lev2.position.y = 0.05 + Math.sin(now / 1600) * 0.06;
      // Each harvesting Leviathan flies an aircraft round its circuit and has tenders circling it
      carriers.forEach((c) => {
        c.ship.updateMatrixWorld();
        c.t = (c.t + dt * 9 / CIRCUIT.getLength()) % 1;
        c.ship.localToWorld(cp.copy(CIRCUIT.getPointAt(c.t)));
        c.ship.localToWorld(cn.copy(CIRCUIT.getPointAt((c.t + 0.01) % 1)));
        c.jet.position.copy(cp); c.jet.lookAt(cn);
        c.tenders.forEach((td) => {
          const a = now / 7000 + td.ph;
          c.ship.localToWorld(cp.set(Math.cos(a) * 9, 0.3, Math.sin(a) * 13));
          c.ship.localToWorld(cn.set(Math.cos(a + 0.05) * 9, 0.3, Math.sin(a + 0.05) * 13));
          td.g.position.copy(cp); td.g.lookAt(cn);
        });
      });
      specks.forEach((s) => {
        if (s.on && (s.x - netCenter.x) ** 2 + (s.z - netCenter.z) ** 2 < 14) {
          s.on = false; s.back = now + 6000 + Math.random() * 8000; sim.plastic++; plastic += 1.2; specksChanged = true;
          if (sim.plastic % 20 === 0) log('LEVIATHAN-01', 'Net haul to forge · drone parts printed');
        }
      });
      drones.forEach((d) => {
        const a = now / 2600 + d.k * Math.PI / 2, r = 4.8 + Math.sin(now / 1800 + d.k) * 2.2;
        const x = lp.x + Math.cos(a) * r, z = lp.z + Math.sin(a) * r;
        d.m.position.set(x, -1.3 - Math.sin(now / 1800 + d.k) * 1, z);
        d.m.rotation.y = -a;
      });
      specks.forEach((s) => { if (!s.on && now > s.back) { placeSpeck(s); specksChanged = true; } });
      if (specksChanged) drawSpecks();

      // Reef submersibles restore coral they pass
      let coralChanged = false;
      subs.forEach((s) => {
        // Patrol loops sized to the reef shelf
        const a = now / 4600 * (s.k % 2 ? -1 : 1) + s.k * 2, rx = 12 - s.k * 3.5, rz = 8.5 - s.k * 2.2;
        const x = R0.x + Math.cos(a) * rx, z = R0.z + Math.sin(a * 1.3) * rz;
        s.m.position.set(x, reefY + 1.4 + Math.sin(now / 700 + s.k) * 0.2, z);
        s.m.lookAt(R0.x + Math.cos(a + 0.05) * rx, s.m.position.y, R0.z + Math.sin((a + 0.05) * 1.3) * rz);
        corals.forEach((c) => {
          if (c.life < 1 && (c.x - x) ** 2 + (c.z - z) ** 2 < 3) {
            const was = c.life; c.life = Math.min(1, c.life + dt * 0.8); coralChanged = true;
            if (was < 1 && c.life === 1) sim.coral++;
          }
        });
      });
      if (coralChanged) drawCoral();
      fish.forEach((f, i) => {
        const a = now / (f.school ? 3800 : 5200) * (f.school ? -1 : 1) + f.off * 0.15, r = (f.school ? 6 : 9) + f.dr;
        const cx = R0.x + (f.school ? 4 : -3), cz = R0.z + (f.school ? -2 : 2);
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * 0.7;
        q.setFromAxisAngle(UP, Math.atan2(-Math.sin(a), Math.cos(a) * 0.7) + (f.school ? Math.PI : 0));   // nose along the swim
        mtx.compose(pv.set(x, reefY + 2.2 + f.dy + Math.sin(now / 500 + f.off) * 0.1, z), q, sc.set(1, 1, 1));
        fishMesh.setMatrixAt(i, mtx);
      });
      fishMesh.instanceMatrix.needsUpdate = true;

      // Abyss mission: the manned sub shuttles between the moon pool and the vent; the vent vents
      const dive = (1 - Math.cos(now / 5200)) / 2;
      manned.position.lerpVectors(moonPool, ventTop, dive);
      manned.rotation.y = Math.atan2(ventTop.x - moonPool.x, ventTop.z - moonPool.z);
      if (dive > 0.98 && !diveLogged) { log('LEVIATHAN-12', 'Manned submersible at vent · samples logged'); diveLogged = true; }
      if (dive < 0.5) diveLogged = false;
      for (let i = 0; i < BUB; i++) {
        const ph = (bubPhase[i] + now / 6000) % 1;
        bubPos[i * 3] = VENT.x + Math.sin(i * 7.1 + ph * 6) * 0.5;
        bubPos[i * 3 + 1] = -DEPTH + 2.6 + ph * (DEPTH - 2.8);
        bubPos[i * 3 + 2] = VENT.z + Math.cos(i * 3.7 + ph * 6) * 0.5;
      }
      bubGeo.attributes.position.needsUpdate = true;

      // Apex Station: the asteroid turns, forge panels stream to L1, sweepers clear debris
      rock.rotation.y += dt * 0.05;
      labRing.rotation.z += dt * 0.04;
      panels.forEach((pn) => {
        pn.t += dt * 0.05;
        if (pn.t >= 1) { pn.t -= 1; sim.panels++; }
        pn.m.position.lerpVectors(FORGE_A, FORGE_B, pn.t);
        pn.m.position.y += Math.sin(pn.t * Math.PI) * 8;
        pn.m.rotation.y += dt * 0.5;
      });
      debris.forEach((d) => {
        if (!d.on) { if (now > d.back) { d.on = true; d.m.visible = true; } else return; }
        d.a += d.w * dt;
        d.m.position.set(AP.x + Math.cos(d.a) * d.r, AP.y + d.y, AP.z + Math.sin(d.a) * d.r);
        d.m.rotation.x += dt * 0.7;
      });
      sweepers.forEach((sw) => {
        sw.a += sw.w * dt;
        const r = sw.r + Math.sin(now / 2400 + sw.a) * 6, y = sw.y + Math.sin(now / 1900 + sw.r) * 4;
        sw.m.position.set(AP.x + Math.cos(sw.a) * r, AP.y + y, AP.z + Math.sin(sw.a) * r);
        sw.m.rotation.y = -sw.a;
        debris.forEach((d) => {
          if (d.on && d.m.position.distanceToSquared(sw.m.position) < 9) {
            d.on = false; d.m.visible = false; d.back = now + 9000 + Math.random() * 9000; sim.debris++;
            if (sim.debris % 5 === 0) log('KESSLER', `Sweeper ${sw.id} captured debris · fragment sent to the melt`);
          }
        });
      });

      // Wave floats, parasol trim
      floats.forEach((f) => { f.position.y = 0.15 + Math.sin(now / 600 + f.userData.ph) * 0.18; f.rotation.y = Math.sin(now / 900 + f.userData.ph) * 0.1; });
      sim.tilt = Math.sin(now / 7000) * 0.004;
      parasol.rotation.z = sim.tilt * 6;
      auraRing.scale.setScalar(1 + Math.sin(now / 500) * 0.05);

      feedTimer += dt;
      if (feedTimer > 6) {
        feedTimer = 0;
        const lines = [
          ['AURA', `Forecast cycle ${fmt(sim.forecast)} · seeder windows updated`],
          ['L1', `Parasol trim ${sim.tilt >= 0 ? '+' : '−'}${Math.abs(sim.tilt).toFixed(3)}° · Council setpoint held`],
          ['REEF', `Polyp weld pass · ${sim.coral} colonies restored this visit`],
          ['PORT', 'Foundry bay 4 · shade panels printed · microwave intake steady'],
          ['MIDWAY', 'Rail mounts armed · mag-rail polarity aligned · corridor clear'],
          ['APEX', `Parasol panel ${String(412 + sim.panels).padStart(4, '0')} deployed toward L1 · ore processing nominal`]
        ];
        log(...lines[Math.floor(Math.random() * lines.length)]);
      }
    }

    const pv2 = new T.Vector3();
    function place(el, at) {
      pv2.set(...at).project(camera);
      const x = (pv2.x + 1) / 2 * W, y = (1 - pv2.y) / 2 * H;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.visibility = x < -60 || x > W + 20 || y < -30 || y > H + 20 ? 'hidden' : 'visible';
    }

    function frame(now) {
      // The first rAF timestamp can predate `last`; a negative step would push route positions below 0
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      requestAnimationFrame(frame);
      if (!visible) return;
      const still = reduceMQ.matches;
      if (tween) {
        const k = Math.min((now - tween.t0) / tween.dur, 1), e = ease(k);
        cam.target.lerpVectors(tween.from, tween.to, e);
        cam.zoom = (tween.fromZ + (tween.toZ - tween.fromZ) * e) * (1 - Math.sin(Math.PI * k) * 0.2);
        if (k >= 1) tween = null;
      }
      const ease8 = still ? 1 : Math.min(1, dt * 8);
      if (!mode) {
        cam.az += (cam.azGoal - cam.az) * ease8;
        cam.el += (cam.elGoal - cam.el) * ease8;
        if (cam.zoomGoal && !tween) cam.zoom += (cam.zoomGoal - cam.zoom) * ease8;
      }
      basis(cam.az, cam.el);
      const ext = clamp(S / cam.zoom * W / H * 0.6, 110, 520);
      if (Math.abs(ext - shadowExt) > 8) {
        shadowExt = ext;
        Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext });
        sun.shadow.camera.updateProjectionMatrix();
      }
      const a = AZ + cam.az + (still || paused || mode ? 0 : Math.sin(now / 9000) * 0.04);
      camera.position.set(cam.target.x + Math.cos(cam.el) * Math.sin(a) * 300, cam.target.y + Math.sin(cam.el) * 300, cam.target.z + Math.cos(cam.el) * Math.cos(a) * 300);
      camera.lookAt(cam.target);
      hills.visible = cam.target.y < 150;   // from orbit they'd sit huge and blurry behind the station
      sun.position.copy(cam.target).add(SUN_OFF);
      sun.target.position.copy(cam.target);
      sun.target.updateMatrixWorld();
      camera.zoom = cam.zoom;
      camera.updateProjectionMatrix();
      if (!still && !paused) step(dt, now);
      renderer.render(scene, camera);
      pins.forEach((b, i) => { if (b) { place(b, STOPS[i].pin); b.style.transform += ' translate(-13px, -13px)'; } });
      // Labels only while the view is close enough to read them; zoomed right out they'd pile up over the city
      const tagsOn = S / cam.zoom < 150;
      TAGS.forEach((t) => { t.el.style.visibility = tagsOn ? '' : 'hidden'; if (tagsOn) place(t.el, t.at); });
    }
    // Deep links from the other pages: model.html#harvest opens that stop
    const linked = STOPS.findIndex((s) => '#' + s.id === location.hash);
    if (linked > 0) go(linked);
    if (reduceMQ.matches) step(0, performance.now());
    requestAnimationFrame(frame);


  }
  if ($('#stage')) initModel();

  // ---------- Vehicle showcase (vehicles.html): each vehicle alone on a turntable, built by the model's own code ----------
  function initShowcase() {
    const host = $('#showcase');
    if (!window.THREE) { host.querySelector('.sc-fallback').hidden = false; return; }
    const T = THREE;
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.prepend(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color(0xe3e8ee);
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 200);
    scene.add(new T.HemisphereLight(0xffffff, 0xaab4c0, 0.95));
    const sun = new T.DirectionalLight(0xffffff, 0.7);
    sun.position.set(-6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    scene.add(sun);
    const floor = new T.Mesh(new T.CircleGeometry(5.6, 64), new T.MeshStandardMaterial({ color: 0xd5dde6, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const rim = new T.Mesh(new T.RingGeometry(5.5, 5.6, 64), new T.MeshBasicMaterial({ color: 0x0284c7 }));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005; scene.add(rim);

    const M = {};
    const COL = { ceramic: 0xf1f4f8, trim: 0xc2cbd6, steel: 0x7b8899, accent: 0x0ea5e9, glass: 0x7c90a6, park: 0xa9cc93, crown: 0x86b97f };
    Object.entries(COL).forEach(([k, c]) => { M[k] = new T.MeshStandardMaterial({ color: c, roughness: k === 'glass' ? 0.3 : 0.8, metalness: k === 'steel' ? 0.25 : 0 }); });
    M.glow = new T.MeshBasicMaterial({ color: 0x7dd3fc });
    M.vortex = new T.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false });
    const lineMat = new T.LineBasicMaterial({ color: 0x0369a1 });
    const shade = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
    const world = new T.Group();
    function box(w, h, d, mat, x, y, z, parent = world) {
      const m = shade(new T.Mesh(new T.BoxGeometry(w, h, d), mat));
      m.position.set(x, y + h / 2, z); parent.add(m); return m;
    }
    function cyl(rt, rb, h, mat, x, y, z, seg = 20, parent = world) {
      const m = shade(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat));
      m.position.set(x, y + h / 2, z); parent.add(m); return m;
    }

  function makeClimber(ox, oz) {
    const g = new T.Group();
    box(1.4, 2.4, 1.4, M.accent, 0, -1.2, 0, g);
    box(1.44, 0.4, 1.44, M.glass, 0, 0.3, 0, g);
    box(1.5, 0.2, 1.5, M.ceramic, 0, 1.2, 0, g);
    box(1.5, 0.2, 1.5, M.ceramic, 0, -1.4, 0, g);
    [-0.8, 0.6].forEach((y) => box(0.6, 0.3, 0.6, M.steel, -Math.sign(ox) * 0.95, y, -Math.sign(oz) * 0.95, g));
    const dish = cyl(0.5, 0.2, 0.25, M.trim, 0, 1.4, 0, 12, g);
    dish.rotation.z = -0.5;
    world.add(g); return g;
  }
  const WING = [[0, 1.6], [2.6, -0.8], [2.5, -1.15], [0.8, -0.85], [0, -1.25], [-0.8, -0.85], [-2.5, -1.15], [-2.6, -0.8]];
  const wingGeo = new T.ExtrudeGeometry(new T.Shape(WING.map(([x, z]) => new T.Vector2(x, z))), { depth: 0.08, bevelEnabled: false });
  wingGeo.rotateX(Math.PI / 2); wingGeo.translate(0, 0.04, 0);
  const spineGeo = new T.CylinderGeometry(0.17, 0.3, 3.2, 10); spineGeo.rotateX(Math.PI / 2);
  const noseGeo = new T.ConeGeometry(0.17, 0.8, 10); noseGeo.rotateX(Math.PI / 2);
  function edge(x0, z0, x1, z1, mat, y, parent) {
    const m = new T.Mesh(new T.BoxGeometry(Math.hypot(x1 - x0, z1 - z0), 0.05, 0.1), mat);
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); parent.add(m);
  }
  const podGeo = new T.CylinderGeometry(0.13, 0.13, 1, 8); podGeo.rotateX(Math.PI / 2);
  function makeGlider(scale = 0.7) {
    const g = new T.Group();
    g.add(shade(new T.Mesh(wingGeo, M.accent)));
    const spine = shade(new T.Mesh(spineGeo, M.ceramic)); spine.position.set(0, 0.12, 0.05); g.add(spine);
    const nose = shade(new T.Mesh(noseGeo, M.ceramic)); nose.position.set(0, 0.12, 2.05); g.add(nose);
    box(0.62, 0.22, 1.9, M.steel, 0, -0.26, -0.15, g);
    box(0.5, 0.14, 0.06, M.glass, 0, -0.22, 0.82, g);
    [-1, 1].forEach((sx) => {
      edge(0.25 * sx, 1.35, 2.55 * sx, -0.78, M.glow, 0.06, g);
      const fin = box(0.07, 0.75, 0.75, M.ceramic, 0.42 * sx, 0.1, -0.95, g);
      fin.rotation.z = -0.35 * sx;
      const pod = shade(new T.Mesh(podGeo, M.ceramic)); pod.position.set(1.15 * sx, -0.12, -0.25); g.add(pod);
      box(0.05, 0.4, 0.45, M.ceramic, 2.52 * sx, 0.04, -0.98, g).rotation.z = -0.25 * sx;
      box(0.12, 0.08, 0.12, M.glow, 2.58 * sx, 0.05, -0.78, g);
    });
    g.scale.setScalar(scale);
    world.add(g); return g;
  }
  function hullGeo(W, Lh, Hh) {
    const b = Lh / 2, t = b - Math.min(Lh * 0.2, W * 1.4);
    const g = new T.ExtrudeGeometry(new T.Shape([[-W / 2, -b], [W / 2, -b], [W / 2, t], [0, b], [-W / 2, t]].map(([x, y]) => new T.Vector2(x, y))), { depth: Hh, bevelEnabled: false });
    g.rotateX(Math.PI / 2); g.translate(0, Hh, 0);
    return g;
  }
  const hull = (W, Lh, Hh, mat, x, y, z, parent) => { const m = shade(new T.Mesh(hullGeo(W, Lh, Hh), mat)); m.position.set(x, y, z); parent.add(m); return m; };
  // Sweep drone: a small catamaran with pointed twin hulls, a solar deck, a sensor mast and an acoustic vortex ring
  function makeCat() {
    const g = new T.Group();
    [-0.9, 0.9].forEach((x) => { hull(0.6, 3.8, 0.6, M.accent, x, 0, 0, g); box(0.62, 0.12, 3, M.ceramic, x, 0.6, -0.3, g); });
    box(2.4, 0.3, 2.2, M.ceramic, 0, 0.6, -0.2, g);
    box(2.2, 0.08, 1.8, M.glass, 0, 0.92, -0.2, g).rotation.x = 0.15;
    cyl(0.04, 0.04, 1, M.steel, 0, 0.9, 0.8, 5, g);
    box(0.16, 0.12, 0.16, M.glow, 0, 1.9, 0.8, g);
    const v = new T.Mesh(new T.RingGeometry(1.6, 2, 32), M.vortex);
    v.rotation.x = -Math.PI / 2; v.position.y = -0.3; g.add(v);
    g.scale.setScalar(0.72);
    world.add(g); return { g, v };
  }
  const lev = new T.Group();
  hull(2.6, 15, 1.3, M.accent, 0, -0.5, 0, lev);
  hull(1, 10, 0.9, M.accent, -4.2, -0.4, -0.5, lev);
  hull(1, 10, 0.9, M.accent, 4.2, -0.4, -0.5, lev);
  // Drone pads on the aft deck, where the hive launches and recharges its sweep drones
  [[1.5, -3.2], [1.5, 0.3], [-1.6, 0.3]].forEach(([x, z]) => { cyl(0.6, 0.6, 0.05, M.trim, x, 1.15, z, 20, lev); cyl(0.62, 0.62, 0.03, M.glow, x, 1.2, z, 20, lev); });
  // Side decks over the outriggers make the top one broad platform, a small city at sea
  [-1, 1].forEach((sx) => box(2.6, 0.3, 11, M.ceramic, sx * 3.85, 0.85, 0.3, lev));
  // Starboard: a flight deck, flown like a carrier's, with parked aircraft and a small control island
  box(2.5, 0.04, 10.8, M.steel, 3.85, 1.15, 0.3, lev);
  for (let z = -4.6; z < 5.6; z += 1.4) box(0.12, 0.02, 0.6, M.ceramic, 3.85, 1.19, z, lev);
  box(0.5, 0.9, 1.2, M.ceramic, 2.85, 1.15, -0.9, lev);
  box(0.54, 0.3, 1.24, M.glass, 2.85, 1.75, -0.9, lev);
  function makeJet(parent) {
    const j = new T.Group();
    box(0.32, 0.22, 1.5, M.ceramic, 0, 0, 0, j);
    const nose = shade(new T.Mesh(new T.ConeGeometry(0.16, 0.5, 6), M.ceramic)); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.11, 1); j.add(nose);
    box(1.3, 0.05, 0.45, M.accent, 0, 0.08, -0.1, j);
    [-0.14, 0.14].forEach((x) => box(0.04, 0.35, 0.3, M.ceramic, x, 0.2, -0.6, j).rotation.z = x * 2);
    parent.add(j); return j;
  }
  // A carrier jet is about a sixteenth of its ship's length
  [[4.5, -3.6], [4.5, -2.6], [3.4, 4.6], [3.4, 3.8]].forEach(([x, z]) => { const j = makeJet(lev); j.scale.setScalar(0.5); j.position.set(x, 1.19, z); j.rotation.y = 0.6; });
  // Port: the campus. Habitat blocks with lit windows and green roofs, a slim tower, gardens and trees.
  [-3.8, 2.6].forEach((z) => {
    box(1.8, 1.4, 2.2, M.ceramic, -3.85, 1.15, z, lev);
    box(1.84, 0.25, 2.24, M.glass, -3.85, 1.95, z, lev);
    box(0.04, 0.14, 1.8, M.glow, -4.77, 1.6, z, lev);
    box(1.6, 0.06, 2, M.park, -3.85, 2.55, z, lev);
  });
  box(1.2, 3, 1.2, M.ceramic, -3.85, 1.15, -0.6, lev);
  box(1.24, 0.3, 1.24, M.glass, -3.85, 3.3, -0.6, lev);
  box(0.04, 1.6, 0.14, M.glow, -4.46, 1.9, -0.6, lev);
  box(2.4, 0.04, 1.6, M.park, -3.85, 1.15, 4.8, lev);
  [[-3.3, 4.7], [-4.4, 5], [-3.4, 0.9], [-4.4, 0.8], [-3.3, -2]].forEach(([x, z]) => {
    cyl(0.05, 0.07, 0.5, M.trim, x, 1.2, z, 5, lev);
    const crown = shade(new T.Mesh(new T.SphereGeometry(0.38, 8, 6), M.crown)); crown.position.set(x, 1.95, z); lev.add(crown);
  });
  [-3.5, 0.5, 4].forEach((z) => box(9.4, 0.3, 0.8, M.ceramic, 0, 0.45, z, lev));
  box(5, 0.35, 11.5, M.ceramic, 0, 0.8, 0.3, lev);
  box(3.2, 2.2, 4, M.ceramic, 0, 1.15, 3, lev);
  box(3.3, 0.6, 4.1, M.glass, 0, 2.6, 3, lev);
  box(2.6, 0.5, 3, M.ceramic, 0, 3.2, 3.2, lev);
  box(1.8, 1.2, 1.8, M.trim, 0, 1.15, -3.2, lev);
  cyl(0.25, 0.3, 1.6, M.steel, 0.5, 2.35, -3.4, 8, lev);
  box(2.2, 1.2, 0.2, M.glass, 0, -0.1, -7.6, lev);
  cyl(0.9, 0.9, 0.06, M.glass, 0, 1.15, -1.2, 20, lev);
  [[-1.8, -0.2], [1.8, -1.6]].forEach(([x, z]) => {
    box(0.12, 4.2, 0.12, M.steel, x, 1.15, z, lev);
    const sail = box(0.08, 2.4, 2.8, M.glass, x, 2.7, z, lev);
    sail.rotation.y = 0.35;
  });
  [-1.32, 1.32].forEach((x) => box(0.05, 0.28, 12, M.glass, x, -0.05, 0.2, lev));
  [-4.72, 4.72].forEach((x) => box(0.05, 0.22, 8, M.glass, x, -0.1, -0.5, lev));
  box(0.16, 2.2, 0.16, M.steel, 0, 3.7, 3.6, lev);
  box(1.6, 0.12, 0.3, M.trim, 0, 5.2, 3.6, lev);
  cyl(0.35, 0.35, 0.22, M.ceramic, 0, 5.9, 3.6, 12, lev);
  cyl(0.18, 0.22, 1.4, M.trim, 1.9, 1.15, -5, 8, lev);
  const jib = box(0.18, 0.18, 3.4, M.trim, 1.9, 2.45, -6.2, lev); jib.rotation.x = -0.35;
  [-3.2, -4.6].forEach((z) => box(1.4, 0.06, 1.1, M.glass, -1.75, 1.15, z, lev));
  const netPts = [];
  const arc = Array.from({ length: 13 }, (_, k) => {
    const a = Math.PI * k / 12;
    return new T.Vector3(Math.cos(a) * 6, 0.12, -11.5 - Math.sin(a) * 4);
  });
  netPts.push(new T.Vector3(-4.2, 0.12, -5.5), arc[12], new T.Vector3(4.2, 0.12, -5.5), arc[0]);
  for (let k = 0; k < 12; k++) netPts.push(arc[k], arc[k + 1]);
  for (let k = 1; k < 12; k += 2) netPts.push(arc[k], new T.Vector3(0, 0.12, -7.6));
  lev.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(netPts), lineMat));

    // The few small craft that the model builds inline
    function makeHarvestDrone() {
      const m = new T.Group();
      const body = shade(new T.Mesh(new T.SphereGeometry(0.4, 16, 10), M.accent)); body.scale.set(0.8, 0.7, 2); m.add(body);
      box(0.06, 0.5, 0.4, M.ceramic, 0, -0.25, -0.7, m);
      box(0.9, 0.06, 0.35, M.ceramic, 0, -0.03, -0.7, m);
      box(0.2, 0.14, 0.08, M.glow, 0, 0.05, 0.8, m);
      return m;
    }
    function makeReefDrone() {
      const m = new T.Group();
      const hullM = shade(new T.Mesh(new T.SphereGeometry(0.75, 16, 12), M.accent)); hullM.scale.set(1, 0.8, 2); m.add(hullM);
      const win = shade(new T.Mesh(new T.SphereGeometry(0.4, 12, 8), M.glass)); win.position.set(0, 0.15, 1.15); m.add(win);
      box(0.08, 0.7, 0.6, M.ceramic, 0, 0, -1.3, m);
      box(1.4, 0.08, 0.5, M.ceramic, 0, -0.04, -1.25, m);
      const prop = new T.Mesh(new T.TorusGeometry(0.32, 0.06, 6, 16), M.steel); prop.position.z = -1.65; m.add(prop);
      box(0.12, 0.12, 0.5, M.steel, 0, -0.45, 1.3, m);
      box(0.18, 0.18, 0.18, M.glow, 0, -0.5, 1.6, m);
      return m;
    }
    function makeQuad() {
      const m = new T.Group();
      box(0.55, 0.2, 0.55, M.ceramic, 0, -0.1, 0, m);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        box(0.95, 0.07, 0.1, M.trim, sx * 0.34, 0, sz * 0.34, m).rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4;
        const r = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.04, 16), M.accent); r.position.set(sx * 0.68, 0.08, sz * 0.68); m.add(r);
      });
      box(0.14, 0.08, 0.14, M.glow, 0, 0.1, 0, m);
      box(0.4, 0.34, 0.4, M.trim, 0, -0.62, 0, m);
      return m;
    }

    // Each vehicle, sized to fill the stand; flying craft hover above it
    const fit = (o, fly) => {
      const bb = new T.Box3().setFromObject(o), size = bb.getSize(new T.Vector3());
      const k = 7.4 / Math.max(size.x, size.z, size.y * 1.6);
      o.scale.multiplyScalar(k);
      const b2 = new T.Box3().setFromObject(o), c = b2.getCenter(new T.Vector3());
      o.position.x -= c.x; o.position.z -= c.z; o.position.y += (fly ? 1.4 : 0.02) - b2.min.y;
      const holder = new T.Group(); holder.add(o); holder.visible = false; scene.add(holder);
      return holder;
    };
    const take = (o) => { world.remove(o); return o; };
    const VEH = [
      { id: 'angel', name: 'Angel-class glider', kind: 'Seeding glider · ~50 m', fly: true, make: () => take(makeGlider(1)),
        blurb: 'Hangs under the Stratosphere Port, drops nose-down along the tether, and is bent into level flight by its magnets. Cruises at Mach 6, releases seed canisters 1,000 m over burned land, and glides home on sunlight.',
        parts: [['Spine and nose', 'Ceramic-white composite'], ['Wings', 'Swept metamaterial solar wings for the glide home'], ['Leading edges', 'Bio-luminescent skin, pressurized before release'], ['Belly frame', 'Bio-metallic frame the tether inductors push on'], ['Intake', 'Ventral scramjet intake, lights at Mach 3'], ['Fins', 'Twin canted tail fins'], ['Pods', 'Seed canisters, released at 1,000 m'], ['Wingtips', 'Upturned winglets with lights']] },
      { id: 'leviathan', name: 'Leviathan-class harvester', kind: 'Ocean harvester · ~660 m', make: () => lev,
        blurb: 'A trimaran twice the length of an aircraft carrier: it sweeps plastic from the gyres, forges it into drone parts, flies its own aircraft and houses a crew the size of a small town.',
        parts: [['Hulls', 'Three hulls with pointed bows, windows along each'], ['Flight deck', 'Runway markings, parked jets, control island'], ['Campus', 'Habitat blocks, a slim tower, lawns and trees'], ['Bridge', 'Glass-banded bridge with a radar mast'], ['Sails', 'Two solar sails on masts'], ['Forge', 'Onboard 3D-printing foundry and its stack'], ['Hive', 'Glowing drone pads and hangar doors'], ['Crane', 'Stern crane for the net and drones'], ['Net', 'Trailing electromagnetic sweep net']] },
      { id: 'jet', name: 'Leviathan carrier jet', kind: 'Air wing', fly: true, make: () => { const j = makeJet(world); return take(j); },
        blurb: 'Each Leviathan flies its own aircraft off the flight deck like a carrier: patrols, survey runs and transfers to the city.',
        parts: [['Fuselage', 'Ceramic body with a pointed nose'], ['Wings', 'Swept wings, blue for things that move'], ['Tails', 'Twin canted tail fins']] },
      { id: 'sweep', name: 'Sweep drone', kind: 'Leviathan hive · surface', make: () => take(makeCat().g),
        blurb: 'A small catamaran launched from a Leviathan’s hive. It circles the gyre and pulls in microplastics with an acoustic vortex.',
        parts: [['Hulls', 'Twin pointed hulls'], ['Deck', 'Solar panel deck'], ['Mast', 'Sensor mast with a beacon'], ['Vortex', 'Acoustic vortex ring that gathers plastic']] },
      { id: 'harvest-drone', name: 'Harvest drone', kind: 'Leviathan hive · underwater', fly: true, make: () => makeHarvestDrone(),
        blurb: 'Runs just under the surface round its Leviathan, herding plastic toward the net.',
        parts: [['Body', 'Torpedo hull'], ['Fins', 'Steering fin and tail planes'], ['Sensor', 'Glowing sensor eye at the nose']] },
      { id: 'reef-drone', name: 'Reef drone', kind: 'Reef restoration', fly: true, make: () => makeReefDrone(),
        blurb: 'Patrols bleached reef and micro-welds heat-tolerant polyps onto it; the coral it passes comes back to colour.',
        parts: [['Hull', 'Submersible hull with a viewport'], ['Fins', 'Tail fin and stabilizers'], ['Thruster', 'Ring-guarded propeller'], ['Tool', 'Micro-welding tip for the polyps']] },
      { id: 'climber', name: 'Tether climber', kind: 'Space elevator', make: () => take(makeClimber(1, 0)),
        blurb: 'Rides the tether on maglev tracks between the anchor tower and the Apex Station, powered by a laser beamed from below.',
        parts: [['Car', 'Pressurized cargo and crew car'], ['Windows', 'Glazed band round the car'], ['Clamps', 'Maglev clamps that hold the tether'], ['Receiver', 'Dish that catches the power laser']] },
      { id: 'quad', name: 'City drone', kind: 'Earth Port', fly: true, make: () => makeQuad(),
        blurb: 'Quadcopters that hop between rooftops across the city, some carrying parcels.',
        parts: [['Body', 'Ceramic core'], ['Rotors', 'Four rotors on crossed arms'], ['Beacon', 'Blinking beacon'], ['Parcel', 'Underslung parcel']] }
    ];
    VEH.forEach((v) => { v.obj = fit(v.make(), v.fly); });

    const tabs = $('#veh-tabs'), panel = $('#veh-panel');
    let cur = 0, yaw = 0.6, drag = null, last = performance.now();
    function show() {
      VEH.forEach((v, i) => { v.obj.visible = i === cur; });
      [...tabs.children].forEach((b, i) => { b.setAttribute('aria-selected', i === cur); b.tabIndex = i === cur ? 0 : -1; });
      const v = VEH[cur];
      panel.setAttribute('aria-labelledby', `veh-tab-${cur}`);
      panel.innerHTML = `<span class="mono kicker">${v.kind}</span><h2>${v.name}</h2><p>${v.blurb}</p>
        <dl class="specs">${v.parts.map(([k, d]) => `<div><dt>${k}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
      host.setAttribute('aria-label', `3D view of the ${v.name}. Drag, or use the left and right arrow keys, to turn it.`);
    }
    VEH.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `veh-tab-${i}`; b.textContent = v.name;
      b.setAttribute('aria-controls', 'veh-panel');
      b.addEventListener('click', () => { cur = i; show(); });
      b.addEventListener('keydown', (e) => {
        const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown', back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        if (!fwd && !back) return;
        e.preventDefault();
        cur = (cur + (fwd ? 1 : -1) + VEH.length) % VEH.length;
        show(); tabs.children[cur].focus();
      });
      tabs.appendChild(b);
    });
    const linked = VEH.findIndex((v) => '#' + v.id === location.hash);
    if (linked >= 0) cur = linked;
    show();

    // Turn by dragging or with the arrow keys; it turns slowly on its own unless motion is paused or reduced
    const cv = renderer.domElement;
    cv.style.touchAction = 'pan-y';
    cv.addEventListener('pointerdown', (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); host.classList.add('grabbing'); });
    cv.addEventListener('pointermove', (e) => { if (drag === null) return; yaw += (e.clientX - drag) * 0.01; drag = e.clientX; });
    const end = () => { drag = null; host.classList.remove('grabbing'); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    host.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { yaw -= 0.26; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { yaw += 0.26; e.preventDefault(); }
    });
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h;
      const d = w / h < 1 ? 23 : 15;   // narrow stands need more distance to fit the wingspan
      camera.position.set(0, d * 0.42, d); camera.lookAt(0, 1.2, 0); camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host); resize();
    (function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05); last = now;
      if (drag === null && !paused && !reduceMQ.matches) yaw += dt * 0.25;
      VEH[cur].obj.rotation.y = yaw;
      renderer.render(scene, camera);
    })(performance.now());
  }
  if ($('#showcase')) initShowcase();

  if (epEl) renderEp();
  tick(); setInterval(tick, 1000);
})();
