// src/validation/clientSchema.js
import { z } from "zod";

// Liczba dziesiętna: usuwa spacje, zamienia ',' -> '.', pilnuje skali (ile miejsc po kropce)
// akceptuje: "", null, undefined -> zostaje null (OK do zapisu bez wartości)
const decimal = (precision = 12, scale = 2) =>
    z.preprocess(
        (v) => {
            if (v === "" || v === null || v === undefined) return null;
            const s = String(v).trim().replace(/\s+/g, "").replace(",", ".");
            return s;
        },
        z.union([
            z.string().regex(
                new RegExp(`^\\d{1,${precision - scale}}(\\.\\d{1,${scale}})?$`),
                "Nieprawidłowy format liczby"
            ),
            z.null(),
        ])
    ).transform((val) => (val === null ? null : Number(val)));


const int0_100 = z.coerce.number().int().min(0, "Min 0").max(100, "Max 100");

// "" / null / undefined → null
// "1 000" → 1000
export const zNumberNullable = z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const num = Number(String(v).replace(/\s/g, ''));
    return Number.isFinite(num) ? num : v; // jeśli się nie da, pozwól Zod'owi rzucić błąd
}, z.number({
    invalid_type_error: 'Invalid input: expected number',
    required_error: 'To pole jest wymagane',
}).nullable());

// Wersja dla liczb całkowitych ≥ 0
export const zIntNullable = z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const num = Number(String(v).replace(/\s/g, ''));
    return Number.isFinite(num) ? num : v;
}, z.number({
    invalid_type_error: 'Invalid input: expected number',
}).int().nonnegative().nullable());

// RegEx dopuszcza: 123, 123.4, 123,45; minus też ok
const decimalRegex = (scale) =>
  new RegExp(`^-?\\d+(?:[\\.,]\\d{1,${scale}})?$`);

/**
 * zDecimalNullable(scale, { round=false, min, max })
 * - przyjmuje string/number, zwraca number lub null
 * - wspiera przecinek i kropkę
 * - waliduje max. X miejsc po przecinku
 */
export function zDecimalNullable(scale, opts = {}) {
  const { round = false, min, max } = opts;

  // 1) preprocess → null albo znormalizowany string z kropką
  let schema = z.preprocess((v) => {
    if (v === '' || v == null) return null;
    return String(v).trim().replace(/\s/g, '').replace(',', '.');
  },
  // 2) walidacja regex + transform na number, lub null
  z.union([
    z
      .string()
      .regex(decimalRegex(scale), { message: `Do ${scale} miejsc po przecinku` })
      .transform((s) => {
        const n = Number(s);
        return round ? Number(n.toFixed(scale)) : n;
      }),
    z.null(),
  ]));

  // 3) dodatkowe zakresy (opcjonalnie)
  if (min !== undefined) {
    schema = schema.refine((v) => v === null || v >= min, { message: `Min ${min}` });
  }
  if (max !== undefined) {
    schema = schema.refine((v) => v === null || v <= max, { message: `Max ${max}` });
  }

  return schema;
}

export const contactSchema = z.object({
    id: z.coerce.number().int().optional(),
    department: z.string().optional().default(""),
    position: z.string().optional().default(""),
    name: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.union([z.string().length(0), z.string().email("Nieprawidłowy email")]).optional().default(""),
    function_notes: z.string().optional().default(""),
    decision_level: z.enum(["-", "wysoka", "średnia", "brak"]).optional().default("-"),
});

export const clientSchema = z.object({
  // market assignment: optional on FE (BE enforces rules). When provided, must be an int > 0
  market_id: z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().positive().nullable().optional()),
  company_name: z.string().min(1, "Nazwa jest wymagana").max(120),
  client_code_erp: z.string().optional().default(""),
  status: z.coerce.number().int().min(0).max(1).default(1),
  data_veryfication: z.coerce.number().int().min(0).max(1).default(0),

  street: z.string().optional().default(""),
  city: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  voivodeship: z.string().optional().default(""),
  country: z.string().optional().default(""),
  nip: z.string().optional().default(""),

  // one-letter class: A, B, C, D, or '-'
  class_category: z.enum(['A', 'B', 'C', 'D', '-']).optional().default('-'),

  client_category: z.string().optional().default(""),
  client_subcategory: z.string().max(255).optional().default(""),
  index_of_parent: z.string().optional().default(""),

  fairs: z.string().optional().default(""),
  competition: z.string().optional().default(""),
  engo_team_director: z.string().optional().default(""),
  engo_team_manager: z.string().optional().default(""),
  engo_team_contact: z.string().optional().default(""),
  engo_team_user_id: z.coerce.number().int().positive().optional().nullable(),
  engo_team_manager_user_id: z.coerce.number().int().positive().optional().nullable(),
  engo_team_director_user_id: z.coerce.number().int().positive().optional().nullable(),

  // number_of_branches: z.preprocess(v => (v === '' ? null : v), z.number().int().min(0).nullable().optional()),
  // number_of_sales_reps: z.preprocess(v => (v === '' ? null : v), z.number().int().min(0).nullable().optional()),
  number_of_branches: zIntNullable.optional(),
  number_of_sales_reps: zIntNullable.optional(),

  www: z.union([z.string(), z.null()]).optional(),
  possibility_www_baner: z.coerce.number().int().min(0).max(1).default(0),
  possibility_add_articles: z.coerce.number().int().min(0).max(1).default(0),
  facebook: z.union([z.string(), z.null()]).optional(),
  possibility_graphic_and_posts_FB: z.coerce.number().int().min(0).max(1).default(0),
  auction_service: z.union([z.string(), z.null()]).optional(),

  private_brand: z.coerce.number().int().min(0).max(1).default(0),
  private_brand_details: z.string().optional().default(""),
  loyalty_program: z.coerce.number().int().min(0).max(1).default(0),
  loyalty_program_details: z.string().optional().default(""),

  turnover_pln: decimal(12, 2).nullable().optional(),
  turnover_eur: decimal(12, 2).nullable().optional(),
  installation_sales_share: decimal(15, 2).nullable().optional(),
  automatic_sales_share: decimal(15, 2).nullable().optional(),
  sales_potential: decimal(12, 2).nullable().optional(),

  has_webstore: z.union([z.string(), z.null()]).optional(),
  has_ENGO_products_in_webstore: z.coerce.number().int().min(0).max(1).default(0),
  possibility_add_ENGO_products_to_webstore: z.coerce.number().int().min(0).max(1).default(0),

  has_b2b_platform: z.union([z.string(), z.null()]).optional(),
  has_b2c_platform: z.union([z.string(), z.null()]).optional(),

  structure_installer: int0_100.default(0),
  structure_wholesaler: int0_100.default(0),
  structure_ecommerce: int0_100.default(0),
  structure_retail: int0_100.default(0),
  structure_other: int0_100.default(0),

  // latitude: z.preprocess(v => (v === '' ? null : v), z.number().min(-90).max(90).nullable().optional()),
  // longitude: z.preprocess(v => (v === '' ? null : v), z.number().min(-180).max(180).nullable().optional()),
  latitude: zDecimalNullable(8).optional(),
  longitude: zDecimalNullable(8).optional(),

  contacts: z.array(contactSchema).default([]),
  // Linked distributors (clients). Optional, up to 3 ids
  distributor_ids: z
    .array(z.coerce.number().int().positive())
    .max(3, 'Maksymalnie 3 dystrybutorów')
    .optional()
    .default([]),
})
    .superRefine((val, ctx) => {
        const sum =
            (val.structure_installer ?? 0) +
            (val.structure_wholesaler ?? 0) +
            (val.structure_ecommerce ?? 0) +
            (val.structure_retail ?? 0) +
            (val.structure_other ?? 0);
        if (sum > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Suma udziałów nie może przekraczać 100",
                path: ["structure_other"],
            });
        }
    });
