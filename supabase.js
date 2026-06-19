'use strict';

// ── Konfiguration ─────────────────────────────────────────────────────────────
// Werte aus: Supabase Dashboard → Ihr Projekt → Settings → API
const SUPABASE_URL      = 'https://ufyhuzhupqocudegtaiq.supabase.co';  // ← anpassen
const SUPABASE_ANON_KEY = 'sb_publishable_4HLKG7BQpiMIROdggzsEKQ_BgSdW5KV'; // ← anpassen

// ── Client ────────────────────────────────────────────────────────────────────
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function chk(res) {
  if (res.error) throw res.error;
  return res.data;
}
async function getUid() {
  const { data } = await sb.auth.getUser();
  return data.user.id;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const Auth = {
  signIn:   (email, pw) => sb.auth.signInWithPassword({ email, password: pw }),
  signUp:   (email, pw) => sb.auth.signUp({ email, password: pw }),
  signOut:  ()           => sb.auth.signOut(),
  getUser:  ()           => sb.auth.getUser(),
  onChange: (cb)         => sb.auth.onAuthStateChange((event, s) => cb(event, s?.user ?? null))
};

// ── Projekte ──────────────────────────────────────────────────────────────────
const Projects = {
  async list() {
    return chk(await sb.from('projects').select('*').order('created_at', { ascending: false })).map(rowToProject);
  },
  async save(p) {
    const uid = await getUid();
    const row = {
      user_id:         uid,
      name:            p.name,
      customer:        p.customer,
      address:         p.address || '',
      inspection_date: p.inspectionDate || null,
      building_data:   p.buildingData,
      updated_at:      new Date().toISOString()
    };
    if (p.id) {
      return rowToProject(chk(await sb.from('projects').update(row).eq('id', p.id).select().single()));
    } else {
      return rowToProject(chk(await sb.from('projects').insert(row).select().single()));
    }
  },
  async delete(id) { chk(await sb.from('projects').delete().eq('id', id)); }
};

function rowToProject(r) {
  return {
    id:             r.id,
    name:           r.name,
    customer:       r.customer,
    address:        r.address || '',
    inspectionDate: r.inspection_date || '',
    buildingData:   r.building_data || {},
    createdAt:      r.created_at,
    updatedAt:      r.updated_at
  };
}

// ── Checklisten-Punkte ────────────────────────────────────────────────────────
const Items = {
  async list(projectId) {
    return chk(await sb.from('checklist_items').select('*')
      .eq('project_id', projectId).order('sort_order')).map(rowToItem);
  },
  async listFotodoku(projectId) {
    return chk(await sb.from('checklist_items').select('*')
      .eq('project_id', projectId)
      .eq('category', '__FOTODOKU__')
      .order('created_at', { ascending: false })).map(rowToItem);
  },
  async updateFotodoku(item) {
    chk(await sb.from('checklist_items').update({
      title: item.title || '',
      notes: item.notes || ''
    }).eq('id', item.id));
  },
  async insertMany(projectId, items) {
    const uid = await getUid();
    const rows = items.map(item => itemToRow(item, projectId, uid));
    return chk(await sb.from('checklist_items').insert(rows).select()).map(rowToItem);
  },
  async insert(item, projectId) {
    const uid = await getUid();
    return rowToItem(chk(await sb.from('checklist_items')
      .insert(itemToRow(item, projectId, uid)).select().single()));
  },
  async update(item) {
    chk(await sb.from('checklist_items').update({
      is_checked:        !!item.isChecked,
      is_not_applicable: !!item.isNotApplicable,
      notes:             item.notes || ''
    }).eq('id', item.id));
  },
  async delete(id) { chk(await sb.from('checklist_items').delete().eq('id', id)); }
};

function rowToItem(r) {
  return {
    id:              r.id,
    projectId:       r.project_id,
    category:        r.category,
    title:           r.title,
    description:     r.description || '',
    isChecked:       !!r.is_checked,
    isMandatory:     !!r.is_mandatory,
    isNotApplicable: !!r.is_not_applicable,
    isCustom:        !!r.is_custom,
    notes:           r.notes || '',
    sortOrder:       r.sort_order
  };
}
function itemToRow(item, projectId, uid) {
  return {
    project_id:        projectId,
    user_id:           uid,
    category:          item.category,
    title:             item.title,
    description:       item.description || '',
    is_checked:        !!item.isChecked,
    is_mandatory:      item.isMandatory !== false,
    is_not_applicable: !!item.isNotApplicable,
    is_custom:         !!item.isCustom,
    notes:             item.notes || '',
    sort_order:        item.sortOrder ?? item.order ?? 0
  };
}

// ── Fotos ─────────────────────────────────────────────────────────────────────
const Photos = {
  async list(itemId) {
    return chk(await sb.from('photos').select('*')
      .eq('checklist_item_id', itemId).order('taken_at')).map(rowToPhoto);
  },
  async listForItems(itemIds) {
    if (!itemIds.length) return [];
    // In Batches à 10 aufteilen – vermeidet Supabase Statement-Timeout bei vielen Items
    const BATCH = 10;
    const results = [];
    for (let i = 0; i < itemIds.length; i += BATCH) {
      const chunk = itemIds.slice(i, i + BATCH);
      const rows  = chk(await sb.from('photos').select('*').in('checklist_item_id', chunk));
      results.push(...rows.map(rowToPhoto));
    }
    return results;
  },
  async save(photo) {
    const uid = await getUid();
    return rowToPhoto(chk(await sb.from('photos').insert({
      checklist_item_id: photo.checklistItemId,
      user_id:           uid,
      data_url:          photo.dataUrl,
      description:       photo.description || '',
      taken_at:          new Date().toISOString()
    }).select().single()));
  },
  async updateDesc(id, desc) {
    chk(await sb.from('photos').update({ description: desc }).eq('id', id));
  },
  async delete(id) { chk(await sb.from('photos').delete().eq('id', id)); }
};

function rowToPhoto(r) {
  return {
    id:              r.id,
    checklistItemId: r.checklist_item_id,
    dataUrl:         r.data_url,
    description:     r.description || '',
    takenAt:         r.taken_at
  };
}

// ── Grundrisspläne ────────────────────────────────────────────────────────────
const FloorPlans = {
  async list(projectId) {
    return chk(await sb.from('floor_plans').select('*')
      .eq('project_id', projectId).order('created_at')).map(rowToFloorPlan);
  },
  async save(plan) {
    const uid = await getUid();
    return rowToFloorPlan(chk(await sb.from('floor_plans').insert({
      project_id: plan.projectId,
      user_id:    uid,
      name:       plan.name,
      data_url:   plan.dataUrl
    }).select().single()));
  },
  async delete(id) { chk(await sb.from('floor_plans').delete().eq('id', id)); }
};
function rowToFloorPlan(r) {
  return { id: r.id, projectId: r.project_id, name: r.name, dataUrl: r.data_url, createdAt: r.created_at };
}

// ── Grundriss-Pins ────────────────────────────────────────────────────────────
const FloorPins = {
  async list(floorPlanId) {
    return chk(await sb.from('floor_plan_pins').select('*')
      .eq('floor_plan_id', floorPlanId).order('created_at')).map(rowToPin);
  },
  async listForPlans(planIds) {
    if (!planIds.length) return [];
    return chk(await sb.from('floor_plan_pins').select('*')
      .in('floor_plan_id', planIds)).map(rowToPin);
  },
  async save(pin) {
    const uid = await getUid();
    const row = {
      floor_plan_id: pin.floorPlanId,
      user_id:       uid,
      label:         pin.label || '',
      x_pct:         pin.xPct,
      y_pct:         pin.yPct,
      description:   pin.description || ''
    };
    if (pin.id) {
      return rowToPin(chk(await sb.from('floor_plan_pins').update(row).eq('id', pin.id).select().single()));
    }
    return rowToPin(chk(await sb.from('floor_plan_pins').insert(row).select().single()));
  },
  async delete(id) { chk(await sb.from('floor_plan_pins').delete().eq('id', id)); }
};
function rowToPin(r) {
  return {
    id: r.id, floorPlanId: r.floor_plan_id,
    label: r.label, xPct: r.x_pct, yPct: r.y_pct,
    description: r.description || '', createdAt: r.created_at
  };
}

// ── Pin-Fotos ─────────────────────────────────────────────────────────────────
const PinPhotos = {
  async list(pinId) {
    return chk(await sb.from('pin_photos').select('*')
      .eq('pin_id', pinId).order('taken_at')).map(rowToPinPhoto);
  },
  async save(photo) {
    const uid = await getUid();
    return rowToPinPhoto(chk(await sb.from('pin_photos').insert({
      pin_id:      photo.pinId,
      user_id:     uid,
      data_url:    photo.dataUrl,
      description: photo.description || '',
      taken_at:    new Date().toISOString()
    }).select().single()));
  },
  async delete(id) { chk(await sb.from('pin_photos').delete().eq('id', id)); }
};
function rowToPinPhoto(r) {
  return { id: r.id, pinId: r.pin_id, dataUrl: r.data_url, description: r.description || '', takenAt: r.taken_at };
}

// ── Export / Import ───────────────────────────────────────────────────────────
async function exportAllData() {
  const projects = await Projects.list();
  const out = [];
  for (const p of projects) {
    const items   = await Items.list(p.id);
    const photos  = await Photos.listForItems(items.map(i => i.id));
    out.push({ project: p, items, photos });
  }
  return out;
}

async function importData(entries) {
  for (const entry of entries) {
    const saved = await Projects.save({ ...entry.project, id: undefined });
    if (!entry.items?.length) continue;
    const savedItems = await Items.insertMany(saved.id, entry.items);
    const idMap = {};
    entry.items.forEach((old, i) => { if (savedItems[i]) idMap[old.id] = savedItems[i].id; });
    for (const ph of (entry.photos || [])) {
      const newId = idMap[ph.checklistItemId];
      if (newId) await Photos.save({ checklistItemId: newId, dataUrl: ph.dataUrl, description: ph.description });
    }
  }
}

window.SB = { Auth, Projects, Items, Photos, FloorPlans, FloorPins, PinPhotos, exportAllData, importData };
