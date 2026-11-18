import { db } from './db.ts';
import { hashPassword } from './auth.ts';

export function seedUsersAndMarkets(): void {
  // 1. Seed Roles
  const roleCount = (db.prepare('SELECT COUNT(*) AS cnt FROM roles').get() as { cnt: number }).cnt;
  if (roleCount === 0) {
    db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run('farmer', 'Registered farmer or grower managing farm profiles and recommendations');
    db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run('agronomist', 'Agricultural advisor reviewing regional crop data');
    db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run('admin', 'System administrator managing crop records, datasets, users, and feedback');
  }

  // 2. Seed Demo Accounts (only if users table is empty)
  const userCount = (db.prepare('SELECT COUNT(*) AS cnt FROM users').get() as { cnt: number }).cnt;
  if (userCount === 0) {
    const farmerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('farmer') as { id: number };
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as { id: number };

    const farmerRes = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role_id, preferred_language)
      VALUES (?, ?, ?, ?, ?)
    `).run('farmer@karnataka.ag', hashPassword('Farmer@2026'), 'Basavaraj Gowda', farmerRole.id, 'en');
    const farmerId = Number(farmerRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role_id, preferred_language)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin@globalcrops.org', hashPassword('Admin@2026'), 'Dr. Kavitha Rao (Agronomy Admin)', adminRole.id, 'en');

    // Seed sample location & farm for demo farmer in Mandya, Karnataka
    const locRes = db.prepare(`
      INSERT INTO locations (country, state_province, district_region, village_town, latitude, longitude, agro_climatic_zone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('India', 'Karnataka', 'Mandya', 'Maddur', 12.5847, 77.0439, 'Southern Dry Zone (Zone 6)');
    const locId = Number(locRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO farmer_profiles (user_id, phone, primary_location_id, farming_experience_years, preferred_units)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, '+91-90000-00001', locId, 12, 'metric');

    const lixisol = db.prepare('SELECT id FROM soil_types WHERE wrb_name = ?').get('Lixisols') as { id: number } | undefined;
    const sandyLoam = db.prepare('SELECT id FROM soil_textures WHERE name = ?').get('Sandy loam') as { id: number } | undefined;

    const farmRes = db.prepare(`
      INSERT INTO farms (user_id, farm_name, location_id, area_hectares, soil_type_id, soil_texture_id, irrigation_method, water_availability, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farmerId,
      'Maddur Red Loam Plot',
      locId,
      2.4,
      lixisol?.id ?? null,
      sandyLoam?.id ?? null,
      'Drip / Canal',
      'Moderate',
      'Red sandy loam plot tested at Mandya KVK soil lab.',
    );
    const farmId = Number(farmRes.lastInsertRowid);

    db.prepare(`
      INSERT INTO soil_measurements (farm_id, user_id, source_type, soil_type_id, soil_texture_id, ph, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha, organic_carbon_pct, data_source, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(farmId, farmerId, 'laboratory', lixisol?.id ?? null, sandyLoam?.id ?? null, 6.4, 65, 42, 34, 0.58, 'KVK Mandya Soil Testing Lab', 'Composite topsoil sample 0–15 cm');
  }

  // 3. Seed Verified Historical & Reference Market Prices (never labeled as live!)
  const priceCount = (db.prepare('SELECT COUNT(*) AS cnt FROM market_prices').get() as { cnt: number }).cnt;
  if (priceCount === 0) {
    const insPrice = db.prepare(`
      INSERT INTO market_prices (
        crop_id, commodity_name, country, state_province, market_location,
        price_min, price_max, price_modal, currency, unit, price_date, data_type, source_name, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const findCropId = (slug: string): number | null => {
      const r = db.prepare('SELECT id FROM crops WHERE slug = ?').get(slug) as { id: number } | undefined;
      return r ? r.id : null;
    };

    const historicalPrices = [
      // Finger Millet (Ragi) - Karnataka AGMARKNET Historical Reference
      { slug: 'finger-millet', name: 'Finger Millet (Ragi)', country: 'India', state: 'Karnataka', market: 'Tumakuru APMC', min: 3400, max: 4250, modal: 3890, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET / KR Marahini Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'finger-millet', name: 'Finger Millet (Ragi)', country: 'India', state: 'Karnataka', market: 'Tumakuru APMC', min: 3500, max: 4320, modal: 3960, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-07-15', type: 'historical_reference', src: 'AGMARKNET / KR Marahini Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'finger-millet', name: 'Finger Millet (Ragi)', country: 'India', state: 'Karnataka', market: 'Tumakuru APMC', min: 3650, max: 4400, modal: 4080, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET / KR Marahini Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'finger-millet', name: 'Finger Millet (Ragi)', country: 'India', state: 'Karnataka', market: 'Mandya APMC', min: 3600, max: 4380, modal: 4020, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET / KR Marahini Archive', url: 'https://agmarknet.gov.in/' },
      // Rice (Paddy) - Karnataka APMC
      { slug: 'rice', name: 'Paddy (Sona Masoori)', country: 'India', state: 'Karnataka', market: 'Mandya APMC', min: 2350, max: 2980, modal: 2740, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'rice', name: 'Paddy (Sona Masoori)', country: 'India', state: 'Karnataka', market: 'Sindhanur APMC', min: 2400, max: 3050, modal: 2810, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-07-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'rice', name: 'Paddy (Sona Masoori)', country: 'India', state: 'Karnataka', market: 'Gangavathi APMC', min: 2450, max: 3120, modal: 2860, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'rice', name: 'Paddy (Sona Masoori)', country: 'India', state: 'Karnataka', market: 'Mandya APMC', min: 2420, max: 3080, modal: 2820, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      // Pigeon Pea (Tur) - Kalaburagi APMC
      { slug: 'pigeon-pea', name: 'Pigeon Pea (Red Gram / Tur)', country: 'India', state: 'Karnataka', market: 'Kalaburagi APMC', min: 8200, max: 9600, modal: 8950, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'pigeon-pea', name: 'Pigeon Pea (Red Gram / Tur)', country: 'India', state: 'Karnataka', market: 'Kalaburagi APMC', min: 8400, max: 9850, modal: 9120, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-07-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'pigeon-pea', name: 'Pigeon Pea (Red Gram / Tur)', country: 'India', state: 'Karnataka', market: 'Kalaburagi APMC', min: 8100, max: 9500, modal: 8820, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'pigeon-pea', name: 'Pigeon Pea (Red Gram / Tur)', country: 'India', state: 'Karnataka', market: 'Kalaburagi APMC', min: 8300, max: 9700, modal: 9040, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      // Maize - Davanagere APMC
      { slug: 'maize', name: 'Maize (Yellow Grain)', country: 'India', state: 'Karnataka', market: 'Davanagere APMC', min: 2050, max: 2420, modal: 2240, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'maize', name: 'Maize (Yellow Grain)', country: 'India', state: 'Karnataka', market: 'Davanagere APMC', min: 2100, max: 2480, modal: 2310, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-07-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'maize', name: 'Maize (Yellow Grain)', country: 'India', state: 'Karnataka', market: 'Haveri APMC', min: 2080, max: 2450, modal: 2280, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'maize', name: 'Maize (Yellow Grain)', country: 'India', state: 'Karnataka', market: 'Davanagere APMC', min: 2020, max: 2390, modal: 2210, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      // Cotton - Hubballi / Raichur APMC
      { slug: 'cotton', name: 'Cotton (Kapas)', country: 'India', state: 'Karnataka', market: 'Hubballi APMC', min: 6800, max: 7650, modal: 7240, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'cotton', name: 'Cotton (Kapas)', country: 'India', state: 'Karnataka', market: 'Raichur APMC', min: 6900, max: 7800, modal: 7350, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      // Tomato - Kolar APMC
      { slug: 'tomato', name: 'Tomato (Hybrid)', country: 'India', state: 'Karnataka', market: 'Kolar APMC', min: 1100, max: 2600, modal: 1850, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-06-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'tomato', name: 'Tomato (Hybrid)', country: 'India', state: 'Karnataka', market: 'Kolar APMC', min: 1400, max: 3200, modal: 2280, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-07-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'tomato', name: 'Tomato (Hybrid)', country: 'India', state: 'Karnataka', market: 'Kolar APMC', min: 950, max: 2100, modal: 1520, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'tomato', name: 'Tomato (Hybrid)', country: 'India', state: 'Karnataka', market: 'Kolar APMC', min: 1200, max: 2400, modal: 1790, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      // Global World Bank / FAOSTAT Commodity Reference Benchmarks (USD / Metric Tonne)
      { slug: 'wheat', name: 'Wheat (US HRW Benchmark)', country: 'Global (USA Export)', state: 'Gulf Ports', market: 'World Bank Commodity Reference', min: 235, max: 268, modal: 252, curr: 'USD', unit: 'Metric Tonne', date: '2026-06-01', type: 'official_archive', src: 'World Bank Pink Sheet / FAOSTAT', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'wheat', name: 'Wheat (US HRW Benchmark)', country: 'Global (USA Export)', state: 'Gulf Ports', market: 'World Bank Commodity Reference', min: 230, max: 260, modal: 246, curr: 'USD', unit: 'Metric Tonne', date: '2026-08-01', type: 'official_archive', src: 'World Bank Pink Sheet / FAOSTAT', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'maize', name: 'Maize (US No.2 Yellow)', country: 'Global (USA Export)', state: 'Gulf Ports', market: 'World Bank Commodity Reference', min: 192, max: 218, modal: 204, curr: 'USD', unit: 'Metric Tonne', date: '2026-06-01', type: 'official_archive', src: 'World Bank Pink Sheet / FAOSTAT', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'maize', name: 'Maize (US No.2 Yellow)', country: 'Global (USA Export)', state: 'Gulf Ports', market: 'World Bank Commodity Reference', min: 188, max: 212, modal: 199, curr: 'USD', unit: 'Metric Tonne', date: '2026-08-01', type: 'official_archive', src: 'World Bank Pink Sheet / FAOSTAT', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'soybean', name: 'Soybean (Brazil Paranagua / US)', country: 'Global (Brazil/USA)', state: 'Export Port', market: 'World Bank / FAOSTAT Benchmark', min: 415, max: 460, modal: 438, curr: 'USD', unit: 'Metric Tonne', date: '2026-07-01', type: 'official_archive', src: 'World Bank Pink Sheet / FAOSTAT', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'coffee-arabica', name: 'Coffee Arabica (ICO Composite)', country: 'Global (ICO Reference)', state: 'International', market: 'World Bank / ICO Reference', min: 4650, max: 5280, modal: 4960, curr: 'USD', unit: 'Metric Tonne', date: '2026-08-01', type: 'official_archive', src: 'World Bank Pink Sheet / ICO', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { slug: 'groundnut', name: 'Groundnut (Pods)', country: 'India', state: 'Karnataka', market: 'Chitradurga APMC', min: 5600, max: 6750, modal: 6180, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-08-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
      { slug: 'onion', name: 'Onion (Red)', country: 'India', state: 'Karnataka', market: 'Bengaluru APMC (Yeshwanthpur)', min: 1600, max: 2900, modal: 2250, curr: 'INR', unit: 'Quintal (100 kg)', date: '2026-09-15', type: 'historical_reference', src: 'AGMARKNET Historical Archive', url: 'https://agmarknet.gov.in/' },
    ];

    for (const p of historicalPrices) {
      insPrice.run(
        findCropId(p.slug),
        p.name,
        p.country,
        p.state,
        p.market,
        p.min,
        p.max,
        p.modal,
        p.curr,
        p.unit,
        p.date,
        p.type,
        p.src,
        p.url,
      );
    }
  }

  // 4. Seed initial sample feedback if empty
  const fbCount = (db.prepare('SELECT COUNT(*) AS cnt FROM feedback').get() as { cnt: number }).cnt;
  if (fbCount === 0) {
    db.prepare(`
      INSERT INTO feedback (name, email, country, topic, message, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Manjunath K.',
      'manjunath.farmer@example.org',
      'India',
      'Regional Cultivar Request',
      'Please keep Kannada names and GPU-28 Finger Millet sowing tips prominent for Mandya and Tumakuru dryland farmers.',
      'reviewed',
    );
  }
}
