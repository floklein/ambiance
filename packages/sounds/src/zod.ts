import { z } from "zod";

export const userMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(
    z.union([
      z.object({
        type: z.literal("text"),
        text: z.string(),
      }),
      z.object({
        type: z.literal("input_audio"),
        input_audio: z.object({
          data: z.string(),
          format: z.enum(["wav", "mp3"]),
        }),
      }),
    ]),
  ),
});
export type UserMessage = z.infer<typeof userMessageSchema>;

export const assistantMessageSchema = z.object({
  role: z.literal("assistant"),
  tool_calls: z
    .array(
      z.object({
        type: z.literal("function"),
        id: z.string(),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      }),
    )
    .optional(),
});
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

export const toolMessageSchema = z.object({
  role: z.literal("tool"),
  tool_call_id: z.string(),
  content: z.string(),
});
export type ToolMessage = z.infer<typeof toolMessageSchema>;

export const messagesSchema = z.array(
  z.union([userMessageSchema, assistantMessageSchema, toolMessageSchema]),
);
export type Messages = z.infer<typeof messagesSchema>;
export type Message = Messages[number];
