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
