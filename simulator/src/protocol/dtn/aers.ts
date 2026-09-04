export interface AERSFeatures {
  gateway: number;
  contact: number;
  link: number;
  battery: number;
  progress: number;
  delivery: number;
  latency: number;
  hopPenalty: number;
  congestion: number;
}

export interface AERSWeights {
  gateway: number;
  contact: number;
  link: number;
  battery: number;
  progress: number;
  delivery: number;
  latency: number;
  hopPenalty: number;
  congestion: number;
}

export interface AERSResult {
  score: number;
  features: AERSFeatures;
  weightedContributions: AERSFeatures;
}

export interface CandidateScore {
  nodeId: string;
  score: number;
  features: AERSFeatures;
}

export const DEFAULT_WEIGHTS: AERSWeights = {
  gateway: 0.25,
  contact: 0.15,
  link: 0.15,
  battery: 0.10,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hopPenalty: 0.025,
  congestion: 0.025
};

export const CRITICAL_WEIGHTS: AERSWeights = {
  gateway: 0.30,
  contact: 0.15,
  link: 0.15,
  battery: 0.05,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hopPenalty: 0.025,
  congestion: 0.025
};

export const HIGH_WEIGHTS: AERSWeights = {
  gateway: 0.27,
  contact: 0.15,
  link: 0.15,
  battery: 0.08,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hopPenalty: 0.025,
  congestion: 0.025
};

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateAERS(features: AERSFeatures, weights: AERSWeights): AERSResult {
  const contributions = {
    gateway: features.gateway * weights.gateway,
    contact: features.contact * weights.contact,
    link: features.link * weights.link,
    battery: features.battery * weights.battery,
    progress: features.progress * weights.progress,
    delivery: features.delivery * weights.delivery,
    latency: features.latency * weights.latency,
    hopPenalty: features.hopPenalty * weights.hopPenalty,
    congestion: features.congestion * weights.congestion,
  };

  const rawScore =
    contributions.gateway +
    contributions.contact +
    contributions.link +
    contributions.battery +
    contributions.progress +
    contributions.delivery +
    contributions.latency -
    contributions.hopPenalty -
    contributions.congestion;

  return {
    score: clamp(rawScore),
    features,
    weightedContributions: contributions,
  };
}

export function selectRelay(
  candidates: CandidateScore[],
  currentScore: number,
  threshold: number,
  hysteresis: number
): CandidateScore | null {
  const eligible = candidates
    .filter(candidate => candidate.score >= threshold)
    .filter(candidate => candidate.score > currentScore + hysteresis)
    .sort((a, b) => b.score - a.score);

  return eligible[0] ?? null;
}
