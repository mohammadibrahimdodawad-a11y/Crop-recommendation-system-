import { db } from './db.ts';
import { CROP_CATEGORIES_SEED, type CropSeedEntry } from './cropTypes.ts';
import { CEREALS_AND_PULSES } from './catalogCerealsPulses.ts';
import { CASH_AND_OILSEEDS } from './catalogCashOilseeds.ts';
import { FRUITS_CATALOG } from './catalogFruits.ts';
import { VEGETABLES_CATALOG } from './catalogVegetables.ts';
import { SPICES_AND_OTHER_CATALOG } from './catalogSpicesOther.ts';

export const ALL_SEED_CROPS: CropSeedEntry[] = [
  ...CEREALS_AND_PULSES,
  ...CASH_AND_OILSEEDS,
  ...FRUITS_CATALOG,
  ...VEGETABLES_CATALOG,
  ...SPICES_AND_OTHER_CATALOG,
];

export const DATASETS_SEED = [
  {
    code: 'FAO-ECOCROP-2024',
    name: 'FAO EcoCrop Global Crop Environmental Requirements',
    publisher: 'Food and Agriculture Organization of the United Nations (FAO)',
    licence: 'CC BY-NC-SA 3.0 IGO (Attribution Required)',
    geographical_coverage: 'Global (190+ countries)',
    verification_status: 'verified',
    url: 'https://gaez.fao.org/pages/ecocrop',
    date_retrieved: '2026-10-15',
    record_count: ALL_SEED_CROPS.length,
    notes: 'Primary reference for crop temperature, rainfall, soil pH, and growing cycle thresholds.',
  },
  {
    code: 'FAO-WRB-2022',
    name: 'World Reference Base for Soil Resources (4th Edition)',
    publisher: 'IUSS Working Group WRB / FAO',
    licence: 'CC BY 4.0',
    geographical_coverage: 'Global (All 32 Reference Soil Groups)',
    verification_status: 'verified',
    url: 'https://wrb.isric.org/',
    date_retrieved: '2026-10-15',
    record_count: 32,
    notes: 'Standardized 32 WRB soil groups mapped to USDA Soil Taxonomy and regional soil descriptors.',
  },
  {
    code: 'ICAR-UAS-KA-2025',
    name: 'ICAR & UAS Bengaluru / Dharwad Package of Practices',
    publisher: 'Indian Council of Agricultural Research & Karnataka Agricultural Universities',
    licence: 'Public Academic / Government Reference',
    geographical_coverage: 'India & Karnataka Agro-Climatic Zones',
    verification_status: 'verified',
    url: 'https://uasbangalore.edu.in/',
    date_retrieved: '2026-10-18',
    record_count: 58,
    notes: 'Verified regional cultivars, NPK doses, Kharif/Rabi calendars, and Kannada common names.',
  },
  {
    code: 'ISRIC-SOILGRIDS-2',
    name: 'ISRIC SoilGrids v2.0 Global Gridded Soil Information',
    publisher: 'ISRIC — World Soil Information',
    licence: 'CC BY 4.0',
    geographical_coverage: 'Global (250m spatial resolution)',
    verification_status: 'verified',
    url: 'https://soilgrids.org/',
    date_retrieved: 'Live / On-demand REST API',
    record_count: 0,
    notes: 'Provides location-based estimated WRB group, pH, clay/sand/silt, and organic carbon. Always labeled as estimated.',
  },
  {
    code: 'OPEN-METEO-V1',
    name: 'Open-Meteo Global Weather & Forecast API',
    publisher: 'Open-Meteo',
    licence: 'CC BY 4.0 (Non-commercial open API)',
    geographical_coverage: 'Global gridded weather observations & 7-day forecasts',
    verification_status: 'verified',
    url: 'https://open-meteo.com/',
    date_retrieved: 'Live / On-demand REST API',
    record_count: 0,
    notes: 'Supplies current observations and 7-day forecasts; forecasts are explicitly marked non-guaranteed.',
  },
  {
    code: 'AGMARKNET-FAOSTAT-REF',
    name: 'AGMARKNET APMC & FAOSTAT Historical Price Benchmarks',
    publisher: 'Directorate of Marketing & Inspection (India) / FAOSTAT / World Bank Pink Sheet',
    licence: 'Government Open Data / CC BY 4.0',
    geographical_coverage: 'Karnataka APMCs, India & Global Commodity Markets',
    verification_status: 'verified',
    url: 'https://agmarknet.gov.in/',
    date_retrieved: '2026-10-20',
    record_count: 36,
    notes: 'Historical reference series explicitly dated and never presented as live spot prices.',
  },
];

export function upsertCropEntry(entry: CropSeedEntry, datasetId: number | null): number {
  const existing = db.prepare('SELECT id FROM crops WHERE slug = ?').get(entry.slug) as { id: number } | undefined;

  let cropId: number;
  if (existing) {
    cropId = existing.id;
    db.prepare(`
      UPDATE crops SET
        common_name = ?, common_name_kn = ?, scientific_name = ?, family_name = ?,
        cultivation_instructions = ?, nutrient_management = ?, common_pests_diseases = ?,
        harvesting_guidance = ?, storage_guidance = ?, growth_conditions = ?,
        source_reference = ?, verification_status = ?, dataset_id = ?, last_updated = datetime('now')
      WHERE id = ?
    `).run(
      entry.common_name,
      entry.common_name_kn || null,
      entry.scientific_name,
      entry.family_name || null,
      entry.cultivation,
      entry.nutrients,
      entry.pests,
      entry.harvesting,
      entry.storage,
      entry.growth_conditions,
      entry.source,
      entry.verification_status || 'verified',
      datasetId,
      cropId,
    );
    db.prepare('DELETE FROM crop_category_map WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_synonyms WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_varieties WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_soil_requirements WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_climate_requirements WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_seasons WHERE crop_id = ?').run(cropId);
    db.prepare('DELETE FROM crop_regions WHERE crop_id = ?').run(cropId);
  } else {
    const res = db.prepare(`
      INSERT INTO crops (
        slug, common_name, common_name_kn, scientific_name, family_name,
        cultivation_instructions, nutrient_management, common_pests_diseases,
        harvesting_guidance, storage_guidance, growth_conditions,
        source_reference, verification_status, dataset_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.slug,
      entry.common_name,
      entry.common_name_kn || null,
      entry.scientific_name,
      entry.family_name || null,
      entry.cultivation,
      entry.nutrients,
      entry.pests,
      entry.harvesting,
      entry.storage,
      entry.growth_conditions,
      entry.source,
      entry.verification_status || 'verified',
      datasetId,
    );
    cropId = Number(res.lastInsertRowid);
  }

  for (const catSlug of entry.categories) {
    const catRow = db.prepare('SELECT id FROM crop_categories WHERE slug = ?').get(catSlug) as { id: number } | undefined;
    if (catRow) {
      db.prepare('INSERT OR IGNORE INTO crop_category_map (crop_id, category_id) VALUES (?, ?)').run(cropId, catRow.id);
    }
  }

  const insSyn = db.prepare('INSERT INTO crop_synonyms (crop_id, name, language_or_region, is_scientific_synonym) VALUES (?, ?, ?, ?)');
  for (const s of entry.synonyms || []) {
    insSyn.run(cropId, s.name, s.region, s.scientific ? 1 : 0);
  }

  const insVar = db.prepare('INSERT INTO crop_varieties (crop_id, variety_name, region, maturity_days, traits, source_reference) VALUES (?, ?, ?, ?, ?, ?)');
  for (const v of entry.varieties || []) {
    insVar.run(cropId, v.name, v.region, v.maturity_days || null, v.traits, entry.source);
  }

  db.prepare(`
    INSERT INTO crop_soil_requirements (
      crop_id, ph_min, ph_max, ph_optimal_min, ph_optimal_max,
      n_req_kg_ha, p_req_kg_ha, k_req_kg_ha, n_ideal, p_ideal, k_ideal,
      suitable_wrb_groups, suitable_textures, salinity_tolerance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cropId,
    entry.ph_min,
    entry.ph_max,
    entry.ph_opt_min ?? entry.ph_min,
    entry.ph_opt_max ?? entry.ph_max,
    entry.n_req,
    entry.p_req,
    entry.k_req,
    entry.n_ideal,
    entry.p_ideal,
    entry.k_ideal,
    JSON.stringify(entry.suitable_wrb || []),
    JSON.stringify(entry.suitable_textures || []),
    entry.salinity_tolerance || 'Low-moderate',
  );

  db.prepare(`
    INSERT INTO crop_climate_requirements (
      crop_id, temp_min_c, temp_max_c, temp_opt_min_c, temp_opt_max_c,
      rainfall_min_mm, rainfall_max_mm, humidity_min_pct, humidity_max_pct,
      water_requirement, irrigation_requirement, drought_tolerance, frost_sensitivity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cropId,
    entry.temp_min,
    entry.temp_max,
    entry.temp_opt_min ?? entry.temp_min,
    entry.temp_opt_max ?? entry.temp_max,
    entry.rain_min,
    entry.rain_max,
    entry.humidity_min,
    entry.humidity_max,
    entry.water_req,
    entry.irrigation_req,
    entry.drought_tolerance,
    entry.frost_sensitivity,
  );

  const insSeason = db.prepare('INSERT INTO crop_seasons (crop_id, season_name, sowing_period, harvesting_period, duration_days_min, duration_days_max, region_scope) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const sn of entry.seasons || []) {
    insSeason.run(cropId, sn.name, sn.sowing, sn.harvesting, sn.days_min, sn.days_max, sn.scope || 'Global');
  }

  const insRegion = db.prepare('INSERT INTO crop_regions (crop_id, country, state_or_region, notes) VALUES (?, ?, ?, ?)');
  for (const reg of entry.regions || []) {
    insRegion.run(cropId, reg.country, reg.state || null, reg.notes || null);
  }

  return cropId;
}

export function seedCropsAndDatasets(): void {
  const dsCount = (db.prepare('SELECT COUNT(*) AS cnt FROM datasets').get() as { cnt: number }).cnt;
  if (dsCount === 0) {
    const insDs = db.prepare(`
      INSERT INTO datasets (code, name, publisher, licence, geographical_coverage, verification_status, url, date_retrieved, record_count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of DATASETS_SEED) {
      insDs.run(d.code, d.name, d.publisher, d.licence, d.geographical_coverage, d.verification_status, d.url, d.date_retrieved, d.record_count, d.notes);
    }
  }

  const catCount = (db.prepare('SELECT COUNT(*) AS cnt FROM crop_categories').get() as { cnt: number }).cnt;
  if (catCount === 0) {
    const insCat = db.prepare('INSERT INTO crop_categories (slug, name, name_kn, description) VALUES (?, ?, ?, ?)');
    for (const c of CROP_CATEGORIES_SEED) {
      insCat.run(c.slug, c.name, c.name_kn, c.description);
    }
  }

  const cropCount = (db.prepare('SELECT COUNT(*) AS cnt FROM crops').get() as { cnt: number }).cnt;
  if (cropCount === 0) {
    const primaryDs = db.prepare('SELECT id FROM datasets WHERE code = ?').get('FAO-ECOCROP-2024') as { id: number } | undefined;
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const crop of ALL_SEED_CROPS) {
        upsertCropEntry(crop, primaryDs?.id ?? null);
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}
