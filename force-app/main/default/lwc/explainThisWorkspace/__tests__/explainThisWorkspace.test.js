import { createElement } from "@lwc/engine-dom";
import ExplainThisWorkspace from "c/explainThisWorkspace";
import { getMetadataSnapshot } from "c/copilotCore";
import { analyzeDependencies, explainEntity } from "c/copilotIntelligence";

jest.mock(
  "c/copilotCore",
  () => ({
    getMetadataSnapshot: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "c/copilotIntelligence",
  () => ({
    analyzeDependencies: jest.fn(),
    explainEntity: jest.fn()
  }),
  { virtual: true }
);

const SNAPSHOT = {
  success: true,
  sourceLabel: "Shared metadata",
  flows: [
    {
      apiName: "AddAttnd",
      label: "Add or Modify Service Appointment Attendees"
    }
  ],
  objects: [
    {
      apiName: "User",
      fields: []
    },
    {
      apiName: "Account",
      fields: [{ apiName: "Active__c" }]
    }
  ]
};

const OBJECT_CONTEXT = {
  sourceWorkspace: "dashboard",
  sourceType: "priority",
  title: "Resolve User field count",
  reason: "Review unused fields.",
  entityType: "object",
  entityApiName: "User",
  evidence: [],
  metadataSnapshot: SNAPSHOT
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("c-explain-this-workspace contextual launch", () => {
  beforeEach(() => {
    analyzeDependencies.mockResolvedValue({
      dependencyCount: 0,
      scores: { confidence: 80, risk: "Low" }
    });
    explainEntity.mockResolvedValue({
      success: true,
      entity: { type: "object", apiName: "User" }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("keeps a direct launch blank", () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    document.body.appendChild(element);

    expect(element.shadowRoot.querySelector("lightning-input").value).toBe("");
    expect(element.shadowRoot.querySelector(".context-banner")).toBeNull();
    expect(explainEntity).not.toHaveBeenCalled();
  });

  it("prefills and automatically explains valid shared object context", async () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = OBJECT_CONTEXT;
    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Resolve User field count"
    );
    expect(element.shadowRoot.querySelector("lightning-input").value).toBe(
      "User"
    );
    expect(explainEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "object",
        entityApiName: "User"
      }),
      { metadataSnapshot: SNAPSHOT }
    );
    expect(getMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("shows deterministic recommended action guidance for a finding", async () => {
    explainEntity.mockResolvedValue({
      success: true,
      entity: { type: "object", apiName: "User" },
      dependencies: [{ label: "User Access Report" }],
      testCases: [{ title: "Validate user updates" }],
      deployment: { prerequisites: ["Confirm business ownership."] }
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = {
      ...OBJECT_CONTEXT,
      findingType: "fieldSprawl",
      severity: "High"
    };
    document.body.appendChild(element);
    await flushPromises();

    const action = element.shadowRoot.querySelector(".recommended-action");
    expect(action).not.toBeNull();
    expect(action.textContent).toContain("Recommended Action");
    expect(action.textContent).toContain("Recommended Approach");
    expect(action.textContent).toContain("What to Review First");
    expect(action.textContent).toContain("Avoid This");
    expect(action.textContent).toContain(
      "Do not delete fields simply because the field count is high."
    );
    const supportingAnalysis = element.shadowRoot.querySelector(".more-detail");
    expect(supportingAnalysis.textContent).toContain("Dependencies to Check");
    expect(supportingAnalysis.textContent).toContain("Resolution Test Plan");
    expect(supportingAnalysis.textContent).toContain(
      "Deployment Considerations"
    );
    expect(supportingAnalysis.textContent).toContain("User Access Report");
  });

  it("launches action tracking with available explanation context", async () => {
    explainEntity.mockResolvedValue({
      success: true,
      entity: { type: "object", apiName: "User" },
      executiveSummary: "Review field usage."
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = { ...OBJECT_CONTEXT, severity: "High" };
    const handler = jest.fn();
    element.addEventListener("workspacenavigate", handler);
    document.body.appendChild(element);
    await flushPromises();

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Track This Action")
      .click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          destination: "adminActionCenter",
          context: expect.objectContaining({
            createAction: true,
            actionContext: expect.objectContaining({
              title: "Resolve User field count",
              severity: "High",
              objectApiName: "User"
            })
          })
        })
      })
    );
  });

  it("presents summary-first results with supporting analysis collapsed", async () => {
    explainEntity.mockResolvedValue({
      success: true,
      source: "Shared metadata",
      entity: { type: "object", apiName: "User" },
      businessPurpose: "Controls access to Salesforce.",
      technicalExplanation: "Represents an authenticated Salesforce user.",
      dependencies: [{ type: "Report", label: "User Access Report" }],
      risks: [{ severity: "High", title: "Access review required" }],
      improvements: [{ priority: "Review", title: "Document ownership" }],
      testCases: [{ type: "Access", title: "Validate assigned access" }],
      deployment: {
        readinessStatus: "Review",
        riskLevel: "High",
        recommendation: "Validate in a sandbox."
      },
      interviewExplanation: "Explain access governance."
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = OBJECT_CONTEXT;
    document.body.appendChild(element);
    await flushPromises();

    const snapshot = element.shadowRoot.querySelector(".summary-bar");
    expect(snapshot.textContent).toContain("Shared metadata");
    expect(snapshot.textContent).toContain("80%");
    expect(snapshot.textContent).toContain("1");
    expect(snapshot.textContent).toContain("Low");

    const core = element.shadowRoot.querySelector(".core-explanation");
    expect(core.textContent).toContain("Controls access to Salesforce.");
    expect(core.textContent).toContain(
      "Represents an authenticated Salesforce user."
    );

    const details = [
      ...element.shadowRoot.querySelectorAll(".more-detail details")
    ];
    expect(details).toHaveLength(6);
    expect(details.every((detail) => detail.open === false)).toBe(true);
    expect(
      element.shadowRoot.querySelector(".more-detail").textContent
    ).toContain("User Access Report");
    expect(
      element.shadowRoot.querySelector(".more-detail").textContent
    ).toContain("Access review required");
    expect(
      element.shadowRoot.querySelector(".more-detail").textContent
    ).toContain("Validate assigned access");
    expect(
      element.shadowRoot.querySelector(".more-detail").textContent
    ).toContain("Validate in a sandbox.");

    expect(
      [...element.shadowRoot.querySelectorAll("h2")].filter(
        (heading) => heading.textContent.trim() === "Recommended Action"
      )
    ).toHaveLength(1);
  });

  it("keeps optional supporting content safe when metadata is missing", async () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = OBJECT_CONTEXT;
    document.body.appendChild(element);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector(".core-explanation").textContent
    ).toContain("A formal business purpose was not found");
    expect(element.shadowRoot.querySelector(".more-detail")).not.toBeNull();
  });

  it("prefills and automatically explains valid shared field context", async () => {
    explainEntity.mockResolvedValue({
      success: true,
      entity: { type: "field", apiName: "Account.Active__c" }
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = {
      ...OBJECT_CONTEXT,
      title: "Resolve missing help text",
      entityType: "field",
      entityApiName: "Account",
      fieldApiName: "Active__c",
      qualifiedApiName: "Account.Active__c"
    };
    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-input").value).toBe(
      "Account.Active__c"
    );
    expect(explainEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "field",
        entityApiName: "Account.Active__c"
      }),
      { metadataSnapshot: SNAPSHOT }
    );
    expect(getMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("preserves Mission Control flow context when Explain is clicked", async () => {
    explainEntity.mockResolvedValue({
      success: true,
      entity: { type: "flow", apiName: "AddAttnd" }
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = {
      sourceWorkspace: "dashboard",
      sourceType: "finding",
      title:
        "Resolve Add or Modify Service Appointment Attendees is missing a description",
      entityType: "flow",
      entityApiName: "AddAttnd",
      metadataSnapshot: SNAPSHOT
    };
    document.body.appendChild(element);

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Explain")
      .click();
    await flushPromises();

    expect(explainEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "flow",
        entityApiName: "AddAttnd"
      }),
      { metadataSnapshot: SNAPSHOT }
    );
    expect(element.shadowRoot.querySelector(".summary-bar")).not.toBeNull();
  });

  it("renders a deterministic message when metadata does not match", async () => {
    getMetadataSnapshot.mockResolvedValue(SNAPSHOT);
    explainEntity.mockResolvedValue({
      success: false,
      warnings: [
        {
          message:
            "Salesforce Object MissingMetadata is not available in the current metadata snapshot."
        }
      ]
    });
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector("lightning-input");
    input.value = "MissingMetadata";
    input.dispatchEvent(new CustomEvent("change"));
    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Explain")
      .click();
    await flushPromises();

    const error = element.shadowRoot.querySelector(".error-panel");
    expect(error).not.toBeNull();
    expect(error.textContent).toContain(
      "Salesforce Object MissingMetadata is not available"
    );
    expect(element.shadowRoot.querySelector(".summary-bar")).toBeNull();
  });

  it("does not invent or run incomplete contextual metadata", async () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = {
      ...OBJECT_CONTEXT,
      entityType: "field",
      entityApiName: "Account",
      fieldApiName: "",
      qualifiedApiName: ""
    };
    document.body.appendChild(element);
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-input").value).toBe(
      "Account"
    );
    expect(explainEntity).not.toHaveBeenCalled();
    expect(getMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("clears contextual state for a new explanation", async () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = OBJECT_CONTEXT;
    document.body.appendChild(element);
    await flushPromises();

    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Start New Explanation")
      .click();
    await flushPromises();

    expect(element.shadowRoot.querySelector(".context-banner")).toBeNull();
    expect(element.shadowRoot.querySelector("lightning-input").value).toBe("");
  });

  it("does not reuse context after a later direct launch", async () => {
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    element.launchContext = OBJECT_CONTEXT;
    document.body.appendChild(element);
    await flushPromises();

    element.launchContext = null;
    await flushPromises();

    expect(element.shadowRoot.querySelector(".context-banner")).toBeNull();
    expect(element.shadowRoot.querySelector("lightning-input").value).toBe("");
  });

  it("preserves existing direct search behavior", async () => {
    getMetadataSnapshot.mockResolvedValue(SNAPSHOT);
    const element = createElement("c-explain-this-workspace", {
      is: ExplainThisWorkspace
    });
    document.body.appendChild(element);

    const input = element.shadowRoot.querySelector("lightning-input");
    input.value = "User";
    input.dispatchEvent(new CustomEvent("change"));
    [...element.shadowRoot.querySelectorAll("lightning-button")]
      .find((button) => button.label === "Explain")
      .click();
    await flushPromises();

    expect(getMetadataSnapshot).toHaveBeenCalledWith({ forceRefresh: false });
    expect(explainEntity).toHaveBeenCalled();
  });
});
