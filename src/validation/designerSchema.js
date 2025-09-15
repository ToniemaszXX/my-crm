// src/validation/designerSchema.js
import { z } from 'zod';
import { zDecimalNullable, zIntNullable } from './clientSchema';

const bool01 = z.coerce.number().int().min(0).max(1).default(0);

const ratingNullable = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.union([
    z.coerce.number().int().min(1).max(5),
    z.null(),
  ])
);

export const designerSchema = z.object({
  // FE: optional/nullable; BE enforces:
  // - single-market: auto-assigns user's market
  // - multi-market: requires a valid market_id from payload
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
  postal_code: z.string().optional().default(''),
  district: z.string().optional().default(''),
  voivodeship: z.string().optional().default(''),
  country: z.string().optional().default(''),
  nip: z.string().optional().default(''),

  client_category: z.string().optional().default(''),
  client_subcategory: z.string().max(255).optional().default(''),
  fairs: z.string().optional().default(''),
  engo_team_director: z.string().optional().default(''),
  engo_team_contact: z.string().optional().default(''),
  number_of_sales_reps: z.string().optional().default(''),
  www: z.union([z.string(), z.null()]).optional(),
  facebook: z.union([z.string(), z.null()]).optional(),
  additional_info: z.union([z.string(), z.null()]).optional(),

  latitude: zDecimalNullable(7, { min: -90, max: 90 }).optional(),
  longitude: zDecimalNullable(7, { min: -180, max: 180 }).optional(),

  automation_inclusion: z.enum(['standard', 'on_request', 'rarely']),
  spec_influence: bool01,
  design_tools: z.union([z.string(), z.null()]).optional(),
  uses_bim: bool01,
  relations: z.union([z.string(), z.null()]).optional(),

  crit_aesthetics: ratingNullable.optional(),
  crit_reliability: ratingNullable.optional(),
  crit_usability: ratingNullable.optional(),
  crit_integration: ratingNullable.optional(),
  crit_support: ratingNullable.optional(),
  crit_energy: ratingNullable.optional(),
  crit_price: ratingNullable.optional(),

  primary_objection: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.union([
      z.enum(['trusted_brand', 'too_technical', 'clients_price', 'none']),
      z.null(),
    ])
  ).optional(),
  objection_note: z.union([z.string(), z.null()]).optional(),

  bt_premium_sf: bool01,
  bt_office_ab: bool01,
  bt_hotel: bool01,
  bt_public: bool01,
  bt_apartment: bool01,
  bt_other: bool01,
  bt_other_text: z.union([z.string(), z.null()]).optional(),

  scope_full_arch: bool01,
  scope_interiors: bool01,
  scope_installations: bool01,

  stage_concept: bool01,
  stage_permit: bool01,
  stage_execution: bool01,
  stage_depends: bool01,

  collab_hvac: bool01,
  collab_electrical: bool01,
  collab_integrator: bool01,
  collab_contractor: bool01,

  pain_aesthetics: bool01,
  pain_single_system: bool01,
  pain_no_support: bool01,
  pain_limited_knowledge: bool01,
  pain_investor_resistance: bool01,
  pain_coordination: bool01,
  pain_lack_materials: bool01,
  pain_other: bool01,
  pain_other_text: z.union([z.string(), z.null()]).optional(),

  support_account_manager: bool01,
  support_training: bool01,
  support_cad_bim: bool01,
  support_samples: bool01,
  support_concept_support: bool01,
  support_partner_terms: bool01,
});

export default designerSchema;