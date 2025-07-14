import { z } from "zod";

const partSchema = z.object({
  text: z.string().optional(),
  inlineData: z
    .object({
      data: z.string(),
      mimeType: z.string(),
    })
    .optional(),
});

export const userContentSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partSchema),
});
export type UserContent = z.infer<typeof userContentSchema>;

export const modelContentSchema = z.object({
  id: z.string(),
  role: z.literal("model"),
  parts: z.array(partSchema),
});
export type ModelContent = z.infer<typeof modelContentSchema>;

export const contentSchema = z.union([userContentSchema, modelContentSchema]);
export type Content = z.infer<typeof contentSchema>;

export const contentsSchema = z.array(contentSchema);
export type Contents = z.infer<typeof contentsSchema>;
