// src/validation/developerSchema.js
import { z } from 'zod';
import { zDecimalNullable, zIntNullable } from './clientSchema';

const bool01 = z.coerce.number().int().min(0).max(1).default(0);

export const developerSchema = z.object({
  // FE optional; BE enforces single/multi market rules
  market_id: z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().positive().nullable().optional()),

  company_name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  client_code_erp: z.string().optional().default(''),
  status: z.coerce.number().int().min(0).max(1).default(1),
  data_veryfication: z.coerce.number().int().min(0).max(1).default(0),

  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  voivodeship: z.string().optional().default(''),
  country: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
  nip: z.string().optional().default(''),

  client_category: z.string().optional().default(''),
  client_subcategory: z.string().max(255).optional().default(''),
  fairs: z.string().optional().default(''),
  engo_team_director: z.string().optional().default(''),
  engo_team_contact: z.string().optional().default(''),
  number_of_sales_reps: z.string().optional().default(''),

  latitude: zDecimalNullable(7, { min: -90, max: 90 }).optional(),
  longitude: zDecimalNullable(7, { min: -180, max: 180 }).optional(),

  www: z.union([z.string(), z.null()]).optional(),
  facebook: z.union([z.string(), z.null()]).optional(),
  additional_info: z.union([z.string(), z.null()]).optional(),

  // Segments
  seg_multi_family: bool01,
  seg_single_family: bool01,
  seg_commercial: bool01,
  seg_hotel_leisure: bool01,

  // Character
  char_mainstream: bool01,
  char_premium: bool01,
  char_luxury: bool01,

  scale_band: z.enum(['le_50', '51_200', 'gt_200']).default('le_50'),
  smart_home_offer: z.enum(['standard', 'optional_package', 'no_but_open', 'no_not_considered']).default('standard'),

  // Differentiators
  diff_location: bool01,
  diff_arch_design: bool01,
  diff_materials_quality: bool01,
  diff_eco_energy: bool01,
  diff_price: bool01,
  diff_other: bool01,
  diff_other_text: z.string().optional().default(''),

  // Challenges / Interests
  chal_competition: bool01,
  chal_rising_costs: bool01,
  chal_long_sales_cycle: bool01,
  chal_customer_needs: bool01,
  chal_energy_compliance: bool01,

  int_cost_reduction: bool01,
  int_safety_comfort: bool01,
  int_modern_sales_arg: bool01,

  // Partners
  gc_company: z.string().optional().default(''),
  inst_hvac_company: z.string().optional().default(''),
  inst_electrical_company: z.string().optional().default(''),
  arch_design_company: z.string().optional().default(''),
  interior_design_company: z.string().optional().default(''),
  wholesale_plumb_heat: z.string().optional().default(''),
  wholesale_electrical: z.string().optional().default(''),

  implementation_model: z.enum(['standard_all', 'optional_package', 'standard_premium']).default('standard_all'),

  // Sales support
  sup_marketing: bool01,
  sup_show_apartment: bool01,
  sup_sales_training: bool01,
  sup_solution_packages: bool01,
  sup_full_coordination: bool01,
  sup_terms_distribution: bool01,
});

export default developerSchema;
