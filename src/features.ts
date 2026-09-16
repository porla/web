import { parse, Range } from "semver";

const RANGE_OPTIONS = { includePrerelease: true } as const;

const FEATURES = {
  base: new Range(">=0.43.0", RANGE_OPTIONS),
} satisfies Record<string, Range>;

type FeatureName = keyof typeof FEATURES;
type FeatureSet = Readonly<Record<FeatureName, boolean>>;

const FEATURE_NAMES = Object.keys(FEATURES) as FeatureName[];

let enabled: FeatureSet | null = null;
let initializedFor: string | null | undefined;

export const NO_FEATURES: FeatureSet = Object.freeze(
  Object.fromEntries(FEATURE_NAMES.map((name) => [name, false])),
) as FeatureSet;

export function feature(name: FeatureName): boolean {
  if (!enabled) {
    console.warn(`feature("${name}") called before initializeFeatures().`);
    return false;
  }
  return enabled[name];
}

export function featureRange(name: FeatureName): string {
  return FEATURES[name].range;
}

export function initializeFeatures(version: string | null | undefined) {
  if (enabled && version === initializedFor) return enabled;
  initializedFor = version;

  const parsed = version ? parse(version) : null;

  if (!parsed) {
    console.warn(
      `Unusable backend version ${JSON.stringify(version)}; all features off.`,
    );
    enabled = NO_FEATURES;
    return enabled;
  }

  enabled = Object.freeze(
    Object.fromEntries(
      FEATURE_NAMES.map((name) => [name, FEATURES[name].test(parsed)]),
    ),
  ) as FeatureSet;

  return enabled;
}
