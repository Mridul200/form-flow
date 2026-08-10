import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  User,
  Calendar,
  Phone,
  Ruler,
  Weight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePatientProfile, calculateAge } from "@/hooks/usePatientProfile";
import { ProfileSetupModal } from "@/components/profile/ProfileSetupModal";
import { useLanguage } from "@/context/LanguageContext";
import { AppFooter, AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Patient Profile — Rehavila" },
      {
        name: "description",
        content: "View and edit your personal patient profile for session reports.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { language, t } = useLanguage();
  const isHi = language === "hi";

  const {
    patientProfile,
    isCompleted,
    isLoading,
    saveProfile,
  } = usePatientProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const age = patientProfile?.date_of_birth
    ? calculateAge(patientProfile.date_of_birth)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader subtitle={isHi ? "प्रोफ़ाइल" : "Profile"} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {isHi ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard"}
        </Link>

        {/* Profile Card Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-emerald-600 text-white font-bold text-xl shadow-md shadow-emerald-600/20">
                {patientProfile?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                  {patientProfile?.full_name || (isHi ? "अनाम रोगी" : "Patient Profile")}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="size-3.5" />
                      {isHi ? "प्रोफ़ाइल पूर्ण" : "Profile Completed"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                      <AlertCircle className="size-3.5" />
                      {isHi ? "प्रोफ़ाइल अपूर्ण" : "Incomplete Profile"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl h-10 px-5 shadow-xs"
            >
              <Edit3 className="size-4" />
              {isHi ? "प्रोफ़ाइल संपादित करें" : "Edit Profile"}
            </Button>
          </div>

          {/* Saved Patient Info Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <InfoTile
              icon={<User className="size-4 text-emerald-600" />}
              label={isHi ? "पूरा नाम" : "Full Name"}
              value={patientProfile?.full_name || "—"}
            />

            <InfoTile
              icon={<Calendar className="size-4 text-emerald-600" />}
              label={isHi ? "जन्म तिथि / आयु" : "Date of Birth / Age"}
              value={
                patientProfile?.date_of_birth
                  ? `${patientProfile.date_of_birth}${age !== null ? ` (${age} ${isHi ? "वर्ष" : "years"})` : ""}`
                  : "—"
              }
            />

            <InfoTile
              icon={<User className="size-4 text-emerald-600" />}
              label={isHi ? "लिंग" : "Gender"}
              value={patientProfile?.gender || "—"}
            />

            <InfoTile
              icon={<Phone className="size-4 text-emerald-600" />}
              label={isHi ? "फोन नंबर" : "Phone"}
              value={patientProfile?.phone || "—"}
            />

            <InfoTile
              icon={<Ruler className="size-4 text-emerald-600" />}
              label={isHi ? "ऊंचाई" : "Height"}
              value={patientProfile?.height ? `${patientProfile.height} cm` : "—"}
            />

            <InfoTile
              icon={<Weight className="size-4 text-emerald-600" />}
              label={isHi ? "वजन" : "Weight"}
              value={patientProfile?.weight ? `${patientProfile.weight} kg` : "—"}
            />
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-500">
            <Shield className="size-5 text-emerald-600 shrink-0" />
            <p>
              {isHi
                ? "आपकी बुनियादी प्रोफ़ाइल जानकारी आपके सत्र रिपोर्ट और PDF दस्तावेज़ों में अपने आप शामिल हो जाएगी।"
                : "Your basic profile info is automatically included in session report PDFs generated for your doctor."}
            </p>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <ProfileSetupModal
        isOpen={isEditModalOpen}
        initialData={patientProfile}
        onSave={async (formData) => {
          await saveProfile(formData);
          setIsEditModalOpen(false);
          return true;
        }}
        onSkip={() => setIsEditModalOpen(false)}
        onClose={() => setIsEditModalOpen(false)}
        isEditing
      />

      <AppFooter />
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
