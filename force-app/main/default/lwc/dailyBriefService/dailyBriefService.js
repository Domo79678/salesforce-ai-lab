import { DEFAULT_SNAPSHOT_OPTIONS, getMetadataSnapshot } from "c/copilotCore";
import orgKnowledgeService from "c/orgKnowledgeService";

export async function loadDailyBriefOperations() {
  const metadataSnapshot = await getMetadataSnapshot({
    ...DEFAULT_SNAPSHOT_OPTIONS,
    objectApiNames: [...DEFAULT_SNAPSHOT_OPTIONS.objectApiNames]
  });

  if (!metadataSnapshot?.success) {
    throw new Error(
      metadataSnapshot?.errors?.[0]?.message ||
        "Shared Salesforce metadata is unavailable."
    );
  }

  const analysisResult = orgKnowledgeService.analyzeOrg(metadataSnapshot, {
    analysisMode: "dailyBrief"
  });

  if (!analysisResult?.success) {
    throw new Error(
      analysisResult?.errors?.[0]?.message ||
        "The shared Knowledge Center analysis could not build the Daily Brief."
    );
  }

  return { metadataSnapshot, analysisResult };
}
