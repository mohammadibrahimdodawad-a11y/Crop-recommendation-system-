import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'agronomy.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

export function initDatabase(): void {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role_id INTEGER NOT NULL REFERENCES roles(id),
      preferred_language TEXT NOT NULL DEFAULT 'en',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT NOT NULL,
      state_province TEXT,
      district_region TEXT,
      village_town TEXT,
      latitude REAL,
      longitude REAL,
      agro_climatic_zone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      phone TEXT,
      primary_location_id INTEGER REFERENCES locations(id),
      farming_experience_years INTEGER,
      preferred_units TEXT NOT NULL DEFAULT 'metric',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS soil_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wrb_code TEXT NOT NULL UNIQUE,
      wrb_name TEXT NOT NULL UNIQUE,
      usda_equivalent TEXT,
      regional_names TEXT NOT NULL,
      simple_explanation TEXT NOT NULL,
      simple_explanation_kn TEXT,
      typical_ph_min REAL,
      typical_ph_max REAL,
      drainage_class TEXT,
      fertility_notes TEXT,
      global_occurrence TEXT,
      source_reference TEXT NOT NULL,
      licence TEXT NOT NULL DEFAULT 'CC BY 4.0 / FAO-ISRIC'
    );

    CREATE TABLE IF NOT EXISTS soil_textures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_kn TEXT,
      sand_pct_range TEXT NOT NULL,
      silt_pct_range TEXT NOT NULL,
      clay_pct_range TEXT NOT NULL,
      water_retention TEXT NOT NULL,
      drainage_rate TEXT NOT NULL,
      workability_notes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      farm_name TEXT NOT NULL,
      location_id INTEGER REFERENCES locations(id),
      area_hectares REAL,
      soil_type_id INTEGER REFERENCES soil_types(id),
      soil_texture_id INTEGER REFERENCES soil_textures(id),
      irrigation_method TEXT,
      water_availability TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS soil_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      source_type TEXT NOT NULL CHECK (source_type IN ('laboratory', 'estimated', 'manual')),
      soil_type_id INTEGER REFERENCES soil_types(id),
      soil_texture_id INTEGER REFERENCES soil_textures(id),
      ph REAL,
      nitrogen_kg_ha REAL,
      phosphorus_kg_ha REAL,
      potassium_kg_ha REAL,
      organic_carbon_pct REAL,
      data_source TEXT NOT NULL,
      resolution_notes TEXT,
      retrieved_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      publisher TEXT NOT NULL,
      licence TEXT NOT NULL,
      geographical_coverage TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      url TEXT,
      date_retrieved TEXT NOT NULL,
      record_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL UNIQUE,
      name_kn TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      common_name TEXT NOT NULL,
      common_name_kn TEXT,
      scientific_name TEXT NOT NULL,
      family_name TEXT,
      cultivation_instructions TEXT,
      nutrient_management TEXT,
      common_pests_diseases TEXT,
      harvesting_guidance TEXT,
      storage_guidance TEXT,
      growth_conditions TEXT,
      source_reference TEXT NOT NULL,
      licence TEXT NOT NULL DEFAULT 'Open Agricultural Reference / FAO-ICAR',
      verification_status TEXT NOT NULL DEFAULT 'verified',
      dataset_id INTEGER REFERENCES datasets(id),
      last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS crop_category_map (
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES crop_categories(id) ON DELETE CASCADE,
      PRIMARY KEY (crop_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS crop_synonyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      language_or_region TEXT NOT NULL,
      is_scientific_synonym INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crop_varieties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      variety_name TEXT NOT NULL,
      region TEXT NOT NULL,
      maturity_days TEXT,
      traits TEXT,
      source_reference TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crop_soil_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL UNIQUE REFERENCES crops(id) ON DELETE CASCADE,
      ph_min REAL,
      ph_max REAL,
      ph_optimal_min REAL,
      ph_optimal_max REAL,
      n_req_kg_ha TEXT,
      p_req_kg_ha TEXT,
      k_req_kg_ha TEXT,
      n_ideal REAL,
      p_ideal REAL,
      k_ideal REAL,
      suitable_wrb_groups TEXT,
      suitable_textures TEXT,
      salinity_tolerance TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_climate_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL UNIQUE REFERENCES crops(id) ON DELETE CASCADE,
      temp_min_c REAL,
      temp_max_c REAL,
      temp_opt_min_c REAL,
      temp_opt_max_c REAL,
      rainfall_min_mm REAL,
      rainfall_max_mm REAL,
      humidity_min_pct REAL,
      humidity_max_pct REAL,
      water_requirement TEXT,
      irrigation_requirement TEXT,
      drought_tolerance TEXT,
      frost_sensitivity TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      season_name TEXT NOT NULL,
      sowing_period TEXT,
      harvesting_period TEXT,
      duration_days_min INTEGER,
      duration_days_max INTEGER,
      region_scope TEXT NOT NULL DEFAULT 'Global'
    );

    CREATE TABLE IF NOT EXISTS crop_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      country TEXT NOT NULL,
      state_or_region TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      dataset_id INTEGER REFERENCES datasets(id),
      citation TEXT NOT NULL,
      url TEXT,
      retrieved_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
      country TEXT NOT NULL,
      state_province TEXT,
      district_region TEXT,
      latitude REAL,
      longitude REAL,
      soil_type_input TEXT,
      soil_texture_input TEXT,
      soil_source_mode TEXT NOT NULL DEFAULT 'manual',
      ph_input REAL,
      nitrogen_input REAL,
      phosphorus_input REAL,
      potassium_input REAL,
      temperature_input REAL,
      rainfall_input REAL,
      humidity_input REAL,
      water_availability TEXT,
      irrigation_method TEXT,
      season_input TEXT,
      preference_category TEXT,
      status TEXT NOT NULL,
      model_version TEXT NOT NULL,
      dataset_version TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recommendation_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      rank_order INTEGER NOT NULL,
      agronomic_score REAL NOT NULL,
      ml_probability REAL,
      combined_score REAL NOT NULL,
      explanation_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      limitations_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weather_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_label TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      record_type TEXT NOT NULL CHECK (record_type IN ('observation', 'forecast', 'historical')),
      temperature_c REAL,
      humidity_pct REAL,
      precipitation_mm REAL,
      wind_speed_kmh REAL,
      payload_json TEXT NOT NULL,
      source_name TEXT NOT NULL,
      retrieved_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
      commodity_name TEXT NOT NULL,
      country TEXT NOT NULL,
      state_province TEXT,
      market_location TEXT NOT NULL,
      price_min REAL,
      price_max REAL,
      price_modal REAL NOT NULL,
      currency TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_date TEXT NOT NULL,
      data_type TEXT NOT NULL CHECK (data_type IN ('historical_reference', 'official_archive', 'estimated')),
      source_name TEXT NOT NULL,
      source_url TEXT
    );

    CREATE TABLE IF NOT EXISTS favourite_crops (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, crop_id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      country TEXT,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_table TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_crops_slug ON crops(slug);
    CREATE INDEX IF NOT EXISTS idx_crops_common ON crops(common_name);
    CREATE INDEX IF NOT EXISTS idx_crop_synonyms_name ON crop_synonyms(name);
    CREATE INDEX IF NOT EXISTS idx_crop_regions_country ON crop_regions(country);
    CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
    CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON market_prices(crop_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}
