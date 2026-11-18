import assert from 'node:assert/strict';
import { initDatabase, db } from '../server/db.ts';
import { seedSoils } from '../server/seedSoils.ts';
import { seedCropsAndDatasets } from '../server/seedCrops.ts';
import { seedUsersAndMarkets } from '../server/seedMarketsAndUsers.ts';
import { ensureTrainedModel, runRecommendationEngine } from '../server/mlEngine.ts';
import { hashPassword, verifyPassword } from '../server/auth.ts';

async function runTests() {
  console.log('1. Initializing database & seeding...');
  initDatabase();
  seedSoils();
  seedCropsAndDatasets();
  seedUsersAndMarkets();

  const soilCount = (db.prepare('SELECT COUNT(*) AS c FROM soil_types').get() as { c: number }).c;
  assert.equal(soilCount, 32, 'Expected all 32 WRB Reference Soil Groups');

  const texCount = (db.prepare('SELECT COUNT(*) AS c FROM soil_textures').get() as { c: number }).c;
  assert.equal(texCount, 12, 'Expected all 12 USDA soil textures');

  const cropCount = (db.prepare('SELECT COUNT(*) AS c FROM crops').get() as { c: number }).c;
  assert.ok(cropCount >= 70, `Expected comprehensive crop database, found ${cropCount}`);

  // Verify zero duplicate soybean records despite belonging to pulses + oilseeds
  const soyRows = db.prepare("SELECT id FROM crops WHERE slug = 'soybean'").all();
  assert.equal(soyRows.length, 1, 'Soybean must have one canonical crop record');

  console.log('2. Verifying Random Forest ML training & evaluation...');
  const model = ensureTrainedModel();
  assert.ok(model.report.accuracy > 0.85, `Expected high held-out test accuracy, got ${model.report.accuracy}`);
  assert.equal(model.report.classes.length, 22);

  console.log('3. Testing missing-data refusal rule...');
  const insufficient = runRecommendationEngine({ country: 'India' });
  assert.equal(insufficient.status, 'insufficient_data');
  assert.equal(
    insufficient.message,
    'Not enough verified information to provide a reliable recommendation. Please provide additional soil or climate details.',
  );

  console.log('4. Testing Karnataka Red Loam (Lixisols) Kharif recommendation...');
  const kaRec = runRecommendationEngine({
    country: 'India',
    state_province: 'Karnataka',
    district_region: 'Mandya',
    soil_type: 'Lixisols',
    soil_texture: 'Sandy loam',
    ph: 6.4,
    nitrogen: 60,
    phosphorus: 40,
    potassium: 30,
    temperature: 26,
    rainfall: 750,
    humidity: 68,
    water_availability: 'Moderate',
    irrigation_method: 'Rainfed only',
    season: 'Kharif',
  });
  assert.equal(kaRec.status, 'recommended');
  assert.ok(kaRec.recommendations.length >= 1 && kaRec.recommendations.length <= 3);

  console.log('5. Testing password hashing & verification...');
  const hashed = hashPassword('Farmer@2026');
  assert.ok(verifyPassword('Farmer@2026', hashed));
  assert.ok(!verifyPassword('WrongPass', hashed));

  console.log('All backend, database, ML, and security tests passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
