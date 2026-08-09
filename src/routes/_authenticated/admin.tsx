import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Flag, Stethoscope, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — RehabAI" },
      {
        name: "description",
        content: "Platform stats, doctor verification, user management and chat moderation.",
      },
      { property: "og:title", content: "Admin panel — RehabAI" },
      { property: "og:description", content: "Operate the RehabAI platform." },
    ],
  }),
  component: AdminPanel,
});

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "doctors", label: "Doctor approval", icon: Stethoscope },
  { id: "users", label: "Users", icon: Users },
  { id: "moderation", label: "Moderation", icon: Flag },
] as const;

function AdminPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const [profiles, roles, doctors, sessions, requests, messages] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("doctor_profiles").select("*"),
        supabase.from("sessions").select("id"),
        supabase.from("connect_requests").select("*"),
        supabase.from("messages").select("*").eq("flagged", true),
      ]);
      return {
        profiles: profiles.data ?? [],
        roles: roles.data ?? [],
        doctors: doctors.data ?? [],
        sessionCount: sessions.data?.length ?? 0,
        requests: requests.data ?? [],
        flagged: messages.data ?? [],
      };
    },
  });

  const roleOf = (id: string) => data?.roles.find((r) => r.user_id === id)?.role ?? "patient";
  const nameOf = (id: string) => data?.profiles.find((p) => p.id === id)?.name ?? "Unknown";
  const revenue = (data?.requests ?? [])
    .filter((r) => r.payment_status === "paid")
    .reduce((a, r) => a + r.amount, 0);

  async function setDoctorStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("doctor_profiles").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Doctor ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-data"] });
  }

  async function toggleActive(id: string, isActive: boolean) {
    const { error } = await supabase.from("profiles").update({ is_active: !isActive }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-data"] });
  }

  async function moderate(id: string, remove: boolean) {
    const { error } = remove
      ? await supabase.from("messages").delete().eq("id", id)
      : await supabase.from("messages").update({ flagged: false }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(remove ? "Message removed" : "Message approved");
    qc.invalidateQueries({ queryKey: ["admin-data"] });
  }

  const filteredUsers = (data?.profiles ?? []).filter((p) =>
    `${p.name} ${p.email ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <AppHeader subtitle="Admin" />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <nav className="hidden w-52 shrink-0 space-y-1 sm:block">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 sm:hidden">
            {TABS.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={tab === t.id ? "default" : "outline"}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Patients", data?.profiles.filter((p) => roleOf(p.id) === "patient").length ?? 0],
                ["Doctors", data?.doctors.length ?? 0],
                ["Sessions", data?.sessionCount ?? 0],
                ["Connect requests", data?.requests.length ?? 0],
                ["Revenue (test)", `₹${revenue}`],
                ["Flagged messages", data?.flagged.length ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "doctors" && (
            <Table
              head={["Doctor", "Specialty", "Experience", "Status", ""]}
              rows={(data?.doctors ?? []).map((d) => [
                nameOf(d.id),
                d.specialty,
                `${d.years_experience} yrs`,
                d.status,
                <span key="a" className="flex gap-2">
                  <Button size="sm" onClick={() => setDoctorStatus(d.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDoctorStatus(d.id, "rejected")}>
                    Reject
                  </Button>
                </span>,
              ])}
            />
          )}

          {tab === "users" && (
            <>
              <Input
                className="mb-4 max-w-sm bg-card"
                placeholder="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Table
                head={["Name", "Email", "Role", "Status", ""]}
                rows={filteredUsers.map((p) => [
                  p.name,
                  p.email ?? "—",
                  roleOf(p.id),
                  p.is_active ? "active" : "deactivated",
                  <Button
                    key="t"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(p.id, p.is_active)}
                  >
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>,
                ])}
              />
            </>
          )}

          {tab === "moderation" && (
            <Table
              head={["Sender", "Message", "Sent", ""]}
              rows={(data?.flagged ?? []).map((m) => [
                nameOf(m.sender_id),
                m.text,
                formatDateTime(m.created_at),
                <span key="a" className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => moderate(m.id, false)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => moderate(m.id, true)}>
                    Remove
                  </Button>
                </span>,
              ])}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/60">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={head.length}>
                Nothing here yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
