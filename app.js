'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let currentProjectId  = null;
let currentItemId     = null;
let originalProjectType = 'BAUABNAHME'; // beim Laden des Formulars gesetzt
let currentItem       = null;
let cachedProject     = null;
let cachedItems       = [];
let recognition       = null;
let isListening       = false;
let notesTimer        = null;
// Floor-plan state
let currentFloorPlans = [];   // alle Pläne des Projekts
let currentPlanIdx    = 0;    // aktiv angezeigter Plan
let currentPins       = {};   // { planId: [pin, …] }
let pinPlacingMode    = false;
let currentPinId      = null; // Pin im Modal

// ── Navigation ─────────────────────────────────────────────────────────────────
const views = ['login','projects','project-edit','checklist','item-detail','report','floor-plan'];

function showView(name, title, showBack = true) {
  views.forEach(v => document.getElementById('view-' + v).classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('header-title').textContent = title;
  document.getElementById('btn-back').style.display      = showBack ? 'flex' : 'none';
  document.getElementById('fab').classList.toggle('hidden', name !== 'projects');
  document.getElementById('btn-report').style.display    = name === 'checklist'    ? 'flex' : 'none';
  document.getElementById('btn-save').style.display      = name === 'project-edit' ? 'flex' : 'none';
  document.getElementById('btn-logout').style.display    = name !== 'login'        ? 'flex' : 'none';
  document.getElementById('btn-floor-plan').style.display =
    (name === 'checklist' || name === 'floor-plan') && currentProjectId ? 'flex' : 'none';
  window.scrollTo(0, 0);
}

function showLoginView() {
  views.forEach(v => document.getElementById('view-' + v).classList.remove('active'));
  document.getElementById('view-login').classList.add('active');
  document.getElementById('header-title').textContent = 'Bauabnahme';
  ['btn-back','btn-report','btn-save','btn-logout','btn-floor-plan'].forEach(id =>
    document.getElementById(id).style.display = 'none');
  document.getElementById('fab').classList.add('hidden');
  window.scrollTo(0, 0);
}

function goBack() {
  if (document.getElementById('view-floor-plan').classList.contains('active')) {
    openChecklist(currentProjectId); return;
  }
  if (currentItemId    !== null) { openChecklist(currentProjectId); return; }
  if (currentProjectId !== null) { openProjectList(); return; }
  openProjectList();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function login() {
  const email = document.getElementById('auth-email').value.trim();
  const pw    = document.getElementById('auth-password').value;
  if (!email || !pw) { showAuthMsg('Bitte E-Mail und Passwort eingeben'); return; }
  try {
    const { error } = await SB.Auth.signIn(email, pw);
    if (error) throw error;
  } catch (e) { showAuthMsg(e.message || 'Anmeldung fehlgeschlagen'); }
}

async function register() {
  const email = document.getElementById('auth-email').value.trim();
  const pw    = document.getElementById('auth-password').value;
  if (!email || !pw) { showAuthMsg('Bitte E-Mail und Passwort eingeben'); return; }
  if (pw.length < 6)  { showAuthMsg('Passwort muss mindestens 6 Zeichen haben'); return; }
  try {
    const { error } = await SB.Auth.signUp(email, pw);
    if (error) throw error;
    showAuthMsg('Registrierung erfolgreich! Bitte E-Mail bestätigen.', false);
  } catch (e) { showAuthMsg(e.message || 'Registrierung fehlgeschlagen'); }
}

async function logout() {
  await SB.Auth.signOut();
}

function showAuthMsg(msg, isError = true) {
  const el = document.getElementById('auth-error');
  el.textContent    = msg;
  el.style.display  = 'block';
  el.style.background = isError ? 'var(--error-bg)' : '#E8F5E9';
  el.style.color      = isError ? 'var(--error)'    : 'var(--primary)';
}

// ── Projektliste ──────────────────────────────────────────────────────────────
async function openProjectList() {
  currentProjectId = null; currentItemId = null;
  currentItem = null; cachedProject = null; cachedItems = [];
  showView('projects', 'Bauabnahme', false);
  await renderProjectList();
}

async function renderProjectList() {
  const el = document.getElementById('project-list');
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--outline)">Laden…</div>';
  try {
    const projects = await SB.Projects.list();
    if (!projects.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🏠</div>
        <div class="empty-title">Noch keine Projekte</div>
        <div class="empty-sub">Tippen Sie auf + um ein neues Projekt anzulegen</div>
      </div>`;
      return;
    }
    const chipLabel = { KFW_NEUBAU:'KFN Neubau', KFW_SANIERUNG:'Sanierung EH',
                        KFW_HEIZUNG:'Heizungstausch', BAFA:'BAFA', KFW:'Sanierung EH' };
    el.innerHTML = projects.map(p => {
      const pt   = p.buildingData?.projectType || 'BAUABNAHME';
      const ft   = p.buildingData?.fundingType || '';
      const chip = pt === 'ISFP' ? 'iSFP Bestandsaufnahme' : (chipLabel[ft] || ft);
      const date = p.inspectionDate ? new Date(p.inspectionDate).toLocaleDateString('de-DE') : '';
      return `<div class="project-card" onclick="openChecklist('${p.id}')">
        <div class="project-card-accent"></div>
        <div class="project-card-body">
          <div class="project-card-name">${esc(p.name)}</div>
          <div class="project-card-customer">${esc(p.customer)}</div>
          ${p.address ? `<div class="card-sub" style="font-size:12px">${esc(p.address)}</div>` : ''}
          <div style="margin-top:6px"><span class="chip">${chip}</span></div>
          ${date ? `<div style="font-size:12px;color:var(--outline);margin-top:4px">📅 ${date}</div>` : ''}
        </div>
        <div class="project-card-actions">
          <button class="btn-icon" onclick="event.stopPropagation();editProject('${p.id}')" title="Bearbeiten">✏️</button>
          <button class="btn-icon" onclick="event.stopPropagation();deleteProject('${p.id}')" title="Löschen" style="color:var(--error)">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) { toast('Fehler beim Laden: ' + e.message); }
}

// ── Projekt anlegen / bearbeiten ──────────────────────────────────────────────
function newProject() {
  currentProjectId = null;
  resetProjectForm();
  showView('project-edit', 'Neues Projekt');
}

async function editProject(id) {
  currentProjectId = id;
  try {
    const projects = await SB.Projects.list();
    const p = projects.find(x => x.id === id);
    if (!p) return;
    fillProjectForm(p);
    showView('project-edit', 'Projekt bearbeiten');
  } catch (e) { toast('Fehler: ' + e.message); }
}

function resetProjectForm() {
  document.getElementById('f-name').value         = '';
  document.getElementById('f-customer').value     = '';
  document.getElementById('f-address').value      = '';
  document.getElementById('f-date').value         = '';
  document.getElementById('f-participants').value = '';
  document.getElementById('f-project-type').value = 'BAUABNAHME';
  originalProjectType = 'BAUABNAHME';
  onProjectTypeChange();
  document.getElementById('f-funding').value      = 'KFW_NEUBAU';
  onFundingChange();
  document.getElementById('f-kfw-neubau-level').value = 'KFN';
  document.getElementById('f-kfw-san-level').value    = 'KFW_55';
  document.getElementById('f-kfw-class').value        = '';
  document.getElementById('f-heizung-type').value     = 'WAERMEPUMPE';
  document.getElementById('f-heat-gen-type').value    = '';
  document.getElementById('f-heat-gen-type2').value   = '';
  document.getElementById('f-heating-custom').value   = '';
  document.getElementById('f-heat-circuits').value    = '';
  document.getElementById('f-system-temp').value      = '';
  document.getElementById('f-distrib-custom').value   = '';
  document.getElementById('f-vent-custom').value      = '';
  document.getElementById('f-pv-custom').value        = '';
  document.getElementById('f-windows-custom').value   = '';
  document.getElementById('f-wall-custom').value      = '';
  document.getElementById('f-roof-custom').value      = '';
  document.getElementById('f-base-custom').value      = '';
  document.getElementById('f-wb-custom').value        = '';
  ['f-heat-dist','f-bafa-measures','f-wb-types'].forEach(id =>
    document.querySelectorAll(`#${id} input[type=checkbox]`).forEach(cb => cb.checked = false));
  ['f-heat-buffer','f-dhw-storage','f-strat-storage','f-pipe-insulation','f-pumps','f-floor-dist'].forEach(id => {
    const el = document.getElementById(id); if (el) el.checked = false;
  });
  ['f-vent','f-pv','f-wall','f-roof','f-base','f-sun'].forEach(id => {
    const el = document.getElementById(id); if (el) el.checked = false;
  });
  ['f-vent','f-pv','f-wall','f-roof','f-base','f-sun'].forEach(id =>
    onToggle(id, 's-' + id.slice(2)));
  // iSFP-Felder zurücksetzen
  const isISFPIds = [
    'is-build-year','is-living-area','is-floors',
    'is-wall-thickness','is-wall-year','is-wall-u',
    'is-roof-year','is-roof-u',
    'is-base-u',
    'is-win-year','is-win-u',
    'is-hg-year','is-hg-brand','is-hg-power',
    'is-ww-volume','is-ww-year',
    'is-dist-vl','is-dist-year',
    'is-vent-year',
    'is-ev-y1-label','is-ev-y1-heat','is-ev-y1-elec',
    'is-ev-y2-label','is-ev-y2-heat',
    'is-ev-y3-label','is-ev-y3-heat'
  ];
  isISFPIds.forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  const isISFPTextIds = [
    'is-wall-notes','is-roof-notes','is-base-notes','is-win-notes',
    'is-hg-notes','is-ww-notes','is-dist-notes','is-vent-notes','is-ev-notes'
  ];
  isISFPTextIds.forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  ['is-has-cellar','is-has-attic','is-dist-hyd','is-dist-pipe-ins','is-dist-hepu'].forEach(id => {
    const el = document.getElementById(id); if(el) el.checked = false;
  });
}

function fillProjectForm(p) {
  const bd = p.buildingData;
  document.getElementById('f-name').value         = p.name;
  document.getElementById('f-customer').value     = p.customer;
  document.getElementById('f-address').value      = p.address || '';
  document.getElementById('f-date').value         = p.inspectionDate || '';
  document.getElementById('f-participants').value = bd.participants || '';

  // Projekttyp wiederherstellen
  const pt = bd.projectType || 'BAUABNAHME';
  document.getElementById('f-project-type').value = pt;
  originalProjectType = pt;   // Ausgangswert merken für Änderungserkennung
  onProjectTypeChange();

  // iSFP-Felder befüllen (falls vorhanden)
  if (pt === 'ISFP' && bd.isfp) {
    const is = bd.isfp;
    const sv = (id, v) => { const el = document.getElementById(id); if(el && v != null) el.value = v; };
    const sc = (id, v) => { const el = document.getElementById(id); if(el) el.checked = !!v; };
    sv('is-build-year', is.buildYear); sv('is-build-type', is.buildType);
    sv('is-living-area', is.livingArea); sv('is-floors', is.floors);
    sc('is-has-cellar', is.hasCellar); sc('is-has-attic', is.hasAttic);
    sv('is-monument', is.monument);
    sv('is-wall-const', is.wallConst); sv('is-wall-thickness', is.wallThickness);
    sv('is-wall-year', is.wallYear); sv('is-wall-ins', is.wallIns);
    sv('is-wall-u', is.wallU); sv('is-wall-condition', is.wallCondition);
    sv('is-wall-notes', is.wallNotes);
    sv('is-roof-type', is.roofType); sv('is-roof-year', is.roofYear);
    sv('is-roof-ins', is.roofIns); sv('is-roof-u', is.roofU);
    sv('is-roof-condition', is.roofCondition); sv('is-roof-notes', is.roofNotes);
    sv('is-base-type', is.baseType); sv('is-base-ins', is.baseIns);
    sv('is-base-u', is.baseU); sv('is-base-condition', is.baseCondition);
    sv('is-base-notes', is.baseNotes);
    sv('is-win-glazing', is.winGlazing); sv('is-win-year', is.winYear);
    sv('is-win-u', is.winU); sv('is-win-condition', is.winCondition);
    sv('is-win-notes', is.winNotes);
    sv('is-hg-type', is.hgType); sv('is-hg-year', is.hgYear);
    sv('is-hg-brand', is.hgBrand); sv('is-hg-power', is.hgPower);
    sv('is-hg-condition', is.hgCondition); sv('is-hg-notes', is.hgNotes);
    sv('is-ww-type', is.wwType); sv('is-ww-volume', is.wwVolume);
    sv('is-ww-year', is.wwYear); sv('is-ww-notes', is.wwNotes);
    sv('is-dist-type', is.distType); sv('is-dist-vl', is.distVl);
    sc('is-dist-hyd', is.distHyd); sc('is-dist-pipe-ins', is.distPipeIns);
    sc('is-dist-hepu', is.distHepu);
    sv('is-dist-year', is.distYear); sv('is-dist-notes', is.distNotes);
    sv('is-vent-type', is.ventType); sv('is-vent-year', is.ventYear);
    sv('is-vent-condition', is.ventCondition); sv('is-vent-notes', is.ventNotes);
    sv('is-energy-carrier', is.energyCarrier);
    sv('is-ev-y1-label', is.evY1Label); sv('is-ev-y1-heat', is.evY1Heat); sv('is-ev-y1-elec', is.evY1Elec);
    sv('is-ev-y2-label', is.evY2Label); sv('is-ev-y2-heat', is.evY2Heat);
    sv('is-ev-y3-label', is.evY3Label); sv('is-ev-y3-heat', is.evY3Heat);
    sv('is-ev-notes', is.evNotes);
  }

  const ft = bd.fundingType === 'KFW' ? 'KFW_SANIERUNG' : (bd.fundingType || 'KFW_NEUBAU');
  document.getElementById('f-funding').value = ft;
  onFundingChange();

  document.getElementById('f-kfw-neubau-level').value = bd.kfwLevel || 'KFN';
  let sanLevel = bd.kfwLevel || 'KFW_55', sanClass = bd.kfwClass || '';
  if (sanLevel === 'KFW_40_PLUS') { sanLevel = 'KFW_40'; sanClass = 'NH'; }
  if (sanLevel === 'KFW_40_EE')   { sanLevel = 'KFW_40'; sanClass = 'EE'; }
  if (sanLevel === 'KFW_55_EE')   { sanLevel = 'KFW_55'; sanClass = 'EE'; }
  document.getElementById('f-kfw-san-level').value = sanLevel;
  document.getElementById('f-kfw-class').value      = sanClass;
  document.getElementById('f-heizung-type').value   = bd.heizungType || 'WAERMEPUMPE';

  setMultiCheck('f-bafa-measures', bd.bafaMeasures    || []);
  // heatGeneration: neu = string (single), alt = array → abwärtskompatibel
  const hg = bd.heatGeneration;
  if (Array.isArray(hg)) {
    document.getElementById('f-heat-gen-type').value  = hg[0] || '';
    document.getElementById('f-heat-gen-type2').value = hg[1] || '';
  } else {
    document.getElementById('f-heat-gen-type').value  = hg || '';
    document.getElementById('f-heat-gen-type2').value = bd.heatGeneration2 || '';
  }
  document.getElementById('f-heating-custom').value   = bd.customNoteHeating   || '';
  setMultiCheck('f-heat-dist', bd.heatDistribution || []);
  document.getElementById('f-heat-circuits').value    = bd.heatCircuits    || '';
  document.getElementById('f-system-temp').value      = bd.systemTemp      || '';
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
  setChk('f-heat-buffer',    bd.heatBuffer);
  setChk('f-dhw-storage',    bd.dhwStorage);
  setChk('f-strat-storage',  bd.stratStorage);
  setChk('f-pipe-insulation',bd.pipeInsulation);
  setChk('f-pumps',          bd.pumps);
  setChk('f-floor-dist',     bd.floorDist);
  document.getElementById('f-distrib-custom').value   = bd.customNoteDistrib  || '';
  setMultiCheck('f-wb-types', bd.wbTypes || []);
  document.getElementById('f-wb-custom').value        = bd.customNoteWb       || '';

  setToggle('f-vent', bd.ventilationPresent); onToggle('f-vent','s-vent');
  document.getElementById('f-vent-type').value        = bd.ventilationType    || 'ZAL';
  document.getElementById('f-vent-custom').value      = bd.customNoteVent     || '';

  setToggle('f-pv', bd.pvPresent); onToggle('f-pv','s-pv');
  document.getElementById('f-pv-kwp').value = bd.pvSizeKwp || '';
  setToggle('f-pv-bat', bd.pvWithBattery); onToggle('f-pv-bat','s-pv-bat');
  document.getElementById('f-pv-kwh').value       = bd.pvBatteryKwh      || '';
  document.getElementById('f-pv-custom').value    = bd.customNotePv       || '';

  document.getElementById('f-win-type').value     = bd.windowType         || '';
  document.getElementById('f-win-frame').value    = bd.windowFrame        || '';
  setToggle('f-sun', bd.sunProtection); onToggle('f-sun','s-sun');
  document.getElementById('f-sun-type').value     = bd.sunProtectionType  || '';
  document.getElementById('f-windows-custom').value = bd.customNoteWindows || '';

  setToggle('f-wall', bd.wallInsulation); onToggle('f-wall','s-wall');
  document.getElementById('f-wall-type').value    = bd.wallInsType  || '';
  document.getElementById('f-wall-cm').value      = bd.wallInsCm    || '';
  document.getElementById('f-wall-custom').value  = bd.customNoteWall || '';

  setToggle('f-roof', bd.roofInsulation); onToggle('f-roof','s-roof');
  document.getElementById('f-roof-type').value    = bd.roofInsType  || '';
  document.getElementById('f-roof-cm').value      = bd.roofInsCm    || '';
  document.getElementById('f-roof-custom').value  = bd.customNoteRoof || '';

  setToggle('f-base', bd.baseInsulation); onToggle('f-base','s-base');
  document.getElementById('f-base-type').value    = bd.baseInsType  || '';
  document.getElementById('f-base-cm').value      = bd.baseInsCm    || '';
  document.getElementById('f-base-custom').value  = bd.customNoteBase || '';
}

function getIsfpData() {
  const gv = id => document.getElementById(id)?.value || null;
  const gc = id => document.getElementById(id)?.checked || false;
  const gn = id => parseFloat(document.getElementById(id)?.value) || null;
  const gi = id => parseInt(document.getElementById(id)?.value) || null;
  return {
    buildYear: gi('is-build-year'), buildType: gv('is-build-type'),
    livingArea: gn('is-living-area'), floors: gi('is-floors'),
    hasCellar: gc('is-has-cellar'), hasAttic: gc('is-has-attic'),
    monument: gv('is-monument'),
    wallConst: gv('is-wall-const'), wallThickness: gn('is-wall-thickness'),
    wallYear: gi('is-wall-year'), wallIns: gv('is-wall-ins'),
    wallU: gn('is-wall-u'), wallCondition: gv('is-wall-condition'),
    wallNotes: gv('is-wall-notes'),
    roofType: gv('is-roof-type'), roofYear: gi('is-roof-year'),
    roofIns: gv('is-roof-ins'), roofU: gn('is-roof-u'),
    roofCondition: gv('is-roof-condition'), roofNotes: gv('is-roof-notes'),
    baseType: gv('is-base-type'), baseIns: gv('is-base-ins'),
    baseU: gn('is-base-u'), baseCondition: gv('is-base-condition'),
    baseNotes: gv('is-base-notes'),
    winGlazing: gv('is-win-glazing'), winYear: gi('is-win-year'),
    winU: gn('is-win-u'), winCondition: gv('is-win-condition'),
    winNotes: gv('is-win-notes'),
    hgType: gv('is-hg-type'), hgYear: gi('is-hg-year'),
    hgBrand: gv('is-hg-brand'), hgPower: gn('is-hg-power'),
    hgCondition: gv('is-hg-condition'), hgNotes: gv('is-hg-notes'),
    wwType: gv('is-ww-type'), wwVolume: gi('is-ww-volume'),
    wwYear: gi('is-ww-year'), wwNotes: gv('is-ww-notes'),
    distType: gv('is-dist-type'), distVl: gn('is-dist-vl'),
    distHyd: gc('is-dist-hyd'), distPipeIns: gc('is-dist-pipe-ins'),
    distHepu: gc('is-dist-hepu'), distYear: gi('is-dist-year'),
    distNotes: gv('is-dist-notes'),
    ventType: gv('is-vent-type'), ventYear: gi('is-vent-year'),
    ventCondition: gv('is-vent-condition'), ventNotes: gv('is-vent-notes'),
    energyCarrier: gv('is-energy-carrier'),
    evY1Label: gi('is-ev-y1-label'), evY1Heat: gn('is-ev-y1-heat'), evY1Elec: gn('is-ev-y1-elec'),
    evY2Label: gi('is-ev-y2-label'), evY2Heat: gn('is-ev-y2-heat'),
    evY3Label: gi('is-ev-y3-label'), evY3Heat: gn('is-ev-y3-heat'),
    evNotes: gv('is-ev-notes')
  };
}

function getBuildingData() {
  const pt = document.getElementById('f-project-type').value;
  const ft = document.getElementById('f-funding').value;
  let kfwLevel = null;
  if (ft === 'KFW_NEUBAU')    kfwLevel = document.getElementById('f-kfw-neubau-level').value;
  if (ft === 'KFW_SANIERUNG') kfwLevel = document.getElementById('f-kfw-san-level').value;
  const gv = id => document.getElementById(id)?.value || null;
  const gc = id => document.getElementById(id)?.checked || false;
  return {
    projectType:         pt,
    isfp:                pt === 'ISFP' ? getIsfpData() : null,
    participants:        document.getElementById('f-participants').value.trim(),
    fundingType:         ft,
    kfwLevel,
    kfwClass:            ft === 'KFW_SANIERUNG' ? document.getElementById('f-kfw-class').value : '',
    heizungType:         ft === 'KFW_HEIZUNG'   ? document.getElementById('f-heizung-type').value : null,
    bafaMeasures:        getMultiCheck('f-bafa-measures'),
    heatGeneration:      gv('f-heat-gen-type'),
    heatGeneration2:     gv('f-heat-gen-type2'),
    customNoteHeating:   gv('f-heating-custom'),
    heatDistribution:    getMultiCheck('f-heat-dist'),
    heatCircuits:        parseInt(gv('f-heat-circuits')) || null,
    systemTemp:          gv('f-system-temp'),
    heatBuffer:          gc('f-heat-buffer'),
    dhwStorage:          gc('f-dhw-storage'),
    stratStorage:        gc('f-strat-storage'),
    pipeInsulation:      gc('f-pipe-insulation'),
    pumps:               gc('f-pumps'),
    floorDist:           gc('f-floor-dist'),
    customNoteDistrib:   gv('f-distrib-custom'),
    wbTypes:             getMultiCheck('f-wb-types'),
    customNoteWb:        gv('f-wb-custom'),
    ventilationPresent:  gc('f-vent'),
    ventilationType:     gv('f-vent-type'),
    customNoteVent:      gv('f-vent-custom'),
    pvPresent:           gc('f-pv'),
    pvSizeKwp:           parseFloat(gv('f-pv-kwp')) || null,
    pvWithBattery:       gc('f-pv-bat'),
    pvBatteryKwh:        parseFloat(gv('f-pv-kwh')) || null,
    customNotePv:        gv('f-pv-custom'),
    windowType:          gv('f-win-type'),
    windowFrame:         gv('f-win-frame'),
    sunProtection:       gc('f-sun'),
    sunProtectionType:   gv('f-sun-type'),
    customNoteWindows:   gv('f-windows-custom'),
    wallInsulation:      gc('f-wall'),
    wallInsType:         gv('f-wall-type'),
    wallInsCm:           parseInt(gv('f-wall-cm'))   || null,
    customNoteWall:      gv('f-wall-custom'),
    roofInsulation:      gc('f-roof'),
    roofInsType:         gv('f-roof-type'),
    roofInsCm:           parseInt(gv('f-roof-cm'))   || null,
    customNoteRoof:      gv('f-roof-custom'),
    baseInsulation:      gc('f-base'),
    baseInsType:         gv('f-base-type'),
    baseInsCm:           parseInt(gv('f-base-cm'))   || null,
    customNoteBase:      gv('f-base-custom')
  };
}

async function saveProject() {
  const name     = document.getElementById('f-name').value.trim();
  const customer = document.getElementById('f-customer').value.trim();
  if (!name || !customer) { toast('Bitte Projektname und Kunde angeben'); return; }

  const bd = getBuildingData();
  const isNew = currentProjectId === null;
  const project = {
    id:             currentProjectId || undefined,
    name, customer,
    address:        document.getElementById('f-address').value.trim(),
    inspectionDate: document.getElementById('f-date').value,
    buildingData:   bd
  };
  try {
    const saved = await SB.Projects.save(project);
    currentProjectId = saved.id;
    if (isNew) {
      const generated = bd.projectType === 'ISFP'
        ? generateIsfpChecklist(saved.id, bd)
        : generateChecklist(saved.id, bd);
      await SB.Items.insertMany(saved.id, generated);
      toast(`${generated.length} Prüfpunkte generiert`);
    } else {
      // Prüfen ob Projekttyp geändert wurde → Checkliste neu generieren
      const oldType = originalProjectType;
      const newType = bd.projectType || 'BAUABNAHME';
      if (oldType !== newType) {
        const ok = confirm(
          `Projektart wurde von „${oldType === 'ISFP' ? 'iSFP' : 'Bauabnahme'}" zu ` +
          `„${newType === 'ISFP' ? 'iSFP' : 'Bauabnahme'}" geändert.\n\n` +
          `Soll die Prüfliste jetzt durch die passende Prüfliste ersetzt werden?\n` +
          `(Alle bisherigen Prüfpunkte, Notizen und Fotos werden gelöscht!)`
        );
        if (ok) {
          const existingItems = await SB.Items.list(saved.id);
          for (const item of existingItems) await SB.Items.delete(item.id);
          const generated = newType === 'ISFP'
            ? generateIsfpChecklist(saved.id, bd)
            : generateChecklist(saved.id, bd);
          await SB.Items.insertMany(saved.id, generated);
          cachedItems = [];
          toast(`Prüfliste ersetzt – ${generated.length} neue Punkte`);
        } else {
          toast('Gespeichert (Prüfliste unverändert)');
        }
      } else {
        toast('Gespeichert');
      }
    }
    await openChecklist(saved.id);
  } catch (e) { toast('Fehler: ' + e.message); }
}

// ── Checkliste ─────────────────────────────────────────────────────────────────
async function openChecklist(projectId) {
  currentProjectId = projectId;
  currentItemId    = null;
  currentItem      = null;
  try {
    const projects = await SB.Projects.list();
    cachedProject  = projects.find(p => p.id === projectId);
    if (!cachedProject) return;
    showView('checklist', cachedProject.name);
    cachedItems = await SB.Items.list(projectId);
    renderChecklist();
  } catch (e) { toast('Fehler: ' + e.message); }
}

function renderChecklist() {
  const items    = cachedItems;
  const relevant = items.filter(i => !i.isNotApplicable);
  const checked  = relevant.filter(i => i.isChecked).length;
  const naCount  = items.length - relevant.length;
  const pct      = relevant.length ? Math.round(checked / relevant.length * 100) : 0;

  if (cachedProject) {
    document.getElementById('cl-project-info').innerHTML =
      `<span style="opacity:.8;font-size:13px">${esc(cachedProject.customer)}${cachedProject.address ? ' · '+esc(cachedProject.address) : ''}</span>`;
  }
  const naHint = naCount > 0 ? ` · ${naCount} nicht relevant` : '';
  document.getElementById('cl-progress-label').textContent = `${checked} / ${relevant.length} geprüft${naHint}`;
  document.getElementById('cl-progress-fill').style.width  = pct + '%';

  const grouped = {};
  items.forEach(item => { (grouped[item.category] ??= []).push(item); });

  document.getElementById('checklist-container').innerHTML = Object.entries(grouped).map(([cat, catItems]) => {
    const catRel     = catItems.filter(i => !i.isNotApplicable);
    const catChecked = catRel.filter(i => i.isChecked).length;
    const allDone = catRel.length > 0 && catChecked === catRel.length;
    const allNA   = catRel.length === 0;
    return `<div class="category-block">
      <div class="category-header" onclick="toggleCategory(this)">
        <span style="font-size:18px">${allDone ? '✅' : allNA ? '⊘' : '⬜'}</span>
        <span class="cat-title">${esc(cat)}</span>
        <span class="cat-count">${catChecked}/${catRel.length}</span>
        <span class="cat-chevron">▾</span>
      </div>
      <div class="category-items">
        ${catItems.map(item => {
          const na = !!item.isNotApplicable;
          return `
          <div class="checklist-item ${item.isChecked && !na ? 'checked' : ''} ${na ? 'na' : ''}"
               onclick="openItemDetail('${item.id}')">
            <input type="checkbox" ${item.isChecked && !na ? 'checked' : ''} ${na ? 'disabled' : ''}
                   onclick="event.stopPropagation();toggleItem('${item.id}',this)">
            <div class="item-content">
              <div class="item-title">${esc(item.title)}${item.isMandatory && !na ? '<span class="mandatory"> *</span>' : ''}</div>
              ${na           ? '<div class="item-na-badge">nicht relevant</div>' : ''}
              ${item.isCustom && !na ? '<div class="item-custom-badge">eigener Punkt</div>' : ''}
              ${!na && item.description ? `<div class="item-desc">${esc(item.description)}</div>` : ''}
              ${!na && item.notes       ? `<div class="item-notes">📝 ${esc(item.notes)}</div>`  : ''}
            </div>
            <button class="na-toggle-btn ${na ? 'active' : ''}"
                    onclick="event.stopPropagation();toggleNA('${item.id}')"
                    title="${na ? 'Wieder aktivieren' : 'Als nicht relevant markieren'}">⊘</button>
            ${item.isCustom ? `<button class="item-delete-btn"
                    onclick="event.stopPropagation();deleteCustomItem('${item.id}')"
                    title="Eigenen Punkt löschen">🗑</button>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function toggleCategory(header) {
  header.classList.toggle('collapsed');
  header.nextElementSibling.classList.toggle('collapsed');
}

async function toggleItem(itemId, cb) {
  const item = cachedItems.find(i => i.id === itemId);
  if (!item || item.isNotApplicable) return;
  item.isChecked = cb.checked;
  await SB.Items.update(item);
  renderChecklist();
}

async function toggleNA(itemId) {
  const item = cachedItems.find(i => i.id === itemId);
  if (!item) return;
  item.isNotApplicable = !item.isNotApplicable;
  if (item.isNotApplicable) item.isChecked = false;
  await SB.Items.update(item);
  if (currentItemId === itemId) renderItemDetail(item);
  renderChecklist();
}

// ── Prüfpunkt Detail ──────────────────────────────────────────────────────────
async function openItemDetail(itemId) {
  currentItemId = itemId;
  currentItem   = cachedItems.find(i => i.id === itemId) || null;
  if (!currentItem) return;
  showView('item-detail', 'Prüfpunkt');
  renderItemDetail(currentItem);
  await renderPhotos(itemId);
}

function renderItemDetail(item) {
  const na = !!item.isNotApplicable;
  document.getElementById('det-category').textContent = item.category;
  document.getElementById('det-title').textContent    = item.title;
  document.getElementById('det-desc').textContent     = item.description || '';
  document.getElementById('det-badge').style.display  = item.isMandatory && !na ? 'inline-block' : 'none';
  document.getElementById('det-checked').checked      = item.isChecked;
  document.getElementById('det-checked').disabled     = na;
  document.getElementById('det-notes').value          = item.notes || '';

  const naBtn = document.getElementById('det-na-btn');
  if (na) {
    naBtn.textContent = '↩ Wieder aktivieren';
    naBtn.classList.add('active');
    document.getElementById('det-na-hint').style.display = 'block';
  } else {
    naBtn.textContent = '⊘ Nicht relevant';
    naBtn.classList.remove('active');
    document.getElementById('det-na-hint').style.display = 'none';
  }
}

async function renderPhotos(itemId) {
  const photos = await SB.Photos.list(itemId);
  const grid   = document.getElementById('photo-grid');
  grid.innerHTML = photos.map(photo => `
    <div class="photo-thumb" onclick="showPhotoModal('${photo.id}')">
      <img src="${photo.dataUrl}" alt="${esc(photo.description || '')}">
      ${photo.description ? `<div class="photo-caption">${esc(photo.description)}</div>` : ''}
      <button class="photo-delete" onclick="event.stopPropagation();deletePhoto('${photo.id}')" title="Löschen">×</button>
    </div>`).join('') +
    `<div class="photo-add-btn" onclick="document.getElementById('photo-input-camera').click()" title="Kamera">
      📷<span class="photo-add-label">Kamera</span>
    </div>` +
    `<div class="photo-add-btn" onclick="document.getElementById('photo-input-gallery').click()" title="Galerie">
      🖼️<span class="photo-add-label">Galerie</span>
    </div>`;
}

async function onCheckedChange(cb) {
  if (!currentItem || currentItem.isNotApplicable) return;
  currentItem.isChecked = cb.checked;
  await SB.Items.update(currentItem);
}

function onNotesChange(textarea) {
  clearTimeout(notesTimer);
  notesTimer = setTimeout(async () => {
    if (!currentItem) return;
    currentItem.notes = textarea.value;
    await SB.Items.update(currentItem);
  }, 800);
}

async function toggleNADetail() {
  if (!currentItem) return;
  currentItem.isNotApplicable = !currentItem.isNotApplicable;
  if (currentItem.isNotApplicable) currentItem.isChecked = false;
  await SB.Items.update(currentItem);
  renderItemDetail(currentItem);
}

// ── Eigene Punkte ─────────────────────────────────────────────────────────────
function openAddCustomItem() {
  const categories = [...new Set(cachedItems.map(i => i.category))];
  const select = document.getElementById('custom-category');
  select.innerHTML = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('') +
    '<option value="__new__">+ Neue Kategorie…</option>';
  document.getElementById('custom-title').value = '';
  document.getElementById('custom-desc').value  = '';
  document.getElementById('custom-item-modal').classList.add('open');
}

async function saveCustomItem() {
  let category = document.getElementById('custom-category').value;
  const title  = document.getElementById('custom-title').value.trim();
  const desc   = document.getElementById('custom-desc').value.trim();
  if (category === '__new__') {
    category = (prompt('Neue Kategorie eingeben:') || '').trim();
    if (!category) return;
  }
  if (!title) { toast('Bitte einen Titel eingeben'); return; }
  try {
    const item = { category, title, description: desc, isMandatory: false,
      isChecked: false, isNotApplicable: false, isCustom: true, notes: '', sortOrder: 9999 };
    const saved = await SB.Items.insert(item, currentProjectId);
    cachedItems.push(saved);
    closeModal('custom-item-modal');
    renderChecklist();
    toast('Eigener Punkt hinzugefügt');
  } catch (e) { toast('Fehler: ' + e.message); }
}

async function deleteCustomItem(itemId) {
  if (!confirm('Diesen eigenen Punkt löschen?')) return;
  await SB.Items.delete(itemId);
  cachedItems = cachedItems.filter(i => i.id !== itemId);
  if (currentItemId === itemId) { await openChecklist(currentProjectId); return; }
  renderChecklist();
  toast('Punkt gelöscht');
}

// ── Spracheingabe ─────────────────────────────────────────────────────────────
function startVoiceInput(targetId) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) { toast('Spracheingabe nicht unterstützt'); return; }
  if (isListening) { recognition?.stop(); return; }
  recognition = new SpeechRec();
  recognition.lang = 'de-DE';
  recognition.continuous = false;
  recognition.interimResults = false;
  const btn = document.getElementById('voice-btn');
  isListening = true;
  btn.classList.add('listening'); btn.textContent = '🔴';
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const ta   = document.getElementById(targetId);
    ta.value   = ta.value ? ta.value + ' ' + text : text;
    onNotesChange(ta);
  };
  recognition.onerror = () => stopListening();
  recognition.onend   = () => stopListening();
  recognition.start();
}
function stopListening() {
  isListening = false;
  const btn = document.getElementById('voice-btn');
  if (btn) { btn.classList.remove('listening'); btn.textContent = '🎤'; }
}

// ── Fotos ─────────────────────────────────────────────────────────────────────
async function deletePhoto(photoId) {
  if (!confirm('Foto löschen?')) return;
  await SB.Photos.delete(photoId);
  await renderPhotos(currentItemId);
}

async function showPhotoModal(photoId) {
  const photos = await SB.Photos.list(currentItemId);
  const photo  = photos.find(p => p.id === photoId);
  if (!photo) return;
  document.getElementById('modal-photo-img').src    = photo.dataUrl;
  document.getElementById('modal-photo-desc').value = photo.description || '';
  document.getElementById('modal-photo-id').value   = photoId;
  document.getElementById('photo-modal').classList.add('open');
}

async function savePhotoDesc() {
  const id   = document.getElementById('modal-photo-id').value;
  const desc = document.getElementById('modal-photo-desc').value.trim();
  await SB.Photos.updateDesc(id, desc);
  closeModal('photo-modal');
  await renderPhotos(currentItemId);
}

// ── Bericht ──────────────────────────────────────────────────────────────────
async function openReport(projectId) {
  showView('report', 'Bericht erstellen');

  // Daten aus Cache oder frisch aus DB laden
  if (!cachedProject || cachedProject.id !== projectId) {
    try {
      const projects = await SB.Projects.list();
      cachedProject  = projects.find(p => p.id === projectId) || null;
      cachedItems    = cachedProject ? await SB.Items.list(projectId) : [];
    } catch (e) { toast('Fehler beim Laden: ' + e.message); return; }
  }
  if (!cachedProject) { toast('Projekt nicht gefunden'); return; }

  const project  = cachedProject;
  const bd       = project.buildingData || {};
  const allItems = cachedItems;
  const items    = allItems.filter(i => !i.isNotApplicable);
  const photos   = await SB.Photos.listForItems(items.map(i => i.id));
  const checked  = items.filter(i => i.isChecked).length;
  const naCount  = allItems.length - items.length;
  const pct      = items.length ? Math.round(checked / items.length * 100) : 0;

  document.getElementById('rep-name').textContent     = project.name;
  document.getElementById('rep-customer').textContent = project.customer;
  document.getElementById('rep-address').textContent  = project.address || '–';
  document.getElementById('rep-date').textContent     = project.inspectionDate
    ? new Date(project.inspectionDate).toLocaleDateString('de-DE') : '–';

  const participants = bd.participants || '';
  document.getElementById('rep-participants').textContent          = participants;
  document.getElementById('rep-participants-row').style.display    = participants ? 'flex' : 'none';

  document.getElementById('rep-funding').textContent =
    bd.projectType === 'ISFP'
      ? 'iSFP – Bestandsaufnahme'
      : (window.ENUMS.FUNDING_TYPE[bd.fundingType] || bd.fundingType || '–');

  let kfwDetail = '';
  const ft = bd.fundingType;
  if (ft === 'KFW_NEUBAU') {
    kfwDetail = window.ENUMS.KFW_NEUBAU_LEVEL?.[bd.kfwLevel] || bd.kfwLevel || 'Effizienzhaus 40';
  } else if (ft === 'KFW_SANIERUNG' || ft === 'KFW') {
    kfwDetail = window.ENUMS.KFW_LEVEL?.[bd.kfwLevel] || bd.kfwLevel || '–';
    if (bd.kfwClass === 'EE') kfwDetail += ' + EE-Klasse';
    if (bd.kfwClass === 'NH') kfwDetail += ' + NH-Klasse';
  } else if (ft === 'KFW_HEIZUNG') {
    kfwDetail = window.ENUMS.KFW_HEIZUNG_TYPE?.[bd.heizungType] || bd.heizungType || '–';
  } else if (ft === 'BAFA') {
    kfwDetail = (bd.bafaMeasures || []).map(m => window.ENUMS.BAFA_MEASURE?.[m] || m).join(', ') || '–';
  }
  document.getElementById('rep-kfw').textContent      = kfwDetail || '–';
  // Zeile immer einblenden wenn ein Förderprogramm gewählt ist
  document.getElementById('rep-kfw-row').style.display = ft ? 'flex' : 'none';

  document.getElementById('rep-total').textContent    = items.length;
  document.getElementById('rep-checked').textContent  = checked;
  document.getElementById('rep-open').textContent     = items.length - checked;
  document.getElementById('rep-photos').textContent   = photos.length;
  document.getElementById('rep-pct').textContent      = pct + '%';
  document.getElementById('rep-fill').style.width     = pct + '%';
  document.getElementById('rep-na').textContent       = naCount;
  document.getElementById('rep-na-row').style.display = naCount > 0 ? 'flex' : 'none';
}

async function generatePdf() {
  if (!window.jspdf) {
    alert('PDF-Bibliothek konnte nicht geladen werden.\n\nBitte prüfen Sie Ihre Internetverbindung und laden Sie die Seite neu (Strg+R / Browser-Reload).');
    return;
  }
  if (!cachedProject) { toast('Bitte zuerst ein Projekt öffnen'); return; }

  const project = cachedProject;
  const bd      = project.buildingData || {};
  const items   = cachedItems.filter(i => !i.isNotApplicable);
  const photos  = await SB.Photos.listForItems(items.map(i => i.id));

  try {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const PW = 210, MARGIN = 15, CW = PW - 2 * MARGIN;
  let y = 20;

  doc.setFillColor(46, 125, 50); doc.rect(0, 0, PW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  doc.text('Bauabnahme / Begehungsprotokoll', MARGIN, 12);
  doc.setFontSize(9); doc.setFont(undefined, 'normal');
  doc.text(`Erstellt: ${new Date().toLocaleString('de-DE')}`, MARGIN, 20);
  doc.setTextColor(0, 0, 0); y = 36;

  doc.setFontSize(14); doc.setFont(undefined, 'bold');
  doc.text(project.name, MARGIN, y); y += 7;
  doc.setFontSize(10); doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Kunde: ${project.customer}`, MARGIN, y); y += 5;
  if (project.address) { doc.text(`Adresse: ${project.address}`, MARGIN, y); y += 5; }
  if (project.inspectionDate) {
    doc.text(`Begehungsdatum: ${new Date(project.inspectionDate).toLocaleDateString('de-DE')}`, MARGIN, y); y += 5;
  }
  if (bd.participants) {
    const pl = doc.splitTextToSize(`Teilnehmer: ${bd.participants}`, CW);
    doc.text(pl, MARGIN, y); y += pl.length * 4.5;
  }
  const ftLabel = window.ENUMS.FUNDING_TYPE?.[bd.fundingType] || bd.fundingType || '';
  let levelLabel = '';
  if (bd.fundingType === 'KFW_NEUBAU') {
    levelLabel = window.ENUMS.KFW_NEUBAU_LEVEL?.[bd.kfwLevel] || bd.kfwLevel || 'Effizienzhaus 40';
  } else if (bd.fundingType === 'KFW_SANIERUNG' || bd.fundingType === 'KFW') {
    levelLabel = window.ENUMS.KFW_LEVEL?.[bd.kfwLevel] || bd.kfwLevel || '';
    if (bd.kfwClass === 'EE') levelLabel += ' + EE-Klasse';
    if (bd.kfwClass === 'NH') levelLabel += ' + NH-Klasse';
  } else if (bd.fundingType === 'KFW_HEIZUNG') {
    levelLabel = window.ENUMS.KFW_HEIZUNG_TYPE?.[bd.heizungType] || bd.heizungType || '';
  }
  doc.text(`Projektart: ${ftLabel}${levelLabel ? ' - ' + levelLabel : ''}`, MARGIN, y); y += 5;
  doc.setTextColor(0, 0, 0);

  const checked = items.filter(i => i.isChecked).length;
  const pct = items.length ? checked / items.length : 0;
  y += 4;
  doc.setFontSize(11); doc.setFont(undefined, 'bold');
  doc.text(`Fortschritt: ${checked} / ${items.length} geprueft (${Math.round(pct*100)}%)`, MARGIN, y); y += 4;
  doc.setFillColor(220,220,220); doc.rect(MARGIN, y, CW, 5, 'F');
  doc.setFillColor(76,175,80);   doc.rect(MARGIN, y, CW*pct, 5, 'F');
  y += 12;
  doc.setDrawColor(200,200,200); doc.line(MARGIN, y-3, PW-MARGIN, y-3);

  const grouped = {};
  items.forEach(item => { (grouped[item.category] ??= []).push(item); });

  for (const [cat, catItems] of Object.entries(grouped)) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(232,245,233);
    doc.rect(MARGIN-2, y-4, CW+4, 7, 'F');
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.setTextColor(27,94,32);
    doc.text(cat, MARGIN, y); y += 6;
    doc.setTextColor(0,0,0);

    for (const item of catItems) {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      // ASCII-Zeichen statt Unicode (jsPDF Standard-Font)
      const mark = item.isChecked ? '[OK]' : '[  ]';
      const customMark = item.isCustom ? ' [eigener Punkt]' : '';
      const lines = doc.splitTextToSize(`${mark} ${item.title}${item.isMandatory?' *':''}${customMark}`, CW-6);
      doc.setTextColor(item.isChecked ? 120 : 0, item.isChecked ? 120 : 0, item.isChecked ? 120 : 0);
      doc.text(lines, MARGIN+2, y); y += lines.length * 4.5;
      if (item.description) {
        doc.setFontSize(8); doc.setTextColor(120,120,120);
        const dl = doc.splitTextToSize(item.description, CW-10);
        doc.text(dl, MARGIN+6, y); y += dl.length*4;
      }
      if (item.notes) {
        doc.setFontSize(8); doc.setTextColor(46,125,50);
        const nl = doc.splitTextToSize('Notiz: ' + item.notes, CW-10);
        doc.text(nl, MARGIN+6, y); y += nl.length * 4;
      }
      const itemPhotos = photos.filter(p => p.checklistItemId === item.id);
      if (itemPhotos.length) {
        let px = MARGIN+6;
        for (const photo of itemPhotos.slice(0, 4)) {
          if (y > 250 || px+30 > PW-MARGIN) break;
          try {
            doc.addImage(photo.dataUrl, 'JPEG', px, y, 25, 25);
            if (photo.description) {
              doc.setFontSize(6); doc.setTextColor(80,80,80);
              doc.text(doc.splitTextToSize(photo.description, 25), px, y+27);
            }
            px += 28;
          } catch {}
        }
        y += 32;
      }
      doc.setTextColor(0,0,0); y += 1;
    }
    y += 3;
  }
  const filename = `Bauabnahme_${project.name.replace(/[^a-zA-Z0-9]/g,'_')}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  toast('PDF wird heruntergeladen…');

  } catch (err) {
    alert('PDF-Fehler: ' + err.message + '\n\nBitte melden Sie diesen Fehler.');
    console.error('PDF generation error:', err);
  }
}

async function exportCsv() {
  const project = cachedProject;
  const items   = cachedItems.filter(i => !i.isNotApplicable);
  const BOM = '﻿';
  const rows = [
    ['Kategorie','Prüfpunkt','Eigener Punkt','Pflicht','Geprüft','Notizen','Beschreibung'],
    ...items.map(i => [
      i.category, i.title,
      i.isCustom    ? 'Ja' : 'Nein',
      i.isMandatory ? 'Ja' : 'Nein',
      i.isChecked   ? 'Ja' : 'Nein',
      i.notes || '', i.description || ''
    ])
  ];
  const csv = BOM + rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
  downloadBlob(csv, `Bauabnahme_${project.name.replace(/[^a-zA-Z0-9]/g,'_')}.csv`, 'text/csv;charset=utf-8;');
  toast('CSV exportiert');
}

function sendEmail() {
  const project = cachedProject;
  const subject = encodeURIComponent(`Bauabnahme: ${project.name}`);
  const body    = encodeURIComponent(`Anbei der Begehungsbericht für ${project.name} / ${project.customer}.\n\nBitte als Anhang separat per PDF senden.`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// ── Export / Import ───────────────────────────────────────────────────────────
async function exportData() {
  try {
    toast('Export wird erstellt…');
    const data = await SB.exportAllData();
    const json = JSON.stringify(data, null, 2);
    downloadBlob(json, `Bauabnahme_Export_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
    toast('Export abgeschlossen');
  } catch (e) { toast('Export-Fehler: ' + e.message); }
}

async function importData(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    toast('Import läuft…');
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Ungültiges Dateiformat');
    await SB.importData(data);
    input.value = '';
    toast('Import abgeschlossen');
    await renderProjectList();
  } catch (e) { toast('Import-Fehler: ' + e.message); input.value = ''; }
}

// ── Projekt löschen ───────────────────────────────────────────────────────────
async function deleteProject(id) {
  if (!confirm('Projekt und alle zugehörigen Daten löschen?')) return;
  await SB.Projects.delete(id);
  await renderProjectList();
  toast('Projekt gelöscht');
}

// ── Formular-Hilfsfunktionen ──────────────────────────────────────────────────
function onProjectTypeChange() {
  const pt = document.getElementById('f-project-type').value;
  const isISFP = pt === 'ISFP';
  document.getElementById('s-bauabnahme-fields').style.display = isISFP ? 'none'  : 'block';
  document.getElementById('s-isfp-fields').style.display       = isISFP ? 'block' : 'none';
}
function onFundingChange() {
  const v = document.getElementById('f-funding').value;
  document.getElementById('s-kfw-neubau').style.display  = v === 'KFW_NEUBAU'   ? 'block' : 'none';
  document.getElementById('s-kfw-san').style.display     = v === 'KFW_SANIERUNG' ? 'block' : 'none';
  document.getElementById('s-kfw-heizung').style.display = v === 'KFW_HEIZUNG'   ? 'block' : 'none';
  document.getElementById('s-bafa').style.display        = v === 'BAFA'          ? 'block' : 'none';
}
function onToggle(checkId, sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.style.display = document.getElementById(checkId).checked ? 'block' : 'none';
}
function getMultiCheck(groupId) {
  return [...document.querySelectorAll(`#${groupId} input[type=checkbox]:checked`)].map(cb => cb.value);
}
function setMultiCheck(groupId, values) {
  document.querySelectorAll(`#${groupId} input[type=checkbox]`).forEach(cb => { cb.checked = values.includes(cb.value); });
}
function setToggle(id, val) { document.getElementById(id).checked = !!val; }

// ── Allgemeine Hilfen ─────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function fileToDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Foto-Aufnahme (Kamera + Galerie – gleicher Handler)
  async function handlePhotoInput(e) {
    const file = e.target.files[0];
    if (!file || currentItemId === null) return;
    const itemId = currentItemId;   // lokale Kopie, bevor async-Kette startet
    try {
      const dataUrl = await fileToDataUrl(file);
      if (!itemId) { toast('Kein Prüfpunkt ausgewählt'); e.target.value = ''; return; }
      const photo = await SB.Photos.save({ checklistItemId: itemId, dataUrl, description: '' });
      await renderPhotos(itemId);
      e.target.value = '';
      // Beschreibungsmodal öffnen
      document.getElementById('modal-photo-img').src    = photo.dataUrl;
      document.getElementById('modal-photo-desc').value = '';
      document.getElementById('modal-photo-id').value   = photo.id;
      document.getElementById('photo-modal').classList.add('open');
    } catch (err) {
      toast('Fehler beim Speichern: ' + err.message);
      e.target.value = '';
    }
  }
  document.getElementById('photo-input-camera').addEventListener('change',  handlePhotoInput);
  document.getElementById('photo-input-gallery').addEventListener('change', handlePhotoInput);

  // Auth-Zustand beobachten
  // sessionActive-Flag verhindert Navigation bei Token-Refresh / Kamera-Rückkehr
  let sessionActive = false;
  SB.Auth.onChange((event, user) => {
    if (user && !sessionActive) {
      // Echter Übergang: nicht eingeloggt → eingeloggt
      sessionActive = true;
      openProjectList();
    } else if (!user && sessionActive) {
      // Echter Übergang: eingeloggt → ausgeloggt
      sessionActive = false;
      showLoginView();
    } else if (!user && !sessionActive) {
      // Seiten-Load ohne Session
      showLoginView();
    }
    // Bereits eingeloggt und user != null → ignorieren (Token-Refresh, Kamera etc.)
  });
});

// Globale Funktionen für onclick-Handler
window.login            = login;
window.register         = register;
window.logout           = logout;
window.goBack           = goBack;
window.newProject       = newProject;
window.editProject      = editProject;
window.saveProject      = saveProject;
window.deleteProject    = deleteProject;
window.openChecklist    = openChecklist;
window.toggleCategory   = toggleCategory;
window.toggleItem       = toggleItem;
window.toggleNA         = toggleNA;
window.openItemDetail   = openItemDetail;
window.onCheckedChange  = onCheckedChange;
window.onNotesChange    = onNotesChange;
window.toggleNADetail   = toggleNADetail;
window.openAddCustomItem = openAddCustomItem;
window.saveCustomItem   = saveCustomItem;
window.deleteCustomItem = deleteCustomItem;
window.startVoiceInput  = startVoiceInput;
window.deletePhoto      = deletePhoto;
window.showPhotoModal   = showPhotoModal;
window.savePhotoDesc    = savePhotoDesc;
window.openReport       = openReport;
window.generatePdf      = generatePdf;
window.exportCsv        = exportCsv;
window.sendEmail        = sendEmail;
window.exportData       = exportData;
window.importData       = importData;
window.onFundingChange      = onFundingChange;
window.onProjectTypeChange  = onProjectTypeChange;
window.onToggle             = onToggle;
window.closeModal           = closeModal;
window.openFloorPlan        = openFloorPlan;
window.onFloorPlanFile      = onFloorPlanFile;
window.addFloorPlanPin      = addFloorPlanPin;
window.deleteFloorPlan      = deleteFloorPlan;
window.savePinModal         = savePinModal;
window.deletePinModal       = deletePinModal;
window.onPinPhoto           = onPinPhoto;

// ── Grundrissplan ─────────────────────────────────────────────────────────────
async function openFloorPlan() {
  if (!currentProjectId) return;
  showView('floor-plan', 'Grundrisse');
  try {
    currentFloorPlans = await SB.FloorPlans.list(currentProjectId);
    currentPins = {};
    // Pins für alle Pläne laden
    for (const plan of currentFloorPlans) {
      currentPins[plan.id] = await SB.FloorPins.list(plan.id);
    }
    currentPlanIdx = 0;
    renderFloorPlanTabs();
    renderCurrentPlan();
  } catch (e) { toast('Fehler: ' + e.message); }
}

function renderFloorPlanTabs() {
  const tabs = document.getElementById('fp-plan-tabs');
  if (currentFloorPlans.length === 0) { tabs.style.display = 'none'; return; }
  tabs.style.display = 'block';
  tabs.innerHTML = currentFloorPlans.map((p, i) =>
    `<button class="btn ${i === currentPlanIdx ? 'btn-primary' : 'btn-outline'}"
             style="font-size:12px;padding:6px 12px;margin-right:6px"
             onclick="selectPlanTab(${i})">${esc(p.name)}</button>`
  ).join('');
}

function selectPlanTab(idx) {
  currentPlanIdx = idx;
  renderFloorPlanTabs();
  renderCurrentPlan();
}
window.selectPlanTab = selectPlanTab;

function renderCurrentPlan() {
  const canvas    = document.getElementById('fp-canvas');
  const emptyMsg  = document.getElementById('fp-empty');
  const pinsDiv   = document.getElementById('fp-pins');
  const btnPin    = document.getElementById('btn-add-pin');
  const btnDel    = document.getElementById('btn-del-plan');
  const pinList   = document.getElementById('fp-pin-list');

  if (currentFloorPlans.length === 0) {
    canvas.style.display   = 'none';
    emptyMsg.style.display = 'flex';
    pinsDiv.innerHTML      = '';
    pinList.innerHTML      = '';
    btnPin.disabled        = true;
    btnDel.style.display   = 'none';
    return;
  }

  const plan = currentFloorPlans[currentPlanIdx];
  emptyMsg.style.display = 'none';
  canvas.style.display   = 'block';
  btnPin.disabled        = false;
  btnDel.style.display   = 'inline-flex';

  // Bild auf Canvas zeichnen
  const img = new Image();
  img.onload = () => {
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    renderPinMarkers(plan);
  };
  img.src = plan.dataUrl;

  renderPinList(plan);
}

function renderPinMarkers(plan) {
  const pinsDiv  = document.getElementById('fp-pins');
  const canvasEl = document.getElementById('fp-canvas');
  const pins     = currentPins[plan.id] || [];
  pinsDiv.innerHTML = pins.map((pin, i) =>
    `<div class="fp-pin" style="left:${pin.xPct*100}%;top:${pin.yPct*100}%"
          onclick="openPinModal('${plan.id}','${pin.id}')"
          title="${esc(pin.label)}">
       <span>${i + 1}</span>
     </div>`
  ).join('');

  // Tippen/Klicken auf Canvas zum Setzen neuer Pins
  canvasEl.onclick = (e) => {
    if (!pinPlacingMode) return;
    const rect = canvasEl.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top)  / rect.height;
    pinPlacingMode = false;
    document.getElementById('btn-add-pin').textContent = '📍 Pin setzen';
    placeNewPin(plan.id, xPct, yPct);
  };
}

function renderPinList(plan) {
  const pins    = currentPins[plan.id] || [];
  const pinList = document.getElementById('fp-pin-list');
  if (pins.length === 0) { pinList.innerHTML = ''; return; }
  pinList.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">📌 Pins auf diesem Grundriss (${pins.length})</div>
    ${pins.map((pin, i) => `
      <div class="card card-body" style="margin-bottom:8px;padding:10px 14px;display:flex;gap:12px;align-items:flex-start"
           onclick="openPinModal('${plan.id}','${pin.id}')">
        <div class="fp-pin-num">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${esc(pin.label) || '(ohne Bezeichnung)'}</div>
          ${pin.description ? `<div style="font-size:12px;color:var(--outline);margin-top:2px">${esc(pin.description)}</div>` : ''}
        </div>
      </div>`).join('')}`;
}
window.openPinModal = openPinModal;

async function placeNewPin(planId, xPct, yPct) {
  try {
    const pin = await SB.FloorPins.save({ floorPlanId: planId, xPct, yPct, label: '', description: '' });
    if (!currentPins[planId]) currentPins[planId] = [];
    currentPins[planId].push(pin);
    renderCurrentPlan();
    openPinModal(planId, pin.id);
  } catch (e) { toast('Fehler: ' + e.message); }
}

function addFloorPlanPin() {
  if (currentFloorPlans.length === 0) { toast('Zuerst einen Grundriss laden'); return; }
  pinPlacingMode = !pinPlacingMode;
  document.getElementById('btn-add-pin').textContent = pinPlacingMode ? '❌ Abbrechen' : '📍 Pin setzen';
  if (pinPlacingMode) toast('Auf den Grundriss tippen, um einen Pin zu setzen');
}

function openPinModal(planId, pinId) {
  const pins = currentPins[planId] || [];
  const pin  = pins.find(p => p.id === pinId);
  if (!pin) return;
  currentPinId = { planId, pinId };
  const idx = pins.indexOf(pin) + 1;
  document.getElementById('pin-modal-title').textContent = `📍 Pin ${idx}`;
  document.getElementById('pin-modal-id').value          = pinId;
  document.getElementById('pin-modal-label').value       = pin.label || '';
  document.getElementById('pin-modal-desc').value        = pin.description || '';
  document.getElementById('pin-modal-photos').innerHTML  = '';
  document.getElementById('pin-modal').classList.add('open');
  loadPinPhotos(pinId);
}

async function savePinModal() {
  if (!currentPinId) return;
  const { planId, pinId } = currentPinId;
  const pins = currentPins[planId] || [];
  const pin  = pins.find(p => p.id === pinId);
  if (!pin) return;
  pin.label       = document.getElementById('pin-modal-label').value.trim();
  pin.description = document.getElementById('pin-modal-desc').value.trim();
  try {
    await SB.FloorPins.save({ ...pin, floorPlanId: planId });
    closeModal('pin-modal');
    renderCurrentPlan();
  } catch (e) { toast('Fehler: ' + e.message); }
}

async function deletePinModal() {
  if (!currentPinId) return;
  const { planId, pinId } = currentPinId;
  if (!confirm('Pin löschen?')) return;
  try {
    await SB.FloorPins.delete(pinId);
    currentPins[planId] = (currentPins[planId] || []).filter(p => p.id !== pinId);
    closeModal('pin-modal');
    renderCurrentPlan();
  } catch (e) { toast('Fehler: ' + e.message); }
}

async function onPinPhoto(input) {
  const file = input.files[0];
  if (!file || !currentPinId) return;
  const { pinId } = currentPinId;
  try {
    const dataUrl = await fileToDataUrl(file);
    const photo   = await SB.PinPhotos.save({ pinId, dataUrl, description: document.getElementById('pin-modal-label').value || '' });
    appendPinPhotoThumb(photo);
    input.value = '';
  } catch (e) { toast('Fehler: ' + e.message); input.value = ''; }
}

function appendPinPhotoThumb(photo) {
  const container = document.getElementById('pin-modal-photos');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;display:inline-block';
  const img = document.createElement('img');
  img.src = photo.dataUrl;
  img.style.cssText = 'width:72px;height:72px;object-fit:cover;border-radius:8px;cursor:pointer;display:block';
  img.onclick = () => {
    document.getElementById('modal-photo-img').src    = photo.dataUrl;
    document.getElementById('modal-photo-id').value   = photo.id;
    document.getElementById('modal-photo-desc').value = photo.description;
    document.getElementById('photo-modal').classList.add('open');
  };
  const del = document.createElement('button');
  del.textContent = '✕';
  del.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;padding:0;line-height:1';
  del.onclick = async (e) => { e.stopPropagation(); await SB.PinPhotos.delete(photo.id); wrap.remove(); };
  wrap.appendChild(img);
  wrap.appendChild(del);
  container.appendChild(wrap);
}

async function loadPinPhotos(pinId) {
  const container = document.getElementById('pin-modal-photos');
  container.innerHTML = '';
  try {
    const photos = await SB.PinPhotos.list(pinId);
    photos.forEach(appendPinPhotoThumb);
  } catch (e) { /* ignore */ }
}

async function onFloorPlanFile(input) {
  const file = input.files[0];
  if (!file || !currentProjectId) return;
  toast('Grundriss wird geladen…');
  try {
    let dataUrl;
    if (file.type === 'application/pdf') {
      dataUrl = await renderPdfPageToDataUrl(file);
    } else {
      dataUrl = await fileToDataUrl(file);
    }
    const name = file.name.replace(/\.[^.]+$/, '') || 'Grundriss';
    const plan = await SB.FloorPlans.save({ projectId: currentProjectId, name, dataUrl });
    currentFloorPlans.push(plan);
    currentPins[plan.id] = [];
    currentPlanIdx = currentFloorPlans.length - 1;
    renderFloorPlanTabs();
    renderCurrentPlan();
    input.value = '';
    toast('Grundriss geladen');
  } catch (e) { toast('Fehler: ' + e.message); input.value = ''; }
}

async function renderPdfPageToDataUrl(file) {
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js nicht geladen');
  const arrayBuffer = await file.arrayBuffer();
  const pdf    = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page   = await pdf.getPage(1);
  const scale  = 2.0;
  const vp     = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width  = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL('image/png');
}

async function deleteFloorPlan() {
  if (currentFloorPlans.length === 0) return;
  if (!confirm('Diesen Grundriss (inkl. Pins) löschen?')) return;
  const plan = currentFloorPlans[currentPlanIdx];
  try {
    await SB.FloorPlans.delete(plan.id);
    delete currentPins[plan.id];
    currentFloorPlans.splice(currentPlanIdx, 1);
    currentPlanIdx = Math.max(0, currentPlanIdx - 1);
    renderFloorPlanTabs();
    renderCurrentPlan();
    toast('Grundriss gelöscht');
  } catch (e) { toast('Fehler: ' + e.message); }
}
