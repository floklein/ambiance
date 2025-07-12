import { sounds, type ThemeId, themes } from "@ambiance/sounds";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
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

  const audioRef = useRef<HTMLAudioElement>(null);

  const { mutate: askAi } = useMutation(
    trpc.askAi.mutationOptions({
      onSuccess: (data) => {
        console.log(data);
        if (data.soundId && audioRef.current) {
          audioRef.current.src = sounds[data.soundId].url;
          audioRef.current.load();
          audioRef.current.play();
        }
        if (data.themeId) {
          setTheme(data.themeId);
        }
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
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <h1 className="font-bold text-4xl">
          Change the{" "}
          <span className="font-serif text-primary italic">Ambiance...</span>
        </h1>
        <Textarea
          autoFocus
          className="resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              askAi({ message });
            }
          }}
        />
        <audio ref={audioRef} controls />
      </div>
    </div>
  );
}
