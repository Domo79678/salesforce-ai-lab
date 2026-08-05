import orgKnowledgeService, {
  analyzeOrgKnowledge,
  KNOWLEDGE_ANALYSIS_MODES,
  ORG_KNOWLEDGE_SERVICE_VERSION
} from "c/orgKnowledgeService";

describe("c-org-knowledge-service", () => {
  it("analyzes an empty metadata snapshot without failing", () => {
    const result = analyzeOrgKnowledge();

    expect(result.success).toBe(true);
    expect(result.analysisMode).toBe(KNOWLEDGE_ANALYSIS_MODES.FULL);
    expect(result.serviceVersion).toBe(ORG_KNOWLEDGE_SERVICE_VERSION);
    expect(result.errors).toEqual([]);
    expect(result.objects).toEqual([]);
  });

  it("exposes the analysis contract through the default service export", () => {
    expect(orgKnowledgeService.analyzeOrgKnowledge).toBe(analyzeOrgKnowledge);
  });
});
