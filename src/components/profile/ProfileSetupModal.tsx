import React, { useState, useEffect } from "react";
import { UserCheck, X, ArrowRight, Shield, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PatientProfileData } from "@/hooks/usePatientProfile";

interface ProfileSetupModalProps {
  isOpen: boolean;
  initialData?: PatientProfileData | null;
  onSave: (data: {
    full_name: string;
    date_of_birth: string;
    gender: "Male" | "Female" | "Other";
    phone: string;
    height: number;
    weight: number;
  }) => Promise<boolean>;
  onSkip: () => void;
  onClose?: () => void;
  isEditing?: boolean;
}

export function ProfileSetupModal({
  isOpen,
  initialData,
  onSave,
  onSkip,
  onClose,
  isEditing = false,
}: ProfileSetupModalProps) {
  const { language } = useLanguage();
  const isHi = language === "hi";

  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth || "");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">(
    initialData?.gender || "Male"
  );
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [height, setHeight] = useState<string>(
    initialData?.height ? String(initialData.height) : "170"
  );
  const [weight, setWeight] = useState<string>(
    initialData?.weight ? String(initialData.weight) : "65"
  );

  interface ProfileErrors {
    fullName?: string;
    dateOfBirth?: string;
    phone?: string;
    height?: string;
    weight?: string;
  }

  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.full_name || "");
      setDateOfBirth(initialData.date_of_birth || "");
      setGender(initialData.gender || "Male");
      setPhone(initialData.phone || "");
      setHeight(initialData.height ? String(initialData.height) : "170");
      setWeight(initialData.weight ? String(initialData.weight) : "65");
    }
  }, [initialData]);

  if (!isOpen) return null;

  function validate() {
    const errs: ProfileErrors = {};
    if (!fullName.trim()) {
      errs.fullName = isHi ? "कृपया अपना नाम दर्ज करें।" : "Please enter your name.";
    }
    if (!dateOfBirth) {
      errs.dateOfBirth = isHi ? "कृपया जन्म तिथि चुनें।" : "Please enter your date of birth.";
    }
    if (!phone.trim() || phone.trim().length < 6) {
      errs.phone = isHi ? "कृपया सही फोन नंबर दर्ज करें।" : "Please enter a valid phone number.";
    }
    const h = Number(height);
    if (!height || isNaN(h) || h <= 50 || h >= 250) {
      errs.height = isHi ? "कृपया सही ऊंचाई दर्ज करें।" : "Please enter a valid height.";
    }
    const w = Number(weight);
    if (!weight || isNaN(w) || w <= 20 || w >= 300) {
      errs.weight = isHi ? "कृपया सही वजन दर्ज करें।" : "Please enter a valid weight.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        phone: phone.trim(),
        height: Number(height),
        weight: Number(weight),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        {/* Header Close button if editing or provided */}
        {(isEditing || onClose) && (
          <button
            onClick={onClose || onSkip}
            className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}

        {/* Modal Title & Subtitle */}
        <div className="text-center space-y-2 mb-6">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3 shadow-xs">
            <UserCheck className="size-6" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            {isEditing
              ? isHi
                ? "प्रोफ़ाइल संपादित करें"
                : "Edit Profile"
              : isHi
              ? "अपनी प्रोफ़ाइल पूरी करें"
              : "Complete Your Profile"}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isHi
               ? "अपने Rehavila अनुभव को निजीकृत करने के लिए कुछ बुनियादी विवरण जोड़ें। इसमें केवल एक मिनट लगता है।"
               : "Add a few basic details to personalize your Rehavila experience. It only takes a minute."}
          </p>
        </div>

        {/* Form — Exactly 6 fields as specified */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {isHi ? "पूरा नाम *" : "Full Name *"}
            </label>
            <Input
              type="text"
              placeholder={isHi ? "उदा. राहुल शर्मा" : "e.g. Rahul Sharma"}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-10 text-xs rounded-xl ${errors.fullName ? "border-red-500" : ""}`}
            />
            {errors.fullName && (
              <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* 2 & 3. DOB and Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Date of Birth */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isHi ? "जन्म तिथि *" : "Date of Birth *"}
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={`h-10 text-xs rounded-xl ${errors.dateOfBirth ? "border-red-500" : ""}`}
              />
              {errors.dateOfBirth && (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.dateOfBirth}
                </p>
              )}
            </div>

            {/* 3. Gender */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isHi ? "लिंग *" : "Gender *"}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Male">{isHi ? "पुरुष (Male)" : "Male"}</option>
                <option value="Female">{isHi ? "महिला (Female)" : "Female"}</option>
                <option value="Other">{isHi ? "अन्य (Other)" : "Other"}</option>
              </select>
            </div>
          </div>

          {/* 4. Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {isHi ? "फोन नंबर *" : "Phone Number *"}
            </label>
            <Input
              type="tel"
              placeholder={isHi ? "उदा. 9876543210" : "e.g. +91 9876543210"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`h-10 text-xs rounded-xl ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && (
              <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> {errors.phone}
              </p>
            )}
          </div>

          {/* 5 & 6. Height & Weight Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* 5. Height (cm) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isHi ? "ऊंचाई (सेमी) *" : "Height (cm) *"}
              </label>
              <Input
                type="number"
                placeholder="170"
                min={50}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`h-10 text-xs rounded-xl ${errors.height ? "border-red-500" : ""}`}
              />
              {errors.height && (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.height}
                </p>
              )}
            </div>

            {/* 6. Weight (kg) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isHi ? "वजन (किग्रा) *" : "Weight (kg) *"}
              </label>
              <Input
                type="number"
                placeholder="65"
                min={20}
                max={300}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`h-10 text-xs rounded-xl ${errors.weight ? "border-red-500" : ""}`}
              />
              {errors.weight && (
                <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.weight}
                </p>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
            <Shield className="size-4 text-emerald-600 shrink-0" />
            <span>
              {isHi
                ? "यह जानकारी केवल आपकी रिपोर्ट और वर्कआउट अनुकूलन के लिए उपयोग की जाएगी।"
                : "Your basic profile data is stored securely and used only for session reports."}
            </span>
          </div>

          {/* Buttons: Primary "Continue" + Secondary "Skip for now" */}
          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs rounded-xl gap-2 shadow-md shadow-emerald-600/20"
            >
              {saving
                ? isHi
                  ? "सहेजा जा रहा है..."
                  : "Saving..."
                : isHi
                ? "जारी रखें"
                : "Continue"}
              <ArrowRight className="size-4" />
            </Button>

            {!isEditing && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                className="w-full text-slate-500 hover:text-slate-800 text-xs h-9 font-medium"
              >
                {isHi ? "अभी के लिए छोड़ें" : "Skip for now"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
