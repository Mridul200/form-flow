import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "./useAuth";

export interface PatientProfileData {
  id?: string;
  user_id: string;
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: "Male" | "Female" | "Other";
  phone: string;
  height: number; // in cm
  weight: number; // in kg
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function usePatientProfile() {
  const { userId } = useSession();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [skipped, setSkipped] = useState<boolean>(() => {
    if (typeof window !== "undefined" && userId) {
      return localStorage.getItem(`skipped_profile_${userId}`) === "true";
    }
    return false;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronize skipped state when userId changes
  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const isSkipped = localStorage.getItem(`skipped_profile_${userId}`) === "true";
      setSkipped(isSkipped);
    }
  }, [userId]);

  const query = useQuery({
    queryKey: ["patient_profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PatientProfileData | null> => {
      if (!userId) return null;

      try {
        // Try fetching from Supabase patient_profiles table
        const { data, error } = await (supabase.from("patient_profiles" as any) as any)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            full_name: data.full_name || profile?.name || "",
            date_of_birth: data.date_of_birth || "",
            gender: (data.gender as "Male" | "Female" | "Other") || "Male",
            phone: data.phone || "",
            height: data.height || 170,
            weight: data.weight || 65,
            profile_completed: Boolean(data.profile_completed),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch {
        // Supabase table fallback
      }

      // LocalStorage fallback for offline/local resilience
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`patient_profile_${userId}`);
        if (local) {
          try {
            return JSON.parse(local) as PatientProfileData;
          } catch {
            // parse error
          }
        }
      }

      // Default empty profile
      return {
        user_id: userId,
        full_name: profile?.name || "",
        date_of_birth: "",
        gender: "Male",
        phone: "",
        height: 170,
        weight: 65,
        profile_completed: false,
      };
    },
  });

  const patientProfile = query.data ?? null;
  const isCompleted = Boolean(patientProfile?.profile_completed);

  // Auto-open modal on first dashboard visit if patient, not completed, and not skipped
  useEffect(() => {
    if (
      userId &&
      profile?.role === "patient" &&
      !query.isLoading &&
      !isCompleted &&
      !skipped
    ) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [userId, profile?.role, query.isLoading, isCompleted, skipped]);

  const saveProfile = useCallback(
    async (formData: {
      full_name: string;
      date_of_birth: string;
      gender: "Male" | "Female" | "Other";
      phone: string;
      height: number;
      weight: number;
    }) => {
      if (!userId) return false;

      const payload: PatientProfileData = {
        user_id: userId,
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        phone: formData.phone.trim(),
        height: Number(formData.height),
        weight: Number(formData.weight),
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };

      // 1. Save to LocalStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`patient_profile_${userId}`, JSON.stringify(payload));
        localStorage.removeItem(`skipped_profile_${userId}`);
      }

      // 2. Save to Supabase (patient_profiles or profiles table)
      try {
        await (supabase.from("patient_profiles" as any) as any).upsert(
          {
            user_id: userId,
            full_name: payload.full_name,
            date_of_birth: payload.date_of_birth || null,
            gender: payload.gender,
            phone: payload.phone,
            height: payload.height,
            weight: payload.weight,
            profile_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Also update name in main profiles table for consistency
        await supabase
          .from("profiles")
          .update({ name: payload.full_name })
          .eq("id", userId);
      } catch {
        // Fallback silently if table doesn't exist
      }

      setSkipped(false);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["patient_profile", userId] });
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      return true;
    },
    [userId, queryClient]
  );

  const skipProfile = useCallback(() => {
    if (!userId) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(`skipped_profile_${userId}`, "true");
    }
    setSkipped(true);
    setIsModalOpen(false);
  }, [userId]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    patientProfile,
    isCompleted,
    isSkipped: skipped,
    isLoading: query.isLoading,
    isModalOpen,
    openModal,
    closeModal,
    saveProfile,
    skipProfile,
  };
}
