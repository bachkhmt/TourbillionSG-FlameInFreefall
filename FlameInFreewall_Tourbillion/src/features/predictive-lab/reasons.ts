/** Plain-language text for backend readiness codes and notebook blocking reasons. */
const REASONS: Record<string, string> = {
  // GET /prediction/readiness (flameguard-ai-backend/app/services/predictions.py)
  model_selection_required: 'No model has been selected for public predictions.',
  validated_provider_unavailable: 'No validated prediction provider is configured.',
  model_unavailable: 'The requested model is not registered.',
  model_unvalidated: 'The model has not passed validation.',
  model_validation_expired: 'The model validation has expired.',
  model_metadata_unavailable: 'Model domain, evaluation or uncertainty metadata is missing.',
  scientific_collection_unreviewed: 'The scientific data collection has not been reviewed.',
  dataset_version_unavailable: 'The training dataset version cannot be verified.',
  provider_model_binding_unavailable: 'The model is not bound to a prediction provider.',
  training_evaluation_binding_unavailable: 'The model is not bound to its training and evaluation records.',
  observable_unsupported: 'This quantity is not supported by the model.',
  domain_units_unsupported: 'The input units are outside the model domain.',
  // Notebook evaluation.json
  validation_plan_missing: 'No validation plan yet.',
  exploratory_results_only: 'Exploratory results only.',
  at_least_three_groups_required: 'Not enough independent groups to evaluate (at least three are required).',
};

export function reasonText(code: string): string {
  // Notebook notes point at audit files that are not published with the site.
  if (/^see .*audit\.json$/i.test(code)) {
    return 'More independent measurements are needed (details in the notebook audit, not published).';
  }
  return REASONS[code] ?? code;
}
