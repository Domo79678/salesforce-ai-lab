import {
  buildResolutionGuidance,
  getSupportedResolutionScenarios
} from "c/resolutionGuidanceService";

describe("resolutionGuidanceService", () => {
  it.each([
    ["fieldSprawl", { launchContext: { title: "High field count" } }],
    ["flowAutomation", { entityType: "flow" }],
    [
      "metadataCoverage",
      {
        metadataCoverage: {
          status: "partial",
          unavailableCategories: ["Flows"]
        }
      }
    ],
    ["permissionAccess", { entityType: "permissionSet" }],
    ["deploymentReadiness", { blocking: true }]
  ])("builds deterministic %s guidance", (scenarioId, context) => {
    const result = buildResolutionGuidance(context);

    expect(result.scenarioId).toBe(scenarioId);
    expect(result.recommendedApproach).not.toHaveLength(0);
    expect(result.reviewFirst).not.toHaveLength(0);
    expect(result.doNotDo).not.toHaveLength(0);
    expect(result.dependenciesToCheck).not.toHaveLength(0);
    expect(result.testPlan).not.toHaveLength(0);
    expect(result.deploymentConsiderations).not.toHaveLength(0);
    expect(result.source).toBe("Deterministic resolution guidance rules");
  });

  it("preserves known dependency, test, and deployment context", () => {
    const result = buildResolutionGuidance({
      launchContext: { title: "High field count" },
      explanation: {
        dependencies: [{ label: "Account Summary Flow" }],
        testCases: [
          { title: "Update an account", expectedResult: "Save succeeds." }
        ],
        deployment: {
          recommendation: "Use a staged release.",
          prerequisites: ["Confirm the owner."],
          rollbackSteps: ["Restore the prior field state."]
        }
      }
    });

    expect(result.dependenciesToCheck).toContain("Account Summary Flow");
    expect(result.testPlan).toContain(
      "Update an account Expected: Save succeeds."
    );
    expect(result.deploymentConsiderations).toEqual(
      expect.arrayContaining([
        "Use a staged release.",
        "Confirm the owner.",
        "Restore the prior field state."
      ])
    );
  });

  it("prefers a specific finding rule when general coverage is partial", () => {
    const result = buildResolutionGuidance({
      findingType: "fieldSprawl",
      metadataCoverage: { status: "partial" }
    });

    expect(result.scenarioId).toBe("fieldSprawl");
  });

  it("returns isolated arrays and an explicit supported scenario catalog", () => {
    const first = buildResolutionGuidance({ entityType: "flow" });
    first.testPlan.push("Mutation");

    expect(
      buildResolutionGuidance({ entityType: "flow" }).testPlan
    ).not.toContain("Mutation");
    expect(getSupportedResolutionScenarios()).toEqual([
      "metadataCoverage",
      "fieldSprawl",
      "flowAutomation",
      "permissionAccess",
      "deploymentReadiness"
    ]);
  });
});
