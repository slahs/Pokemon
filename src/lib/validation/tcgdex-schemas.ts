import { z } from "zod";

/** Zod-Schemata fuer externe TCGdex-Antworten. */

export const tcgdexSetBriefSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  symbol: z.string().optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  cardCount: z
    .object({
      total: z.number().optional().nullable(),
      official: z.number().optional().nullable(),
    })
    .partial()
    .optional(),
  serie: z.object({ id: z.string(), name: z.string() }).optional(),
});

export const tcgdexSetListSchema = z.array(tcgdexSetBriefSchema);

export const tcgdexCardBriefSchema = z.object({
  id: z.string(),
  localId: z.union([z.string(), z.number()]).transform((v) => String(v)),
  name: z.string(),
  image: z.string().optional().nullable(),
});

export const tcgdexBoosterSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  artwork_front: z.string().optional().nullable(),
  artwork_back: z.string().optional().nullable(),
});

export const tcgdexSetDetailSchema = tcgdexSetBriefSchema.extend({
  boosters: z
    .array(tcgdexBoosterSchema)
    .optional()
    .nullable()
    .transform((v) => v ?? []),
  cards: z.array(tcgdexCardBriefSchema).default([]),
});

const priceNumber = z.number().nullable().optional();

export const tcgdexCardmarketPricingSchema = z
  .object({
    updated: z.string().optional().nullable(),
    unit: z.string().optional().nullable(),
    avg: priceNumber,
    low: priceNumber,
    trend: priceNumber,
    avg1: priceNumber,
    avg7: priceNumber,
    avg30: priceNumber,
    "avg-holo": priceNumber,
    "low-holo": priceNumber,
    "trend-holo": priceNumber,
    "avg1-holo": priceNumber,
    "avg7-holo": priceNumber,
    "avg30-holo": priceNumber,
  })
  .passthrough();

export const tcgdexCardDetailSchema = z
  .object({
    id: z.string(),
    localId: z.union([z.string(), z.number()]).transform((v) => String(v)),
    name: z.string(),
    image: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    rarity: z.string().optional().nullable(),
    set: z.object({ id: z.string(), name: z.string().optional() }).optional(),
    variants: z
      .object({
        normal: z.boolean().optional(),
        reverse: z.boolean().optional(),
        holo: z.boolean().optional(),
        firstEdition: z.boolean().optional(),
      })
      .partial()
      .optional(),
    pricing: z
      .object({
        cardmarket: tcgdexCardmarketPricingSchema.optional().nullable(),
      })
      .passthrough()
      .optional()
      .nullable(),
  })
  .passthrough();

export type TcgdexSetBrief = z.infer<typeof tcgdexSetBriefSchema>;
export type TcgdexSetDetail = z.infer<typeof tcgdexSetDetailSchema>;
export type TcgdexCardDetail = z.infer<typeof tcgdexCardDetailSchema>;
