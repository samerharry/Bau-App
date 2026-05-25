'use strict';

// ── Enum-Labels ──────────────────────────────────────────────────────────────
const FUNDING_TYPE = {
  KFW_NEUBAU:    'KfW Klimafreundlicher Neubau (KFN)',
  KFW_SANIERUNG: 'KfW Sanierung Effizienzhaus (BEG WG)',
  KFW_HEIZUNG:   'KfW Heizungstausch (BEG EM · KfW 458)',
  BAFA:          'BAFA Einzelmaßnahmen (BEG EM)',
  // backward-compat
  KFW:           'KfW Sanierung Effizienzhaus'
};
const KFW_NEUBAU_LEVEL = {
  KFN:      'KFN Standard (Effizienzhaus 40)',
  KFN_PLUS: 'KFN Plus (Effizienzhaus 40 + NH-Klasse)'
};
const KFW_LEVEL = {
  KFW_40:      'Effizienzhaus 40',
  KFW_55:      'Effizienzhaus 55',
  KFW_70:      'Effizienzhaus 70',
  KFW_85:      'Effizienzhaus 85',
  KFW_DENKMAL: 'Effizienzhaus Denkmal',
  // backward-compat (old projects)
  KFW_40_PLUS: 'Effizienzhaus 40 (NH-Klasse)',
  KFW_40_EE:   'Effizienzhaus 40 (EE-Klasse)',
  KFW_55_EE:   'Effizienzhaus 55 (EE-Klasse)'
};
const KFW_HEIZUNG_TYPE = {
  WAERMEPUMPE: 'Wärmepumpe',
  BIOMASSE:    'Biomasseheizung (Pellets / Hackschnitzel)',
  HYBRID:      'Hybridheizung (Wärmepumpe + Gas/Öl)',
  FERNWAERME:  'Fernwärme / Wärmenetz'
};
const BAFA_MEASURE = {
  WAERMEPUMPE:       'Wärmepumpe',
  PELLETKESSEL:      'Pelletkessel / Hackschnitzel',
  GAS_HYBRID:        'Gas-Brennwertkessel (Hybridheizung)',
  SOLARTHERMIE:      'Solarthermie',
  FASSADE:           'Fassadendämmung (WDVS / VHF)',
  DACH:              'Dachdämmung / Dachbodendämmung',
  KELLER:            'Kellerdecken- / Perimeterdämmung',
  FENSTER:           'Fenster und Außentüren',
  LUEFTUNG:          'Lüftungsanlage mit WRG',
  HEIZOPT:           'Heizungsoptimierung',
  FERNWAERME:        'Fernwärme / Wärmenetze'
};
const HEAT_GEN = {
  WP_LUFT:     'Luftwärmepumpe (Luft/Wasser)',
  WP_SOLE:     'Solewärmepumpe (Erde/Wasser)',
  WP_WASSER:   'Grundwasserwärmepumpe (Wasser/Wasser)',
  WP_LL:       'Luft-Luft-Wärmepumpe',
  GAS:         'Gas-Brennwertkessel',
  PELLET:      'Pelletkessel',
  HOLZ:        'Holzvergaser / Scheitholzkessel',
  SOLAR:       'Solarthermie (Heizungsunterstützung)',
  FERN:        'Fernwärme / Nahwärme',
  BHKW:        'BHKW / Mikro-KWK',
  ELEKTRO:     'Elektrische Direktheizung',
  OEL:         'Ölkessel',
  HYBRID:      'Hybridheizung (WP + Gas)'
};
const HEAT_DIST = {
  HK:   'Heizkörper',
  FBH:  'Fußbodenheizung',
  WAND: 'Wandheizung',
  DECK: 'Deckenheizung',
  FC:   'Gebläsekonvektoren / Fan Coils'
};
const VENT_TYPE = {
  ZAL:    'Zentrale Lüftungsanlage (ZAL)',
  ERG_ZU: 'Einzelraumgeräte – Zu-/Abluftgeräte (dezentral)',
  ERG_PP: 'Einzelraumgeräte – Push-Pull-Systeme',
  ERG:    'Einzelraumgeräte (dezentral)',
  ABL:    'Abluftanlage (ohne WRG)'
};
const WINDOW_TYPE = {
  W2:  '2-fach Verglasung',
  W3:  '3-fach Verglasung',
  W3P: '3-fach Verglasung (Passivhaus)'
};
const WINDOW_FRAME = {
  KST:  'Kunststoff',
  HOLZ: 'Holz',
  ALU:  'Aluminium',
  HA:   'Holz-Aluminium',
  ST:   'Stahl'
};
const SUN_PROT = {
  JAL:  'Außenjalousie',
  ROLL: 'Rolladen',
  MARK: 'Markise',
  INN:  'Innenliegender Sonnenschutz',
  BVSH: 'Bauliche Verschattung',
  GLAS: 'Sonnenschutzverglasung (g-Wert)'
};
const WALL_INS = {
  WDVS_EPS:  'WDVS mit EPS (Polystyrol)',
  WDVS_MW:   'WDVS mit Mineralwolle',
  WDVS_HF:   'WDVS mit Holzfaserdämmplatte',
  VHF:       'Vorgehängte hinterlüftete Fassade (VHF)',
  KVH_MW:    'Holzrahmenbau, Gefach Mineralwolle',
  KVH_HF:    'Holzrahmenbau, Gefach Holzfaser',
  EINBLAS:   'Einblasdämmung (Kerndämmung)',
  INNEN:     'Innendämmung'
};
const ROOF_INS = {
  AUF:    'Aufdachdämmung (Sarking)',
  ZWISCH: 'Zwischensparrendämmung',
  Z_U:    'Zwischen- + Untersparrendämmung',
  Z_AUF:  'Zwischen- + Aufsparrendämmung (kombiniert)',
  BODEN:  'Dachbodendämmung (oberste Geschossdecke)',
  FLACH:  'Flachdach- / Terrassendämmung'
};
const WB_TYPE = {
  FENSTER: 'Fensterlaibungen / Stürze',
  DACH:    'Dach- / Deckenanschlüsse',
  KELLER:  'Keller- / Sockelanschlüsse',
  BALKON:  'Balkone / Loggien',
  ECKEN:   'Gebäudeecken',
  ROLLADEN:'Rollladenkästen',
  STURZ:   'Türsturz / Ringanker',
  RING:    'Ringbalken / Deckenauflager'
};
const BASE_INS = {
  PERIM:   'Perimeterdämmung (außen)',
  KD_U:    'Kellerdecke unterseitig',
  KD_O:    'Kellerdecke oberseitig (Fußboden EG)',
  INNEN:   'Kellerwandinnendämmung',
  KOMBI:   'Kombiniert (Perimeter + Decke)'
};

// ── Öffentliche Enums (für Formular) ─────────────────────────────────────────
window.ENUMS = {
  FUNDING_TYPE, KFW_NEUBAU_LEVEL, KFW_LEVEL, KFW_HEIZUNG_TYPE, BAFA_MEASURE,
  HEAT_GEN, HEAT_DIST, VENT_TYPE,
  WINDOW_TYPE, WINDOW_FRAME, SUN_PROT,
  WALL_INS, ROOF_INS, BASE_INS, WB_TYPE
};

// ── Generator ─────────────────────────────────────────────────────────────────
function generateChecklist(projectId, bd) {
  const items = [];
  let order = 0;
  function add(category, title, description = '', mandatory = true) {
    items.push({ id: null, projectId, category, title, description, isChecked: false, isMandatory: mandatory, notes: '', sortOrder: order++ });
  }

  // ── Allgemein ────────────────────────────────────────────────────────────
  add('Allgemein', 'Projektdokumentation vollständig', 'Alle Pläne, Berechnungen und Verträge vorhanden');
  if ((bd.fundingType || '') === 'KFW_NEUBAU') {
    add('Allgemein', 'Baugenehmigung und Baupläne vorhanden', 'Genehmigter Entwurf, Schnitte, Grundrisse');
    add('Allgemein', 'Rohbauabnahme / Baufortschritt dokumentiert', 'Fotos und Protokolle je Bauabschnitt');
  } else {
    add('Allgemein', 'Bauzustandsprotokoll (Bestandsaufnahme) erstellt', 'Fotos und Beschreibung des Ausgangszustands');
  }
  add('Allgemein', 'Fachunternehmerbestätigung(en) vorhanden', 'Alle ausführenden Unternehmen bestätigt');
  add('Allgemein', 'Energieausweis / Berechnung vorhanden', 'Bedarfsausweis oder Berechnungsgrundlage');
  add('Allgemein', 'Fotos Bauschild / Außenansicht', 'Gesamtansicht des Gebäudes dokumentiert');

  // ── Förderung ────────────────────────────────────────────────────────────
  const ft = bd.fundingType || 'KFW_SANIERUNG';

  if (ft === 'KFW_NEUBAU') {
    // ── KfW Klimafreundlicher Neubau (KFN) ──────────────────────────────
    add('Förderung', 'KfW-Antrag 297/298 gestellt, Förderzusage vorhanden', 'Förderzusage muss vor Baubeginn vorliegen');
    add('Förderung', 'Energieeffizienz-Experten-Bestätigung (BEG-EB) vorhanden', 'Bestätigung des zugelassenen Energieberaters');
    add('Förderung', 'Baugenehmigung vorhanden', 'Genehmigter Bauantrag / Baugenehmigung');
    add('Förderung', 'Gebäude erfüllt GEG Effizienzhaus 40 (Neubau)', 'Primärenergiebedarf QP ≤ 55 % des Referenzgebäudes');
    add('Förderung', 'Transmissionswärmeverlust H\'T eingehalten', 'H\'T ≤ 0,30 W/(m²·K) gemäß GEG');
    add('Förderung', 'Klimafreundlicher Neubau: CO₂-Emissionen im Lebenszyklus nachgewiesen', 'Anforderungen BEG WG Neubau (KFN)');
    add('Förderung', 'Luftdichtheitstest (Blower Door) geplant / durchgeführt', 'Pflicht: n₅₀ ≤ 1,0 h⁻¹');
    add('Förderung', 'Wärmebrückennachweis vorhanden', 'Gleichwertigkeitsnachweis oder detaillierte Berechnung');
    add('Förderung', 'Technische Mindestanforderungen BEG WG Neubau erfüllt', 'Gemäß aktueller BEG-Technische Mindestanforderungen');
    add('Förderung', 'Fachunternehmererklärungen vollständig', 'Alle ausführenden Gewerke haben Erklärungen unterzeichnet');
    if (bd.kfwLevel === 'KFN_PLUS') {
      add('Förderung', 'NH-Klasse: QNG-Siegel beantragt / vorhanden', 'Qualitätssiegel Nachhaltiges Gebäude (DGNB, BNB o. ä.)');
      add('Förderung', 'NH-Klasse: Nachhaltigkeitszertifizierung durch anerkannte Stelle', 'Zertifizierungsstelle und Auditierung dokumentiert');
    }

  } else if (ft === 'KFW_SANIERUNG' || ft === 'KFW') {
    // ── KfW Sanierung Effizienzhaus (BEG WG 261) ────────────────────────
    add('Förderung', 'KfW-Antrag 261 gestellt, Förderzusage vorhanden', 'Förderzusage vor Baubeginn / Beauftragung');
    add('Förderung', 'Energieeffizienz-Experten-Bestätigung (BEG-EB) vorhanden', 'Bestätigung des zugelassenen Energieberaters');
    add('Förderung', 'Technische Mindestanforderungen BEG WG Sanierung erfüllt', 'Gemäß aktueller BEG-Technische Mindestanforderungen');
    add('Förderung', 'Wärmebrückennachweis vorhanden', 'Gleichwertigkeitsnachweis oder detaillierte Berechnung');
    const sanLevel = bd.kfwLevel || '';
    const isEH40   = ['KFW_40','KFW_40_PLUS','KFW_40_EE'].includes(sanLevel);
    add('Förderung', 'Luftdichtheitstest (Blower Door) geplant / durchgeführt',
      isEH40 ? 'Pflicht für EH 40, n₅₀ ≤ 1,0 h⁻¹' : 'Empfohlen, n₅₀ ≤ 3,0 h⁻¹');
    add('Förderung', 'Fachunternehmererklärungen vollständig', 'Alle Gewerke mit Erklärungen abgedeckt');
    // EE-Klasse
    const kfwClass = bd.kfwClass || '';
    if (kfwClass === 'EE' || sanLevel === 'KFW_40_EE' || sanLevel === 'KFW_55_EE') {
      add('Förderung', 'EE-Klasse: Mindestanteil erneuerbare Energien ≥ 65 % am Wärme-/Kältebedarf', 'Nachweis EE-Anteil erforderlich');
      add('Förderung', 'EE-Klasse: Nachweis EE-Anteil vorhanden (Solarthermie, PV+WP, Biomasse o. ä.)', '');
      add('Förderung', 'EE-Klasse: Bestätigung durch Energieberater', '');
    }
    // NH-Klasse
    if (kfwClass === 'NH' || sanLevel === 'KFW_40_PLUS') {
      add('Förderung', 'NH-Klasse: QNG-Siegel beantragt / Siegel vorhanden', 'Qualitätssiegel Nachhaltiges Gebäude (DGNB, BNB o. ä.)');
      add('Förderung', 'NH-Klasse: Nachhaltigkeitszertifizierung durch anerkannte Stelle', '');
    }

  } else if (ft === 'KFW_HEIZUNG') {
    // ── KfW Heizungstausch (BEG EM, KfW 458) ───────────────────────────
    add('Förderung', 'KfW-Antrag 458 gestellt VOR Beauftragung', 'Antrag muss vor Vertragsabschluss mit Handwerker eingereicht sein');
    add('Förderung', 'Förderzusage KfW 458 vorhanden', '');
    add('Förderung', 'Energieberater-Bestätigung (BEG-EB) vorhanden', 'Für förderfähige Maßnahmen erforderlich');
    add('Förderung', 'Altkessel: Typenschild, Foto und Baujahr dokumentiert', 'Nachweis der bestehenden Heizungsanlage');
    add('Förderung', 'Altkessel erfüllt Fördervoraussetzung', 'Gaskessel, Ölkessel oder Kessel ≥ 20 Jahre alt');
    add('Förderung', 'Stilllegung / Demontage der Altanlage geplant', 'Abbruchbestätigung wird für Verwendungsnachweis benötigt');
    add('Förderung', 'Neue Heizungsanlage: Fachunternehmererklärung vorhanden', '');
    add('Förderung', 'Verwendungsnachweis vollständig vorbereitet', 'Rechnungen, Nachweise und Bestätigungen bereithalten');
    const ht = bd.heizungType || '';
    if (ht === 'WAERMEPUMPE') {
      add('Heizungstausch', 'WP: JAZ-Nachweis erbracht (≥ 2,5 Luft-Luft, ≥ 3,0 andere)', 'Saisonale Arbeitszahl gemäß BEG-Anforderung');
      add('Heizungstausch', 'WP: Kältemittel GWP ≤ 675 oder natürliches Kältemittel', 'Anforderung BEG EM ab 2024');
      add('Heizungstausch', 'WP: Hydraulischer Abgleich Verfahren B durchgeführt', 'Pflicht bei KfW 458');
      add('Heizungstausch', 'WP: Typenschild und Inbetriebnahmeprotokoll', '');
      add('Heizungstausch', 'WP: SG-Ready-Schnittstelle vorhanden', '');
      add('Heizungstausch', 'WP: Leckagetest Kältemittelkreis (F-Gas-Protokoll)', '');
    } else if (ht === 'BIOMASSE') {
      add('Heizungstausch', 'Biomasse: BImSchV Stufe 2 und Staubgrenzwert eingehalten', '');
      add('Heizungstausch', 'Biomasse: EE-Anteil erfüllt (mind. 65 %)', '');
      add('Heizungstausch', 'Biomasse: Pufferspeicher korrekt dimensioniert', '');
      add('Heizungstausch', 'Biomasse: Rauchgasmessung (BImSchV) durch Schornsteinfeger', '');
      add('Heizungstausch', 'Biomasse: Lagerraum / Pelletspeicher dokumentiert', '');
    } else if (ht === 'HYBRID') {
      add('Heizungstausch', 'Hybrid: WP-Anteil mind. 65 % am Jahreswärmebedarf nachgewiesen', '');
      add('Heizungstausch', 'Hybrid: JAZ der Wärmepumpe dokumentiert', '');
      add('Heizungstausch', 'Hybrid: Hydraulischer Abgleich Verfahren B', '');
      add('Heizungstausch', 'Hybrid: Steuerung / Regelung priorisiert Wärmepumpe', '');
    } else if (ht === 'FERNWAERME') {
      add('Heizungstausch', 'Fernwärme: Netznachweis (mind. 65 % EE, KWK oder Abwärme)', 'Bestätigung des Netzbetreibers erforderlich');
      add('Heizungstausch', 'Fernwärme: Anschlussvertrag vorhanden', '');
      add('Heizungstausch', 'Fernwärme: Übergabestation installiert und geprüft', '');
    }

  } else {
    // ── BAFA Einzelmaßnahmen (BEG EM) ───────────────────────────────────
    add('Förderung', 'BAFA-Antrag genehmigt VOR Maßnahmenbeginn', 'Förderantrag muss vor Auftragsvergabe gestellt sein');
    add('Förderung', 'Energieberater-Bestätigung (BEG-EB) vorhanden', 'Für förderfähige Maßnahmen erforderlich');
    add('Förderung', 'Angebote / Rechnungen vorhanden', 'Dokumente für Verwendungsnachweis bereithalten');
    (bd.bafaMeasures || []).forEach(m => {
      add('Förderung', `BAFA-Anforderung: ${BAFA_MEASURE[m] || m}`, 'Technische Mindestanforderung für diese Maßnahme prüfen');
    });
  }

  // ── Wärmeerzeugung ───────────────────────────────────────────────────────
  // Abwärtskompatibel: früher Array, jetzt String (+ optionaler 2. String)
  const wpTypes = ['WP_LUFT', 'WP_SOLE', 'WP_WASSER', 'WP_LL'];
  const hgRaw = bd.heatGeneration;
  const heatGenList = Array.isArray(hgRaw)
    ? hgRaw.filter(Boolean)
    : [hgRaw, bd.heatGeneration2].filter(Boolean);

  heatGenList.forEach(type => {
    const lbl = HEAT_GEN[type] || type;
    if (wpTypes.includes(type)) {
      add('Wärmeerzeugung', `${lbl}: Typenschild / CE-Kennzeichnung`, 'Hersteller, Modell, Seriennummer dokumentieren');
      add('Wärmeerzeugung', `${lbl}: JAZ-Nachweis / COP-Kennwert`, 'Jahresarbeitszahl gemäß BEG-Anforderung ≥ 2,5');
      add('Wärmeerzeugung', `${lbl}: Kältemittelkreis dicht (Leckagetest)`, 'Kein F-Gas-Austritt, Protokoll des Kältemittelmonteurs');
      add('Wärmeerzeugung', `${lbl}: Hydraulische Einbindung korrekt`, 'Pufferspeicher, Mischventile, Volumenstrom');
      add('Wärmeerzeugung', `${lbl}: Pufferspeicher korrekt eingebunden`, 'Volumen gemäß Herstellervorgabe');
      if (type !== 'WP_LL') {
        add('Wärmeerzeugung', `${lbl}: Hydraulischer Abgleich Heizkreis`, 'Berechnung und Einstellung dokumentiert');
        add('Wärmeerzeugung', `${lbl}: Smart-Grid-ready Schnittstelle (SG Ready)`, 'SG-Ready-Label oder vergleichbare Schnittstelle');
      }
      add('Wärmeerzeugung', `${lbl}: Schallschutz am Aufstellungsort`, 'Abstandsflächen, Körperschall-Entkopplung');
      add('Wärmeerzeugung', `${lbl}: Fundament / Schwingungsentkopplung`, 'Schwingungsdämpfer / Entkopplungsmatte eingebaut');
      add('Wärmeerzeugung', `${lbl}: Elektrischer Anschluss (Wärmepumpentarif)`, 'Tarif, Leistungsschalter, Zähler');
      add('Wärmeerzeugung', `${lbl}: Inbetriebnahmeprotokoll Hersteller`, 'Werkskundendienst oder autorisierter Fachbetrieb');
      if (type === 'WP_SOLE') add('Wärmeerzeugung', `${lbl}: Erdkollektor / Erdsonde Druckprüfung`, 'Sole-Kreislauf dicht, Länge / Leistung dokumentiert');
      if (type === 'WP_WASSER') add('Wärmeerzeugung', `${lbl}: Wasserrechtliche Erlaubnis vorhanden`, 'Brunnen-Genehmigung vorhanden');
    } else if (type === 'GAS') {
      add('Wärmeerzeugung', 'Gas-Brennwert: CE-Kennzeichnung / Typenschild', '');
      add('Wärmeerzeugung', 'Gas-Brennwert: Abgasanlage / Zuluftführung', 'Schornsteinfeger-Abnahme vorhanden');
      add('Wärmeerzeugung', 'Gas-Brennwert: Kondensat-Abführung korrekt', 'Neutralisationsbox falls pH-Wert kritisch');
      add('Wärmeerzeugung', 'Gas-Brennwert: Hydraulischer Abgleich', '');
      add('Wärmeerzeugung', 'Gas-Brennwert: Vorlauf-/Rücklauftemperatur eingestellt', '');
      add('Wärmeerzeugung', 'Gas-Brennwert: CO-Melder installiert', '', false);
    } else if (type === 'PELLET') {
      add('Wärmeerzeugung', 'Pelletkessel: CE-Kennzeichnung / BImSchV Stufe 2', '');
      add('Wärmeerzeugung', 'Pelletkessel: Rauchgasmessung (BImSchV)', 'Schornsteinfeger-Messung und Protokoll');
      add('Wärmeerzeugung', 'Pelletkessel: Staubfilter vorhanden', '');
      add('Wärmeerzeugung', 'Pelletkessel: Pelletspeicher – Größe und Befüllstutzen', '');
      add('Wärmeerzeugung', 'Pelletkessel: Brandschutz Pelletspeicher', 'Brandschutzklappe, Trennwand gemäß Herstellervorgabe');
      add('Wärmeerzeugung', 'Pelletkessel: Pufferspeicher eingebunden', 'Mindestvolumen gemäß EN 303-5');
    } else if (type === 'BHKW') {
      add('Wärmeerzeugung', 'BHKW: CE-Kennzeichnung und Typenschild', '');
      add('Wärmeerzeugung', 'BHKW: Netzanschluss nach VDE-AR-N 4105', 'Netzzusage Netzbetreiber vorhanden');
      add('Wärmeerzeugung', 'BHKW: Wärmespeicher korrekt dimensioniert', '');
      add('Wärmeerzeugung', 'BHKW: Abgasanlage / Schallschutzmaßnahmen', '');
    } else if (type === 'SOLAR') {
      add('Wärmeerzeugung', 'Solarthermie: Kollektorfläche und Ausrichtung', 'Azimut, Neigungswinkel, Verschattungsfreiheit');
      add('Wärmeerzeugung', 'Solarthermie: Solar-Kombispeicher eingebunden', '');
      add('Wärmeerzeugung', 'Solarthermie: Frostschutz Solarflüssigkeit ≤ -28 °C', '');
      add('Wärmeerzeugung', 'Solarthermie: Stagnationsschutz vorhanden', '');
    } else if (type === 'FERN') {
      add('Wärmeerzeugung', 'Fernwärme: Übergabestation (Hausstation) geprüft', '');
      add('Wärmeerzeugung', 'Fernwärme: Hydraulische Entkopplung sichergestellt', '');
      add('Wärmeerzeugung', 'Fernwärme: Anschlussvertrag mit Versorger vorhanden', '');
    } else {
      add('Wärmeerzeugung', `${lbl}: Typenschild / CE-Kennzeichnung`, '');
      add('Wärmeerzeugung', `${lbl}: Inbetriebnahme dokumentiert`, '');
    }
  });
  if (bd.customNoteHeating) add('Wärmeerzeugung', bd.customNoteHeating, '', false);

  // ── Wärmeverteilung ──────────────────────────────────────────────────────
  const hasDistrib = (bd.heatDistribution || []).length > 0 ||
    bd.heatBuffer || bd.dhwStorage || bd.stratStorage ||
    bd.pipeInsulation || bd.pumps || bd.floorDist ||
    bd.heatCircuits || bd.systemTemp;

  if (hasDistrib) {
    if (bd.heatCircuits) add('Wärmeverteilung', `Anzahl Heizkreise: ${bd.heatCircuits}`, 'Heizkreisverteiler dokumentiert');
    if (bd.systemTemp)   add('Wärmeverteilung', `Systemtemperatur VL/RL: ${bd.systemTemp} °C`, 'Auslegungstemperatur nachgewiesen');
    if (bd.heatBuffer)   add('Wärmeverteilung', 'Heizungspuffer: Volumen und Einbindung geprüft', 'Mindestvolumen gemäß Hersteller / BEG-Anforderung');
    if (bd.dhwStorage)   add('Wärmeverteilung', 'Trinkwasserspeicher: Hygienenachweis und Dimensionierung', 'Legionellenschutz: Temperatur ≥ 60 °C sichergestellt');
    if (bd.stratStorage) add('Wärmeverteilung', 'Schichtenspeicher / Frischwasserstation: Einbindung geprüft', 'Temperaturschichtung und Regelung dokumentiert');
    if (bd.pipeInsulation) add('Wärmeverteilung', 'Dämmung Leitungen und Armaturen: EnEV/GEG-konform', 'Dämmstärken nach Anlage 5 GEG ausgeführt');
    if (bd.pumps)        add('Wärmeverteilung', 'Pumpen: Hocheffizienzpumpen (EEI ≤ 0,23) eingebaut', 'Pumpenklasse und Einstellung dokumentiert');
    if (bd.floorDist)    add('Wärmeverteilung', 'Etagenverteiler: Rohre gedämmt, Durchfluss eingestellt', '');
  }
  (bd.heatDistribution || []).forEach(type => {
    if (type === 'FBH') {
      add('Wärmeabgabe', 'FBH: Druckprobe mit Protokoll', 'Druckprüfung der Heizkreise vor dem Einschütten');
      add('Wärmeabgabe', 'FBH: Hydraulischer Abgleich – Berechnung vorhanden', 'Je Heizkreis nach EN 12831');
      add('Wärmeabgabe', 'FBH: Hydraulischer Abgleich – Ventile eingestellt', 'Durchflussmengen eingestellt und dokumentiert');
      add('Wärmeabgabe', 'FBH: Vorlauftemperatur eingestellt (max. 35 °C)', 'Bei Wärmepumpe: Auslegungstemperatur einhalten');
      add('Wärmeabgabe', 'FBH: Heizkreisverteiler – Durchflussmengen abgelesen', '');
      add('Wärmeabgabe', 'FBH: Aufheizprotokoll Estrich vorhanden', 'Funktionsheizen gemäß VOB/DIN 18560');
      add('Wärmeabgabe', 'FBH: Randdämmstreifen vorhanden', 'Umlaufender Randdämmstreifen eingebaut');
      add('Wärmeabgabe', 'FBH: Oberflächentemperatur ≤ 29 °C (Aufenthaltsbereich)', '');
      add('Wärmeabgabe', 'FBH: Einzelraumregelung (Thermostate) funktionsfähig', '');
    } else if (type === 'HK') {
      add('Wärmeabgabe', 'HK: Hydraulischer Abgleich – Berechnung vorhanden', 'Gemäß EN 12831 / Verfahren B');
      add('Wärmeabgabe', 'HK: Thermostatventile – Voreinstellung durchgeführt', 'Voreinstellung je Heizkörper dokumentiert');
      add('Wärmeabgabe', 'HK: Rücklaufverschraubungen eingestellt', '');
      add('Wärmeabgabe', 'HK: Heizkörperleistung bei WP-Betrieb ausreichend', 'Leistungsnachweis bei niedrigerer Vorlauftemperatur');
      add('Wärmeabgabe', 'HK: Heizkörper vollständig entlüftet', '');
    } else if (type === 'WAND') {
      add('Wärmeabgabe', 'Wandheizung: Druckprobe mit Protokoll', '');
      add('Wärmeabgabe', 'Wandheizung: Hydraulischer Abgleich', '');
      add('Wärmeabgabe', 'Wandheizung: Mindestabstand zu Elektroleitungen eingehalten', '');
      add('Wärmeabgabe', 'Wandheizung: Putzaufbau fachgerecht', '');
    } else if (type === 'DECK') {
      add('Wärmeabgabe', 'Deckenheizung: Druckprobe mit Protokoll', '');
      add('Wärmeabgabe', 'Deckenheizung: Hydraulischer Abgleich', '');
    } else if (type === 'FC') {
      add('Wärmeabgabe', 'Fan Coils: Luftmenge je Gerät eingemessen', '');
      add('Wärmeabgabe', 'Fan Coils: Hydraulischer Abgleich', '');
      add('Wärmeabgabe', 'Fan Coils: Kondensat-Ablauf vorhanden (Kühlbetrieb)', '');
    }
  });
  if (bd.customNoteDistrib) add('Wärmeverteilung', bd.customNoteDistrib, '', false);

  // ── Lüftung ──────────────────────────────────────────────────────────────
  if (bd.ventilationPresent && bd.ventilationType) {
    if (bd.ventilationType === 'ZAL') {
      add('Lüftungsanlage', 'ZAL: Lüftungskonzept nach DIN 1946-6 vorhanden', '');
      add('Lüftungsanlage', 'ZAL: Luftmengen gemessen und protokolliert', 'Zu- und Abluftraten je Raum eingemessen');
      add('Lüftungsanlage', 'ZAL: Einregulierung Luftmengen durchgeführt', '');
      add('Lüftungsanlage', 'ZAL: Filterklasse geprüft (ISO 16890)', '');
      add('Lüftungsanlage', 'ZAL: Wärmerückgewinnung – Effizienz ≥ 75 %', 'BEG-Mindestanforderung');
      add('Lüftungsanlage', 'ZAL: Brandschutzklappen vorhanden und geprüft', '');
      add('Lüftungsanlage', 'ZAL: Schalldämpfer eingebaut', 'DIN 4109');
      add('Lüftungsanlage', 'ZAL: Außenluftansaugung – Lage und Schutzgitter', '');
      add('Lüftungsanlage', 'ZAL: Fortluftauslass – Lage und Rückströmschutz', '');
      add('Lüftungsanlage', 'ZAL: Überströmung zwischen Räumen sichergestellt', 'Türspalt oder Überströmöffnungen');
      add('Lüftungsanlage', 'ZAL: Inbetriebnahmeprotokoll des Herstellers', '');
      add('Lüftungsanlage', 'ZAL: Bedienungsanweisung an Nutzer übergeben', '', false);
    } else if (bd.ventilationType === 'ERG_ZU') {
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Lüftungskonzept nach DIN 1946-6 vorhanden', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Luftmengen je Gerät gemessen und protokolliert', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Zuluft- und Abluftgeräte korrekt zugeordnet (Raum-Paare)', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Einbauort korrekt (≥ 1,5 m von Raumecken)', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Wärmerückgewinnung – Effizienz ≥ 75 %', 'BEG-Mindestanforderung');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Kernbohrungen luftdicht abgedichtet', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Schallschutz geprüft (< 25 dB(A))', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Alle Geräte in Betrieb und gesteuert', '');
      add('Lüftungsanlage', 'ERG Zu-/Abluft: Wartungsintervalle erklärt', '', false);
    } else if (bd.ventilationType === 'ERG_PP') {
      add('Lüftungsanlage', 'Push-Pull: Lüftungskonzept nach DIN 1946-6 vorhanden', '');
      add('Lüftungsanlage', 'Push-Pull: Betriebsphasen (Zu-/Abluftphasen) korrekt eingestellt', 'Typisch 70-s-Takt, synchronisierte Geräte');
      add('Lüftungsanlage', 'Push-Pull: Synchronisation benachbarter Geräte sichergestellt', 'Gegenphasiger Betrieb ggf. per Funk/Kabel');
      add('Lüftungsanlage', 'Push-Pull: Luftmengen je Gerät gemessen', '');
      add('Lüftungsanlage', 'Push-Pull: Wärmerückgewinnung – Effizienz ≥ 75 %', '');
      add('Lüftungsanlage', 'Push-Pull: Kernbohrungen luftdicht abgedichtet', '');
      add('Lüftungsanlage', 'Push-Pull: Schallschutz geprüft (< 25 dB(A))', '');
      add('Lüftungsanlage', 'Push-Pull: Wartungsintervalle erklärt', '', false);
    } else if (bd.ventilationType === 'ERG') {
      add('Lüftungsanlage', 'ERG: Lüftungskonzept nach DIN 1946-6 vorhanden', '');
      add('Lüftungsanlage', 'ERG: Luftmengen je Gerät gemessen', '');
      add('Lüftungsanlage', 'ERG: Gegenstrom-Paarung (Zuluft/Abluft) korrekt', '');
      add('Lüftungsanlage', 'ERG: Einbauort korrekt (≥ 1,5 m von Raumecken)', '');
      add('Lüftungsanlage', 'ERG: Wärmerückgewinnung – Effizienz ≥ 75 %', '');
      add('Lüftungsanlage', 'ERG: Kernbohrungen luftdicht abgedichtet', '');
      add('Lüftungsanlage', 'ERG: Schallschutz geprüft (< 25 dB(A))', '');
      add('Lüftungsanlage', 'ERG: Alle Geräte in Betrieb und gesteuert', '');
      add('Lüftungsanlage', 'ERG: Wartungsintervalle erklärt', '', false);
    } else {
      add('Lüftungsanlage', 'Abluft: Abluftmengen gemessen', '');
      add('Lüftungsanlage', 'Abluft: Ersatzluft-Zufuhr sichergestellt', '');
      add('Lüftungsanlage', 'Abluft: Ventilatoren funktionsfähig', '');
    }
    if (bd.customNoteVent) add('Lüftungsanlage', bd.customNoteVent, '', false);
  }

  // ── Photovoltaik ─────────────────────────────────────────────────────────
  if (bd.pvPresent) {
    add('Photovoltaik', 'PV: Modulausrichtung und Neigungswinkel dokumentiert', '');
    add('Photovoltaik', 'PV: Modultypenschild / Datenblatt vorhanden', '');
    add('Photovoltaik', 'PV: String-Verschaltung korrekt ausgeführt', '');
    add('Photovoltaik', 'PV: DC-Leitungen korrekt verlegt und gesichert', 'UV-beständige PV-Kabel');
    add('Photovoltaik', 'PV: Wechselrichter – Typenschild und Inbetriebnahme', '');
    add('Photovoltaik', 'PV: Netzanschluss nach VDE-AR-N 4105', '');
    add('Photovoltaik', 'PV: Netzzusage des Netzbetreibers vorhanden', '');
    add('Photovoltaik', 'PV: Smart Meter / Zweirichtungszähler installiert', '');
    add('Photovoltaik', 'PV: EEG-Anmeldung / Marktstammdatenregister', '');
    add('Photovoltaik', 'PV: Blitzschutz / Überspannungsschutz eingebaut', '');
    add('Photovoltaik', 'PV: Dacheindeckung im Modulbereich dicht', '');
    if (bd.pvWithBattery) {
      const cap = bd.pvBatteryKwh ? `${bd.pvBatteryKwh} kWh` : '–';
      add('Photovoltaik', `Batterie: Kapazität dokumentiert (${cap})`, '');
      add('Photovoltaik', 'Batterie: BMS (Batteriemanagementsystem) aktiv', '');
      add('Photovoltaik', 'Batterie: Brandschutz im Aufstellungsraum', '');
      add('Photovoltaik', 'Batterie: Sicherheitsabstände eingehalten', '');
      add('Photovoltaik', 'Batterie: Notabschaltung / Hauptschalter vorhanden', '');
      add('Photovoltaik', 'Batterie: Inbetriebnahmeprotokoll vorhanden', '');
    }
    if (bd.customNotePv) add('Photovoltaik', bd.customNotePv, '', false);
  }

  // ── Fenster ──────────────────────────────────────────────────────────────
  if (bd.windowType) {
    add('Fenster & Verglasung', 'Fenster: CE-Kennzeichnung / Leistungserklärung', '');
    add('Fenster & Verglasung', `Fenster: Uw-Wert dokumentiert (${WINDOW_TYPE[bd.windowType] || ''})`, '');
    add('Fenster & Verglasung', 'Fenster: Einbaulage in der Dämmebene', 'Keine unnötige Wärmebrücke');
    add('Fenster & Verglasung', 'Fenster: Anschlussfolie innen (luftdicht)', '');
    add('Fenster & Verglasung', 'Fenster: Anschlussband/-folie außen (schlagregendicht)', '');
    add('Fenster & Verglasung', 'Fenster: Sturzbereich gedämmt / wärmebrückenfrei', '');
    add('Fenster & Verglasung', 'Fenster: Laibungen gedämmt', '');
    add('Fenster & Verglasung', 'Fenster: Öffnungsfunktion aller Flügel geprüft', '');
    add('Fenster & Verglasung', 'Fenster: g-Wert dokumentiert', 'Für sommerlichen Wärmeschutz');
    if (bd.sunProtection) {
      const sp = SUN_PROT[bd.sunProtectionType] || '';
      add('Fenster & Verglasung', `Sonnenschutz: ${sp} – Ausführung dokumentiert`, '');
      add('Fenster & Verglasung', 'Sonnenschutz: Gesamtenergiedurchlassgrad (gtot) ≤ 0,35', 'Nachweis sommerlicher Wärmeschutz DIN 4108-2');
      add('Fenster & Verglasung', 'Sonnenschutz: Funktion und Steuerung geprüft', '');
    }
    if (bd.windowFrame === 'ALU' || bd.windowFrame === 'ST') {
      add('Fenster & Verglasung', 'Rahmen: Thermische Trennung vorhanden', 'Alu/Stahl: thermisch getrennte Konstruktion prüfen');
    }
    if (bd.customNoteWindows) add('Fenster & Verglasung', bd.customNoteWindows, '', false);
  }

  // ── Wanddämmung ──────────────────────────────────────────────────────────
  if (bd.wallInsulation) {
    const t = WALL_INS[bd.wallInsType] || '';
    const d = bd.wallInsCm ? `${bd.wallInsCm} cm` : '–';
    add('Wärmedämmung Außenwand', `Wand: Dämmstoff-Typ und -Stärke dokumentiert`, `${t}, ${d}`);
    add('Wärmedämmung Außenwand', 'Wand: CE-Kennzeichnung Dämmsystem / Dämmstoffe', '');
    if (['WDVS_EPS','WDVS_MW','WDVS_HF'].includes(bd.wallInsType)) {
      add('Wärmedämmung Außenwand', 'WDVS: Verklebung vollflächig oder Nockenrand', '≥ 40 % der Plattenfläche');
      add('Wärmedämmung Außenwand', 'WDVS: Verdübelung korrekt (Anzahl, Typ, Tiefe)', '');
      add('Wärmedämmung Außenwand', 'WDVS: Armierungsschicht mit Glasfasergewebe', '');
      add('Wärmedämmung Außenwand', 'WDVS: Plattenversatz korrekt (keine Kreuzfugen)', '');
      add('Wärmedämmung Außenwand', 'WDVS: Anschlüsse an Fenster/Türen mit Profilen', '');
      add('Wärmedämmung Außenwand', 'WDVS: Sockelzone ausgeführt (wasserabweisend)', 'min. 30 cm über OK-Gelände');
      add('Wärmedämmung Außenwand', 'WDVS: Brandriegel bei > 7 m Höhe eingebaut', 'MW-Riegel bei EPS ≥ 100 mm');
    } else if (bd.wallInsType === 'INNEN') {
      add('Wärmedämmung Außenwand', 'Innendämmung: Taupunktberechnung vorhanden', 'Hygrothermischer Nachweis erforderlich');
      add('Wärmedämmung Außenwand', 'Innendämmung: Dampfbremse korrekt', 'Sd-Wert, lückenlose Ausführung');
    } else if (bd.wallInsType === 'VHF') {
      add('Wärmedämmung Außenwand', 'VHF: Unterkonstruktion korrosionsgeschützt', '');
      add('Wärmedämmung Außenwand', 'VHF: Hinterlüftungsraum ≥ 2 cm vorhanden', '');
      add('Wärmedämmung Außenwand', 'VHF: Winddichtung fachgerecht', '');
    }
    add('Wärmedämmung Außenwand', 'Wand: Wärmebrücken an Anschlüssen minimiert', 'Fenster, Dach, Decke, Bodenplatte');
    add('Wärmedämmung Außenwand', 'Wand: Fotos der Dämmschicht vor Verkleidung', '');
    if (bd.customNoteWall) add('Wärmedämmung Außenwand', bd.customNoteWall, '', false);
  }

  // ── Dachdämmung ──────────────────────────────────────────────────────────
  if (bd.roofInsulation) {
    const t = ROOF_INS[bd.roofInsType] || '';
    const d = bd.roofInsCm ? `${bd.roofInsCm} cm` : '–';
    add('Wärmedämmung Dach', `Dach: Dämmstoff-Typ und -Stärke dokumentiert`, `${t}, ${d}`);
    add('Wärmedämmung Dach', 'Dach: CE-Kennzeichnung Dämmstoffe', '');
    if (bd.roofInsType === 'AUF') {
      add('Wärmedämmung Dach', 'Dach: Aufdämmplatten verklebt / mechanisch befestigt', '');
      add('Wärmedämmung Dach', 'Dach: Anschluss an Außenwanddämmung wärmebrückenfrei', '');
    } else if (['ZWISCH','Z_U','Z_AUF'].includes(bd.roofInsType)) {
      add('Wärmedämmung Dach', 'Dach: Zwischensparrendämmung vollflächig und lückenlos', '');
      add('Wärmedämmung Dach', 'Dach: Dampfbremse/-sperre korrekt eingebaut', 'Sd-Wert, Stöße verklebt');
      add('Wärmedämmung Dach', 'Dach: Anschlüsse Dampfbremse an Wand / Giebelwand', '');
      if (bd.roofInsType === 'Z_U')  add('Wärmedämmung Dach', 'Dach: Untersparrendämmung lückenlos', '');
      if (bd.roofInsType === 'Z_AUF') {
        add('Wärmedämmung Dach', 'Dach: Aufsparrendämmung lückenlos auf Zwischensparrendämmung', '');
        add('Wärmedämmung Dach', 'Dach: Aufdämmplatten verklebt / befestigt und Stöße versetzt', '');
        add('Wärmedämmung Dach', 'Dach: Kombination Zwischen- + Aufsparren – U-Wert-Nachweis', '');
      }
      add('Wärmedämmung Dach', 'Dach: Belüftungsebene ≥ 4 cm (bei belüftetem Dach)', '');
    } else if (bd.roofInsType === 'BODEN') {
      add('Wärmedämmung Dach', 'Dachboden: Dämmung der obersten Geschossdecke vollflächig', '');
      add('Wärmedämmung Dach', 'Dachboden: Trittfestigkeit / Begehbarkeit geprüft', '');
    } else if (bd.roofInsType === 'FLACH') {
      add('Wärmedämmung Dach', 'Flachdach: Abdichtung über Dämmung korrekt', '');
      add('Wärmedämmung Dach', 'Flachdach: Gefälle ≥ 2 % zum Ablauf', '');
      add('Wärmedämmung Dach', 'Flachdach: Notüberläufe vorhanden', '');
      add('Wärmedämmung Dach', 'Flachdach: Anschlüsse hochgezogen ≥ 15 cm', '');
    }
    add('Wärmedämmung Dach', 'Dach: Anschluss an Außenwand wärmebrückenfrei', '');
    add('Wärmedämmung Dach', 'Dach: Fotos der Dämmschicht vor Verkleidung', '');
    if (bd.customNoteRoof) add('Wärmedämmung Dach', bd.customNoteRoof, '', false);
  }

  // ── Kellerdämmung ─────────────────────────────────────────────────────────
  if (bd.baseInsulation) {
    const t = BASE_INS[bd.baseInsType] || '';
    const d = bd.baseInsCm ? `${bd.baseInsCm} cm` : '–';
    add('Wärmedämmung Keller', `Keller: Dämmstoff-Typ und -Stärke dokumentiert`, `${t}, ${d}`);
    add('Wärmedämmung Keller', 'Keller: CE-Kennzeichnung Dämmstoffe', '');
    if (bd.baseInsType === 'PERIM') {
      add('Wärmedämmung Keller', 'Perimeter: Druckfester XPS / Schaumglas', 'Druckfestigkeit ≥ 300 kPa');
      add('Wärmedämmung Keller', 'Perimeter: Feuchteschutz / Abdichtung Kellerwand', '');
      add('Wärmedämmung Keller', 'Perimeter: Anschluss an Wanddämmung lückenlos', '');
    } else if (bd.baseInsType === 'KD_U') {
      add('Wärmedämmung Keller', 'Kellerdecke: Dämmplatten vollflächig und lückenlos', '');
      add('Wärmedämmung Keller', 'Kellerdecke: Befestigung (Kleben + Dübeln)', '');
      add('Wärmedämmung Keller', 'Kellerdecke: Treppenhausbereich gedämmt', '');
      add('Wärmedämmung Keller', 'Kellerdecke: Rohrdurchführungen gedämmt', '');
    }
    add('Wärmedämmung Keller', 'Keller: Wärmebrücken minimiert', 'Treppe, Wände, Stützen');
    add('Wärmedämmung Keller', 'Keller: Fotos der Dämmschicht vor Abdeckung', '');
    if (bd.customNoteBase) add('Wärmedämmung Keller', bd.customNoteBase, '', false);
  }

  // ── Wärmebrücken ─────────────────────────────────────────────────────────
  if ((bd.wbTypes || []).length > 0 || bd.customNoteWb) {
    add('Wärmebrücken', 'Wärmebrückennachweis: Gleichwertigkeitsnachweise oder Einzelberechnungen vorhanden', 'DIN 4108 Beiblatt 2 oder detaillierter Nachweis nach ISO 10211');
    add('Wärmebrücken', 'Wärmebrücken: Nachweis in Energieberechnung berücksichtigt', 'ΔUWB-Zuschlag oder detailliert eingerechnet');
    (bd.wbTypes || []).forEach(wb => {
      const lbl = WB_TYPE[wb] || wb;
      if (wb === 'FENSTER') {
        add('Wärmebrücken', `WB ${lbl}: Einbaulage in Dämmebene nachgewiesen`, '');
        add('Wärmebrücken', `WB ${lbl}: Laibungen gedämmt, Anschlussfolien korrekt`, '');
      } else if (wb === 'BALKON') {
        add('Wärmebrücken', `WB ${lbl}: Thermisch getrenntes Balkonelement (Isokorb o. ä.)`, '');
        add('Wärmedämmung Außenwand', 'Balkon: Nachweis Wärmebrückenfreiheit / Isokorb dokumentiert', '');
      } else if (wb === 'ROLLADEN') {
        add('Wärmebrücken', `WB ${lbl}: Rollladenkasten gedämmt oder außen liegend`, '');
        add('Wärmebrücken', `WB ${lbl}: Luftdichtheit Rollladen-Öffnung geprüft`, '');
      } else if (wb === 'KELLER') {
        add('Wärmebrücken', `WB ${lbl}: Perimeter- / Sockeldämmung lückenlos`, '');
        add('Wärmebrücken', `WB ${lbl}: Übergang Wand–Bodenplatte / Streifenfundament gedämmt`, '');
      } else if (wb === 'DACH') {
        add('Wärmebrücken', `WB ${lbl}: Dach-Wand-Anschluss wärmebrückenfrei ausgeführt`, '');
        add('Wärmebrücken', `WB ${lbl}: Kehlbalkenlage / Pfetten gedämmt`, '');
      } else {
        add('Wärmebrücken', `WB ${lbl}: Ausführung und Nachweis dokumentiert`, '');
      }
    });
    if (bd.customNoteWb) add('Wärmebrücken', bd.customNoteWb, '', false);
  }

  return items;
}

window.generateChecklist = generateChecklist;

// ══════════════════════════════════════════════════════════════════════════════
// iSFP – Bestandsaufnahme-Checkliste
// Dokumentation des Ist-Zustands vor Ort; kein Qualitätsnachweis, sondern
// strukturierte Begehungs- und Fotodokumentation für den Sanierungsfahrplan.
// ══════════════════════════════════════════════════════════════════════════════
function generateIsfpChecklist(projectId, bd) {
  const items = [];
  let order = 0;
  const is = bd.isfp || {};

  function add(category, title, description = '', mandatory = true) {
    items.push({ id: null, projectId, category, title, description,
      isChecked: false, isMandatory: mandatory, notes: '', sortOrder: order++ });
  }

  // ── Allgemeine Dokumentation ─────────────────────────────────────────────
  add('Allgemein', 'Gebäude-Außenansicht: Foto von allen 4 Seiten aufgenommen', 'Nord, Süd, Ost, West – Gesamtbild des Gebäudes');
  add('Allgemein', 'Vorhandene Pläne / Grundrisse gesammelt', 'Baupläne, Baugenehmigung, ältere Energieausweise');
  add('Allgemein', 'Heizkostenabrechnungen / Energierechnungen eingesehen', 'Möglichst 3 Jahre; Verbrauchsdaten erfasst');
  add('Allgemein', 'Eigentümer- / Nutzergespräch geführt', 'Bekannte Mängel, Sanierungsabsichten, Nutzungsgewohnheiten');
  add('Allgemein', 'Gebäudegröße und Nutzfläche plausibilisiert', `Wohnfläche laut Angabe: ${is.livingArea ? is.livingArea + ' m²' : '–'}`);
  add('Allgemein', 'Baujahr und Bauweise dokumentiert', `Baujahr: ${is.buildYear || '–'}, Typ: ${is.buildType || '–'}`);
  if (is.monument && is.monument !== 'NEIN') {
    add('Allgemein', 'Denkmalschutz-Auflagen geklärt', 'Zuständige Denkmalbehörde kontaktiert / Auflagen dokumentiert');
  }

  // ── Außenwand ────────────────────────────────────────────────────────────
  add('Außenwand', 'Außenwand: Fotos aller Fassadenflächen aufgenommen', 'Inkl. Detailfotos kritischer Bereiche (Sockel, Ecken, Anschlüsse)');
  add('Außenwand', 'Außenwand: Konstruktionsaufbau ermittelt / geschätzt',
    is.wallConst ? `Ermittelter Aufbau: ${is.wallConst}` : 'Aufbau nach Baujahr und Sichtbefund einschätzen');
  if (is.wallThickness) add('Außenwand', `Außenwand: Wandstärke gemessen / überprüft`, `Angabe: ${is.wallThickness} cm`);
  add('Außenwand', 'Außenwand: U-Wert dokumentiert / geschätzt',
    is.wallU ? `Geschätzter U-Wert: ${is.wallU} W/(m²K)` : 'U-Wert nach Aufbau und Baujahr einschätzen');
  add('Außenwand', 'Außenwand: Vorhandene Dämmung geprüft',
    is.wallIns && is.wallIns !== 'NEIN' ? `Dämmung: ${is.wallIns}` : 'Keine Dämmung vorhanden – U-Wert entsprechend schlechter');
  add('Außenwand', 'Außenwand: Schäden und Mängel dokumentiert',
    `Zustand laut Begehung: ${is.wallCondition || '–'}. ${is.wallNotes || ''}`);
  add('Außenwand', 'Außenwand: Wärmebrücken-Situationen fotografiert', 'Fensteranschlüsse, Gebäudeecken, Balkone, Rollladenkästen');
  add('Außenwand', 'Außenwand: Feuchteschäden / Schimmelspuren geprüft', 'Besonders Sockelbereich und Nordseite');

  // ── Dach ─────────────────────────────────────────────────────────────────
  add('Dach', 'Dach: Außenansicht fotografiert', `Dachform: ${is.roofType || '–'}`);
  add('Dach', 'Dach: Dachboden / Kehlbalkenlage besichtigt', 'Zugänglichkeit prüfen; Dämmschicht von oben und unten beurteilen');
  add('Dach', 'Dach: Dämmung dokumentiert',
    is.roofIns && is.roofIns !== 'NEIN' ? `Vorhandene Dämmung: ${is.roofIns}` : 'Keine Dachdämmung festgestellt');
  add('Dach', 'Dach: U-Wert dokumentiert / geschätzt',
    is.roofU ? `Geschätzter U-Wert: ${is.roofU} W/(m²K)` : 'U-Wert nach Aufbau und Baujahr einschätzen');
  add('Dach', 'Dach: Dampfbremse / Luftdichtheitsebene beurteilt', 'Vorhanden? Lücken oder Schäden sichtbar?');
  add('Dach', 'Dach: Schäden und Mängel dokumentiert',
    `Zustand: ${is.roofCondition || '–'}. ${is.roofNotes || ''}`);
  add('Dach', 'Dach: Gauben, Dachflächenfenster und Anschlüsse beurteilt', '', false);
  if (is.hasAttic) {
    add('Dach', 'Dachgeschoss: Ausbauzustand und Heizwärmebedarf dokumentiert', 'Beheiztes DG – Dämmung der Dachschrägen besonders relevant');
  }

  // ── Keller / Bodenplatte ─────────────────────────────────────────────────
  if (is.hasCellar || is.baseType) {
    add('Keller', 'Keller: Besichtigt und fotografiert', `Art: ${is.baseType || '–'}`);
    add('Keller', 'Keller: Feuchtigkeitsschäden / Schimmel geprüft', `Befund: ${is.baseCondition || '–'}. ${is.baseNotes || ''}`);
    add('Keller', 'Keller: Kellerdeckendämmung dokumentiert',
      is.baseIns && is.baseIns !== 'NEIN' ? `Dämmung: ${is.baseIns}` : 'Keine Dämmung festgestellt');
    add('Keller', 'Keller: U-Wert Kellerdecke / Bodenplatte dokumentiert',
      is.baseU ? `Geschätzter U-Wert: ${is.baseU} W/(m²K)` : 'Einschätzen nach Konstruktion und Baujahr');
    add('Keller', 'Keller: Rohrleitungen im Keller gedämmt?', 'Ungedämmte Heizungsrohre im unbeheizten Keller: hohe Verluste');
  } else {
    add('Keller', 'Bodenplatte: Gedämmt oder ungedämmt dokumentiert', is.baseNotes || '');
    add('Keller', 'Bodenplatte: U-Wert dokumentiert / geschätzt', is.baseU ? `U-Wert: ${is.baseU} W/(m²K)` : '');
  }

  // ── Fenster & Außentüren ─────────────────────────────────────────────────
  add('Fenster & Türen', 'Fenster: Fotos aller Fensterflächen aufgenommen', 'Inkl. Detailfotos Rahmen, Glasrand, Dichtungen');
  add('Fenster & Türen', 'Fenster: Verglasung und Baujahr dokumentiert',
    is.winGlazing ? `Verglasung: ${is.winGlazing}, Baujahr: ${is.winYear || '–'}` : 'Verglasung nach Augenschein einschätzen');
  add('Fenster & Türen', 'Fenster: Uw-Wert dokumentiert / geschätzt',
    is.winU ? `Geschätzter Uw-Wert: ${is.winU} W/(m²K)` : 'U-Wert aus Tabelle nach Baujahr / Glastyp');
  add('Fenster & Türen', 'Fenster: Rahmen, Dichtungen und Beschläge geprüft', `Zustand: ${is.winCondition || '–'}. ${is.winNotes || ''}`);
  add('Fenster & Türen', 'Fenster: Luftdichtheit an Laibungsanschlüssen geprüft', 'Zugluft, undichte Anschlussfugen?');
  add('Fenster & Türen', 'Außentür: Typ, Baujahr und Wärmedämmwert dokumentiert', '', false);
  add('Fenster & Türen', 'Rollladenkästen: Gedämmt oder ungedämmt dokumentiert', '', false);

  // ── Wärmeerzeuger ────────────────────────────────────────────────────────
  if (is.hgType) {
    const hgLabel = `${is.hgType}${is.hgBrand ? ' – ' + is.hgBrand : ''}`;
    add('Wärmeerzeuger', `Typenschild fotografiert: ${hgLabel}`, `Baujahr: ${is.hgYear || '–'}, Nennleistung: ${is.hgPower ? is.hgPower + ' kW' : '–'}`);
    add('Wärmeerzeuger', 'Wartungsprotokoll / Prüfbuch eingesehen', 'Letzte Wartung, Schornsteinfegerprotokoll');
    add('Wärmeerzeuger', 'Betriebszustand und Regelung dokumentiert', `Zustand: ${is.hgCondition || '–'}. ${is.hgNotes || ''}`);
    add('Wärmeerzeuger', 'Vorlauf- und Rücklauftemperatur abgelesen / gemessen', 'Heizkurve eingestellt? Nachtabsenkung aktiv?');
    add('Wärmeerzeuger', 'Abgasanlage / Schornstein besichtigt', 'Zustand, freie Querschnitte, Kondensatablauf');
    if (['GAS_NT','GAS_BW','OEL_NT','OEL_BW'].includes(is.hgType)) {
      add('Wärmeerzeuger', 'Brennereinstellung und Abgaswerte dokumentiert', 'CO₂-Gehalt, Abgastemperatur aus letztem Messbericht');
    }
    if (['WP_LUFT','WP_SOLE'].includes(is.hgType)) {
      add('Wärmeerzeuger', 'Wärmepumpe: Betriebspunkte und JAZ-Einschätzung dokumentiert', 'Betriebsstunden, Energieverbrauch Wärmepumpe ablesen');
    }
    add('Wärmeerzeuger', 'Eingestellte Vorlauftemperatur im Verhältnis zur Abgabefläche beurteilen', 'Hohe VL-Temp. = schlechtere WP-Effizienz / höherer Verbrauch');
  } else {
    add('Wärmeerzeuger', 'Wärmeerzeuger: Art, Baujahr und Zustand dokumentiert', 'Typenschild fotografieren');
    add('Wärmeerzeuger', 'Wärmeerzeuger: Betriebszustand und Regelung dokumentiert', '');
  }

  // ── Warmwasserbereitung ───────────────────────────────────────────────────
  add('Warmwasser', 'Warmwasserbereitung: System und Baujahr dokumentiert',
    is.wwType ? `System: ${is.wwType}, Baujahr: ${is.wwYear || '–'}` : 'System ermitteln und dokumentieren');
  if (is.wwVolume) add('Warmwasser', `Speichervolumen dokumentiert: ${is.wwVolume} Liter`, 'Dämmung des Speichers beurteilen');
  add('Warmwasser', 'Warmwasserspeicher: Dämmung und Verluste beurteilt', 'Warme Oberfläche = hohe Bereitschaftsverluste');
  add('Warmwasser', 'Zirkulationsleitung: Vorhanden? Gedämmt? Zeitschaltuhr?', `${is.wwNotes || ''}`);
  add('Warmwasser', 'Legionellenschutz: Temperaturniveau und Systemaufbau beurteilt', '', false);

  // ── Wärmeverteilung & -abgabe ─────────────────────────────────────────────
  const distLabel = is.distType || 'Wärmeabgabe';
  add('Wärmeverteilung', `Wärmeabgabe: Typ und Zustand dokumentiert`,
    is.distType ? `System: ${is.distType}, Baujahr: ${is.distYear || '–'}` : '');
  add('Wärmeverteilung', 'Rohrleitungen: Dämmzustand im unbeheizten Bereich geprüft',
    is.distPipeIns ? 'Leitungen gedämmt – Zustand prüfen' : 'Keine Leitungsdämmung festgestellt – Verluste einschätzen');
  add('Wärmeverteilung', 'Pumpentyp dokumentiert',
    is.distHepu ? 'Hocheffizienzpumpe vorhanden' : 'Alte Pumpe vorhanden – Austausch sinnvoll');
  add('Wärmeverteilung', 'Hydraulischer Abgleich: Nachgewiesen oder eingeschätzt',
    is.distHyd ? 'Hydraulischer Abgleich laut Eigentümer vorhanden' : 'Kein hydraulischer Abgleich – Einsparpotenzial ermitteln');
  if (is.distVl) {
    add('Wärmeverteilung', `Vorlauftemperatur: ${is.distVl} °C – Absenkungspotenzial prüfen`,
      'Niedrige VL-Temp. ermöglicht effizienteren WP-Betrieb; bei HK: Heizkörper-Leistung prüfen');
  }
  add('Wärmeverteilung', 'Heizkörper / Thermostatventile: Alter und Funktion geprüft', `${is.distNotes || ''}`, false);

  // ── Lüftung ──────────────────────────────────────────────────────────────
  const ventLabel = is.ventType || 'Fensterlüftung';
  add('Lüftung', `Lüftungssituation dokumentiert: ${ventLabel}`,
    is.ventType === 'FENSTERLÜFT' || !is.ventType
      ? 'Keine Lüftungsanlage – Nutzerverhalten und Schimmelrisiko beurteilen'
      : `Anlage Baujahr: ${is.ventYear || '–'}, Zustand: ${is.ventCondition || '–'}`);
  add('Lüftung', 'Bad- und WC-Entlüftung: Funktionsfähigkeit geprüft', 'Ventilatoren, Abluftöffnungen, Rückströmschutz');
  add('Lüftung', 'Küche: Dunstabzug – Umluft oder Abluft dokumentiert', '', false);
  if (is.ventType && is.ventType !== 'FENSTERLÜFT') {
    add('Lüftung', 'Lüftungsanlage: Filter geprüft und Filterklasse dokumentiert', '');
    add('Lüftung', 'Lüftungsanlage: Luftmengen eingeschätzt / Messung empfohlen', '');
  }
  add('Lüftung', 'Schimmelrisiko beurteilt und dokumentiert', `${is.ventNotes || ''}Besonders kritisch bei schlechter Lüftung und hoher Innendämmung`);

  // ── Energieverbrauch ─────────────────────────────────────────────────────
  add('Energieverbrauch', 'Verbrauchsdaten erfasst und plausibilisiert',
    [is.evY1Label && `${is.evY1Label}: ${is.evY1Heat || '–'} kWh Heizung`,
     is.evY2Label && `${is.evY2Label}: ${is.evY2Heat || '–'} kWh`,
     is.evY3Label && `${is.evY3Label}: ${is.evY3Heat || '–'} kWh`].filter(Boolean).join(' | ') || 'Abrechnungen einsehen');
  add('Energieverbrauch', 'Energieträger und Verbrauchseinheit dokumentiert',
    `Energieträger: ${is.energyCarrier || '–'} – Umrechnung in kWh prüfen (kWh, m³, Liter, kg)`);
  add('Energieverbrauch', 'Witterungsbereinigung und spezifischer Verbrauch eingeschätzt', 'Gradtagzahlbereinigung für Jahresvergleich');
  add('Energieverbrauch', 'Verbrauch dem Gebäude / der Nutzfläche gegenüberstellen',
    is.livingArea ? `Richtwert: ${is.livingArea} m² × Verbrauch kWh/m²a` : 'Spez. Heizwärmebedarf abschätzen');
  add('Energieverbrauch', 'Auffälligkeiten im Verbrauch notiert (Leerstand, Zuzug, Heizung neu)', `${is.evNotes || ''}`, false);
  add('Energieverbrauch', 'Stromverbrauch gesondert erfasst', is.evY1Elec ? `Strom Jahr 1: ${is.evY1Elec} kWh` : '', false);

  // ── Photovoltaik / Solar (falls erkennbar) ───────────────────────────────
  add('Erneuerbare Energien', 'PV-Anlage: Vorhanden? Leistung, Ausrichtung und Baujahr dokumentiert', '', false);
  add('Erneuerbare Energien', 'Solarthermie: Vorhanden? Kollektorfläche und Ausrichtung dokumentiert', '', false);
  add('Erneuerbare Energien', 'Dachflächen-Potenzial für PV / Solar eingeschätzt', 'Ausrichtung, Neigung, Verschattung beurteilen', false);

  // ── Zusammenfassung / Nächste Schritte ───────────────────────────────────
  add('Zusammenfassung', 'Schwachstellen nach Begehung priorisiert notiert', 'Top-3-Maßnahmen einschätzen: Wärmeerzeuger, Hülle, Fenster');
  add('Zusammenfassung', 'Sanierungsreihenfolge und Stufenplan skizziert', 'Basis für individuellen Sanierungsfahrplan (iSFP)');
  add('Zusammenfassung', 'Fördermöglichkeiten für relevante Maßnahmen geprüft', 'BEG EM (BAFA), KfW 261, KfW 458 – passend zur Maßnahmenliste');
  add('Zusammenfassung', 'Ergebnisse mit Eigentümer besprochen', 'Rückfragen geklärt, nächste Schritte vereinbart', false);

  return items;
}

window.generateIsfpChecklist = generateIsfpChecklist;
