export interface CropSeedEntry {
  slug: string;
  common_name: string;
  common_name_kn?: string;
  scientific_name: string;
  family_name: string;
  categories: string[];
  synonyms: { name: string; region: string; scientific?: boolean }[];
  varieties?: { name: string; region: string; maturity_days?: string; traits: string }[];
  ph_min: number | null;
  ph_max: number | null;
  ph_opt_min?: number | null;
  ph_opt_max?: number | null;
  n_req: string | null;
  p_req: string | null;
  k_req: string | null;
  n_ideal: number | null;
  p_ideal: number | null;
  k_ideal: number | null;
  suitable_wrb: string[];
  suitable_textures: string[];
  salinity_tolerance?: string;
  temp_min: number | null;
  temp_max: number | null;
  temp_opt_min?: number | null;
  temp_opt_max?: number | null;
  rain_min: number | null;
  rain_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  water_req: string;
  irrigation_req: string;
  drought_tolerance: string;
  frost_sensitivity: string;
  seasons: {
    name: string;
    sowing: string;
    harvesting: string;
    days_min: number | null;
    days_max: number | null;
    scope?: string;
  }[];
  regions: { country: string; state?: string; notes?: string }[];
  growth_conditions: string;
  cultivation: string | null;
  nutrients: string | null;
  pests: string | null;
  harvesting: string | null;
  storage: string | null;
  source: string;
  verification_status?: 'verified' | 'partial_reference';
}

export const CROP_CATEGORIES_SEED = [
  { slug: 'cereals', name: 'Food Grains & Cereals', name_kn: 'ಆಹಾರ ಧಾನ್ಯಗಳು ಮತ್ತು ಸಿರಿಧಾನ್ಯಗಳು', description: 'Staple grain grasses and pseudocereals including rice, wheat, maize, millets, barley, oats, quinoa, and teff.' },
  { slug: 'pulses', name: 'Pulses & Legumes', name_kn: 'ಬೇಳೆಕಾಳುಗಳು ಮತ್ತು ದ್ವಿದಳ ಧಾನ್ಯಗಳು', description: 'Nitrogen-fixing grain legumes including chickpea, pigeon pea, green gram, black gram, lentil, cowpea, and beans.' },
  { slug: 'cash-crops', name: 'Cash & Commercial Crops', name_kn: 'ವಾಣಿಜ್ಯ ಬೆಳೆಗಳು', description: 'High-value commercial crops including cotton, sugarcane, tobacco, jute, coffee, tea, rubber, and arecanut.' },
  { slug: 'oilseeds', name: 'Oilseed Crops', name_kn: 'ಎಣ್ಣೆಕಾಳು ಬೆಳೆಗಳು', description: 'Edible and industrial oil-bearing crops including groundnut, mustard, sesame, sunflower, soybean, safflower, and olive.' },
  { slug: 'fruits', name: 'Fruits', name_kn: 'ಹಣ್ಣುಗಳು', description: 'Tropical, subtropical, and temperate fruit orchards, berries, melons, and vines.' },
  { slug: 'vegetables', name: 'Vegetables', name_kn: 'ತರಕಾರಿಗಳು', description: 'Solanaceous, cucurbit, brassica, leafy, bulb, and pod vegetables grown worldwide.' },
  { slug: 'spices', name: 'Spices & Condiments', name_kn: 'ಸಾಂಬಾರ ಪದಾರ್ಥಗಳು', description: 'Culinary rhizome, seed, bark, and berry spices including turmeric, ginger, black pepper, cardamom, cumin, and saffron.' },
  { slug: 'plantation', name: 'Plantation & Beverage Crops', name_kn: 'ತೋಟಗಾರಿಕೆ ಮತ್ತು ಪಾನೀಯ ಬೆಳೆಗಳು', description: 'Perennial estate crops such as coffee, tea, cocoa, coconut, arecanut, oil palm, and rubber.' },
  { slug: 'medicinal', name: 'Medicinal & Aromatic Crops', name_kn: 'ಔಷಧೀಯ ಮತ್ತು ಸುಗಂಧ ಬೆಳೆಗಳು', description: 'Botanical crops cultivated for essential oils, alkaloids, and herbal remedies.' },
  { slug: 'fodder', name: 'Fodder & Forage Crops', name_kn: 'ಮೇವು ಮತ್ತು ಪಶು ಆಹಾರ ಬೆಳೆಗಳು', description: 'High-biomass grasses and forage legumes supporting livestock systems.' },
  { slug: 'fibre', name: 'Fibre Crops', name_kn: 'ನಾರು ಬೆಳೆಗಳು', description: 'Natural textile and cordage crops including cotton, jute, hemp, and flax.' },
  { slug: 'nuts', name: 'Nut Crops', name_kn: 'ಬೀಜ ಮತ್ತು ಗೋಡಂಬಿ ಬೆಳೆಗಳು', description: 'Tree nuts and edible kernels including cashew, almond, walnut, and pistachio.' },
  { slug: 'tubers', name: 'Tuber, Root & Sugar Crops', name_kn: 'ಗೆಡ್ಡೆಗೆಣಸು ಮತ್ತು ಸಕ್ಕರೆ ಬೆಳೆಗಳು', description: 'Calorie-dense underground storage crops and sugar crops including potato, cassava, sweet potato, yam, and sugar beet.' },
];
