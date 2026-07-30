# Salesforce Administration Workspace Roadmap

The application is a deterministic Salesforce Administration Workspace. AI is
not implemented in the current product; any future AI capability is optional
and must remain grounded in shared, explainable analysis.

## Completed Foundations

- Salesforce DX project and application shell
- Shared Workspace Router and module registry
- Live Org Context and metadata snapshot services
- Deterministic Org Knowledge analysis
- Dashboard, Daily Brief, Org Health, Org Explorer, Explain This, Flow
  Intelligence, Automation Advisor, and Troubleshooting workspaces

## Sprint 5 — Connected Administration Workspace

- [x] Registry-backed recommendation-to-workspace resolution
- [x] Recommendation navigation through the existing Workspace Router
- [x] Admin Task Center with high-priority, recommended-action, quick-launch,
      and source-aware recent-activity sections
- [x] Deterministic Ask Before You Build guided workspace
- [x] Shared pre-build guidance and workspace-routing services
- [x] Focused Jest coverage for guidance, routing, task presentation, and
      navigation

## Next Validation

- Validate recommendation category-to-workspace mappings against representative
  org snapshots.
- Add a verified Salesforce change-history source before populating Recent
  Activity.
- Replace remaining placeholder tests in established workspaces.
- Validate Flow metadata coverage before making change-impact or deployment
  safety claims.
- Test installation and permissions in a clean second Salesforce org.

## Sprint 6 — Product Experience

- [x] Simplified Home information hierarchy
- [x] Featured Ask Before You Build
- [x] Morning-oriented Daily Brief
- [x] Knowledge Center user-facing rename
- [x] Complete catalog retained in All Tools
- [x] Technical diagnostics retained in Developer Tools
- [x] Responsive layouts and behavioral UX tests

## Sprint 7 — Daily Brief Operations Center

- [x] Lightweight Today’s Brief Summary on Home
- [x] Admin Task Center moved into Daily Brief
- [x] Shared Daily Brief orchestration service
- [x] Executive summary, documentation, readiness, findings, and checklist
- [x] Suggested workspace using shared recommendation routing
- [x] Mission Control and Operations Center behavioral tests
- [x] Mission Control organization-state header and compact navigation
- [x] Org Health promoted directly below Today’s Brief Summary
- [x] Verified History relocated from Home to Developer Tools

## Future Optional AI

- Define a provider-neutral, governed AI gateway only after deterministic
  contracts are stable.
- Keep every core workflow usable without AI.
- Require metadata grounding, clear provenance, safe fallbacks, and explicit
  administrator review for generated assistance.
