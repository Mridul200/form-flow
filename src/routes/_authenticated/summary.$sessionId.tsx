import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, FileText, UserCheck, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AppFooter, AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/stats";
import { calculateAge } from "@/hooks/usePatientProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/summary/$sessionId")({
  head: () => ({
    meta: [
      { title: "Session Summary — Rehavila" },
      {
        name: "description",
        content: "Accuracy score, valid and invalid reps, patient information, and AI coaching notes for your session.",
      },
      { property: "og:title", content: "Session Summary — Rehavila" },
      { property: "og:description", content: "Your rehab session results and key corrections." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { sessionId } = Route.useParams();
  const { language } = useLanguage();
  const isHi = language === "hi";

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const userId = session?.user_id ?? null;

  const { data: patientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["patient_profile_summary", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      try {
        const { data } = await (supabase.from("patient_profiles" as any) as any)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) return data;
      } catch {
        // Supabase query fallback
      }
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`patient_profile_${userId}`);
        if (local) {
          try {
            return JSON.parse(local);
          } catch {
            // error
          }
        }
      }
      return null;
    },
  });

  const patientName = patientProfile?.full_name || "Patient";
  const ageVal = patientProfile?.date_of_birth
    ? calculateAge(patientProfile.date_of_birth)
    : null;
  const patientAgeStr = ageVal !== null ? `${ageVal} years` : patientProfile?.date_of_birth || "N/A";
  const patientGender = patientProfile?.gender || "N/A";
  const patientHeight = patientProfile?.height ? `${patientProfile.height} cm` : "N/A";
  const patientWeight = patientProfile?.weight ? `${patientProfile.weight} kg` : "N/A";

  async function exportPdf() {
    if (!session) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.text("Rehavila — Patient Session Report", 20, y);
      y += 6;
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);

      // PATIENT INFORMATION
      y += 8;
      doc.setFontSize(13);
      doc.text("PATIENT INFORMATION", 20, y);
      doc.setFontSize(10);
      doc.text(`Name: ${patientName}`, 20, (y += 6));
      doc.text(`Age: ${patientAgeStr}`, 20, (y += 6));
      doc.text(`Gender: ${patientGender}`, 20, (y += 6));
      doc.text(`Height: ${patientHeight}`, 20, (y += 6));
      doc.text(`Weight: ${patientWeight}`, 20, (y += 6));

      // SESSION INFORMATION
      y += 8;
      doc.setFontSize(13);
      doc.text("SESSION INFORMATION", 20, (y += 4));
      doc.setFontSize(10);
      doc.text(`Exercise: ${session.exercise}`, 20, (y += 6));
      doc.text(`Session Date: ${formatDateTime(session.created_at)}`, 20, (y += 6));
      doc.text(`Form Score: ${session.accuracy}%`, 20, (y += 6));
      doc.text(`Valid Repetitions: ${session.valid_reps}`, 20, (y += 6));
      doc.text(`Invalid Repetitions: ${session.invalid_reps}`, 20, (y += 6));
      doc.text(`Duration: ${session.duration_seconds}s`, 20, (y += 6));

      // Key Corrections
      y += 8;
      doc.setFontSize(13);
      doc.text("Key Corrections", 20, (y += 4));
      doc.setFontSize(10);
      const corrections = session.corrections?.length ? session.corrections : ["None recorded (Clean session)"];
      for (const c of corrections) {
        doc.text(`• ${c}`, 24, (y += 6));
      }

      // Coach Recap
      y += 8;
      doc.setFontSize(13);
      doc.text("Coach Recap", 20, (y += 4));
      doc.setFontSize(10);
      for (const line of doc.splitTextToSize(session.summary || "No recap recorded.", 170)) {
        doc.text(line, 20, (y += 6));
      }

      // Footer Disclaimer
      y += 12;
      doc.setFontSize(8);
      for (const line of doc.splitTextToSize(
        "Disclaimer: Rehavila provides movement feedback for general fitness and rehab support. It is not a substitute for professional medical advice, diagnosis or treatment.",
        170,
      )) {
        doc.text(line, 20, (y += 4));
      }

      doc.save(`rehabai-report-${patientName.toLowerCase().replace(/\s+/g, "_")}-${sessionId.slice(0, 6)}.pdf`);
      toast.success("Patient Report PDF downloaded cleanly");
    } catch {
      toast.error("Could not generate the PDF");
    }
  }

  const isLoading = sessionLoading || profileLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle="Session Summary" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : !session ? (
          <p className="text-sm text-muted-foreground">Session not found.</p>
        ) : (
          <>
            <div className="surface-card p-6 sm:p-8 space-y-6">
              {/* Session Title & Accuracy */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                  <h1 className="text-2xl font-bold font-display">{session.exercise}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isHi ? "आज का अभ्यास पूरा हो गया" : "Session completed"} · {formatDateTime(session.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-5xl font-extrabold text-primary">
                    {session.accuracy}%
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">{isHi ? "फॉर्म स्कोर" : "Form score"}</p>
                </div>
              </div>

              {/* PATIENT INFORMATION CARD */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <UserCheck className="size-4" />
                  <span>{isHi ? "मरीज़ की जानकारी" : "Patient information"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isHi ? "पूरा नाम" : "Full name"}</span>
                    <span className="font-bold text-foreground">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isHi ? "उम्र" : "Age"}</span>
                    <span className="font-bold text-foreground">{patientAgeStr}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isHi ? "लिंग" : "Gender"}</span>
                    <span className="font-bold text-foreground">{patientGender}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isHi ? "लंबाई / वजन" : "Height / weight"}</span>
                    <span className="font-bold text-foreground">{patientHeight} / {patientWeight}</span>
                  </div>
                </div>
              </div>

              {/* SESSION METRICS GRID */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Tile
                  icon={<CheckCircle2 className="size-4 text-emerald-500" />}
                  label={isHi ? "सही रेप्स" : "Valid reps"}
                  value={session.valid_reps}
                />
                <Tile
                  icon={<XCircle className="size-4 text-destructive" />}
                  label={isHi ? "गलत रेप्स" : "Invalid reps"}
                  value={session.invalid_reps}
                />
                <Tile
                  icon={<FileText className="size-4 text-muted-foreground" />}
                  label={isHi ? "समय" : "Duration"}
                  value={`${session.duration_seconds}s`}
                />
              </div>

              {/* Coach Recap */}
              <div className="rounded-2xl bg-accent/50 p-5 border border-border/40">
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">{isHi ? "सारांश" : "Coach recap"}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {session.summary || "No recap available for this session."}
                </p>
              </div>

              {/* Key Corrections */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">{isHi ? "मुख्य सुधार" : "Key corrections"}</h2>
                {session.corrections?.length ? (
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {session.corrections.map((c: string) => (
                      <li key={c} className="flex gap-2 items-start">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Clean session — no posture errors recorded.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={exportPdf} className="gap-2 font-bold">
                <Download className="size-4" />
                {isHi ? "डॉक्टर को रिपोर्ट भेजें (PDF)" : "Share report with doctor (PDF)"}
              </Button>
              <Button asChild variant="outline">
                <Link to="/progress">{isHi ? "प्रगति देखें" : "View progress"}</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/dashboard">{isHi ? "डैशबोर्ड पर वापस जाएँ" : "Back to dashboard"}</Link>
              </Button>
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
