# Contributing to Global Smart Crop Recommendation System

Thank you for helping improve agricultural data accuracy, multilingual guidance, and agronomic tooling for farmers worldwide.

## Guidelines
1. **Verified Data Only**: Do not invent crop agronomic ranges, yields, or market prices. Every crop or soil addition must cite an authoritative source (FAO EcoCrop, ICAR, USDA NRCS, ISRIC, or peer-reviewed agricultural university publications).
2. **Preserve Licensing & Attribution**: Include publisher, licence, retrieval date, and geographical coverage in dataset metadata.
3. **Avoid Duplicate Canonical Crops**: A crop belonging to multiple categories (e.g. Soybean as both a Pulse and an Oilseed) must remain a single canonical crop entry mapped across categories.
4. **Never Commit Secrets or User Databases**: Keep `.env` and `*.db` files excluded via `.gitignore`.
5. **Run Verification**:
   - `npm run lint`
   - `npm run build`
   - `npx tsx tests/smoke.test.ts`
