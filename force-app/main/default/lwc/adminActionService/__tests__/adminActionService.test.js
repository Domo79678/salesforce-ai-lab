import {
  createAction,
  getActions,
  getActionSummary,
  updateAction
} from "c/adminActionService";

describe("admin action service", () => {
  beforeEach(() => localStorage.clear());

  it("creates a context-aware action with safe defaults and persists it", () => {
    const action = createAction(
      {
        title: "Review Account field",
        sourceWorkspace: "Explain This",
        sourceFinding: "Missing help text",
        selectedAction: "Add useful help text",
        objectApiName: "Account"
      },
      "2026-08-05T12:00:00.000Z"
    );
    expect(action).toMatchObject({
      status: "Needs Review",
      riskDisposition: "Not Evaluated",
      objectApiName: "Account"
    });
    expect(getActions()).toHaveLength(1);
  });

  it("uses a useful fallback when source context is missing", () => {
    expect(createAction({}, "2026-08-05T12:00:00.000Z")).toMatchObject({
      title: "Review admin finding",
      sourceWorkspace: "Administration Workspace"
    });
  });

  it("updates lifecycle status without inferring mitigated risk", () => {
    const action = createAction({}, "2026-08-05T12:00:00.000Z");
    const resolved = updateAction(
      action.id,
      { status: "Resolved", resolutionNotes: "Validated in sandbox." },
      "2026-08-06T12:00:00.000Z"
    );
    expect(resolved.status).toBe("Resolved");
    expect(resolved.riskDisposition).toBe("Not Evaluated");
    expect(resolved.completedAt).toBe("2026-08-06T12:00:00.000Z");
  });

  it("records Accepted Risk explicitly", () => {
    const action = createAction({ title: "Legacy automation" });
    const accepted = updateAction(action.id, {
      status: "Accepted Risk",
      riskDisposition: "Accepted",
      resolutionNotes: "Business owner approved continued use."
    });
    expect(accepted).toMatchObject({
      status: "Accepted Risk",
      riskDisposition: "Accepted"
    });
    expect(getActionSummary().open).toBe(0);
  });
});
