import {
  type Contents,
  contentsSchema,
  type SoundId,
  sounds,
  type ThemeId,
  themes,
} from "@ambiance/sounds";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

const googleai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful assistant that answers to the user's message by picking a sound and a UI theme from a list of sounds and UI themes.
The user can tell a story, or ask directly for a sound and UI theme.
If the message has an audio attachment, transcribe the audio file to pick the sound and UI theme (and return it in the "transcript" field).
Always pick the sound and UI theme that best match ONLY the last user message, but use the entire conversation history as context.
Always pick both a sound and a UI theme.
Do not make up any sounds or UI themes.

Here is a list of UI themes to choose from, formatted as "- [themeId] themeName (themeDescription)":
${Object.entries(themes)
  .map(
    ([themeId, theme]) =>
      `- [${themeId}] ${theme.label} (${theme.description})`,
  )
  .join("\n")}

Here is a list of sounds to choose from, formatted as "- [soundId] soundName (soundTags)":
${Object.entries(sounds)
  .map(
    ([soundId, sound]) =>
      `- [${soundId}] ${sound.title} (${sound.tags.join(", ")})`,
  )
  .join("\n")}
`;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  askAi: protectedProcedure
    .input(contentsSchema)
    .mutation(async ({ input }) => {
      try {
        const response = await googleai.models.generateContent({
          model: "gemini-2.5-flash-lite-preview-06-17",
          contents: input,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                soundId: { type: Type.STRING, enum: Object.keys(sounds) },
                themeId: { type: Type.STRING, enum: Object.keys(themes) },
                transcript: {
                  type: Type.STRING,
                  description:
                    "The transcript of the audio file, in its original language, in plain text.",
                },
              },
              required: [
                "soundId",
                "themeId",
                input.at(-1)?.parts.some((part) => part.inlineData)
                  ? "transcript"
                  : undefined,
              ].filter(Boolean),
            },
          },
        });
        const json = z
          .object({
            soundId: z.string(),
            themeId: z.string(),
            transcript: z.string().optional(),
          })
          .parse(JSON.parse(response.text ?? "{}"));
        const contents: Contents = [
          ...input.slice(0, -1),
          {
            role: "user",
            id: input.at(-1)?.id ?? crypto.randomUUID(),
            parts: [
              {
                text:
                  input.at(-1)?.parts.at(0)?.text ?? json.transcript ?? "Error",
              },
            ],
          },
          {
            role: "model",
            id: crypto.randomUUID(),
            parts: [{ text: response.text }],
          },
        ];
        const soundId = sounds[json.soundId] ? (json.soundId as SoundId) : null;
        const themeId = themes[json.themeId as ThemeId]
          ? (json.themeId as ThemeId)
          : null;
        return {
          soundId,
          themeId,
          contents,
        };
      } catch (error) {
        console.error(error);
        throw error;
      }
    }),
});

export type AppRouter = typeof appRouter;
