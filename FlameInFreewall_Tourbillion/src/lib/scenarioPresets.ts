import type { ScenarioPreset } from "../types";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "iss-baseline",
    name: "ISS US Lab (Destiny Module)",
    subtitle: "Earth-Normal Cabin Atmosphere in Microgravity (0.00g)",
    environment: "iss",
    gravity: 0.0,
    oxygenPct: 21.0,
    pressurePsi: 14.7,
    material: "PMMA",
    airflowVelocity: 5.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
  {
    id: "artemis-lunar-base",
    name: "Artemis Moon Base / Rover",
    subtitle: "High-O₂ Reduced-Pressure Exploration Atmosphere (0.16g)",
    environment: "lunar",
    gravity: 0.16,
    oxygenPct: 30.0,
    pressurePsi: 10.2,
    material: "PMMA",
    airflowVelocity: 8.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
  {
    id: "mars-surface-habitat",
    name: "Mars Surface Habitat",
    subtitle: "Martian Reduced Gravity & Exploration Atmosphere (0.38g)",
    environment: "mars",
    gravity: 0.38,
    oxygenPct: 28.0,
    pressurePsi: 8.2,
    material: "Nomex",
    airflowVelocity: 10.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
  {
    id: "eva-spacesuit",
    name: "Exploration EVA Spacesuit",
    subtitle: "Low-Pressure High-O₂ Pressure Garment (0.00g)",
    environment: "iss",
    gravity: 0.0,
    oxygenPct: 34.0,
    pressurePsi: 7.2,
    material: "Nomex",
    airflowVelocity: 12.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
  {
    id: "earth-calibration",
    name: "Terrestrial 1g Calibration Facility",
    subtitle: "Terrestrial NASA-STD-6001 Flammability Test Baseline (1.00g)",
    environment: "earth",
    gravity: 1.0,
    oxygenPct: 21.0,
    pressurePsi: 14.7,
    material: "PMMA",
    airflowVelocity: 0.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
  {
    id: "custom-sandbox",
    name: "Custom Deep Space Habitat",
    subtitle: "User-Configured Atmospheric & Gravitational Parameter Envelope",
    environment: "custom",
    gravity: 0.0,
    oxygenPct: 25.0,
    pressurePsi: 12.0,
    material: "Cotton",
    airflowVelocity: 6.0,
    badge: "Illustrative",
    primaryRisk:
      "Illustrative scenario input; empirical coverage must be checked against admitted source records.",
    description:
      "User-editable reference scenario, not an observed NASA test or validated habitat design.",
  },
];

export const PRESETS_RECORD: Record<string, ScenarioPreset> =
  SCENARIO_PRESETS.reduce(
    (acc, preset) => {
      acc[preset.id] = preset;
      return acc;
    },
    {} as Record<string, ScenarioPreset>,
  );
