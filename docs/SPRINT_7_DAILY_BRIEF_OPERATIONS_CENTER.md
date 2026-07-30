# Sprint 7: Daily Brief Operations Center

## Product Architecture

- **Home is Mission Control.** It summarizes attention, next steps, and
  destinations without presenting an operational queue.
- **Daily Brief is the Operations Center.** It owns the detailed morning
  workflow and the reusable Admin Task Center.
- **Knowledge Center supports organization understanding.**
- **Ask Before You Build supports planning.**

No administrative capability was added.

## Home

Home now contains a compact organization-state header, Today’s Brief Summary,
Org Health Snapshot, featured Ask Before You Build, Primary Actions, compact
Explore More navigation, View All Tools, and a collapsed Developer Tools entry.

The header reports Org Health score, high-priority count, recommended-action
count, and the last shared analysis timestamp. It does not expose module,
metadata-cache, or analysis-engine state.

Explore More is registry-driven and intentionally limited to Knowledge Center,
Explain This, Automation Advisor, and Flow Intelligence. Daily Brief and Ask
Before You Build are excluded because they already have prominent launch
points.

The full Admin Task Center, priority queue, recommendation list, and Explain
Metadata action are not rendered on Home. Opening Daily Brief is the single path
from the summary into operational detail.

The unverified history placeholder has moved from Home to Developer Tools.
Developer Tools now keeps diagnostics, routing, metadata cache, registry,
verified-history availability, and source coverage outside the administrator
dashboard.

## Shared Brief Data

`dailyBriefService` owns the shared snapshot and deterministic Daily Brief
analysis orchestration. Both the lightweight Home summary and Daily Brief use
the same service contract. The underlying metadata snapshot remains cached, so
this introduces no metadata collector or retrieval path.

## Daily Brief Operations Center

Daily Brief owns:

- Executive Summary
- Priority Queue
- Recommended Actions
- Documentation Gaps
- Deployment Readiness
- Recent Findings
- Suggested Workspace
- End-of-Day Checklist

`adminTaskCenter` receives the already-loaded analysis result from Daily Brief,
so it does not retrieve or analyze metadata again. Recommendation buttons
continue through the shared recommendation routing service, including Explain
This when supported by the recommendation category.

## Preserved Contracts

- Shared metadata snapshot
- Shared deterministic organization analysis
- Recommendation-to-workspace routing
- Explain This integration
- Registry-driven workspace routing
- Back navigation
- Deterministic behavior

## UX Outcome

Home remains quick to scan. Daily Brief becomes the place administrators begin
the morning, work through prioritized actions, choose the next workspace, and
review the available end-of-day validation checklist.
