import { type SoundId, sounds, type ThemeId, themes } from "@ambiance/sounds";
import OpenAI from "openai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful assistant that can play sounds and change the theme of the website.
You will be given a message and you will need to pick the sound and theme that best match the message.
The user can tell a story, or ask directly for a sound and theme.
Always pick BOTH a sound and a theme, so always call both functions.
Do not make up any sounds or themes, only choose from the lists.
Do not answer the user's message, do not write any words, only play the sound and change the theme.

Here is a list of sounds to choose from, formatted as "- [soundId] soundName (soundDescription)":
${Object.entries(sounds)
  .map(
    ([soundId, sound]) => `- [${soundId}] ${sound.name} (${sound.description})`,
  )
  .join("\n")}

Here is a list of themes to choose from, formatted as "- [themeId] themeName (themeDescription)":
${Object.entries(themes)
  .map(
    ([themeId, theme]) =>
      `- [${themeId}] ${theme.label} (${theme.description})`,
  )
  .join("\n")}
`;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  askAi: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "openai/gpt-4.1-nano",
          tools: [
            {
              type: "function",
              function: {
                name: "playSound",
                description: "Play a sound",
                parameters: {
                  type: "object",
                  properties: {
                    soundId: {
                      type: "string",
                      enum: Object.keys(sounds),
                      description: "The ID of the sound to play",
                    },
                  },
                  required: ["soundId"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "changeTheme",
                description: "Change the theme of the website",
                parameters: {
                  type: "object",
                  properties: {
                    themeId: {
                      type: "string",
                      enum: Object.keys(themes),
                      description: "The ID of the theme to change to",
                    },
                  },
                  required: ["themeId"],
                },
              },
            },
          ],
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            { role: "user", content: input.message },
          ],
        });
        const result: { soundId: SoundId | null; themeId: ThemeId | null } = {
          soundId: null,
          themeId: null,
        };
        completion.choices[0].message.tool_calls?.forEach((toolCall) => {
          if (toolCall.function.name === "playSound") {
            const { soundId } = JSON.parse(toolCall.function.arguments);
            result.soundId = soundId;
          }
          if (toolCall.function.name === "changeTheme") {
            const { themeId } = JSON.parse(toolCall.function.arguments);
            result.themeId = themeId;
          }
        });
        return result;
      } catch (error) {
        console.error(JSON.stringify(error, null, 2));
        throw error;
      }
    }),
});

export type AppRouter = typeof appRouter;
