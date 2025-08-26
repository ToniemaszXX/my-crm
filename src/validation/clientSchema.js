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

export const contactSchema = z.object({
    department: z.string().optional().default(""),
    position: z.string().optional().default(""),
    name: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.union([z.string().length(0), z.string().email("Nieprawidłowy email")]).optional().default(""),
    function_notes: z.string().optional().default(""),
    decision_level: z.enum(["-", "wysoka", "średnia", "brak"]).optional().default("-"),
});

export const clientSchema = z.object({
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

    client_category: z.string().optional().default(""),
    index_of_parent: z.string().optional().default(""),

    fairs: z.string().optional().default(""),
    competition: z.string().optional().default(""),
    engo_team_contact: z.string().optional().default(""),

    number_of_branches: z.preprocess(v => (v === '' ? null : v), z.number().int().min(0).nullable().optional()),
    number_of_sales_reps: z.preprocess(v => (v === '' ? null : v), z.number().int().min(0).nullable().optional()),

    www: z.union([z.string(), z.null()]).optional(),
    facebook: z.union([z.string(), z.null()]).optional(),
    auction_service: z.union([z.string(), z.null()]).optional(),

    private_brand: z.coerce.number().int().min(0).max(1).default(0),
    private_brand_details: z.string().optional().default(""),
    loyalty_program: z.coerce.number().int().min(0).max(1).default(0),
    loyalty_program_details: z.string().optional().default(""),

    turnover_pln: decimal(12, 2).nullable().optional(),
    turnover_eur: decimal(12, 2).nullable().optional(),
    installation_sales_share: decimal(5, 2).nullable().optional(),
    automatic_sales_share: decimal(5, 2).nullable().optional(),
    sales_potential: decimal(12, 2).nullable().optional(),

    has_webstore: z.union([z.string(), z.null()]).optional(),
    has_b2b_platform: z.union([z.string(), z.null()]).optional(),
    has_b2c_platform: z.union([z.string(), z.null()]).optional(),

    structure_installer: int0_100.default(0),
    structure_wholesaler: int0_100.default(0),
    structure_ecommerce: int0_100.default(0),
    structure_retail: int0_100.default(0),
    structure_other: int0_100.default(0),

    latitude: z.preprocess(v => (v === '' ? null : v), z.number().min(-90).max(90).nullable().optional()),
    longitude: z.preprocess(v => (v === '' ? null : v), z.number().min(-180).max(180).nullable().optional()),

    contacts: z.array(contactSchema).default([]),
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
