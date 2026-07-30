# UX Simplification Sprint

## Goal

Make the Salesforce Administration Workspace easier to scan and use for
administrators, consultants, CRM professionals, and learners without adding
product capabilities.

## Before

The homepage presented a large hero, three KPI cards, an expanded task center,
eight Quick Action cards, the complete module catalog, progress bars, status
labels, planned modules, and metadata diagnostics at the same visual level.
Technical implementation status competed with the administrator’s next task.

## After

The homepage follows an admin-first sequence:

1. A compact product hero presents active modules, metadata status, and
   deterministic analysis status.
2. The reusable Admin Task Center presents Today’s Admin Brief: one top
   priority, up to three recommended actions, Org Health, and available
   deployment or risk guidance.
3. Five Primary Actions prioritize common workflows:
   - Ask Before You Build
   - Explain Metadata
   - Analyze Flow
   - Explore Org
   - Review Org Health
4. A compact Workspace preview presents available secondary workspaces without
   progress bars. Planned workspaces remain collapsed under Coming Soon.
5. View All Tools opens the registry-driven complete catalog.
6. Developer Tools opens technical metadata, coverage, cache, service, registry,
   and routing diagnostics.

## Full Catalog Decision

The complete module catalog moved to the All Tools workspace. Keeping it on the
homepage would repeat the Primary Actions and restore the original visual
competition. The homepage retains a short available-workspace preview and a
visible View All Tools action, so discoverability is preserved.

## Architecture

- `salesforceCopilotDashboard` owns presentation and top-level navigation only.
- `adminTaskCenter` continues to use the shared metadata snapshot and
  `orgKnowledgeService`.
- `allToolsWorkspace` reads available and planned modules from
  `copilotModuleRegistry`.
- `developerToolsWorkspace` reads existing cache, snapshot, service, and
  registry diagnostics and embeds the existing `orgContextViewer`.
- `copilotWorkspaceRouter` remains the only component loader and preserves Back
  navigation.
- Recommendation routing continues through
  `recommendationWorkspaceService`.

No new metadata retrieval, analysis engine, recommendation engine, or routing
implementation was introduced.

## Accessibility and Responsive Behavior

- Page sections use ordered headings and named regions.
- Buttons use explicit task labels.
- Cards expose visible keyboard focus.
- Desktop grids collapse to two columns and then one column.
- Technical details are removed from the main administrator reading path.

## Verification

Behavioral Jest coverage verifies the five Primary Actions, Ask Before You Build
navigation, Back navigation, All Tools navigation, Developer Tools navigation,
collapsed planned tools, Admin Brief content, recommendation routing, and
diagnostic relocation.
