# Salesforce Administration Workspace — Jobs to Be Done

## Purpose

This document defines the user outcomes the Salesforce Administration Workspace
should support. It is intended to guide product planning, feature evaluation,
user research, and professional portfolio review.

The current product uses deterministic metadata analysis. The jobs below
include both jobs addressed by the existing implementation and important jobs
that remain unsolved.

## Primary User Groups

### Salesforce administrators

Own day-to-day configuration, user support, data quality, automation, access,
documentation, and operational improvement.

### Salesforce consultants

Assess unfamiliar orgs, translate business needs into solutions, communicate
tradeoffs, and prepare client-ready recommendations and delivery plans.

### CRM and business systems professionals

Coordinate processes, requirements, governance, data, and system behavior
across business and technical teams.

### Business systems analysts

Investigate current-state configuration, clarify business intent, identify
gaps, and prepare requirements and acceptance criteria.

### Developing Salesforce professionals

Build practical administration, consulting, troubleshooting, testing, and
communication skills.

## Functional Jobs

### Understand the current system

> When I enter an unfamiliar Salesforce org, help me build an accurate view of
> its important objects, fields, relationships, record types, automation, and
> access characteristics so I can work without relying on assumptions.

### Explain configuration

> When I encounter metadata I do not recognize, help me understand its likely
> business purpose, technical behavior, dependencies, risks, and testing needs
> so I can discuss it responsibly.

### Prioritize administrative work

> When many findings or requests compete for attention, help me identify which
> items matter most and why so I can focus limited time on meaningful work.

### Analyze automation

> When I review an existing or proposed automation, help me assess its purpose,
> design considerations, risks, and tests so I can reduce operational mistakes.

### Troubleshoot a problem

> When a user reports an error or unexpected behavior, help me structure the
> investigation, identify likely causes, and choose useful tests so I can reach
> a diagnosis faster.

### Select an implementation approach

> When a business requirement could be solved in several ways, help me compare
> appropriate Salesforce automation and configuration approaches so I can
> recommend a supportable solution.

### Assess a proposed change

> When I plan to modify or remove configuration, help me identify known
> dependencies, affected users and processes, risks, tests, documentation, and
> rollback needs so I can prepare a safer change.

### Prepare for deployment

> When a change is ready to move environments, help me verify that evidence,
> testing, access, documentation, dependencies, and rollback planning are
> sufficient so I can make a responsible release decision.

### Document the system

> When knowledge exists only in configuration or individual memory, help me
> produce consistent documentation from verified context so future
> administrators can understand and maintain the system.

### Monitor meaningful change

> When an org evolves over time, help me identify verified recent changes,
> failed deployments, and new risks so I can respond before they become larger
> problems.

## Emotional Jobs

Users also want to:

- Feel oriented rather than overwhelmed in an unfamiliar org.
- Feel confident that a recommendation is based on evidence.
- Reduce anxiety before changing important configuration.
- Avoid the embarrassment of overlooking an obvious dependency or test.
- Feel in control of an administrative backlog.
- Trust that incomplete metadata is being represented honestly.
- Communicate uncertainty without appearing unprepared.
- Feel supported without surrendering professional judgment.

## Professional-Growth Jobs

Users want to:

- Learn how experienced administrators frame a problem.
- Develop stronger discovery and requirements questions.
- Practice explaining technical behavior in business language.
- Recognize common risk, maintainability, and data-quality patterns.
- Improve testing and deployment-planning habits.
- Learn when declarative configuration is appropriate and when escalation is
  necessary.
- Build consultant-style thinking about evidence, tradeoffs, stakeholders, and
  outcomes.
- Turn completed work into portfolio, interview, and scenario-based learning
  material.

## Current Pain Points

- Salesforce Setup distributes related information across many interfaces.
- Object discovery does not automatically explain business importance.
- Metadata retrieval may be incomplete because of permissions or unsupported
  categories.
- Admins often reconstruct the same context for troubleshooting, planning,
  documentation, and handoff.
- Findings are difficult to prioritize without consistent severity and impact
  rules.
- Generic recommendations do not always identify the next workspace or action.
- Change impact is often assessed informally.
- Deployment readiness is frequently represented by a checklist rather than
  evidence tied to the actual change.
- Documentation becomes stale because it is separated from configuration
  analysis.
- Learning resources are rarely connected to the configuration being reviewed.
- New professionals may know product vocabulary without yet having a repeatable
  decision-making method.

## Desired Outcomes

The product should help users achieve:

- Faster orientation to supported org configuration.
- Fewer unsupported assumptions.
- A prioritized list of evidence-backed actions.
- Clearer explanations for technical and nontechnical stakeholders.
- Safer change plans with dependencies, tests, and rollback considerations.
- More consistent troubleshooting and requirements analysis.
- Documentation grounded in known metadata.
- Less duplicated discovery and context switching.
- Better administration and consulting judgment over time.
- Honest awareness of what the workspace could not inspect.

## Example Administrator Workflows

### Workflow 1: Start-of-day review

1. Open Daily Brief.
2. Review data source and coverage.
3. Read the deterministic health headline.
4. Review ranked priorities and top findings.
5. Navigate to Org Health for supporting detail.
6. Decide which recommendation becomes an administrative task.

Current status: the shared snapshot and Org Knowledge layer can support this
flow. Verified recent-change monitoring is not yet available.

### Workflow 2: Understand an unfamiliar object

1. Open Org Explorer.
2. Search for the object.
3. Review fields, relationships, record types, and access characteristics.
4. Open an explanation workflow for supported context.
5. Record unresolved questions caused by unavailable metadata.

Current status: object and field exploration are implemented. Cross-workspace
selection and handoff can be improved.

### Workflow 3: Review a Flow

1. Retrieve the available Flow inventory.
2. Select a Flow and inspect version context.
3. Review purpose, risks, dependencies, and tests.
4. Identify documentation or design gaps.
5. Prepare follow-up validation in Salesforce.

Current status: live Flow inventory and version retrieval exist, and a Flow
Intelligence presentation exists. They are not yet fully connected into this
end-to-end workflow.

### Workflow 4: Diagnose an issue

1. Describe the symptom in Troubleshooting.
2. Review deterministic classification and likely causes.
3. Follow the investigation and test steps.
4. Use Org Explorer or Org Health to inspect relevant context.
5. Confirm the cause in Salesforce before changing configuration.

Current status: deterministic troubleshooting guidance and relevant
workspaces exist. Automatic transfer of issue context between them does not.

### Workflow 5: Evaluate an automation request

1. Enter the business requirement in Automation Advisor.
2. Review the suggested implementation category and rationale.
3. Identify missing requirements and risk considerations.
4. Inspect existing metadata for conflicts or dependencies.
5. Prepare acceptance criteria and tests.

Current status: rules-based recommendation logic exists. Live conflict
analysis and requirement-to-metadata linking remain gaps.

### Workflow 6: Prepare a change

1. Select the configuration to change.
2. Review known dependencies and risk.
3. Generate a test plan.
4. Check Org Health findings relevant to the change.
5. Document the change and rollback plan.
6. Decide whether it is ready for deployment.

Current status: dependency, risk, test-plan, health, and readiness foundations
exist. A unified Change Impact and Deployment Readiness workflow does not.

## Existing Feature Mapping

| User job                 | Existing feature or foundation                                     | Current limitation                                                                         |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Orient to the workspace  | Dashboard and Workspace Router                                     | Not every diagnostic workspace is connected through a contextual handoff.                  |
| Prioritize work          | Daily Brief and Org Health                                         | No recent-change source; recommendation destinations are not centrally mapped.             |
| Explore configuration    | Org Explorer and Org Context Service                               | Metadata breadth is limited to supported Describe and context sources.                     |
| Understand org knowledge | Org Knowledge Viewer and shared analysis                           | Rule accuracy and coverage require broader validation.                                     |
| Explain metadata         | Explain This and deterministic intelligence services               | Live selection breadth and cross-workspace context are incomplete.                         |
| Analyze Flows            | Flow metadata controller, snapshot services, and Flow Intelligence | Live retrieval and analysis presentation are not fully integrated.                         |
| Select automation        | Automation Advisor                                                 | Primarily requirement-driven rules; it does not inspect all existing automation conflicts. |
| Troubleshoot issues      | Troubleshooting Assistant                                          | Guidance is deterministic but not connected to live runtime diagnostics.                   |
| Review health            | Org Health Dashboard                                               | Health reflects supported metadata, not the entire org.                                    |
| Reuse system context     | Shared snapshot, cache, refresh, and Org Knowledge services        | Shared analysis results are not yet cached as a separate product contract.                 |
| Prepare tests            | Deterministic test-plan services                                   | No unified change or deployment workspace consumes the full plan.                          |
| Prepare deployment       | Readiness models and scoring foundations                           | No complete Deployment Readiness Workspace or verified release rubric.                     |
| Document the system      | Early disabled Documentation Generator prototype                   | No source contract, document types, export workflow, or validation.                        |
| Learn while working      | Explanation and interview-guidance foundations                     | No complete Professional Growth Mode.                                                      |

## Gaps in the Current Product

### Evidence and metadata gaps

- Validation Rules
- Permission Sets, profiles, and assignments
- Duplicate and Matching Rules
- Apex classes, triggers, and test context
- Reports and dashboards
- Sharing model
- Deployment history and verified recent changes
- Runtime failures and telemetry

These categories should not be added only to increase metadata volume. Each
requires a validated user job, permission model, coverage behavior, and
maintenance plan.

### Workflow gaps

- Live Flow selection and end-to-end analysis
- Change Impact Analyzer
- Deployment Readiness Workspace
- Recommendation-to-workspace routing
- Context transfer between workspaces
- Documentation generation and export
- Dependency visualization
- Recent Changes Monitor
- Professional Growth Mode

### Product-quality gaps

- Clean second-org validation
- Permission-set and least-privilege design
- Apex tests and broader behavioral LWC tests
- Accessibility and performance baselines
- Stable installation and packaging approach
- User research and measurable outcome baselines

## Highest-Value Jobs to Solve Next

### 1. Move from a finding to the correct action

Why it matters: the product already generates findings and recommendations, but
users still need to determine where to investigate them. A shared
recommendation-to-workspace selector is bounded, reusable, and builds on
existing navigation.

### 2. Analyze a proposed change safely

Why it matters: change impact connects understanding, dependencies, risk,
testing, and execution. Much of the deterministic foundation exists, but the
workflow and evidence model require validation.

### 3. Prepare a defensible deployment decision

Why it matters: release mistakes are costly, and existing health, risk, test,
and readiness services provide a starting point. The product must avoid calling
a deployment “ready” when required metadata is unavailable.

### 4. Connect live Flow metadata to Flow analysis

Why it matters: this completes an already-started workflow without introducing
a new product area. It also tests whether the shared snapshot-to-analysis design
works for a high-value metadata type.

### 5. Document verified configuration and decisions

Why it matters: documentation supports continuity, handoff, audits, consulting,
and professional growth. The product first needs defined document types,
provenance, and export expectations.

### 6. Identify verified recent changes

Why it matters: recent changes would make Daily Brief operationally relevant.
It is high value but must wait for a trustworthy, permission-aware source and
clear freshness semantics.

### 7. Learn from completed administrative work

Why it matters: professional growth differentiates the product and supports its
portfolio purpose. It should follow core workflow reliability so learning
content is grounded in sound analysis.
