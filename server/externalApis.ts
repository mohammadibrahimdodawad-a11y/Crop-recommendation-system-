import { db } from './db.ts';

export interface WeatherResult {
  location_label: string;
  latitude: number;
  longitude: number;
  retrieved_at: string;
  source_name: string;
  data_status: 'live_api' | 'cached_fallback' | 'unavailable';
  current_observation: {
    temperature_c: number;
    humidity_pct: number;
    precipitation_mm: number;
    wind_speed_kmh: number;
    observation_time: string;
    label: string;
  } | null;
  forecast_7day: {
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    precipitation_mm: number;
    precipitation_prob_pct: number | null;
  }[];
  forecast_disclaimer: string;
  seasonal_climate_note: string;
}

export interface SoilEstimateResult {
  latitude: number;
  longitude: number;
  source_name: string;
  data_status: 'isric_live' | 'regional_reference_estimate';
  is_estimated: true;
  resolution_notes: string;
  retrieved_at: string;
  estimated_wrb_group: string | null;
  estimated_texture: string | null;
  estimated_ph: number | null;
  estimated_organic_carbon_g_kg: number | null;
  estimated_nitrogen_g_kg: number | null;
  clay_pct: number | null;
  sand_pct: number | null;
  silt_pct: number | null;
  warning: string;
}

function mapSandSiltClayToTexture(sand: number, silt: number, clay: number): string {
  if (clay >= 40) {
    if (silt >= 40) return 'Silty clay';
    if (sand >= 45) return 'Sandy clay';
    return 'Clay';
  }
  if (clay >= 27) {
    if (sand >= 45) return 'Sandy clay loam';
    if (sand <= 20) return 'Silty clay loam';
    return 'Clay loam';
  }
  if (silt >= 50) return clay >= 12 || sand >= 20 ? 'Silty loam' : 'Silty';
  if (sand >= 85) return 'Sandy';
  if (sand >= 70) return 'Loamy sand';
  if (sand >= 43 && clay < 20) return 'Sandy loam';
  return 'Loamy';
}

export async function geocodePlace(query: string): Promise<{ name: string; country: string; admin1?: string; latitude: number; longitude: number }[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return [];
    const data = (await resp.json()) as { results?: any[] };
    return (data.results || []).map((r) => ({
      name: r.name,
      country: r.country || '',
      admin1: r.admin1 || '',
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch {
    return [];
  }
}

export async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  locationLabel: string,
): Promise<WeatherResult> {
  const base = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';
  const url = `${base}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) {
      throw new Error(`Open-Meteo HTTP ${resp.status}`);
    }
    const data = (await resp.json()) as any;
    const retrievedAt = new Date().toISOString();

    const currentObs = data.current
      ? {
          temperature_c: Number(data.current.temperature_2m),
          humidity_pct: Number(data.current.relative_humidity_2m),
          precipitation_mm: Number(data.current.precipitation ?? 0),
          wind_speed_kmh: Number(data.current.wind_speed_10m ?? 0),
          observation_time: data.current.time || retrievedAt,
          label: 'Current Weather Observation (Open-Meteo)',
        }
      : null;

    const forecast: WeatherResult['forecast_7day'] = [];
    if (data.daily && Array.isArray(data.daily.time)) {
      for (let i = 0; i < data.daily.time.length; i++) {
        forecast.push({
          date: data.daily.time[i],
          temp_max_c: Number(data.daily.temperature_2m_max[i]),
          temp_min_c: Number(data.daily.temperature_2m_min[i]),
          precipitation_mm: Number(data.daily.precipitation_sum[i] ?? 0),
          precipitation_prob_pct:
            data.daily.precipitation_probability_max?.[i] != null
              ? Number(data.daily.precipitation_probability_max[i])
              : null,
        });
      }
    }

    const result: WeatherResult = {
      location_label: locationLabel,
      latitude,
      longitude,
      retrieved_at: retrievedAt,
      source_name: 'Open-Meteo Weather API (CC BY 4.0)',
      data_status: 'live_api',
      current_observation: currentObs,
      forecast_7day: forecast,
      forecast_disclaimer: '7-day forecast values are probabilistic meteorological projections and NOT guaranteed future conditions.',
      seasonal_climate_note: 'For seasonal crop selection, enter multi-month expected seasonal rainfall (mm) rather than a single day’s precipitation.',
    };

    if (currentObs) {
      db.prepare(`
        INSERT INTO weather_records (location_label, latitude, longitude, record_type, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, payload_json, source_name, retrieved_at)
        VALUES (?, ?, ?, 'observation', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        locationLabel,
        latitude,
        longitude,
        currentObs.temperature_c,
        currentObs.humidity_pct,
        currentObs.precipitation_mm,
        currentObs.wind_speed_kmh,
        JSON.stringify(result),
        result.source_name,
        retrievedAt,
      );
    }

    return result;
  } catch {
    // Graceful fallback to last cached record near coordinates if available
    const cached = db.prepare(`
      SELECT payload_json, retrieved_at FROM weather_records
      WHERE ABS(latitude - ?) < 0.25 AND ABS(longitude - ?) < 0.25
      ORDER BY id DESC LIMIT 1
    `).get(latitude, longitude) as { payload_json: string; retrieved_at: string } | undefined;

    if (cached) {
      const parsed = JSON.parse(cached.payload_json) as WeatherResult;
      return {
        ...parsed,
        data_status: 'cached_fallback',
        forecast_disclaimer: 'Live Open-Meteo request failed; showing previously cached observation/forecast. Please verify locally or enter values manually.',
      };
    }

    return {
      location_label: locationLabel,
      latitude,
      longitude,
      retrieved_at: new Date().toISOString(),
      source_name: 'Open-Meteo (Unavailable)',
      data_status: 'unavailable',
      current_observation: null,
      forecast_7day: [],
      forecast_disclaimer: 'Weather API unreachable or rate-limited. Use manual temperature, humidity, and rainfall inputs in the Crop Recommendation form.',
      seasonal_climate_note: 'Manual climate entry active.',
    };
  }
}

export async function fetchSoilEstimate(latitude: number, longitude: number): Promise<SoilEstimateResult> {
  const base = process.env.SOILGRIDS_BASE_URL || 'https://rest.isric.org/soilgrids/v2.0';
  const retrievedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);
    const propsUrl = `${base}/properties/query?lon=${longitude}&lat=${latitude}&property=phh2o&property=clay&property=sand&property=silt&property=soc&property=nitrogen&depth=0-5cm&value=mean`;
    const classUrl = `${base}/classification/query?lon=${longitude}&lat=${latitude}&number_classes=3`;

    const [propsResp, classResp] = await Promise.all([
      fetch(propsUrl, { signal: controller.signal }),
      fetch(classUrl, { signal: controller.signal }).catch(() => null),
    ]);
    clearTimeout(timer);

    if (!propsResp.ok) throw new Error(`SoilGrids HTTP ${propsResp.status}`);
    const propsJson = (await propsResp.json()) as any;
    const layers = propsJson?.properties?.layers || [];

    const extractMean = (name: string): number | null => {
      const l = layers.find((x: any) => x.name === name);
      const val = l?.depths?.[0]?.values?.mean;
      return typeof val === 'number' ? val : null;
    };

    const phRaw = extractMean('phh2o');
    const clayRaw = extractMean('clay');
    const sandRaw = extractMean('sand');
    const siltRaw = extractMean('silt');
    const socRaw = extractMean('soc');
    const nRaw = extractMean('nitrogen');

    if (phRaw === null && clayRaw === null) {
      throw new Error('No gridded soil data at coordinates');
    }

    const clayPct = clayRaw != null ? Number((clayRaw / 10).toFixed(1)) : null;
    const sandPct = sandRaw != null ? Number((sandRaw / 10).toFixed(1)) : null;
    const siltPct = siltRaw != null ? Number((siltRaw / 10).toFixed(1)) : null;

    let wrbGroup: string | null = null;
    if (classResp && classResp.ok) {
      const cJson = (await classResp.json()) as any;
      wrbGroup = cJson?.wrb_class_name || null;
    }

    const texture =
      sandPct != null && siltPct != null && clayPct != null
        ? mapSandSiltClayToTexture(sandPct, siltPct, clayPct)
        : null;

    return {
      latitude,
      longitude,
      source_name: 'ISRIC SoilGrids v2.0 (CC BY 4.0)',
      data_status: 'isric_live',
      is_estimated: true,
      resolution_notes: '250m global spatial prediction (0–5 cm topsoil mean). Gridded model estimate, NOT a laboratory soil test.',
      retrieved_at: retrievedAt,
      estimated_wrb_group: wrbGroup,
      estimated_texture: texture,
      estimated_ph: phRaw != null ? Number((phRaw / 10).toFixed(2)) : null,
      estimated_organic_carbon_g_kg: socRaw != null ? Number((socRaw / 10).toFixed(1)) : null,
      estimated_nitrogen_g_kg: nRaw != null ? Number((nRaw / 100).toFixed(2)) : null,
      clay_pct: clayPct,
      sand_pct: sandPct,
      silt_pct: siltPct,
      warning: 'Estimated from global 250m satellite/model grid. Always prefer physical laboratory soil test values when available.',
    };
  } catch {
    // Transparent regional FAO/NBSS&LUP spatial reference fallback
    let wrb = 'Cambisols';
    let texture = 'Loamy';
    let ph = 6.6;
    let note = 'FAO/ISRIC broad agro-ecological reference estimate (SoilGrids API timed out or unavailable for exact point).';

    // Karnataka / Deccan Plateau spatial awareness
    if (latitude >= 11.5 && latitude <= 18.5 && longitude >= 74.0 && longitude <= 78.6) {
      if (latitude >= 14.8 && longitude >= 75.0) {
        wrb = 'Vertisols';
        texture = 'Clay';
        ph = 7.8;
        note = 'North Karnataka Deccan Black Soil (Vertisols) regional reference estimate (SoilGrids unavailable).';
      } else if (longitude <= 75.2 && latitude <= 14.8) {
        wrb = 'Ferralsols';
        texture = 'Sandy clay loam';
        ph = 5.6;
        note = 'Coastal/Malnad Karnataka Lateritic (Ferralsols/Plinthosols) regional reference estimate.';
      } else {
        wrb = 'Lixisols';
        texture = 'Sandy loam';
        ph = 6.4;
        note = 'Southern Karnataka Red Loam (Lixisols) regional reference estimate.';
      }
    } else if (latitude >= 22 && latitude <= 32 && longitude >= 73 && longitude <= 88) {
      wrb = 'Fluvisols';
      texture = 'Silty loam';
      ph = 7.3;
      note = 'Indo-Gangetic Alluvial Basin (Fluvisols) regional reference estimate.';
    }

    return {
      latitude,
      longitude,
      source_name: 'FAO / Regional Reference Fallback Estimate (SoilGrids Unavailable)',
      data_status: 'regional_reference_estimate',
      is_estimated: true,
      resolution_notes: note,
      retrieved_at: retrievedAt,
      estimated_wrb_group: wrb,
      estimated_texture: texture,
      estimated_ph: ph,
      estimated_organic_carbon_g_kg: null,
      estimated_nitrogen_g_kg: null,
      clay_pct: null,
      sand_pct: null,
      silt_pct: null,
      warning: 'Approximate regional soil estimate only — NOT laboratory-tested data. Enter manual soil lab results for accurate fertilizer and crop planning.',
    };
  }
}
