import { type SoundId, sounds, type ThemeId, themes } from "@ambiance/sounds";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Fragment, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
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
  const [history, setHistory] = useState<
    {
      id: string;
      message: string;
      soundId: SoundId | null;
      themeId: ThemeId | null;
    }[]
  >([]);

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
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message: data.messages.at(-1) ?? "",
            soundId: null,
            themeId: null,
          },
        ]);
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

  return (
    <div className="flex h-svh flex-col items-center justify-center">
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
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h3 className="font-sans text-2xl">Tell your story,</h3>
          <h2 className="font-serif text-4xl text-primary">
            feel the <span className="italic">ambiance</span>...
          </h2>
        </div>
        <Textarea
          autoFocus
          className="resize-none font-mono"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              askAi({
                messages: [...history.map((item) => item.message), message],
              });
            }
          }}
          disabled={isPending}
          maxLength={200}
          placeholder="Begin to write your story..."
        />
        <ol className="flex flex-col gap-2 px-3 font-mono text-sm">
          {history.toReversed().map((item, index) => (
            <Fragment key={item.id}>
              <li>{item.message}</li>
              {index !== history.length - 1 && <hr />}
            </Fragment>
          ))}
        </ol>
      </div>
      <div className="fixed right-0 bottom-0 left-0 flex items-center justify-center p-4">
        {isPending && <Skeleton className="h-[54px] w-[300px] rounded-full" />}
        <audio
          ref={audioRef}
          controls
          controlsList="nodownload"
          className={cn(isPending && "hidden")}
        />
      </div>
    </div>
  );
}
