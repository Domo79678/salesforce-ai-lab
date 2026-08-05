import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace,
  getRecommendationQuickLaunches,
  resolveRecommendationWorkspace
} from "c/recommendationWorkspaceService";

describe("recommendation workspace service", () => {
  it("routes recommendations using registered categories", () => {
    expect(
      resolveRecommendationWorkspace({
        category: "Automation",
        entityType: "Flow"
      })
    ).toBe("flowIntelligence");

    expect(
      resolveRecommendationWorkspace({
        category: "Security"
      })
    ).toBe("orgHealthDashboard");
  });

  it("honors an available explicit destination", () => {
    const recommendation = enrichRecommendationWithWorkspace({
      title: "Inspect the object",
      moduleName: "orgExplorer"
    });

    expect(recommendation.moduleName).toBe("orgExplorer");
    expect(recommendation.workspaceLabel).toBe("Org Explorer");
  });

  it("routes solution-design recommendations to Ask Before You Build", () => {
    const recommendation = enrichRecommendationWithWorkspace({
      title: "Frame the change before implementation",
      category: "Solution Design"
    });

    expect(recommendation.moduleName).toBe("askBeforeYouBuild");
    expect(recommendation.workspaceLabel).toBe("Ask Before You Build");
  });

  it("derives quick launches from the module registry", () => {
    const launches = getRecommendationQuickLaunches();

    expect(launches.map((item) => item.moduleName)).toEqual(
      expect.arrayContaining([
        "dailyBrief",
        "explainThis",
        "flowIntelligence",
        "orgHealthDashboard",
        "orgExplorer",
        "askBeforeYouBuild"
      ])
    );
  });

  it("preserves structured recommendation context in navigation", () => {
    const context = createRecommendationContext(
      {
        id: "rec-1",
        title: "Resolve missing help text",
        action: "Add concise help text.",
        findingType: "missingDocumentation",
        category: "Documentation",
        severity: "High",
        blocking: true,
        entityType: "field",
        entityApiName: "Account",
        fieldApiName: "Active__c"
      },
      {
        sourceWorkspace: "dailyBrief",
        sourceType: "recommendation"
      }
    );
    const event = createWorkspaceNavigationEvent("explainThis", context);

    expect(event.detail).toEqual({
      moduleName: "explainThis",
      context: expect.objectContaining({
        sourceWorkspace: "dailyBrief",
        recommendationId: "rec-1",
        entityType: "field",
        entityApiName: "Account",
        fieldApiName: "Active__c",
        findingType: "missingDocumentation",
        category: "Documentation",
        severity: "High",
        blocking: true
      })
    });
  });

  it("preserves Flow identity for Mission Control explanation handoff", () => {
    const context = createRecommendationContext(
      {
        id: "flow-description-AddAttnd",
        title:
          "Resolve Add or Modify Service Appointment Attendees is missing a description",
        entityType: "flow",
        entityApiName: "AddAttnd"
      },
      { sourceWorkspace: "dashboard", sourceType: "finding" }
    );

    expect(context).toEqual(
      expect.objectContaining({
        sourceWorkspace: "dashboard",
        sourceType: "finding",
        entityType: "flow",
        entityApiName: "AddAttnd"
      })
    );
  });
});
