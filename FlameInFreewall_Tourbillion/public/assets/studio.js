const demos = [
  {
    id: 'candle',
    category: 'NASA CFM · DIFFUSION FLAME',
    label: 'Candle Flame',
    tag: '3D',
    title: 'Candle Flames in Microgravity (CFM)',
    description: 'Direct empirical comparison between 0g orbital freefall (molecular diffusion dome) and 1g terrestrial baseline (buoyant teardrop flame).',
    hint: 'Drag to rotate · Scroll to zoom · Toggle gravity regimes and adjust atmospheric conditions in the side panel.',
    file: 'candle'
  },
  {
    id: 'mist',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'MIST · Rod Ignition',
    tag: '01',
    title: 'Material Ignition and Suppression Test (MIST)',
    description: 'PMMA acrylic rod under external radiant heating with opposed-flow flame spread and three independent suppression methods.',
    hint: 'Click "Run Experiment", then test N₂ dilution, flow reduction (quenching), or chamber depressurization while the flame spreads.',
    file: 'mist'
  },
  {
    id: 'nca',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'NCA · Narrow Channel',
    tag: '02',
    title: 'Narrow Channel Apparatus (NCA)',
    description: 'Synchronized comparison: 1g open duct, 1g 5mm narrow channel (buoyancy suppression), and ISS microgravity.',
    hint: 'Adjust channel gap and opposed airflow velocity to observe terrestrial buoyancy suppression across the three viewports.',
    file: 'nca'
  },
  {
    id: 'rtdfs',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'RTDFS · Thin Films',
    tag: '03',
    title: 'Residence Time Driven Flame Spread (RTDFS)',
    description: 'Opposed-flow flame spread across thin PMMA film in 3D: radiation quenching at low flow vs aerodynamic blowoff at high flow.',
    hint: 'Toggle flow presets (V=1, V=8, V=50 cm/s); open "Notes" for underlying NASA experimental bounds.',
    file: 'rtdfs'
  },
  {
    id: 'smurf',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'SMµRF · Space Safety',
    tag: '04',
    title: 'NASA-STD-6001 Flammability Paradox (SMµRF)',
    description: 'The same PMMA material: self-extinguishes on Earth due to buoyant stretch, but sustains combustion in ventilated microgravity.',
    hint: 'Inspect the U-shaped flammability boundary and Non-combustion to Microgravity Spread (NOMS) margin.',
    file: 'smurf'
  },
  {
    id: 'gel-comparison',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'GEL · Sphere (Dual)',
    tag: '05',
    title: 'Growth and Extinction Limit (GEL) · 1g vs µg',
    description: 'Dual 3D viewports comparing flame growth, thermal regression, and extinction dynamics over thick solid PMMA spheres.',
    hint: 'Adjust ambient O₂ and sphere diameter; click "Ignite / Rerun" or trigger "N₂ Quench".',
    file: 'gel-comparison'
  },
  {
    id: 'gel',
    category: 'NASA SoFIE · SOLID FUEL (ISS)',
    label: 'GEL · Extinction Map',
    tag: '06',
    title: 'Extinction Boundaries on Solid Spheres (GEL)',
    description: 'Phase space map of flow velocity vs O₂ with calibrated NASA test runs 1409B & 1410A across four extinction regimes.',
    hint: 'Select scenarios A–D or click directly on the Flow × O₂ phase map to test custom operating points.',
    file: 'gel'
  },
];

const $ = (id) => document.getElementById(id);
const navigation = $('demo-list');
let current = null;
let requestVersion = 0;
let readinessTimer;

let lastCategory = '';
for (const demo of demos) {
  if (demo.category !== lastCategory) {
    lastCategory = demo.category;
    const catHeader = document.createElement('div');
    catHeader.className = 'category-header';
    catHeader.textContent = demo.category;
    navigation.append(catHeader);
  }

  const link = document.createElement('a');
  link.href = `#${demo.id}`;
  link.className = 'demo-link';
  link.dataset.demo = demo.id;
  const number = document.createElement('span');
  number.className = 'demo-number';
  number.textContent = demo.tag;
  const label = document.createElement('span');
  label.textContent = demo.label;
  const arrow = document.createElement('span');
  arrow.className = 'demo-arrow';
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden', 'true');
  link.append(number, label, arrow);
  navigation.append(link);
}

function showState(kind, message) {
  $('frame-state').hidden = kind === 'ready';
  $('frame-state').dataset.state = kind;
  $('state-message').textContent = message;
  $('retry-demo').hidden = kind !== 'error';
  $('demo-status').textContent = kind === 'ready' ? 'Active simulation' : kind === 'error' ? 'Loading failed' : 'Preparing...';
}

async function selectDemo(force = false) {
  const requested = location.hash.slice(1);
  const demo = demos.find((item) => item.id === requested) || demos[0];
  if (requested !== demo.id) history.replaceState(null, '', `#${demo.id}`);
  if (!force && current === demo.id) return;
  current = demo.id;
  const version = ++requestVersion;
  clearTimeout(readinessTimer);
  $('demo-frame')?.remove();
  for (const link of navigation.querySelectorAll('.demo-link')) {
    if (link.dataset.demo === demo.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  $('demo-title').textContent = demo.title;
  $('demo-description').textContent = demo.description;
  $('demo-hint').textContent = demo.hint;
  $('demo-kind').textContent = demo.id === 'candle' ? '3D VOLUMETRIC SIMULATION' : 'NASA SOFIE EXPERIMENT';
  $('provenance').textContent = demo.id === 'candle'
    ? 'Interactive visual simulation. Morphological and spectroscopic model for physical observation.'
    : 'Qualitative phenomenological simulation · Assumed boundary parameters · Numerical thresholds are illustrative approximations from NASA reference literature · Not direct raw PSI sensor streams.';
  const url = `/studio/experiments/${demo.file}.html`;
  $('open-demo').href = url;
  document.title = `${demo.label} · Studio · Flame in Freefall`;
  showState('loading', 'Preparing demonstration...');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (!html.includes('data-studio-demo')) throw new Error('Invalid demo document');
    if (version !== requestVersion) return;
    const frame = document.createElement('iframe');
    frame.id = 'demo-frame';
    frame.title = `${demo.label} — ${demo.title}`;
    frame.allow = 'fullscreen';
    frame.src = url;
    $('frame-host').prepend(frame);
    readinessTimer = setTimeout(() => {
      if (version === requestVersion) showState('error', 'Demonstration unresponsive. Please reload or open standalone.');
    }, 20000);
  } catch {
    if (version === requestVersion) showState('error', 'Unable to load demonstration. Please reload or open standalone.');
  }
}

window.addEventListener('message', (event) => {
  const frame = $('demo-frame');
  if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'studio-demo') return;
  if (!['ready', 'error'].includes(event.data.state)) return;
  clearTimeout(readinessTimer);
  showState(event.data.state, event.data.state === 'error' ? event.data.detail : '');
});
window.addEventListener('hashchange', () => selectDemo());
document.querySelector('.skip').addEventListener('click', (event) => {
  event.preventDefault();
  $('demo-title').focus();
});
$('reload-demo').addEventListener('click', () => selectDemo(true));
$('retry-demo').addEventListener('click', () => selectDemo(true));
selectDemo();
