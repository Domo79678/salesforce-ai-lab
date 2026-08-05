import salesforceMetadataCollector, {
  calculateCompletionPercentage,
  calculateStagePercentage,
  countNestedItems
} from "c/salesforceMetadataCollector";

describe("c-salesforce-metadata-collector", () => {
  it("calculates bounded deterministic collection progress", () => {
    expect(calculateCompletionPercentage(4, 3)).toBe(75);
    expect(calculateCompletionPercentage(0, 3)).toBe(0);
    expect(calculateCompletionPercentage(2, 4)).toBe(100);
    expect(calculateStagePercentage(50, 20, 60)).toBe(40);
  });

  it("counts only array-backed nested metadata", () => {
    expect(
      countNestedItems(
        [
          { fields: [{ apiName: "Name" }, { apiName: "Industry" }] },
          { fields: [{ apiName: "Subject" }] },
          { fields: null }
        ],
        "fields"
      )
    ).toBe(3);
    expect(countNestedItems([], "")).toBe(0);
  });

  it("exposes the collection contract through the default export", () => {
    expect(salesforceMetadataCollector.calculateCompletionPercentage).toBe(
      calculateCompletionPercentage
    );
  });
});
