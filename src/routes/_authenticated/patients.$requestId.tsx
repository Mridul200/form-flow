import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { AppFooter, AppHeader } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel, VideoCallPanel } from "@/components/communication";
import { formatDateTime } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/patients/$requestId")({
  head: () => ({
    meta: [
      { title: "Patient detail — RehabAI" },
      {
        name: "description",
        content: "Full session history, trends, chat and video call for an approved patient.",
      },
      { property: "og:title", content: "Patient detail — RehabAI" },
      { property: "og:description", content: "Review a patient's rehab sessions." },
    ],
  }),
  component: PatientDetail,
});

function PatientDetail() {
  const { requestId } = Route.useParams();
  const { userId } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-detail", requestId],
    queryFn: async () => {
      const { data: req, error } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      if (!req) return null;
      const [{ data: profile }, { data: sessions }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", req.patient_id).maybeSingle(),
        supabase
          .from("sessions")
          .select("*")
          .eq("user_id", req.patient_id)
          .order("created_at", { ascending: false }),
      ]);
      return { req, name: profile?.name ?? "Patient", sessions: sessions ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Patient" />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Patient" />
        <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          This patient link is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle={data.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">{data.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Condition: {data.req.condition}</p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Session history</h2>
          {data.sessions.length ? (
            <ul className="mt-4 space-y-3">
              {data.sessions.map((s) => (
                <li key={s.id} className="surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{s.exercise}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-success">{s.valid_reps} valid</span>
                      <span className="text-destructive">{s.invalid_reps} invalid</span>
                      <span className="font-display text-xl font-semibold">{s.accuracy}%</span>
                    </div>
                  </div>
                  {s.summary && (
                    <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sessions recorded yet.</p>
          )}
        </section>

        {userId && (
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <ChatPanel requestId={data.req.id} selfId={userId} />
            <VideoCallPanel room={`rehabai_${data.req.doctor_id}_${data.req.patient_id}`} />
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
