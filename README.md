# Global Smart Crop Recommendation System

A worldwide soil, climate, and agricultural intelligence platform designed to help farmers choose suitable crops using verified soil properties, weather observations, geographical location, water availability, and documented crop requirements—with dedicated initial testing for Karnataka & India alongside international coverage.

## Key Capabilities
- **Worldwide Soil Database**: All 32 FAO WRB Reference Soil Groups mapped to USDA Soil Taxonomy and regional soil descriptors (e.g. Black Cotton Soil, Red Loam, Laterite, Alluvial), plus all 12 USDA soil texture classes with plain-language explanations in English and Kannada (`ಕನ್ನಡ`).
- **Global Crop Catalogue**: Canonical, multi-category database spanning Cereals & Millets, Pulses & Legumes, Cash & Commercial Crops, Oilseeds, Fruits, Vegetables, Spices, Plantation, Medicinal/Aromatic, Fodder, Fibre, Nuts, and Tubers.
- **Hybrid Smart Recommendation Engine**: Combines input validation, agronomic suitability rules (pH, temperature, rainfall + irrigation synergy, NPK, WRB soil, texture, season, regional coverage), and a reproducible Random Forest Classifier (`ml/`) with held-out evaluation metrics.
- **Live Weather & Location-Based Soil Estimation**: Integrates Open-Meteo (current observations + 7-day forecasts) and ISRIC SoilGrids v2.0 (250m gridded estimates clearly labeled as estimated, with laboratory test override priority).
- **Historical & Reference Market Benchmarks**: Clearly dated AGMARKNET Karnataka APMC and World Bank/FAOSTAT historical price series with Chart.js visualizations.
- **Role-Based Security & Multilingual UI**: Scrypt password hashing, HMAC-signed HTTP-only cookies, CSRF protection, rate limiting, Farmer & Admin dashboards, and English / Kannada (`ಕನ್ನಡ`) translation support.

## Quick Start (Local Development)
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install Node.js dependencies and run the full-stack server on port 3000:
   ```bash
   npm install
   npm run dev
   ```
3. Run automated verification tests:
   ```bash
   npm run lint
   npm run build
   npx tsx tests/smoke.test.ts
   ```
4. Optional Python Scikit-learn ML Training Pipeline:
   ```bash
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   python3 ml/train_model.py
   python3 ml/evaluate_model.py
   ```

## Pushing to GitHub
After creating an empty repository on GitHub:
```bash
git init
git add .
git commit -m "feat: initial Global Smart Crop Recommendation System"
git branch -M main
git remote add origin https://github.com/<your-username>/global-smart-crop-recommendation-system.git
git push -u origin main
```
