import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
  const { data: session } = authClient.useSession();

  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Welcome {session?.user.name}</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            You are successfully authenticated!
          </p>
          <div className="space-y-2">
            <div>
              <strong>Private Data:</strong> {privateData.data?.message}
            </div>
            <div>
              <strong>User Email:</strong> {session?.user.email}
            </div>
          </div>
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-muted-foreground text-sm">
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
