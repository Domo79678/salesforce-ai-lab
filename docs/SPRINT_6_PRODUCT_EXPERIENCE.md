# Sprint 6: Product Experience

## Goal

Polish the Salesforce Administration Workspace for daily use without adding
administrative capabilities. The experience remains deterministic and uses the
same shared metadata, organization analysis, registry, recommendations, and
navigation contracts.

## Home Responsibilities

The Home page now answers only:

1. What needs my attention?
2. What should I do next?
3. Where do I go to do it?

The reading order is:

1. compact product and service status;
2. Today’s Admin Brief;
3. featured Ask Before You Build planning card;
4. four Primary Actions;
5. Org Health Snapshot and verified-source Recent Activity;
6. Primary Workspaces and View All Tools; and
7. a quiet Developer Tools link.

The complete catalog is not rendered on Home.

## Today’s Admin Brief

The reusable Admin Task Center presents one top priority and up to three
deterministic recommended actions. It publishes shared metadata, analysis,
health, and risk status to Home without introducing another metadata request.

## Daily Brief

Daily Brief is now a morning briefing rather than another dashboard. It leads
with the recommended focus, then presents organization health, metadata
coverage, up to three actions for the day, and up to three supporting findings.
It remains a presentation layer over the shared metadata snapshot and
organization analysis.

## Knowledge Center

The user-facing Org Knowledge Viewer is now named Knowledge Center. Its purpose
is to help users understand organization metadata, findings, coverage, trends,
and explainable health analysis. Internal service and result-contract names are
unchanged to preserve compatibility.

## All Tools and Developer Tools

All Tools contains the complete registry-driven catalog, with available
workspaces first and planned workspaces collapsed under Coming Soon.

Developer Tools contains metadata diagnostics, source coverage, cache state,
service status, registry information, and routing diagnostics. These technical
details are not rendered in the primary admin workflow.

## Visual System

- Whitespace and section separation replace dense stacks of cards.
- Headings use a consistent hierarchy.
- Descriptions are shorter and task-oriented.
- No implementation percentages or progress bars are rendered in Home, All
  Tools, or Developer Tools.
- Accent colors are reserved for high priority, healthy state, review state,
  and planning.
- Layouts collapse from desktop grids to a single mobile column.

## Preserved Architecture

- Shared Salesforce metadata snapshot
- Shared deterministic organization analysis
- Module registry
- Recommendation routing
- Workspace Router and Back navigation
- Ask Before You Build
- Admin Task Center
- Deterministic behavior
