import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { AppFooter, AppHeader } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { computeStreak, formatDate, formatDateTime } from "@/lib/stats";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress & history — RehabAI" },
      {
        name: "description",
        content: "Accuracy trend over time, full session timeline and your consistency streak.",
      },
      { property: "og:title", content: "Progress & history — RehabAI" },
      { property: "og:description", content: "See whether your rehab form is actually improving." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { userId } = useSession();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const list = sessions ?? [];
  const chartData = [...list]
    .reverse()
    .map((s) => ({
      date: formatDate(s.created_at),
      accuracy: s.accuracy,
      reps: s.valid_reps,
    }));
  const streak = computeStreak(list.map((s) => s.created_at));
  const avg = list.length
    ? Math.round(list.reduce((a, s) => a + s.accuracy, 0) / list.length)
    : 0;
  const totalReps = list.reduce((a, s) => a + s.valid_reps, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle="Progress" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Progress & history</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Flame className="size-4" />} label="Streak" value={`${streak} days`} />
          <StatCard icon={<Flame className="size-4" />} label="Average accuracy" value={`${avg}%`} />
          <StatCard icon={<Flame className="size-4" />} label="Valid reps" value={String(totalReps)} />
        </div>

        <section className="surface-card mt-8 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Accuracy trend</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-64 rounded-xl" />
          ) : chartData.length < 2 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Complete at least two sessions to see a trend line.
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reps"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Session timeline</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-40 rounded-2xl" />
          ) : list.length === 0 ? (
            <div className="surface-card mt-4 p-8 text-center">
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
              <Button asChild className="mt-4">
                <Link to="/exercise" search={{ exercise: "squat" }}>
                  Start your first session
                </Link>
              </Button>
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {list.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/summary/$sessionId"
                    params={{ sessionId: s.id }}
                    className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.exercise}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-success">{s.valid_reps} valid</span>
                      <span className="text-destructive">{s.invalid_reps} invalid</span>
                      <span className="font-display text-xl font-semibold">{s.accuracy}%</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
