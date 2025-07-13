import {
  type Messages,
  messagesSchema,
  type SoundId,
  sounds,
  type ThemeId,
  themes,
} from "@ambiance/sounds";
import OpenAI from "openai";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful assistant that can play sounds and change the UI theme of the website.
You will be given a message where the user can tell a story, or ask directly for a sound and UI theme.
If the message has an audio attachment, use what the user says in the audio message to pick the sound and UI theme.
You will need to pick the sound and UI theme that best match ONLY the last user message.
Always pick BOTH a sound and a UI theme, so always call both functions.
Do not make up any sounds or UI themes, only choose a sound from the list of sounds and a UI theme from the list of UI themes.
Do not answer the user's message, do not write any words, only play the sound and change the UI theme.

Here is a list of UI themes to choose from, formatted as "[themeId] themeName (themeDescription)":
<themes>
${Object.entries(themes)
  .map(
    ([themeId, theme]) => `[${themeId}] ${theme.label} (${theme.description})`,
  )
  .join("\n")}
</themes>

Here is a list of sounds to choose from, formatted as "[soundId] soundName (soundDescription)":
<sounds>
${Object.entries(sounds)
  .map(
    ([soundId, sound]) =>
      `[${soundId}] ${sound.title} (${sound.tags.join(", ")})`,
  )
  .join("\n")}
</sounds>
`;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  askAi: protectedProcedure
    .input(messagesSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(JSON.stringify(input, null, 2));
        const completion = await openai.chat.completions.create({
          model: "mistralai/mistral-small-3.2-24b-instruct",
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
          tool_choice: "required",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...input,
          ],
        });
        const result: {
          soundId: SoundId | null;
          themeId: ThemeId | null;
          history: Messages;
        } = {
          soundId: null,
          themeId: null,
          history: [...input, completion.choices[0].message],
        };
        completion.choices[0].message.tool_calls?.forEach((toolCall) => {
          if (toolCall.function.name === "playSound") {
            const { soundId } = JSON.parse(toolCall.function.arguments);
            const sound = sounds[soundId as SoundId];
            if (!sound || sound.disabled) {
              console.error(`Sound ${soundId} not found`);
            } else {
              result.soundId = soundId;
              // result.history.push({
              //   role: "tool",
              //   tool_call_id: toolCall.id,
              //   content: toolCall.function.arguments,
              // });
            }
          }
          if (toolCall.function.name === "changeTheme") {
            const { themeId } = JSON.parse(toolCall.function.arguments);
            const theme = themes[themeId as ThemeId];
            if (!theme) {
              console.error(`Theme ${themeId} not found`);
            } else {
              result.themeId = themeId;
              // result.history.push({
              //   role: "tool",
              //   tool_call_id: toolCall.id,
              //   content: toolCall.function.arguments,
              // });
            }
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
