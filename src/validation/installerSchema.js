// src/validation/installerSchema.js
import { z } from 'zod';
import { zDecimalNullable, zIntNullable } from './clientSchema';

const bool01 = z.coerce.number().int().min(0).max(1).default(0);

export const installerSchema = z.object({
  // FE optional; BE enforces single/multi market rules
  market_id: z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().positive().nullable().optional()),

  company_name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  client_code_erp: z.string().optional().default(''),
  client_psmobile: z.string().max(255).optional().default(''),
  status: z.coerce.number().int().min(0).max(1).default(1),
  data_veryfication: z.coerce.number().int().min(0).max(1).default(0),
  // Consents and source
  sms_consent: bool01.optional().default(0),
  marketing_consent: bool01.optional().default(0),
  source: z.string().optional().default(''),

  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  voivodeship: z.string().optional().default(''),
  country: z.string().optional().default(''),
  postal_code: z.string().optional().default(''),
  district: z.string().optional().default(''),
  nip: z.string().optional().default(''),

  // one-letter class: A, B, C, D, or '-'
  class_category: z.enum(['A', 'B', 'C', 'D', '-']).optional().default('-'),

  client_category: z.string().optional().default(''),
  client_subcategory: z.string().max(255).optional().default(''),
  fairs: z.string().optional().default(''),
  // Deprecated on FE; canonical are *_user_id below
  engo_team_director: z.string().optional().default(''),
  engo_team_manager: z.string().optional().default(''),
  engo_team_contact: z.string().optional().default(''),
  engo_team_user_id: z.coerce.number().int().positive().optional().nullable(),
  engo_team_manager_user_id: z.coerce.number().int().positive().optional().nullable(),
  engo_team_director_user_id: z.coerce.number().int().positive().optional().nullable(),
  number_of_sales_reps: z.string().optional().default(''),

  latitude: zDecimalNullable(7, { min: -90, max: 90 }).optional(),
  longitude: zDecimalNullable(7, { min: -180, max: 180 }).optional(),

  www: z.union([z.string(), z.null()]).optional(),
  facebook: z.union([z.string(), z.null()]).optional(),
  additional_info: z.union([z.string(), z.null()]).optional(),

  // Scope of work
  install_heating: bool01,
  install_AC: bool01,
  install_ventilation: bool01,
  install_sh: bool01,

  // KOI segments
  koi_flats: bool01,
  koi_houses: bool01,
  koi_OUP: bool01,
  koi_hotels: bool01,
  koi_comercial: bool01,
  koi_others: z.string().optional().default(''),

  // Subcontractors and qualifications
  numbers_of_subcontractors: zIntNullable.optional(),
  has_electrician: bool01,
  work_with_needs: bool01,
  approved_by_distributor: bool01,

  // Problems
  problems_arrears: bool01,
  problem_time: bool01,
  problem_clients_with_inteligent_system: bool01,
  problem_expensive: bool01,
  problem_low_margin: bool01,
  problem_complicated_installation: bool01,
  problem_complicated_configuration: bool01,
  problem_app: bool01,
  problem_support: bool01,
  problem_complaint: bool01,
  problem_training: bool01,
  problem_integration: bool01,
  problem_marketing_stuff: bool01,
  problem_competition: zIntNullable.optional(),
  problem_others: z.string().optional().default(''),
  // Linked distributors (clients). Optional, up to 3 ids
  distributor_ids: z
    .array(z.coerce.number().int().positive())
    .max(3, 'Maksymalnie 3 dystrybutorów')
    .optional()
    .default([]),
});

export default installerSchema;
