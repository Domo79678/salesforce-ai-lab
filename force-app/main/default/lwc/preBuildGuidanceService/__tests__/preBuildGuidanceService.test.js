import {
  buildPreBuildGuidance,
  getSupportedChangeTypes
} from "c/preBuildGuidanceService";

describe("pre-build guidance service", () => {
  it("supports every Sprint 5 change type", () => {
    expect(getSupportedChangeTypes()).toEqual([
      "Object",
      "Field",
      "Flow",
      "Validation Rule",
      "Permission Set",
      "Report",
      "Dashboard"
    ]);
  });

  it("builds deterministic Flow guidance without metadata retrieval", () => {
    const first = buildPreBuildGuidance({
      changeType: "Flow",
      businessProblem: "Notify service managers when a case escalates.",
      affectedUsers: ["Service users", "Managers"]
    });
    const second = buildPreBuildGuidance({
      changeType: "Flow",
      businessProblem: "Notify service managers when a case escalates.",
      affectedUsers: ["Service users", "Managers"]
    });

    expect(first).toEqual(second);
    expect(first.recommendedFeature).toContain("Salesforce Flow");
    expect(first.relatedWorkspaces).toContain("automationAdvisor");
    expect(first.testingChecklist).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Service users, Managers")
      ])
    );
  });

  it("does not generate guidance without required inputs", () => {
    expect(
      buildPreBuildGuidance({
        changeType: "Field",
        businessProblem: ""
      })
    ).toBeNull();
  });
});
