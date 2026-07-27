# Salesforce Copilot — AI and Developer Context

## Purpose

Salesforce Copilot is a modular Salesforce administration workspace for administrators, business analysts, consultants, and architects. It helps users understand org configuration, explore metadata, diagnose problems, assess risk and health, prepare tests and deployments, generate documentation, and develop Salesforce skills.

The product should behave like an explainable senior consultant: explain before recommending, use business language before technical detail, show uncertainty, and always encourage appropriate testing and documentation.

## Architectural Principles

Salesforce Copilot is deterministic-first. Live Salesforce metadata is the source of truth, shared services normalize it, reusable rule engines analyze it, and focused Lightning Web Component (LWC) workspaces present the results.

```text
Salesforce org
  -> Apex metadata controllers
  -> org context and metadata collection services
  -> normalized metadata snapshot
  -> org knowledge and intelligence layers
  -> modular user workspaces
  -> optional AI enhancement
```

The main layers are:

1. **Salesforce data access** — `OrgContextController`, `OrgExplorerController`, and `FlowMetadataController` retrieve live Describe and Flow metadata.
2. **Core services** — `orgContextService` wraps Apex access; `copilotCore` provides constants, caching, refresh coordination, design tokens, and snapshot support.
3. **Metadata collection** — `salesforceMetadataCollector` plans collection, records coverage, and adapts Salesforce results into a standard snapshot.
4. **Org Knowledge Layer** — `orgKnowledgeService` normalizes metadata, applies deterministic rules, and produces findings, recommendations, health scores, and readiness signals.
5. **Intelligence Layer** — `copilotIntelligence` supplies reusable explanation, dependency, risk, test-plan, and interview engines.
6. **Presentation and workspaces** — `salesforceCopilotDashboard` is the application shell. Feature LWCs such as `flowIntelligence`, `orgExplorer`, `orgHealthDashboard`, and `explainThisWorkspace` consume the shared layers.

## The Intelligence Layer

The Intelligence Layer converts verified context into reusable, explainable guidance. It is not a UI module and should not fetch unrelated data independently.

- `explanationEngine.js` creates plain-language business and technical explanations.
- `dependencyEngine.js`, `dependencyGraph.js`, resolvers, utilities, and scoring organize known dependencies and their significance.
- `riskEngine.js` evaluates change, configuration, and user-impact risk.
- `testPlanEngine.js` produces structured tests for supported Salesforce metadata types.
- `interviewEngine.js` turns project work into learning prompts and interview-ready explanations.
- `intelligenceModels.js` defines common output structures.

Engines should accept normalized, source-aware inputs and return structured results. A finding must distinguish verified metadata from an inference, include an understandable reason, and avoid overstating coverage.

## AI Is Optional

Every core workflow must work without generative AI. Metadata retrieval, navigation, deterministic analysis, scoring, recommendations, testing guidance, and safe error states may not depend on an AI provider.

AI-enhanced mode may later summarize verified results, adapt explanations to an audience, answer grounded follow-up questions, or draft documentation. AI must receive structured outputs from the core platform; it must not invent org configuration. Provider failure, missing credentials, cost controls, or an org policy that prohibits AI must never disable core functionality.

## Portability Vision

The near-term goal is to deploy the same product safely to multiple Salesforce orgs: developer orgs, scratch orgs, sandboxes, production orgs, and client orgs. Do not hardcode org IDs, record IDs, custom object names, or assumptions about one org's installed features. Discover capabilities dynamically, respect permissions, and degrade gracefully when metadata is unavailable.

The longer-term goal is a CRM Copilot platform that supports Salesforce and additional CRM products through adapters. CRM-specific collectors should translate source data into stable, CRM-neutral snapshot and knowledge models. Intelligence engines and presentation modules should consume those common contracts rather than Salesforce-specific payloads. Salesforce remains the first adapter, not a permanent coupling point for all business logic.

## Coding Standards

- Prefer small, cohesive modules with explicit inputs and predictable outputs.
- Keep retrieval, normalization, analysis, and presentation responsibilities separate.
- Reuse shared constants, models, utilities, cache, refresh, and scoring services instead of duplicating logic.
- Use descriptive camelCase names for JavaScript values and functions, PascalCase for classes, and Salesforce naming conventions for Apex.
- Treat inputs and wire/Apex results as untrusted: validate shape, handle nulls, and provide actionable error states.
- Do not mutate shared inputs. Return new arrays and objects from transformations.
- Preserve source and coverage information throughout analysis. Label unavailable, partial, inferred, and verified results honestly.
- Avoid secrets, credentials, endpoints, org-specific identifiers, and personal data in source.
- Format with the repository Prettier configuration and lint JavaScript with ESLint.
- Add or update Jest tests for LWC behavior and pure JavaScript logic. Add Apex tests when Apex changes are authorized.
- Keep documentation synchronized with architecture, status, and feature changes.

Before merging, use the relevant checks:

```shell
npm run prettier:verify
npm run lint
npm run test:unit
```

## LWC Conventions

- Give each user-facing capability its own LWC bundle under `force-app/main/default/lwc`.
- Keep `salesforceCopilotDashboard` focused on shell, navigation, and composition rather than feature logic.
- Put reusable service modules in non-visual LWC bundles such as `copilotCore`, `orgContextService`, `orgKnowledgeService`, and `copilotIntelligence`.
- Import cross-bundle APIs through `c/<bundle>` public exports. Keep bundle-internal helpers local unless another bundle genuinely needs them.
- Keep templates declarative. Move complex parsing, scoring, mapping, and selection into testable JavaScript helpers.
- Use Lightning base components and SLDS patterns; reuse shared design tokens before adding one-off styling.
- Expose only the targets and public properties required in the component metadata and JavaScript API.
- Provide loading, empty, partial-data, success, and error states for metadata-driven views.
- Never label deterministic output as AI-generated. Do not use “AI” as a synonym for rules or recommendations.
- Place Jest tests in `<bundle>/__tests__` and replace generated placeholder tests with assertions that cover meaningful behavior.

## Adding a New Module

1. Define the user problem, inputs, outputs, data source, coverage limits, and whether AI enhancement is optional.
2. Check `FEATURE_REGISTRY.md` and the shared layers before creating new logic.
3. Add or extend a collector/adapter only when the required source data is not already available.
4. Normalize new source data into shared models. Keep Salesforce-specific translation at the adapter boundary.
5. Add deterministic rules or intelligence functions to the appropriate shared service when they are reusable.
6. Create a focused LWC workspace that consumes shared outputs and handles all UI states.
7. Register navigation in the dashboard only after the module has a usable state.
8. Add meaningful Jest coverage, document limitations, and update `FEATURE_REGISTRY.md`, `PROJECT_STATUS.md`, and `SESSION_LOG.md`.
9. Validate in a clean or second org before calling the module portable or complete.

## Safely Modifying Existing Code

Before editing, read the target component, its imports, tests, controller methods, and the relevant architecture documentation. Trace consumers of any shared export with repository search. Preserve public method signatures and normalized data contracts unless a coordinated migration is planned.

Make the smallest change that satisfies the requirement. Do not mix refactors with feature work without a clear reason. Never replace live metadata with sample data or silently convert an unavailable category into a healthy result. Test changed helpers and user-visible states, review the diff for unrelated formatting, and confirm that existing modules still work without AI.

Salesforce metadata and Apex changes deserve extra care: verify permissions, sharing, cacheability, governor limits, API-version compatibility, and deployment impact. Do not modify them unless the task explicitly authorizes it.
