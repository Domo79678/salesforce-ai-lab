# Salesforce AI Lab Portability Audit

**Status date:** August 5, 2026

**Current rating:** Level 2 — clean-org deployable application

## Executive summary

The P0 portability baseline is complete. Salesforce AI Lab now has an explicit product boundary, production-style Apex validation, an administrator-facing permission set, a packaged Lightning entry point, and a verified installation and runtime path in a clean Developer scratch org.

The clean-org test deployed only `manifest/package.xml`; `practice-app` was absent. A Technical Admin using **Minimum Access - Salesforce** plus `Salesforce_AI_Lab_User` launched and exercised the application without System Administrator, API Enabled, business-object CRUD/FLS, or broad record access.

The application remains deterministic and does not depend on AI. Advanced metadata coverage and browser-local persistence remain known product limitations, not P0 portability blockers.

## Product deployment boundary

- `force-app` contains the Salesforce AI Lab application source.
- `practice-app` contains Salesforce practice/training Account metadata and is not part of product installation.
- `manifest/package.xml` explicitly lists the product metadata.
- `force-app` remains the default Salesforce DX package directory; `practice-app` is registered as non-default.
- The packaged entry point is Lightning App → custom tab → App Page → `salesforceCopilotDashboard` → Mission Control.

## P0 completion record

| Item                                                  | Outcome  | Evidence                                                                                                                                                                                                                       |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0 #1 — separate product and practice metadata        | Complete | Account practice fields, list views, and web link moved to `practice-app`; explicit product manifest created.                                                                                                                  |
| P0 #2 — Apex test coverage and deployment gate        | Complete | 11 Apex tests pass; controller coverage is 80% for `FlowMetadataController`, 88% for `OrgContextController`, and 100% for `OrgExplorerController`; production-style validation passes.                                         |
| P0 #3 — least-privilege product permission model      | Complete | `Salesforce_AI_Lab_User` grants only required Apex, app/tab, Lightning, and read-only setup visibility. No business-object CRUD/FLS or broad data authority is granted.                                                        |
| P0 #4 — clean-org installation and runtime validation | Complete | Product-only deployment, permission assignment, packaged launch, reduced Technical Admin browser smoke test, metadata diagnostics, workspace navigation, and safe error behavior passed in a disposable Developer scratch org. |

## Permission model and personas

`Salesforce_AI_Lab_User` is the minimum product-access artifact. It grants:

- access to `FlowMetadataController`, `OrgContextController`, and `OrgExplorerController`;
- visibility for the Salesforce AI Lab Lightning application and tab;
- Lightning Experience User, which is required to launch the packaged Lightning application;
- View Setup and Configuration for administrator-facing metadata diagnostics;
- View Roles, required by Salesforce as a dependency of View Setup and Configuration.

It does **not** grant API Enabled, Modify All Data, View All Data, Manage Users, Author Apex, Customize Application, business-object CRUD/FLS, or record access.

The installing organization owns the distinction between product access and implementation authority:

| Persona                | Authority                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Salesforce AI Lab User | Minimum product access supplied by `Salesforce_AI_Lab_User`.                                                         |
| Diagnostic Admin       | Product access plus organization-approved visibility needed to analyze and inspect metadata.                         |
| Implementation Admin   | Product access plus separately granted Salesforce configuration permissions needed to implement approved changes.    |
| System Administrator   | Broad Salesforce authority supplied by Salesforce plus product access; not required merely to run Salesforce AI Lab. |

Salesforce AI Lab must not grant implementation authority merely because a user can inspect the org or use the product. Object, field, sharing, record, and configuration permissions remain governed by the organization.

## Clean-org validation evidence

The August 5 validation used a disposable Developer scratch org created from `config/project-scratch-def.json`. The active Enterprise sandbox was not modified.

Verified outcomes:

- product-only deployment succeeded and practice metadata was absent;
- all 11 Apex tests passed with 85% org-wide coverage in the validation org;
- `Salesforce_AI_Lab_User` compiled, deployed, and remained assigned to the reduced persona;
- the Technical Admin entered Lightning Experience and launched Salesforce AI Lab;
- Mission Control, Daily Brief, Org Explorer, Org Health, Org Knowledge, Explain This, Action Center, Flow Intelligence, Ask Before You Build / Consultant Lens, Troubleshooting Assistant, and All Tools loaded and navigated successfully;
- Action Center saved and updated a browser-local action;
- no unexpected permission errors or broken application screens appeared;
- the product permission set did not add Account object or field access;
- source and runtime review found no business-record retrieval or access bypass in the metadata controllers.

Schema and configuration inspection is intentional for authorized administrators. Business record values must continue to obey Salesforce object, field, sharing, and record-level controls.

## Explain This Flow routing defect

The clean-org smoke test found a real deterministic routing defect when Mission Control passed the Flow finding for `AddAttnd` to Explain This:

1. Mission Control correctly passed `entityType: flow` and `entityApiName: AddAttnd`.
2. Explain This incorrectly converted every non-field request to `entityType: object`.
3. The explanation engine returned a deterministic not-found result for an object named `AddAttnd`.
4. The workspace stored the error but did not render its existing error state, producing an apparent no-op.

The request builder now preserves structured metadata types, and the workspace renders a visible deterministic error for unsupported or missing metadata. Focused tests cover a successful Flow explanation, supported object behavior, no-match behavior, and the Mission Control context handoff. The corrected bundle was validated, deployed to the disposable org, and manually confirmed: `AddAttnd` now produces a visible Flow explanation.

## Installation sequence

1. Obtain an appropriate Salesforce org.
2. Validate and deploy `manifest/package.xml`.
3. Assign `Salesforce_AI_Lab_User` to an authorized administrator or technical administrator.
4. Open the Salesforce AI Lab Lightning application.
5. Run the initial Org Knowledge diagnostics.
6. Smoke-test the core workspaces.

See `docs/INSTALLATION.md` for commands and the validation checklist.

## Remaining non-P0 risks

- Admin Actions and Org Knowledge trend state use browser `localStorage`; they are not shared, audited Salesforce records.
- Live collection covers foundation metadata and Flows; unsupported advanced categories must remain explicit coverage limitations.
- Static module enablement is not yet capability-aware.
- Mixed component API versions should be aligned to a documented baseline.
- No unlocked-package, namespace, installation-upgrade, or collision validation exists yet.
- User identity returned by Org Context should receive a future data-minimization review.
- Automated browser regression is not yet part of CI; the final least-privilege runtime gate was manual.

## Next portability level

Level 3 work should focus on governed Salesforce persistence, broader permission-edge automation, capability-aware metadata providers, API-version alignment, and package install/upgrade testing. These improvements must retain the deterministic core and keep AI optional.
