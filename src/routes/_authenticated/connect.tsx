import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { AppFooter, AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel, VideoCallPanel } from "@/components/communication";
import { getPaymentService } from "@/lib/payment";

export const Route = createFileRoute("/_authenticated/connect")({
  head: () => ({
    meta: [
      { title: "Connect with a doctor — Rehavila" },
      {
        name: "description",
        content:
          "Share your condition and rehab history with a verified physiotherapist, then chat or video call once approved.",
      },
      { property: "og:title", content: "Connect with a doctor — Rehavila" },
      { property: "og:description", content: "Get a human opinion on your rehab progress." },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const { userId } = useSession();
  const qc = useQueryClient();
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["approved-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("status", "approved");
      if (error) throw error;
      const ids = data.map((d) => d.id);
      const { data: names } = await supabase.from("profiles").select("id, name").in("id", ids);
      const byId = new Map((names ?? []).map((n) => [n.id, n.name]));
      return data.map((d) => ({ ...d, doctorName: byId.get(d.id) ?? "Physiotherapist" }));
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["my-requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connect_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = data.map((r) => r.doctor_id);
      const { data: names } = await supabase.from("profiles").select("id, name").in("id", ids);
      const byId = new Map((names ?? []).map((n) => [n.id, n.name]));
      return data.map((r) => ({ ...r, doctorName: byId.get(r.doctor_id) ?? "Your doctor" }));
    },
  });

  const active = requests?.find((r) => !r.revoked);

  async function submit() {
    if (!userId || !selected || !condition.trim()) {
      toast.error("Add your condition and pick a doctor first");
      return;
    }
    setPaying(true);
    try {
      const doctor = doctors?.find((d) => d.id === selected);
      const payment = await getPaymentService().pay({
        amount: doctor?.fee_amount ?? 499,
        currency: "INR",
        customerName: "Patient",
        description: `Consultation with ${doctor?.doctorName ?? "doctor"}`,
      });
      if (payment.paymentStatus !== "paid") throw new Error("Payment did not go through");

      const { error } = await supabase.from("connect_requests").insert({
        patient_id: userId,
        doctor_id: selected,
        condition: condition.trim(),
        notes: notes.trim(),
        payment_status: payment.paymentStatus,
        transaction_id: payment.transactionId,
        amount: doctor?.fee_amount ?? 499,
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Request sent — waiting for the doctor to approve");
      qc.invalidateQueries({ queryKey: ["my-requests", userId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaying(false);
    }
  }

  async function revoke(id: string) {
    await supabase.from("connect_requests").update({ revoked: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-requests", userId] });
    toast.success("Access revoked");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle="Connect with a doctor" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {active ? (
          <div className="space-y-6">
            <div className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold">
                    {active.doctorName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Condition: {active.condition} · Payment {active.payment_status} ·{" "}
                    {active.transaction_id}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => revoke(active.id)}>
                  Revoke access
                </Button>
              </div>
              {active.status === "pending" && (
                <p className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Waiting for the doctor to approve your request. Chat and video unlock the moment
                  they accept.
                </p>
              )}
              {active.status === "rejected" && (
                <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  This request was declined. You can revoke it and request another clinician.
                </p>
              )}
            </div>

            {active.status === "approved" && userId && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ChatPanel requestId={active.id} selfId={userId} />
                <VideoCallPanel room={`rehabai_${active.doctor_id}_${active.patient_id}`} />
              </div>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold sm:text-3xl">Connect with a doctor</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your session history is shared with the clinician only after they approve, and you can
              revoke access at any time.
            </p>

            <section className="surface-card mt-8 space-y-4 p-6">
              <h2 className="text-sm font-semibold">1. Tell us what's going on</h2>
              <Input
                placeholder="Condition (e.g. ACL rehab, week 6)"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
              <Textarea
                placeholder="Anything else the clinician should know (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-semibold">2. Choose a physiotherapist</h2>
              {isLoading ? (
                <Skeleton className="mt-4 h-32 rounded-2xl" />
              ) : doctors?.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {doctors.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelected(d.id)}
                      className={`surface-card p-5 text-left transition ${
                        selected === d.id ? "ring-2 ring-primary" : "hover:shadow-lg"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="size-4 text-primary" />
                        <span className="font-semibold">{d.doctorName}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {d.specialty} · {d.years_experience} yrs
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>
                      <p className="mt-3 font-display text-lg font-semibold">₹{d.fee_amount}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No verified clinicians are available yet. An admin needs to approve doctor
                  accounts first.
                </p>
              )}
            </section>

            <section className="surface-card mt-8 p-6">
              <h2 className="text-sm font-semibold">3. Pay & send request</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <ShieldCheck className="mr-1 inline size-4 text-primary" />
                Sandbox checkout — no real money moves. Settlement with a live gateway is future
                scope.
              </p>
              <Button className="mt-4" size="lg" disabled={paying} onClick={submit}>
                {paying && <Loader2 className="mr-1 size-4 animate-spin" />}
                Pay & request consultation
              </Button>
            </section>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
