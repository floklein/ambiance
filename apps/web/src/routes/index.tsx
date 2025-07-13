import {
  type AssistantMessage,
  sounds,
  type ThemeId,
  themes,
  type UserMessage,
} from "@ambiance/sounds";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Fragment, useRef, useState } from "react";
import { toast } from "sonner";
import { RecordButton } from "@/components/record-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { blobToBase64 } from "@/utils/blob";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function HomeComponent() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [history, setHistory] = useState<(UserMessage | AssistantMessage)[]>(
    [],
  );

  const audioRef = useRef<HTMLAudioElement>(null);

  const { mutate: askAi, isPending } = useMutation(
    trpc.askAi.mutationOptions({
      onSuccess: (data) => {
        if (data.soundId && audioRef.current) {
          console.log("Sound:", sounds[data.soundId].title);
          audioRef.current.src = `https://sounds.tabletopaudio.com/${sounds[data.soundId].mp3}`;
          audioRef.current.load();
          audioRef.current.play();
        }
        if (data.themeId) {
          console.log("Theme:", themes[data.themeId].label);
          setTheme(data.themeId);
        }
      },
      onMutate: (data) => {
        setMessage("");
        setHistory(data);
        return { history, message };
      },
      onError: (error, _variables, context) => {
        if (context) {
          setMessage(context.message);
          setHistory(context.history);
        }
        toast.error(error.message);
      },
    }),
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAi([
        ...history,
        {
          role: "user",
          content: [{ type: "text", text: message }],
        },
      ]);
    }
  }

  async function handleRecord(blob: Blob) {
    const base64 = await blobToBase64(blob);
    askAi([
      ...history,
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: base64,
              format: "wav",
            },
          },
        ],
      },
    ]);
  }

  return (
    <div className="grid grow grid-cols-1 grid-rows-[1fr_auto] items-center justify-items-center">
      {theme && (
        <style>
          {`:root {
          ${Object.entries(themes[theme].styles.light)
            .map(([key, value]) => `--${key}: ${value};`)
            .join("\n")}
        }
        .dark {
          ${Object.entries(themes[theme].styles.dark)
            .map(([key, value]) => `--${key}: ${value};`)
            .join("\n")}
        }`}
        </style>
      )}
      <div className="flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-8">
        <div>
          <h3 className="font-sans text-2xl">Tell your story,</h3>
          <h2 className="font-serif text-4xl text-primary">
            feel the <span className="italic">ambiance</span>...
          </h2>
        </div>
        <div className="relative">
          <Textarea
            autoFocus
            className="resize-none pr-15 font-mono"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            maxLength={200}
            placeholder="Begin to write your story..."
          />
          <div className="absolute top-0 right-0 bottom-0 flex items-center justify-center pr-3.5">
            <RecordButton onRecord={handleRecord} />
          </div>
        </div>
        <ol className="flex flex-col gap-2 px-3 font-mono text-sm">
          {history
            .filter((item) => item.role === "user")
            .toReversed()
            .map((item, index) => {
              const content = item.content.at(0);
              if (content?.type === "text") {
                return (
                  <Fragment key={content.text}>
                    <li>{content.text}</li>
                    {index !== history.length - 1 && <hr />}
                  </Fragment>
                );
              }
              if (content?.type === "input_audio") {
                return (
                  <Fragment key={content.input_audio.data}>
                    <li>
                      <audio src={content.input_audio.data} controls />
                    </li>
                    {index !== history.length - 1 && <hr />}
                  </Fragment>
                );
              }
              return null;
            })}
        </ol>
      </div>
      <div className="flex items-center justify-center p-4">
        {isPending && <Skeleton className="h-[54px] w-[300px] rounded-full" />}
        <audio
          ref={audioRef}
          controls
          controlsList="nodownload"
          loop
          className={cn(isPending && "hidden")}
        />
      </div>
    </div>
  );
}
