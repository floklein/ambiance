import { sounds } from "@ambiance/sounds";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

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
  return (
    <div className="flex h-svh flex-col items-center justify-center">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <h1 className="font-bold text-4xl">
          Change the{" "}
          <span className="font-serif text-primary italic">Ambiance...</span>
        </h1>
        <Textarea autoFocus className="resize-none shadow-2xl" />
      </div>
      <audio controls>
        <source src={sounds.goodhaven.url} />
      </audio>
    </div>
  );
}
