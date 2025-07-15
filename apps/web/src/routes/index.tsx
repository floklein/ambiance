import { type Contents, sounds, type ThemeId, themes } from "@ambiance/shared";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
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

const FADE_DURATION = 5000;
const FADE_STEPS = 20;

function HomeComponent() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [history, setHistory] = useState<Contents>([]);
  const [activeAudioRef, setActiveAudioRef] = useState<1 | 2>(1);

  const audioRef1 = useRef<HTMLAudioElement>(null);
  const audioRef2 = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const { mutate: askAi, isPending } = useMutation(
    trpc.askAi.mutationOptions({
      onSuccess: (data) => {
        setHistory(data.contents);
        console.log("Contents:", data.contents);
        if (data.soundId) {
          console.log("Sound:", sounds[data.soundId].title);
          crossfade(
            `https://sounds.tabletopaudio.com/${sounds[data.soundId].mp3}`,
          );
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
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ text: message }],
        },
      ]);
    }
  }

  async function handleRecord(blob: Blob) {
    const base64 = (await blobToBase64(blob)).split(",")[1] ?? "";
    askAi([
      ...history,
      {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ inlineData: { data: base64, mimeType: "audio/wav" } }],
      },
    ]);
  }

  async function crossfade(nextSrc: string) {
    const currentRef =
      activeAudioRef === 1 ? audioRef1.current : audioRef2.current;
    const nextRef =
      activeAudioRef === 1 ? audioRef2.current : audioRef1.current;
    if (!currentRef || !nextRef) return;
    nextRef.src = nextSrc;
    nextRef.volume = 0;
    nextRef.load();
    await nextRef.play();
    setActiveAudioRef(activeAudioRef === 1 ? 2 : 1);
    const stepDuration = FADE_DURATION / FADE_STEPS;
    let step = 0;
    fadeIntervalRef.current = setInterval(() => {
      step++;
      const progress = step / FADE_STEPS;
      nextRef.volume = progress;
      if (!currentRef.paused) {
        currentRef.volume = 1 - progress;
      }
      if (step >= FADE_STEPS) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
        nextRef.volume = 1;
        if (!currentRef.paused) {
          currentRef.pause();
          currentRef.volume = 1;
        }
      }
    }, stepDuration);
  }

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const userMessages = history
    .filter((item) => item.role === "user")
    .toReversed();

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
            className="resize-none bg-card pr-15 font-mono"
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
          {userMessages.map((item, index) => {
            const part = item.parts.at(0);
            return (
              <Fragment key={item.id}>
                <li>
                  {part?.inlineData && (
                    <span className="italic">Transcribing...</span>
                  )}
                  {part?.text}
                </li>
                {index !== userMessages.length - 1 && <hr />}
              </Fragment>
            );
          })}
        </ol>
      </div>
      <div className="flex items-center justify-center p-4">
        {isPending && <Skeleton className="h-[54px] w-[300px] rounded-full" />}
        <audio
          ref={audioRef1}
          controls
          controlsList="nodownload"
          loop
          className={cn((isPending || activeAudioRef !== 1) && "hidden")}
        />
        <audio
          ref={audioRef2}
          controls
          controlsList="nodownload"
          loop
          className={cn((isPending || activeAudioRef !== 2) && "hidden")}
        />
      </div>
    </div>
  );
}
