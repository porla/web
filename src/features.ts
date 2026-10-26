import { parse, Range, SemVer } from "semver";

const RANGE_OPTIONS = { includePrerelease: true } as const;

const FEATURES = {
  base: new Range(">=0.43.0", RANGE_OPTIONS),
  api_keys: new Range(">=0.49.0", RANGE_OPTIONS),
} satisfies Record<string, Range>;

type FeatureName = keyof typeof FEATURES;
type FeatureSet = Readonly<Record<FeatureName, boolean>>;

const FEATURE_NAMES = Object.keys(FEATURES) as FeatureName[];

// porla reports 0.0.0 when it's built without GitVersion (e.g. the debug
// CMake preset); treat that as a development build with every feature on.
const DEV_BUILD_VERSION = "0.0.0";

let currentVersion: SemVer | null = null;
let enabled: FeatureSet | null = null;
let initializedFor: string | null | undefined;
let versionError: Error | null = null;

export const NO_FEATURES: FeatureSet = Object.freeze(
  Object.fromEntries(FEATURE_NAMES.map((name) => [name, false])),
) as FeatureSet;

export const getCurrentVersion = () => currentVersion;

export const getVersionError = () => versionError;

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

export function initializeFeatures(
  version: string | null | undefined,
  error: Error | null = null,
) {
  if (enabled && version === initializedFor && error === versionError) {
    return enabled;
  }

  initializedFor = version;
  versionError = error;

  const parsed = version ? parse(version) : null;

  if (!parsed) {
    console.warn(
      `Unusable backend version ${JSON.stringify(version)}; all features off.`,
    );
    enabled = NO_FEATURES;
    return enabled;
  }

  currentVersion = parsed;

  enabled = Object.freeze(
    Object.fromEntries(
      FEATURE_NAMES.map((name) => [
        name,
        parsed.version === DEV_BUILD_VERSION || FEATURES[name].test(parsed),
      ]),
    ),
  ) as FeatureSet;

  return enabled;
}
