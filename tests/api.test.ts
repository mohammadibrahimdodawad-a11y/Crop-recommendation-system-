import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.ts';
import { db } from '../server/db.ts';

async function runApiTests() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;

  try {
    console.log('1. Checking /api/health, /api/categories, /api/crops, /api/soils, /api/ml/metrics...');
    const health = await fetch(`${base}/api/health`).then((r) => r.json());
    assert.equal(health.status, 'ok');
    assert.ok(health.crops >= 70);
    assert.equal(health.wrb_soil_groups, 32);

    const cats = await fetch(`${base}/api/categories`).then((r) => r.json());
    assert.ok(Array.isArray(cats.categories) && cats.categories.length >= 13);

    const ragiSearch = await fetch(`${base}/api/crops?q=ರಾಗಿ`).then((r) => r.json());
    assert.ok(ragiSearch.crops.some((c: any) => c.slug === 'finger-millet'), 'Kannada search should find Finger Millet');

    const cropDetail = await fetch(`${base}/api/crops/finger-millet`).then((r) => r.json());
    assert.equal(cropDetail.crop.common_name, 'Finger Millet (Ragi)');
    assert.ok(Array.isArray(cropDetail.crop.varieties) && cropDetail.crop.varieties.length > 0);

    const soils = await fetch(`${base}/api/soils?q=Black+Cotton`).then((r) => r.json());
    assert.ok(soils.wrb_soils.some((s: any) => s.wrb_name === 'Vertisols'), 'Regional Black Cotton search must resolve to Vertisols');
    assert.equal(soils.textures.length, 12);

    const metrics = await fetch(`${base}/api/ml/metrics`).then((r) => r.json());
    assert.ok(metrics.report.accuracy > 0.85);
    assert.equal(metrics.report.confusionMatrix.length, 22);

    console.log('2. Testing /api/recommend bounds, insufficiency refusal, and valid recommendation...');
    const badBounds = await fetch(`${base}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ph: 15 }),
    });
    assert.equal(badBounds.status, 400);

    const insuff = await fetch(`${base}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'India' }),
    }).then((r) => r.json());
    assert.equal(insuff.status, 'insufficient_data');

    const rec = await fetch(`${base}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: 'India',
        state_province: 'Karnataka',
        district_region: 'Kalaburagi',
        soil_type: 'Vertisols',
        soil_texture: 'Clay',
        ph: 7.4,
        nitrogen: 35,
        phosphorus: 55,
        potassium: 25,
        temperature: 29,
        rainfall: 850,
        humidity: 60,
        water_availability: 'Moderate',
        irrigation_method: 'Rainfed only',
        season: 'Kharif',
      }),
    }).then((r) => r.json());
    assert.equal(rec.status, 'recommended');
    assert.ok(rec.recommendations.length >= 1);
    assert.ok(rec.recommendations[0].explanations.length >= 1);

    console.log('3. Testing Farmer login, CSRF enforcement, farm CRUD, favourites, feedback & Admin RBAC...');
    const farmerLoginResp = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer@karnataka.ag', password: 'Farmer@2026' }),
    });
    assert.equal(farmerLoginResp.status, 200);
    const farmerCookie = farmerLoginResp.headers.get('set-cookie')?.split(';')[0] || '';
    const farmerJson = await farmerLoginResp.json();
    const farmerCsrf = farmerJson.user.csrfToken;
    assert.ok(farmerCookie && farmerCsrf);

    // CSRF rejection check when X-CSRF-Token omitted
    const missingCsrf = await fetch(`${base}/api/farmer/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: farmerCookie },
      body: JSON.stringify({ farm_name: 'No CSRF Plot' }),
    });
    assert.equal(missingCsrf.status, 403);

    // RBAC check: farmer cannot access /api/admin/overview
    const rbacReject = await fetch(`${base}/api/admin/overview`, {
      headers: { Cookie: farmerCookie },
    });
    assert.equal(rbacReject.status, 403);

    // Farmer favourite toggle
    const favAdd = await fetch(`${base}/api/farmer/favourites/${cropDetail.crop.id}`, {
      method: 'POST',
      headers: { Cookie: farmerCookie, 'X-CSRF-Token': farmerCsrf },
    });
    assert.equal(favAdd.status, 200);

    // Farmer dashboard fetch
    const dash = await fetch(`${base}/api/farmer/dashboard`, {
      headers: { Cookie: farmerCookie },
    }).then((r) => r.json());
    assert.ok(dash.farms.length >= 1);
    assert.ok(dash.favourites.some((f: any) => f.slug === 'finger-millet'));

    // Feedback endpoint
    const fb = await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Test',
        email: 'test@example.org',
        country: 'India',
        topic: 'General Feedback',
        message: 'Automated integration test feedback entry.',
      }),
    });
    assert.equal(fb.status, 201);
    const fbJson = await fb.json();
    db.prepare('DELETE FROM feedback WHERE id = ?').run(fbJson.id);

    // Admin login & overview check
    const adminLoginResp = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@globalcrops.org', password: 'Admin@2026' }),
    });
    assert.equal(adminLoginResp.status, 200);
    const adminCookie = adminLoginResp.headers.get('set-cookie')?.split(';')[0] || '';
    const adminOv = await fetch(`${base}/api/admin/overview`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminOv.status, 200);
    const adminJson = await adminOv.json();
    assert.ok(adminJson.stats.crops >= 70);
    assert.ok(adminJson.auditLogs.length >= 1);

    // Markets & Datasets endpoints
    const markets = await fetch(`${base}/api/markets?country=India`).then((r) => r.json());
    assert.ok(markets.prices.length >= 5);
    const datasets = await fetch(`${base}/api/datasets`).then((r) => r.json());
    assert.ok(datasets.datasets.length >= 4);

    console.log('All HTTP API integration tests passed!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runApiTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
