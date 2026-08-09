/**
 * Authoritative Squat Configuration & Target Parameters.
 * Central single source of truth for squat thresholds, tolerances, persistence windows, and scoring weights.
 */

export interface SquatConfig {
  camera: {
    requiredLandmarks: number[];
    minVisibility: number;
    goodVisibility: number;
  };
  angles: {
    standKnee: number;          // Standing baseline knee angle (>= 160 deg)
    enterDescendKnee: number;   // Angle to enter DESCENDING phase (<= 150 deg)
    targetDepthKnee: number;    // Ideal squat depth (<= 100 deg)
    minDepthKnee: number;       // Minimum depth to satisfy valid rep (<= 120 deg)
    maxBackLean: number;        // Critical forward torso lean threshold (>= 35 deg)
    warnBackLean: number;       // Warning forward torso lean threshold (>= 25 deg)
    maxKneeValgus: number;      // Inward knee collapse ratio threshold (>= 0.08)
    warnKneeValgus: number;     // Inward knee warning ratio threshold (>= 0.05)
    maxAsymmetry: number;       // Max left/right knee angle delta (>= 15 deg)
    maxSpeedDegPerSec: number;  // Max descent velocity before triggering speed warning (>= 120 deg/s)
  };
  hysteresis: {
    kneePhaseDelta: number;     // 10 deg hysteresis buffer between enter & exit phase thresholds
  };
  persistence: {
    errorActivationMs: number;  // Error must persist 350ms before activating
    correctionClearMs: number; // Correction must persist 300ms before clearing error
  };
  rep: {
    minROM: number;             // Minimum ROM required for valid rep (45 deg)
    debounceMs: number;         // Cooldown between reps (500ms)
  };
  scoringWeights: {
    depth: number;              // Weight for depth (35%)
    valgus: number;             // Weight for knee tracking (30%)
    torso: number;              // Weight for posture (20%)
    control: number;            // Weight for speed/control (15%)
  };
}

export const DEFAULT_SQUAT_CONFIG: SquatConfig = {
  camera: {
    // Shoulders (11, 12), Hips (23, 24), Knees (25, 26), Ankles (27, 28)
    requiredLandmarks: [11, 12, 23, 24, 25, 26, 27, 28],
    minVisibility: 0.45,
    goodVisibility: 0.70,
  },
  angles: {
    standKnee: 160,
    enterDescendKnee: 150,
    targetDepthKnee: 100,
    minDepthKnee: 120,
    maxBackLean: 35,
    warnBackLean: 25,
    maxKneeValgus: 0.08,
    warnKneeValgus: 0.05,
    maxAsymmetry: 15,
    maxSpeedDegPerSec: 120,
  },
  hysteresis: {
    kneePhaseDelta: 10,
  },
  persistence: {
    errorActivationMs: 350,
    correctionClearMs: 300,
  },
  rep: {
    minROM: 45,
    debounceMs: 500,
  },
  scoringWeights: {
    depth: 0.35,
    valgus: 0.30,
    torso: 0.20,
    control: 0.15,
  },
};
