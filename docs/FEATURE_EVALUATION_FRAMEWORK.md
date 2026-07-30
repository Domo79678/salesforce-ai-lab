# Salesforce Administration Workspace — Feature Evaluation Framework

## Purpose

This framework helps decide whether a proposed capability should be built,
validated, postponed, or rejected.

It is designed for a deterministic Salesforce Administration Workspace. A
feature should not be prioritized because it sounds intelligent, uses a new
technology, or increases the number of modules. It should improve a meaningful
user outcome and fit the shared metadata and analysis architecture.

## Required Connection to a User Job

Every proposal must complete this statement:

> When **[user group]** is trying to **[job]** in **[situation]**, the feature
> helps them achieve **[measurable outcome]** by **[mechanism]**.

A proposal is not eligible to build when:

- No primary user and job can be named.
- The outcome is an interface element rather than a user result.
- The same outcome is already available through a simpler existing workflow.
- Required data cannot be retrieved or represented honestly.
- The proposal depends on presenting inference as verified fact.
- Its main justification is novelty, AI, or portfolio appearance.

## Scoring Scale

Score every criterion from 1 to 5. Use evidence when available and label
assumptions.

### Benefit criteria

#### Time saved

| Score | Meaning                                                     |
| ----: | ----------------------------------------------------------- |
|     1 | No meaningful time saved or adds steps.                     |
|     2 | Saves a small amount in an occasional task.                 |
|     3 | Removes one meaningful manual step.                         |
|     4 | Substantially shortens a multi-step workflow.               |
|     5 | Replaces repeated, high-cost discovery or preparation work. |

#### Risk reduced

| Score | Meaning                                                                  |
| ----: | ------------------------------------------------------------------------ |
|     1 | No clear effect on mistakes or delivery risk.                            |
|     2 | Adds a reminder but little evidence.                                     |
|     3 | Helps identify common, moderate-risk issues.                             |
|     4 | Consistently improves verification or change safety.                     |
|     5 | Addresses frequent or high-impact failure modes with traceable evidence. |

#### Understanding improved

| Score | Meaning                                                                    |
| ----: | -------------------------------------------------------------------------- |
|     1 | Adds information without improving comprehension.                          |
|     2 | Clarifies a narrow detail.                                                 |
|     3 | Explains an important object, finding, or workflow.                        |
|     4 | Builds a coherent view across related metadata.                            |
|     5 | Materially changes how quickly and accurately users understand the system. |

#### Context switching reduced

| Score | Meaning                                                     |
| ----: | ----------------------------------------------------------- |
|     1 | Adds another destination without consolidating work.        |
|     2 | Keeps a small part of a task in one place.                  |
|     3 | Connects two related steps or sources.                      |
|     4 | Consolidates most of a common workflow.                     |
|     5 | Creates a coherent end-to-end workflow from shared context. |

#### Frequency of use

| Score | Meaning                                        |
| ----: | ---------------------------------------------- |
|     1 | Rare, exceptional use.                         |
|     2 | A few times per year.                          |
|     3 | Monthly or project-stage use.                  |
|     4 | Weekly use for a target user.                  |
|     5 | Daily or nearly daily use across target users. |

#### Professional growth value

| Score | Meaning                                                          |
| ----: | ---------------------------------------------------------------- |
|     1 | No meaningful learning or judgment benefit.                      |
|     2 | Exposes terminology or a narrow practice.                        |
|     3 | Reinforces a reusable administration habit.                      |
|     4 | Develops analysis, communication, or consulting skill.           |
|     5 | Repeatedly teaches expert reasoning in the context of real work. |

#### Reusability

| Score | Meaning                                                        |
| ----: | -------------------------------------------------------------- |
|     1 | One-off logic embedded in one view.                            |
|     2 | Limited reuse within one component family.                     |
|     3 | Reusable selector, component, or rule within one workflow.     |
|     4 | Shared service or contract used by several workspaces.         |
|     5 | Foundational capability that enables multiple product pillars. |

#### Cross-org value

| Score | Meaning                                                                       |
| ----: | ----------------------------------------------------------------------------- |
|     1 | Depends on one org’s custom configuration.                                    |
|     2 | Requires substantial org-specific setup.                                      |
|     3 | Works across similar orgs with configuration.                                 |
|     4 | Uses dynamic metadata and degrades safely across orgs.                        |
|     5 | Demonstrably useful across org types with validated permissions and coverage. |

#### Cross-CRM potential

| Score | Meaning                                                        |
| ----: | -------------------------------------------------------------- |
|     1 | Intrinsically tied to a Salesforce-only implementation detail. |
|     2 | Mostly Salesforce-specific, with a reusable concept.           |
|     3 | Reusable job but requires significant platform adaptation.     |
|     4 | Fits source-neutral contracts with platform-specific adapters. |
|     5 | Largely platform-neutral and validated beyond Salesforce.      |

### Cost criteria

Higher cost scores reduce priority.

#### Development effort

| Score | Meaning                                                               |
| ----: | --------------------------------------------------------------------- |
|     1 | Small change using established contracts.                             |
|     2 | Bounded feature with limited new logic.                               |
|     3 | Several components or one new shared contract.                        |
|     4 | Significant workflow, data, testing, and UX work.                     |
|     5 | New integration, data source, security model, or platform capability. |

#### Maintenance burden

| Score | Meaning                                                                                    |
| ----: | ------------------------------------------------------------------------------------------ |
|     1 | Stable, local behavior with minimal upkeep.                                                |
|     2 | Small shared mapping or presentation contract.                                             |
|     3 | Rules or APIs that require periodic review.                                                |
|     4 | Broad metadata, permissions, UX, or version-compatibility surface.                         |
|     5 | External provider, rapidly changing API, high governance, or continuous evaluation burden. |

## Score Calculation

Calculate:

```text
Benefit score =
  Time saved
  + Risk reduced
  + Understanding improved
  + Context switching reduced
  + Frequency of use
  + Professional growth value
  + Reusability
  + Cross-org value
  + Cross-CRM potential

Net score =
  Benefit score
  - Development effort
  - Maintenance burden
```

The possible net range is -1–43. The score supports a decision; it does not
replace evidence, architectural judgment, or sequencing.

## Evidence Required Before Implementation

Every feature proposal should include:

### User evidence

- Named primary user group and job.
- At least three concrete workflow examples or user observations.
- Current workaround and its measurable cost.
- Expected frequency and consequence of failure.
- A definition of success observable by the user.

For early portfolio work, clearly labeled expert review and scenario validation
may substitute for formal research temporarily. It is not equivalent to user
research.

### Data evidence

- Required metadata and its authoritative source.
- Permission and licensing prerequisites.
- Expected availability, freshness, and scale.
- Complete, partial, unavailable, and failure behaviors.
- Evidence that the source can be retrieved in a representative org.

### Product evidence

- Existing feature or service that can be reused.
- Why the outcome cannot be achieved through a smaller change.
- Entry point, next action, and handoff to Salesforce.
- Accessibility and empty/error-state requirements.
- A plan for measuring the expected outcome.

### Technical evidence

- Proposed contract and ownership boundary.
- Security, privacy, governor-limit, and performance implications.
- Testing strategy, including deterministic fixtures.
- Cross-org assumptions and clean-org validation plan.
- Upgrade and maintenance owner.

### AI-specific evidence

Any future AI feature additionally requires:

- A task where generation materially outperforms deterministic presentation.
- Grounding, citations, and unsupported-claim behavior.
- Sensitive-data, retention, provider, and consent rules.
- Accuracy and usefulness evaluations.
- Cost, latency, rate-limit, and provider-failure behavior.
- A deterministic fallback.

Without this evidence, an AI feature must be postponed regardless of score.

## Decision Thresholds

### Build

- Net score of **27 or higher**.
- Required user and data evidence exists.
- The job is aligned with the current product phase.
- No unresolved security or source-of-truth blocker exists.
- A smaller reusable implementation has been considered.

### Validate

- Net score of **22–26**, or a higher-scoring feature whose most important
  assumptions remain unverified.
- Next work should be research, a contract prototype, fixture validation, or a
  narrow workflow test—not full implementation.

### Postpone

- Net score of **15–21**.
- The job is valuable but depends on missing foundations, lower-priority data,
  governance, or product maturity.
- Record the dependency and the condition that would reopen evaluation.

### Reject

- Net score below **15**.
- No clear user job.
- Duplicates an existing workflow without a better outcome.
- Requires misleading claims or unsafe data behavior.
- Maintenance burden is disproportionate to demonstrated value.

### Decision overrides

Regardless of score:

- Missing trustworthy data moves a feature from Build to Validate or Postpone.
- Unresolved security or permission issues prevent Build.
- A feature that weakens deterministic core workflows is rejected or
  redesigned.
- A feature required to correct misleading behavior, data loss, or a serious
  security issue may be built before lower-risk roadmap items.

## Feature Evaluation Template

```markdown
# Feature: [Name]

## User job

When [user] is trying to [job] in [situation], this feature helps them achieve
[outcome] by [mechanism].

## Current workaround

[Steps, time, tools, risks, and frequency]

## Proposed outcome

[What changes for the user—not merely what UI is added]

## Required data

- Source:
- Permissions:
- Freshness:
- Coverage behavior:
- Known gaps:

## Reuse and architecture

- Existing shared services:
- New contract, if required:
- Why a smaller change is insufficient:

## Scores

| Criterion                 | Score | Evidence or assumption |
| ------------------------- | ----: | ---------------------- |
| Time saved                |       |                        |
| Risk reduced              |       |                        |
| Understanding improved    |       |                        |
| Context switching reduced |       |                        |
| Frequency of use          |       |                        |
| Professional growth value |       |                        |
| Reusability               |       |                        |
| Cross-org value           |       |                        |
| Cross-CRM potential       |       |                        |
| Development effort        |       |                        |
| Maintenance burden        |       |                        |

Benefit score:
Net score:

## Evidence still required

- [ ]

## Risks

- Product:
- Data:
- Security:
- Technical:
- Maintenance:

## Decision

Build / Validate / Postpone / Reject

Rationale:

Revisit condition:
```

## Initial Evaluation of Proposed Features

Scores are initial product hypotheses based on the current repository. They are
not substitutes for user research, clean-org validation, or implementation
estimates.

| Proposed feature                    | Time | Risk | Understand | Context | Frequency | Growth | Reuse | Cross-org | Cross-CRM | Effort | Maintenance | Net | Initial decision |
| ----------------------------------- | ---: | ---: | ---------: | ------: | --------: | -----: | ----: | --------: | --------: | -----: | ----------: | --: | ---------------- |
| Change Impact Analyzer              |    4 |    5 |          5 |       4 |         4 |      5 |     5 |         5 |         4 |      4 |           4 |  33 | Validate         |
| Deployment Readiness Workspace      |    4 |    5 |          4 |       4 |         3 |      5 |     5 |         5 |         4 |      4 |           4 |  31 | Validate         |
| Documentation Generator             |    5 |    3 |          4 |       5 |         4 |      4 |     5 |         5 |         5 |      4 |           4 |  32 | Validate         |
| Dependency Visualizer               |    4 |    5 |          5 |       4 |         4 |      5 |     4 |         5 |         4 |      5 |           4 |  31 | Validate         |
| Professional Growth Mode            |    3 |    2 |          4 |       3 |         3 |      5 |     4 |         5 |         5 |      4 |           4 |  26 | Validate         |
| AI Chat Assistant                   |    4 |    3 |          4 |       4 |         3 |      3 |     4 |         4 |         5 |      5 |           5 |  24 | Postpone         |
| Recent Changes Monitor              |    5 |    5 |          5 |       5 |         5 |      4 |     5 |         5 |         4 |      5 |           5 |  33 | Validate         |
| Recommendation-to-Workspace Routing |    3 |    3 |          3 |       4 |         5 |      2 |     5 |         5 |         4 |      2 |           2 |  30 | Build            |

### Change Impact Analyzer — Validate

**User job:** Understand the consequences of modifying or removing
configuration before making a change.

**Why it scores well:** It connects existing dependency, risk, explanation,
testing, health, and knowledge foundations to a high-risk administrative job.

**Why it is not Build yet:** The repository does not demonstrate sufficiently
complete dependency retrieval. A workspace could otherwise imply confidence
that the available metadata does not support.

**Next evidence:** Define the change-request model, supported entity types,
coverage warnings, and expert-reviewed fixtures. Validate a narrow object/field
change workflow before expanding scope.

### Deployment Readiness Workspace — Validate

**User job:** Decide whether a planned change has sufficient evidence, tests,
documentation, permissions, and rollback preparation.

**Why it scores well:** Deployment mistakes are costly, and readiness, health,
risk, and test-plan foundations already exist.

**Why it is not Build yet:** A numeric score could create false confidence when
security, test, dependency, or change metadata is unavailable. The blocking
rules and required evidence are not yet validated.

**Next evidence:** Define an evidence-based readiness rubric with explicit
unknown and blocked states. Test it against historical or expert-designed
release scenarios.

### Documentation Generator — Validate

**User job:** Produce maintainable admin and implementation documentation from
verified context.

**Why it scores well:** Documentation is time-consuming, reusable across orgs,
and valuable for handoff, consulting, operations, and learning.

**Why it is not Build yet:** The existing prototype does not establish document
types, source provenance, editing expectations, export formats, or freshness
rules.

**Next evidence:** Select one document type—such as an object configuration
summary—and validate its required fields, provenance, review workflow, and
export format.

### Dependency Visualizer — Validate

**User job:** Understand how configuration elements relate before
troubleshooting or changing them.

**Why it scores well:** Dependencies are difficult to understand in lists, and
visualization can improve comprehension and change safety.

**Why it is not Build yet:** A visualization cannot compensate for incomplete
dependency retrieval. Large graphs also introduce accessibility, performance,
and interaction complexity.

**Next evidence:** Validate a small, bounded graph for one supported entity
type. Define unknown-edge behavior and provide an equivalent accessible table.

### Professional Growth Mode — Validate

**User job:** Develop stronger administration and consulting judgment while
completing real work.

**Why it matters:** It is strategically differentiating and supports the
portfolio audience, but direct time and risk benefits are lower than core
administration workflows.

**Why it is not Build yet:** The learning outcome, curriculum, and relationship
to actual workspace evidence are not defined. A generic quiz experience would
not satisfy the job.

**Next evidence:** Prototype a deterministic “why this matters” and reflection
panel for a completed Org Health or Explain This workflow. Measure whether users
can better explain the decision afterward.

### AI Chat Assistant — Postpone

**User job:** Ask follow-up questions about verified workspace context using
natural language.

**Potential value:** It could reduce navigation and make complex analysis more
approachable.

**Why it is postponed:** AI is not currently implemented. The repository has no
provider gateway, grounding contract, evaluation system, privacy controls,
cost model, or failure behavior. Chat also risks becoming a broad interface
without a sufficiently bounded user job.

**Revisit when:** Deterministic workflows are stable, a provider-neutral
gateway and governance model exist, and research demonstrates that chat solves
a high-frequency job better than selectors and contextual actions.

### Recent Changes Monitor — Validate

**User job:** Identify verified changes, failed deployments, and newly relevant
risks since the last review.

**Why it scores well:** It could make Daily Brief operationally valuable and
supports troubleshooting, governance, and release review.

**Why it is not Build yet:** No verified shared recent-change source currently
exists. “Recent change” requires precise scope, freshness, permissions,
retention, and reconciliation semantics.

**Next evidence:** Investigate authoritative Salesforce sources and licensing
requirements. Validate what can be retrieved consistently before designing the
workspace.

### Recommendation-to-Workspace Routing — Build

**User job:** Move directly from a finding or recommendation to the workspace
where it can be investigated or acted upon.

**Why it is the strongest immediate candidate:** Findings, recommendations,
module definitions, and routing already exist. A shared deterministic selector
can reduce context switching without new metadata retrieval.

**Proposed first scope:** Create a reusable mapping based on supported
recommendation category and entity type. Return a destination only when the
mapping is known; otherwise route to Org Health or show no contextual action.

**Evidence required during implementation:** Confirm category consistency,
define fallback behavior, test every enabled destination, and avoid embedding
mapping logic separately in Daily Brief, Org Health, and other workspaces.
