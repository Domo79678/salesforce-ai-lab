import { loadDailyBriefOperations } from "c/dailyBriefService";

describe("daily brief service", () => {
  it("returns the shared snapshot and deterministic Daily Brief contract", async () => {
    const result = await loadDailyBriefOperations();

    expect(result.metadataSnapshot.success).toBe(true);
    expect(result.analysisResult.success).toBe(true);
    expect(result.analysisResult.analysisMode).toBe("dailyBrief");
    expect(result.analysisResult.dailyBrief).toBeTruthy();
  });
});
