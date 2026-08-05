# Salesforce AI Lab Installation

Salesforce AI Lab is intended for authorized Salesforce administrators and technical administrators. It is not an ordinary business-user application.

## Prerequisites

- A Salesforce org that supports Lightning Experience and Metadata API version 66.0.
- Salesforce CLI authenticated to the target org.
- An installer with permission to deploy metadata and assign permission sets.

The product deployment does not include `practice-app` and does not require its Account metadata.

## Deploy the product

Validate first:

```powershell
sf project deploy validate --manifest manifest/package.xml --target-org TARGET_ORG --test-level RunSpecifiedTests --tests FlowMetadataControllerTest --tests OrgContextControllerTest --tests OrgExplorerControllerTest --wait 30
```

After a successful validation, install into the intended org:

```powershell
sf project deploy start --manifest manifest/package.xml --target-org TARGET_ORG --test-level RunSpecifiedTests --tests FlowMetadataControllerTest --tests OrgContextControllerTest --tests OrgExplorerControllerTest --wait 30
```

Do not deploy `practice-app` as part of the product installation.

## Assign administrator access

Assign the base permission set to each product user:

```powershell
sf org assign permset --name Salesforce_AI_Lab_User --target-org TARGET_ORG --on-behalf-of USERNAME
```

`Salesforce_AI_Lab_User` provides access to the product app, tab, three Apex controllers, Lightning Experience, and View Setup and Configuration. Salesforce requires View Roles as a dependency of View Setup and Configuration. Lightning Experience User is required to launch the packaged application, while the read-only setup permissions are required because Flow and metadata analysis are fundamental product functions.

Assign this permission set only to authorized Salesforce administrators or technical administrators. The user does not have to use the System Administrator profile if their existing profile and assignments provide Lightning Experience access and the organization-specific object and field visibility appropriate to their role.

The permission set does not grant API Enabled, Modify All Data, View All Data, Manage Users, Author Apex, Customize Application, business-object CRUD, field permissions, broad record access, or Salesforce implementation authority. Analyses reflect the business-object and field access held separately by each administrator.

### Administrator personas

Product access and implementation authority are intentionally separate:

- **Salesforce AI Lab User:** minimum product access supplied by `Salesforce_AI_Lab_User`.
- **Diagnostic Admin:** product access plus organization-approved visibility needed to analyze and inspect metadata.
- **Implementation Admin:** product access plus separately granted Salesforce configuration permissions needed to implement approved changes.
- **System Administrator:** broad Salesforce authority supplied by Salesforce plus product access; this profile is not required merely to run Salesforce AI Lab.

Salesforce AI Lab must not grant implementation authority merely because a person can inspect the org or use the product. The installing organization remains responsible for object, field, sharing, record, and configuration permissions.

## Open Salesforce AI Lab

1. Sign in as the assigned user.
2. Open the Lightning App Launcher.
3. Select **Salesforce AI Lab**.
4. Open the **Salesforce AI Lab** navigation tab if it is not already selected.

The landing page hosts the existing Mission Control shell. Its workspace router opens Explain This, Action Center, Org Explorer, Org Health, Org Knowledge, and other enabled tools without additional page construction.

## First launch and Org Knowledge scan

1. Confirm Mission Control renders without a fatal error.
2. Open **Org Knowledge**.
3. Start the default scan.
4. Review the coverage summary and warnings before relying on findings.
5. Treat omitted objects, fields, record types, and setup categories as permission or provider coverage limits—not proof that the metadata does not exist.

If a particular metadata category remains unavailable, the application should surface an empty result, warning, or coverage limitation rather than require broader administrative access.

## Smoke tests

- Mission Control loads and returns from child workspaces.
- Explain This opens and handles an accessible object or field.
- Action Center opens and can manage browser-local prototype actions.
- Org Context lists only accessible/queryable objects and accessible fields.
- Org Explorer returns an accessible object and handles an unknown object safely.
- Org Health and Org Knowledge complete with explicit coverage limitations instead of fatal errors.
- Flow metadata is available through the base administrator permission set.
- A metadata category unavailable to the administrator produces a warning or coverage limitation without granting broader access.

## Known limitations

- Admin Actions and prior Org Knowledge trend state use browser `localStorage`; they are not shared Salesforce records.
- Metadata results vary with the user's object, field, record-type, and setup visibility.
- Org Explorer intentionally exposes schema diagnostics to authorized administrators, but it must never return record values or grant object/field access. Its behavior should still be tested with a technical administrator whose business-object permissions are restricted.
- The base permission set includes View Roles only because Salesforce requires it as a dependency of View Setup and Configuration.

## Clean-org validation

The documented sequence was validated in a disposable Developer scratch org on August 5, 2026:

1. Create a scratch org from `config/project-scratch-def.json`.
2. Deploy only `manifest/package.xml` with the three specified Apex tests.
3. Assign `Salesforce_AI_Lab_User`.
4. Open the packaged **Salesforce AI Lab** application and tab.
5. Run the workspace smoke tests above.

The deployment and all 11 Apex tests succeeded. A reduced Technical Admin using **Minimum Access - Salesforce** plus `Salesforce_AI_Lab_User` entered Lightning Experience, launched the packaged application, and completed the browser smoke test without unexpected permission errors or broken screens.

The verified browser path covered Mission Control, Daily Brief, Org Explorer, Org Health, Org Knowledge, Explain This, Action Center create/update behavior, Flow Intelligence, Ask Before You Build / Consultant Lens, Troubleshooting Assistant, and All Tools navigation. The Mission Control `AddAttnd` Flow finding also produced a visible deterministic Explain This result after the Flow context-routing correction.

A second scratch-org user was validated with the **Minimum Access - Salesforce** profile plus `Salesforce_AI_Lab_User`. That combination received no Account object or field permissions from either the profile or product permission set. It also did not receive API Enabled, Modify All Data, View All Data, Manage Users, Author Apex, or Customize Application. Salesforce CLI automation as that user was intentionally unavailable because neither assignment grants API Enabled; API Enabled is not a product runtime requirement and should not be added solely for CLI smoke testing.

## Developer-machine CLI troubleshooting

These settings are local troubleshooting only. They are not Salesforce AI Lab installation requirements:

```powershell
$env:SHELL = 'cmd.exe'
$env:NODE_EXTRA_CA_CERTS = 'C:\ProgramData\AVG\Antivirus\wscert.pem'
```

The certificate path is specific to a machine using AVG TLS inspection. Do not copy it to machines that do not use that certificate.
