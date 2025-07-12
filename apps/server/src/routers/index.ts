import { sounds } from "@ambiance/sounds";
import OpenAI from "openai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful assistant that can play sounds.
You will be given a message and you will need to play the sound that best matches the message.
The user can tell a story, or ask directly for a sound.
Do not make up any sounds, only choose from the list.
Do not answer the user's message, only play the sound.
Do not answer any words, only play the sound.

Here is a list of sounds to choose from, formatted as "- [soundId] soundName (soundDescription)":
${Object.entries(sounds)
  .map(
    ([soundId, sound]) => `- [${soundId}] ${sound.name} (${sound.description})`,
  )
  .join("\n")}
`;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  getSound: protectedProcedure
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
          ],
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            { role: "user", content: input.message },
          ],
        });
        return completion.choices[0].message;
      } catch (error) {
        console.error(JSON.stringify(error, null, 2));
        throw error;
      }
    }),
});

export type AppRouter = typeof appRouter;
