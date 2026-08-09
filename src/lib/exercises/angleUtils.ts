/**
 * Shared geometry utilities for pose landmark processing.
 * All exercises import from here — do not duplicate angle math.
 */

export interface Landmark {
  x: number;         // normalized 0–1, horizontal
  y: number;         // normalized 0–1, vertical (increases downward)
  z: number;         // depth
  visibility?: number;
}

/** MediaPipe BlazePose — all 33 landmark indices. */
export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  LEFT_MOUTH: 9, RIGHT_MOUTH: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
} as const;

/** Full BlazePose skeleton edges for overlay drawing. */
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];

/** Angle at vertex B in degrees for the A–B–C triplet. */
export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const ax = a.x - b.x, ay = a.y - b.y;
  const cx = c.x - b.x, cy = c.y - b.y;
  const dot = ax * cx + ay * cy;
  const mag = Math.hypot(ax, ay) * Math.hypot(cx, cy);
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/** 3D Angle at vertex B in degrees for the A–B–C triplet using x, y, z. */
export function angleAt3D(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x, aby = a.y - b.y, abz = a.z - b.z;
  const cbx = c.x - b.x, cby = c.y - b.y, cbz = c.z - b.z;
  const dot = abx * cbx + aby * cby + abz * cbz;
  const mag = Math.hypot(abx, aby, abz) * Math.hypot(cbx, cby, cbz);
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/** Vector from A to B. */
export function vector3D(a: Landmark, b: Landmark) {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}

/** Angle in degrees between two 3D vectors. */
export function angleBetweenVectors3D(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number }
): number {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag = Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z);
  if (mag === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/** Average position of two landmarks. */
export function mid(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/** Safe landmark accessor — returns zero-landmark if index is out of range. */
export function at(lms: Landmark[], i: number): Landmark {
  return lms[i] ?? { x: 0, y: 0, z: 0, visibility: 0 };
}

/** True when every required index has visibility above threshold. */
export function visible(lms: Landmark[], indices: number[], minV = 0.4): boolean {
  return indices.every((i) => {
    const lm = lms[i];
    return !!lm && (lm.visibility ?? 1) > minV;
  });
}

/** Vertical distance: positive = b is ABOVE a on screen (smaller y). */
export function verticalOffset(a: Landmark, b: Landmark): number {
  return a.y - b.y; // positive means b is above a
}

export type LandmarkQualityScore = "GOOD" | "UNCERTAIN" | "UNRELIABLE";

export interface LandmarkQualityResult {
  quality: LandmarkQualityScore;
  avgVisibility: number;
  missingIndices: number[];
}

/** Evaluate quality of required landmarks. */
export function evalLandmarkQuality(
  lms: Landmark[],
  requiredIndices: number[],
  goodThreshold = 0.7,
  uncertainThreshold = 0.45
): LandmarkQualityResult {
  if (!lms.length) {
    return { quality: "UNRELIABLE", avgVisibility: 0, missingIndices: requiredIndices };
  }

  let visSum = 0;
  const missingIndices: number[] = [];

  for (const idx of requiredIndices) {
    const lm = lms[idx];
    const v = lm?.visibility ?? 0;
    visSum += v;
    if (v < uncertainThreshold) {
      missingIndices.push(idx);
    }
  }

  const avgVisibility = requiredIndices.length ? visSum / requiredIndices.length : 0;
  let quality: LandmarkQualityScore = "GOOD";

  if (avgVisibility < uncertainThreshold || missingIndices.length > 2) {
    quality = "UNRELIABLE";
  } else if (avgVisibility < goodThreshold || missingIndices.length > 0) {
    quality = "UNCERTAIN";
  }

  return { quality, avgVisibility, missingIndices };
}

/** Outlier rejection — clamps single-frame jumps larger than maxStep. */
export function rejectLandmarkOutliers(
  current: Landmark[],
  previous: Landmark[] | null,
  maxStep = 0.25
): Landmark[] {
  if (!previous || previous.length !== current.length) return current;

  return current.map((lm, i) => {
    const prev = previous[i];
    if (!prev) return lm;

    const dx = lm.x - prev.x;
    const dy = lm.y - prev.y;
    const dz = lm.z - prev.z;
    const step = Math.hypot(dx, dy, dz);

    if (step > maxStep) {
      // Down-weight outlier step by interpolating
      const result: Landmark = {
        x: prev.x + (dx / step) * maxStep,
        y: prev.y + (dy / step) * maxStep,
        z: prev.z + (dz / step) * maxStep,
      };
      if (lm.visibility !== undefined) {
        result.visibility = Math.min(lm.visibility, prev.visibility ?? 1);
      }
      return result;
    }
    return lm;
  });
}

/** Low-latency Exponential Moving Average (EMA) smoother for continuous values. */
export class EMASmoother {
  private alpha: number;
  private value: number | null = null;

  constructor(alpha = 0.35) {
    this.alpha = alpha;
  }

  filter(val: number): number {
    if (this.value === null || isNaN(this.value)) {
      this.value = val;
    } else {
      this.value = this.alpha * val + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

/** Low-latency EMA filter for 33 MediaPipe landmarks. */
export class LandmarkSmoother {
  private alpha: number;
  private prevLms: Landmark[] | null = null;

  constructor(alpha = 0.4) {
    this.alpha = alpha;
  }

  filter(lms: Landmark[]): Landmark[] {
    if (!this.prevLms || this.prevLms.length !== lms.length) {
      this.prevLms = lms;
      return lms;
    }

    const smoothed = lms.map((lm, i) => {
      const prev = this.prevLms![i];
      if (!prev) return lm;
      const res: Landmark = {
        x: this.alpha * lm.x + (1 - this.alpha) * prev.x,
        y: this.alpha * lm.y + (1 - this.alpha) * prev.y,
        z: this.alpha * lm.z + (1 - this.alpha) * prev.z,
      };
      if (lm.visibility !== undefined) {
        res.visibility = lm.visibility;
      }
      return res;
    });

    this.prevLms = smoothed;
    return smoothed;
  }

  reset() {
    this.prevLms = null;
  }
}

/** Normalize landmark coordinates relative to mid-hip origin and body scale. */
export function normalizeBodyCoordinates(lms: Landmark[]): Landmark[] {
  const lHip = at(lms, LM.LEFT_HIP);
  const rHip = at(lms, LM.RIGHT_HIP);
  const lShoulder = at(lms, LM.LEFT_SHOULDER);
  const rShoulder = at(lms, LM.RIGHT_SHOULDER);

  const hipCenter = mid(lHip, rHip);
  const shoulderCenter = mid(lShoulder, rShoulder);

  // Body scale: torso length or shoulder width
  const torsoLength = Math.hypot(
    shoulderCenter.x - hipCenter.x,
    shoulderCenter.y - hipCenter.y,
    shoulderCenter.z - hipCenter.z
  );
  const scale = torsoLength > 0.05 ? torsoLength : 1.0;

  return lms.map((lm) => {
    const res: Landmark = {
      x: (lm.x - hipCenter.x) / scale,
      y: (lm.y - hipCenter.y) / scale,
      z: (lm.z - hipCenter.z) / scale,
    };
    if (lm.visibility !== undefined) {
      res.visibility = lm.visibility;
    }
    return res;
  });
}

