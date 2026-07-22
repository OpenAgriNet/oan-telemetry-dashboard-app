export const METRICS = [
  ["process_fidelity.agristack_workflow", "Agristack Workflow"],
  ["process_fidelity.term_identification", "Term Identification"],
  ["process_fidelity.tool_sequencing", "Tool Sequencing"],
  ["process_fidelity.search_quality", "Search Quality"],
  ["process_fidelity.output_hygiene", "Output Hygiene"],
  ["factual_grounding.source_alignment", "Source Alignment"],
  ["factual_grounding.no_fabrication", "No Fabrication"],
  ["factual_grounding.citation_accuracy", "Citation Accuracy"],
  ["factual_grounding.safety_compliance", "Safety Compliance"],
  ["response_usefulness.completeness", "Completeness"],
  ["response_usefulness.actionability", "Actionability"],
  ["response_usefulness.context_fit", "Context Fit"],
  ["response_usefulness.clarity", "Clarity"],
  ["response_usefulness.conversation_closure", "Conversation Closure"],
  ["marathi_quality.grammar", "Grammar"],
  ["marathi_quality.terminology", "Terminology"],
  ["marathi_quality.language_purity", "Language Purity"],
  ["marathi_quality.fluency", "Fluency"],
] as const;

export const DIMENSION_LABELS: Record<string, string> = {
  process_fidelity: "Process Fidelity",
  factual_grounding: "Factual Grounding",
  response_usefulness: "Response Usefulness",
  marathi_quality: "Marathi Quality",
};

export const metricLabel = (key: string) => METRICS.find(([metric]) => metric === key)?.[1] || key;
