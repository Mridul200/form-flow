import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { AppFooter, AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor dashboard — Rehavila" },
      {
        name: "description",
        content: "Review incoming patient requests and open chat or video with approved patients.",
      },
      { property: "og:title", content: "Doctor dashboard — Rehavila" },
      { property: "og:description", content: "Manage your Rehavila patients." },
    ],
  }),
  component: DoctorDashboard,
});

type Req = {
  id: string;
  patient_id: string;
  condition: string;
  notes: string;
  status: string;
  revoked: boolean;
  payment_status: string;
  patientName: string;
};

function DoctorDashboard() {
  const { userId } = useSession();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("revoked", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: names } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", rows.map((r) => r.patient_id));
      const byId = new Map((names ?? []).map((n) => [n.id, n.name]));
      return rows.map((r) => ({
        ...r,
        patientName: byId.get(r.patient_id) ?? "Patient",
      })) as Req[];
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("connect_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Patient approved" : "Request rejected");
    qc.invalidateQueries({ queryKey: ["doctor-requests", userId] });
  }

  const pending = data?.filter((r) => r.status === "pending") ?? [];
  const approved = data?.filter((r) => r.status === "approved") ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle="Doctor" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your patients</h1>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Pending requests</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-24 rounded-2xl" />
          ) : pending.length ? (
            <ul className="mt-4 space-y-3">
              {pending.map((r) => (
                <li key={r.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-semibold">{r.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.condition} · payment {r.payment_status}
                    </p>
                    {r.notes && <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(r.id, "approved")}>
                      <Check className="mr-1 size-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}>
                      <X className="mr-1 size-4" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing waiting on you.</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold">Approved patients</h2>
          {approved.length ? (
            <ul className="mt-4 space-y-3">
              {approved.map((r) => (
                <li key={r.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-semibold">{r.patientName}</p>
                    <p className="text-sm text-muted-foreground">{r.condition}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/patients/$requestId" params={{ requestId: r.id }}>
                      Open patient
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No approved patients yet.</p>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
