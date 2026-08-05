import {
  buildConsultantDiscovery,
  DISCOVERY_READINESS,
  getSupportedDiscoveryScenarios
} from "c/consultantDiscoveryService";

const COMPLETE_DISCOVERY = {
  businessProblem: "Sales reps do not consistently contact new leads on time.",
  desiredOutcome: "Increase timely lead follow-up.",
  affectedUsers: ["Sales users"],
  stakeholders: ["Sales operations", "Sales managers"],
  currentProcess: "Reps review assigned leads manually each morning.",
  successMetrics: ["Percentage of leads contacted within one business day"]
};

describe("consultantDiscoveryService", () => {
  it("asks lead follow-up discovery questions", () => {
    const result = buildConsultantDiscovery({
      businessProblem:
        "Automatically remind sales reps when leads have not been contacted.",
      affectedUsers: ["Sales users"]
    });

    expect(result.scenarioId).toBe("salesLeadFollowUp");
    expect(result.discoveryQuestions).toEqual(
      expect.arrayContaining([
        "Who owns the lead?",
        "What qualifies as contact?",
        "What is the required response time?",
        "Should managers be notified?",
        "Are all lead sources treated the same?",
        "How will success be measured?"
      ])
    );
    expect(result.readinessAssessment.status).toBe(
      DISCOVERY_READINESS.DISCOVERY_NEEDED
    );
  });

  it("explains incomplete, nearly ready, and ready assessments", () => {
    const incomplete = buildConsultantDiscovery({
      businessProblem: "Improve approval turnaround.",
      affectedUsers: ["Operations users"]
    });
    const nearlyReady = buildConsultantDiscovery({
      ...COMPLETE_DISCOVERY,
      stakeholders: []
    });
    const ready = buildConsultantDiscovery(COMPLETE_DISCOVERY);

    expect(incomplete.readinessAssessment.status).toBe("Discovery Needed");
    expect(incomplete.readinessAssessment.missingCritical).toContain(
      "desired outcome"
    );
    expect(nearlyReady.readinessAssessment.status).toBe("Nearly Ready");
    expect(nearlyReady.readinessAssessment.readyToDesign).toBe(false);
    expect(ready.readinessAssessment.status).toBe("Ready to Design");
    expect(ready.readinessAssessment.readyToDesign).toBe(true);
    expect(ready.readinessAssessment.score).toBe(100);
  });

  it.each([
    ["approvalBusinessProcess", "Route discount requests for approval."],
    ["dataQuality", "Prevent missing required information."],
    ["userAccess", "Give temporary access to support managers."],
    ["reportingVisibility", "Improve pipeline report visibility."],
    ["general", "Reduce manual handoffs between teams."]
  ])("selects the %s scenario deterministically", (scenarioId, problem) => {
    expect(
      buildConsultantDiscovery({ businessProblem: problem }).scenarioId
    ).toBe(scenarioId);
  });

  it("publishes the supported CRM-neutral scenario catalog", () => {
    expect(getSupportedDiscoveryScenarios()).toEqual([
      "salesLeadFollowUp",
      "approvalBusinessProcess",
      "dataQuality",
      "userAccess",
      "reportingVisibility",
      "general"
    ]);
  });
});
