/*
 * issueTemplates.js
 *
 * Builds complete troubleshooting recommendations for the
 * Salesforce Copilot Troubleshooting Assistant.
 *
 * issueParser.js identifies the problem.
 * issueRules.js selects the diagnostic path.
 * This file builds the full troubleshooting response.
 */

import { DIAGNOSIS_TYPES } from './issueRules';

export function buildTroubleshootingGuide(
    diagnosis = {},
    originalIssue = ''
) {
    let guide;

    switch (diagnosis.diagnosisType) {
        case DIAGNOSIS_TYPES.CLARIFICATION:
            guide = createClarificationGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.FLOW_NOT_STARTING:
            guide = createFlowNotStartingGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.FLOW_RUNTIME_FAILURE:
            guide = createFlowRuntimeGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.RECORD_CREATION_FAILURE:
            guide = createRecordCreationGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.RECORD_UPDATE_FAILURE:
            guide = createRecordUpdateGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.SAVE_BLOCKED:
            guide = createSaveBlockedGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.ACCESS_DENIED:
            guide = createAccessDeniedGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.DUPLICATE_BLOCK:
            guide = createDuplicateGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.APPROVAL_FAILURE:
            guide = createApprovalGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.EMAIL_DELIVERY_FAILURE:
            guide = createEmailGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.APEX_FAILURE:
            guide = createApexGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.GOVERNOR_LIMIT_FAILURE:
            guide = createGovernorLimitGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.INTEGRATION_FAILURE:
            guide = createIntegrationGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.DATA_OPERATION_FAILURE:
            guide = createDataGuide(
                diagnosis,
                originalIssue
            );
            break;

        case DIAGNOSIS_TYPES.REPORTING_FAILURE:
            guide = createReportingGuide(
                diagnosis,
                originalIssue
            );
            break;

        default:
            guide = createGeneralGuide(
                diagnosis,
                originalIssue
            );
            break;
    }

    return applyDiagnosisMetadata(
        guide,
        diagnosis
    );
}

function createBaseGuide(
    diagnosis,
    originalIssue
) {
    return {
        originalIssue:
            originalIssue || '',

        title:
            'Salesforce Troubleshooting Guide',

        issueType:
            diagnosis?.parsedIssue
                ?.issueTypeLabel ||
            'Salesforce Issue',

        object:
            diagnosis?.parsedIssue?.object ||
            'Not clearly identified',

        symptom:
            diagnosis?.parsedIssue?.symptom ||
            'General Salesforce issue',

        severity:
            diagnosis?.parsedIssue?.severity ||
            'Medium',

        timing:
            diagnosis?.parsedIssue?.timing ||
            'Not clearly identified',

        confidence:
            diagnosis?.confidence || 0,

        confidenceLabel:
            diagnosis?.confidenceLabel || 'Low',

        priority:
            diagnosis?.priority || 'P3',

        estimatedResolution:
            diagnosis?.estimatedResolution ||
            '1–3 business days',

        matchedRule:
            diagnosis?.matchedRule || '',

        summary:
            '',

        likelyCauses:
            [],

        investigationSteps:
            [],

        fixChecklist:
            [],

        testCases:
            [],

        preventionRecommendations:
            [],

        escalationCriteria:
            [],

        recommendedContext:
            Array.isArray(
                diagnosis?.recommendedContext
            )
                ? [
                      ...diagnosis
                          .recommendedContext
                  ]
                : [],

        interviewAnswer:
            '',

        adminNotes:
            ''
    };
}

function applyDiagnosisMetadata(
    guide,
    diagnosis
) {
    return {
        ...guide,

        confidence:
            diagnosis?.confidence ||
            guide.confidence,

        confidenceLabel:
            diagnosis?.confidenceLabel ||
            guide.confidenceLabel,

        priority:
            diagnosis?.priority ||
            guide.priority,

        estimatedResolution:
            diagnosis?.estimatedResolution ||
            guide.estimatedResolution,

        matchedRule:
            diagnosis?.matchedRule ||
            guide.matchedRule,

        ruleReasons:
            Array.isArray(
                diagnosis?.reasons
            )
                ? [...diagnosis.reasons]
                : []
    };
}

function createClarificationGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'More Information Required';

    guide.summary =
        'The issue description does not contain enough detail to identify a reliable Salesforce troubleshooting path. Gather the missing context before making configuration changes.';

    guide.likelyCauses = [
        'The affected Salesforce feature was not identified.',
        'The exact symptom or error message was not provided.',
        'The affected object or record was not identified.',
        'The number of impacted users is unknown.',
        'The steps required to reproduce the issue are unclear.'
    ];

    guide.investigationSteps = [
        'Capture the exact error message or unexpected behavior.',
        'Identify the affected Salesforce object and record.',
        'Document the steps that reproduce the issue.',
        'Confirm whether the issue affects one user or multiple users.',
        'Confirm whether the issue occurs in production, sandbox, or both.',
        'Identify recent configuration, deployment, permission, or data changes.',
        'Retry the analysis after adding the missing details.'
    ];

    guide.fixChecklist = [
        'Record the exact error message.',
        'Capture the affected record ID.',
        'Identify the affected user.',
        'Identify the Salesforce feature involved.',
        'Document reproduction steps.',
        'Document expected behavior.',
        'Document actual behavior.'
    ];

    guide.testCases = [
        'Repeat the same action with the affected user.',
        'Repeat the action with a System Administrator.',
        'Test a different record of the same object.',
        'Test in a sandbox if available.',
        'Compare working and failing scenarios.'
    ];

    guide.preventionRecommendations = [
        'Require issue reports to include screenshots and exact error text.',
        'Use a standard troubleshooting intake template.',
        'Capture user, record, date, time, and reproduction steps.',
        'Document recent deployments and configuration changes.'
    ];

    guide.escalationCriteria = [
        'The issue affects production users.',
        'The issue blocks a business-critical process.',
        'The issue cannot be reproduced consistently.',
        'The issue may involve data loss or security exposure.'
    ];

    guide.interviewAnswer =
        'Before changing configuration, I would gather the exact error, affected user, object, record, reproduction steps, expected result, and recent changes. Good troubleshooting begins with confirming the problem and narrowing the scope.';

    guide.adminNotes =
        'Do not make speculative configuration changes until the issue can be reproduced or clearly described.';

    return guide;
}

function createFlowNotStartingGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Flow Trigger Failure';

    guide.summary =
        'The automation appears not to start. The most likely causes are an inactive Flow version, incorrect trigger configuration, unmet entry criteria, or record changes that do not qualify the transaction.';

    guide.likelyCauses = [
        'The correct Flow version is not active.',
        'The Flow is configured for the wrong object.',
        'Entry criteria are not met.',
        'The Flow runs only when the record changes to meet criteria, but the record already met the criteria.',
        'The Flow is configured for create when the test uses update, or vice versa.',
        'The triggering field values differ from the expected values.',
        'Another automation changes the record before the Flow evaluates it.',
        'The user does not have access required by the Flow.'
    ];

    guide.investigationSteps = [
        'Confirm the expected Flow version is active.',
        'Verify the triggering object.',
        'Review create, update, or create-and-update settings.',
        'Review every entry-criteria condition.',
        'Compare the test record values to the entry criteria.',
        'Confirm whether the Flow requires the record to change to meet the criteria.',
        'Use Flow Debug with the failing record values.',
        'Review other automation running on the same object.',
        'Test as the affected user where possible.',
        'Review debug logs and failed Flow interviews.'
    ];

    guide.fixChecklist = [
        'Activate the correct Flow version.',
        'Correct the triggering object if necessary.',
        'Correct entry criteria.',
        'Correct create-versus-update settings.',
        'Choose the correct optimization mode.',
        'Review record-change requirements.',
        'Add descriptions to the Start element.',
        'Create a test record that definitively meets criteria.',
        'Document expected trigger behavior.'
    ];

    guide.testCases = [
        'Create a record that meets all criteria.',
        'Create a record that does not meet criteria.',
        'Update a record so it newly meets criteria.',
        'Update a record that already met criteria.',
        'Test with blank values.',
        'Test with a restricted user.',
        'Test a bulk update.'
    ];

    guide.preventionRecommendations = [
        'Use narrow and documented entry criteria.',
        'Add descriptions to the Flow and Start element.',
        'Maintain a Flow inventory by object and trigger.',
        'Use regression tests for every Flow change.',
        'Avoid overlapping automation on the same object.'
    ];

    guide.escalationCriteria = [
        'The Flow works in Debug but not in live transactions.',
        'Multiple automations may conflict.',
        'The Flow intermittently fails.',
        'The issue affects a critical production process.'
    ];

    guide.interviewAnswer =
        'For a Flow that does not start, I first confirm the active version, trigger object, create-or-update configuration, and entry criteria. I then compare actual record values, check whether the Flow requires the record to change to meet criteria, debug the Flow, and review other automation on the same object.';

    guide.adminNotes =
        'Start with the Start element. Most non-starting Flow problems are caused before the first Flow element executes.';

    return guide;
}

function createFlowRuntimeGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Flow Runtime Failure';

    guide.summary =
        'The Flow starts but fails during execution. The investigation should focus on the failed element, missing fault handling, invalid data, permissions, downstream automation, and transaction limits.';

    guide.likelyCauses = [
        'A data element failed.',
        'A required field value is missing.',
        'A Validation Rule blocked the transaction.',
        'The running user lacks object or field access.',
        'A downstream Flow, trigger, or process failed.',
        'A null record or variable was used.',
        'A collection was empty or contained unexpected values.',
        'The Flow exceeded a platform limit.',
        'The Flow does not have a fault path.'
    ];

    guide.investigationSteps = [
        'Open the Flow error email or failed Flow interview.',
        'Identify the exact failed element.',
        'Capture the error message and affected record ID.',
        'Review input variables and record values.',
        'Check required fields on the target object.',
        'Review active Validation Rules.',
        'Review field-level and object permissions.',
        'Review duplicate-management rules.',
        'Review downstream Flows and Apex.',
        'Run Flow Debug using the failing data.',
        'Add or review fault paths.'
    ];

    guide.fixChecklist = [
        'Correct the failing element.',
        'Populate required values.',
        'Handle null records and empty collections.',
        'Add permission-safe behavior.',
        'Add fault paths to data and action elements.',
        'Add a fault logging or notification mechanism.',
        'Review bulk behavior.',
        'Create regression tests.'
    ];

    guide.testCases = [
        'Successful execution path.',
        'Missing required value.',
        'Restricted-user execution.',
        'Validation Rule failure.',
        'Duplicate Rule failure.',
        'Empty collection.',
        'Bulk-record processing.',
        'Fault-path execution.'
    ];

    guide.preventionRecommendations = [
        'Add fault paths to every data operation.',
        'Use meaningful element labels.',
        'Document expected inputs and outputs.',
        'Validate record collections before using them.',
        'Use centralized error logging.',
        'Test both individual and bulk transactions.'
    ];

    guide.escalationCriteria = [
        'The error originates from Apex.',
        'The error involves a governor limit.',
        'The failure is intermittent.',
        'The Flow performs external callouts.',
        'The failure affects many production users.'
    ];

    guide.interviewAnswer =
        'For a Flow runtime failure, I identify the exact failed element and error message first. I then review the data being passed, required fields, Validation Rules, permissions, duplicate rules, downstream automation, and fault handling. I reproduce the issue in Debug and add regression tests after the fix.';

    guide.adminNotes =
        'The exact failed element and error message are the fastest path to isolating a runtime issue.';

    return guide;
}

function createRecordCreationGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Record Creation Failure';

    guide.summary =
        'The Flow or automation fails while creating a record. Required fields, restricted values, permissions, Validation Rules, Duplicate Rules, and downstream automation are the most likely causes.';

    guide.likelyCauses = [
        'A required field is blank.',
        'A restricted picklist value is invalid.',
        'The user lacks create permission.',
        'The user lacks field-level access.',
        'A Validation Rule blocks the record.',
        'A Duplicate Rule blocks creation.',
        'The owner or lookup value is invalid.',
        'A downstream automation fails.',
        'The Create Records element is using the wrong values.'
    ];

    guide.investigationSteps = [
        'Identify the target object.',
        'Review the exact values passed into Create Records.',
        'Check required fields and conditional requiredness.',
        'Check restricted picklists.',
        'Check object create permission.',
        'Check field-level security.',
        'Review Validation Rules.',
        'Review Matching Rules and Duplicate Rules.',
        'Review lookup and owner values.',
        'Test manual record creation using the same values.',
        'Review downstream automation.'
    ];

    guide.fixChecklist = [
        'Populate all required fields.',
        'Correct invalid picklist values.',
        'Correct lookup or owner values.',
        'Grant appropriate permissions.',
        'Add bypass logic only when justified.',
        'Add fault handling.',
        'Prevent duplicate creation.',
        'Document required inputs.',
        'Test manual and automated creation.'
    ];

    guide.testCases = [
        'Create with all required fields.',
        'Create with a missing required field.',
        'Create with an invalid picklist value.',
        'Create as a restricted user.',
        'Create a possible duplicate.',
        'Create with an invalid lookup.',
        'Create multiple records in bulk.'
    ];

    guide.preventionRecommendations = [
        'Document required fields for automated creation.',
        'Use Record Type-aware values.',
        'Validate lookup IDs before DML.',
        'Use fault paths.',
        'Test duplicate-management behavior.',
        'Avoid hardcoded IDs.'
    ];

    guide.escalationCriteria = [
        'The failure originates from managed-package automation.',
        'The error is caused by Apex.',
        'The issue is volume-related.',
        'Required fields differ by record type.',
        'The issue affects critical production automation.'
    ];

    guide.interviewAnswer =
        'For a record-creation failure, I inspect the values passed into Create Records, confirm required fields, validate picklists and lookups, review create and field permissions, check Validation and Duplicate Rules, and then test manual creation with the same data.';

    guide.adminNotes =
        'Attempting manual record creation with the same values often reveals the blocking configuration quickly.';

    return guide;
}

function createRecordUpdateGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Record Update Failure';

    guide.summary =
        'The automation fails while updating an existing record. Access, record locking, Validation Rules, restricted values, stale data, and automation conflicts are common causes.';

    guide.likelyCauses = [
        'The running user lacks edit permission.',
        'Field-level security blocks the update.',
        'The user lacks access to the record.',
        'A Validation Rule blocks the new value.',
        'The record is locked by an Approval Process.',
        'A restricted picklist value is invalid.',
        'Another transaction holds a record lock.',
        'Downstream automation fails.',
        'The update targets the wrong record.'
    ];

    guide.investigationSteps = [
        'Identify the exact target record.',
        'Confirm the user can edit it manually.',
        'Review object and field permissions.',
        'Review sharing and ownership.',
        'Check approval-lock status.',
        'Review Validation Rules.',
        'Review restricted picklists.',
        'Review downstream Flows and Apex.',
        'Check for record-locking errors.',
        'Run Debug using the failing record.'
    ];

    guide.fixChecklist = [
        'Correct the record-selection logic.',
        'Grant appropriate edit access.',
        'Correct invalid field values.',
        'Address record locking.',
        'Adjust Validation Rule logic if justified.',
        'Prevent repeated updates.',
        'Add fault handling.',
        'Document update ownership.'
    ];

    guide.testCases = [
        'Update as an administrator.',
        'Update as the affected user.',
        'Update an owned record.',
        'Update a shared record.',
        'Update a locked record.',
        'Update with invalid values.',
        'Bulk update multiple records.'
    ];

    guide.preventionRecommendations = [
        'Use precise record-selection criteria.',
        'Avoid unnecessary repeated updates.',
        'Document record-access assumptions.',
        'Review automation order.',
        'Use fault paths and error logging.',
        'Test locked and shared records.'
    ];

    guide.escalationCriteria = [
        'The issue involves record locking.',
        'The issue is intermittent under load.',
        'Multiple automations update the same object.',
        'The failure originates in Apex.',
        'Data integrity may be affected.'
    ];

    guide.interviewAnswer =
        'For an update failure, I confirm the target record, reproduce the edit manually, review object and field permissions, sharing, record locking, Validation Rules, picklist values, and downstream automation. I also test bulk behavior and repeated execution.';

    guide.adminNotes =
        'Always confirm whether the record is locked or inaccessible before changing automation logic.';

    return guide;
}

function createSaveBlockedGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Validation or Save Failure';

    guide.summary =
        'The record cannot be saved. Review the exact error, Validation Rules, required fields, restricted picklists, duplicate rules, permissions, record locking, and automation failures.';

    guide.likelyCauses = [
        'A Validation Rule evaluates to true.',
        'A required field is blank.',
        'A restricted picklist value is invalid.',
        'A Duplicate Rule blocks the save.',
        'The record is locked.',
        'The user lacks field or object permission.',
        'A Flow or Apex trigger fails during save.',
        'The record type does not allow the selected value.'
    ];

    guide.investigationSteps = [
        'Capture the exact save error.',
        'Identify the field or page error location.',
        'Review active Validation Rules.',
        'Review required fields.',
        'Review restricted picklists.',
        'Review Duplicate Rules.',
        'Check record-lock status.',
        'Review user permissions.',
        'Review save-triggered Flows and Apex.',
        'Test as System Administrator and affected user.'
    ];

    guide.fixChecklist = [
        'Correct invalid record data.',
        'Correct the Validation Rule if business logic is wrong.',
        'Add a clear error message.',
        'Add controlled bypass logic only when justified.',
        'Correct record-type picklist values.',
        'Grant appropriate access.',
        'Fix failing automation.',
        'Document the resolved condition.'
    ];

    guide.testCases = [
        'Valid record saves.',
        'Invalid record is blocked.',
        'Error message is clear.',
        'Affected user behavior.',
        'Administrator behavior.',
        'Integration-user behavior.',
        'Bulk-load behavior.'
    ];

    guide.preventionRecommendations = [
        'Use clear Validation Rule descriptions.',
        'Avoid overlapping save-blocking rules.',
        'Document bypass logic.',
        'Test integrations and imports.',
        'Use actionable error messages.',
        'Review record-type dependencies.'
    ];

    guide.escalationCriteria = [
        'The error has no actionable message.',
        'Managed-package automation is involved.',
        'The rule impacts integrations.',
        'Multiple save-time automations conflict.',
        'The issue blocks a critical process.'
    ];

    guide.interviewAnswer =
        'For a blocked save, I capture the exact error first, then review Validation Rules, required fields, restricted picklists, Duplicate Rules, record locks, user permissions, and save-time automation. I compare administrator and affected-user behavior to isolate security from business logic.';

    guide.adminNotes =
        'The exact save error usually points directly to the first configuration area to inspect.';

    return guide;
}

function createAccessDeniedGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Permission or Record Access Issue';

    guide.summary =
        'The user cannot view, create, edit, or delete the expected data. Troubleshooting should follow the Salesforce access model from object permission through field access and record-level sharing.';

    guide.likelyCauses = [
        'The profile or Permission Set lacks object permission.',
        'Field-level security hides or prevents edits.',
        'Organization-Wide Defaults restrict access.',
        'The user is outside the relevant role hierarchy.',
        'A Sharing Rule does not apply.',
        'The record owner has not shared the record.',
        'The user lacks access to a related parent record.',
        'The Lightning page hides the field or action.'
    ];

    guide.investigationSteps = [
        'Identify the exact user and requested action.',
        'Check object permissions.',
        'Check field-level security.',
        'Check record ownership.',
        'Review Organization-Wide Defaults.',
        'Review role hierarchy.',
        'Review Sharing Rules.',
        'Review manual sharing and teams.',
        'Review record-type access.',
        'Review Lightning page visibility.',
        'Use User Access Summary where available.'
    ];

    guide.fixChecklist = [
        'Grant the minimum required object permission.',
        'Grant required field access.',
        'Correct record-level sharing.',
        'Correct role or group membership.',
        'Correct record-type access.',
        'Correct component visibility.',
        'Document the access requirement.',
        'Retest using the affected user.'
    ];

    guide.testCases = [
        'Affected user can perform the intended action.',
        'Restricted user remains restricted.',
        'Record owner behavior.',
        'Role hierarchy behavior.',
        'Sharing Rule behavior.',
        'Field visibility.',
        'Record-type access.'
    ];

    guide.preventionRecommendations = [
        'Use Permission Sets instead of excessive profile customization.',
        'Document the security model.',
        'Use least-privilege access.',
        'Review sharing before changing OWD.',
        'Test with representative users.',
        'Maintain access-matrix documentation.'
    ];

    guide.escalationCriteria = [
        'The issue may expose sensitive data.',
        'Changing OWD is being considered.',
        'Complex sharing architecture is involved.',
        'A managed package controls access.',
        'The requested access conflicts with policy.'
    ];

    guide.interviewAnswer =
        'For an access issue, I troubleshoot from object permission to field-level security, then record-level access through ownership, OWD, role hierarchy, Sharing Rules, groups, and teams. I also check record types and Lightning visibility, then retest as the affected user.';

    guide.adminNotes =
        'Do not solve record-level access problems by granting broad administrative permissions.';

    return guide;
}

function createDuplicateGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Duplicate Management Issue';

    guide.summary =
        'Salesforce detected or blocked a possible duplicate. Review Matching Rules, Duplicate Rules, matching fields, user permissions, and whether the desired behavior should allow or block the record.';

    guide.likelyCauses = [
        'The Matching Rule is too broad.',
        'The Duplicate Rule is configured to block.',
        'Blank values are treated unexpectedly.',
        'The wrong fields are used for matching.',
        'Users lack permission to view the matching record.',
        'Integration behavior differs from user-interface behavior.',
        'Existing duplicate data triggers the rule.'
    ];

    guide.investigationSteps = [
        'Capture the duplicate warning.',
        'Identify the Matching Rule.',
        'Identify the Duplicate Rule.',
        'Review fields used for matching.',
        'Review exact versus fuzzy matching.',
        'Review allow-versus-block behavior.',
        'Review user and integration behavior.',
        'Search for the existing matching record.',
        'Test representative values.'
    ];

    guide.fixChecklist = [
        'Correct matching criteria.',
        'Correct allow-or-block behavior.',
        'Correct blank-value handling.',
        'Review field normalization.',
        'Test integration behavior.',
        'Clean existing duplicates if needed.',
        'Document duplicate-management policy.'
    ];

    guide.testCases = [
        'Exact duplicate.',
        'Near duplicate.',
        'Blank email or phone.',
        'Different formatting.',
        'User with access to matching record.',
        'User without access.',
        'Integration insert.',
        'Bulk import.'
    ];

    guide.preventionRecommendations = [
        'Normalize matching fields.',
        'Document duplicate policy.',
        'Test Matching and Duplicate Rules together.',
        'Review integration behavior.',
        'Monitor duplicate reports.',
        'Provide merge guidance.'
    ];

    guide.escalationCriteria = [
        'Legitimate records are blocked broadly.',
        'Integration loads fail.',
        'Large-scale cleanup is required.',
        'Cross-object matching is required.',
        'Duplicate rules conflict with business policy.'
    ];

    guide.interviewAnswer =
        'For duplicate issues, I identify the Matching Rule and Duplicate Rule, review matching fields and fuzzy behavior, confirm allow-versus-block settings, test user and integration scenarios, and check whether existing data requires cleanup.';

    guide.adminNotes =
        'Matching Rules determine similarity; Duplicate Rules determine what Salesforce does about the match.';

    return guide;
}

function createApprovalGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Approval Process Issue';

    guide.summary =
        'The record cannot be submitted, routed, approved, rejected, or recalled correctly. Review entry criteria, submitter eligibility, approver routing, record locking, and approval actions.';

    guide.likelyCauses = [
        'The record does not meet entry criteria.',
        'The user is not an allowed submitter.',
        'The approver cannot be resolved.',
        'The approver is inactive or unavailable.',
        'The record is already locked or submitted.',
        'Approval actions conflict with automation.',
        'The wrong Approval Process is active.',
        'Recall or rejection behavior is incomplete.'
    ];

    guide.investigationSteps = [
        'Confirm the active Approval Process.',
        'Review entry criteria.',
        'Review allowed submitters.',
        'Review approver routing.',
        'Confirm approver activity and access.',
        'Review approval history.',
        'Check record-lock status.',
        'Review submission, approval, rejection, and recall actions.',
        'Review supporting Flows.',
        'Test with a qualifying record.'
    ];

    guide.fixChecklist = [
        'Correct entry criteria.',
        'Correct submitter settings.',
        'Correct approver routing.',
        'Resolve inactive approvers.',
        'Correct record-lock behavior.',
        'Correct approval actions.',
        'Document lifecycle states.',
        'Test submission through recall.'
    ];

    guide.testCases = [
        'Qualifying record submission.',
        'Non-qualifying record.',
        'Correct approver.',
        'Approval.',
        'Rejection.',
        'Recall.',
        'Delegated approver.',
        'Locked-record behavior.'
    ];

    guide.preventionRecommendations = [
        'Document approval entry criteria.',
        'Avoid hardcoded approver IDs.',
        'Use queues, roles, or lookup-based routing where appropriate.',
        'Test the full lifecycle.',
        'Document record-lock behavior.',
        'Monitor inactive approvers.'
    ];

    guide.escalationCriteria = [
        'Approver routing is highly dynamic.',
        'Multiple Approval Processes overlap.',
        'Managed-package approval logic is involved.',
        'Record locking impacts integrations.',
        'The approval is legally or financially sensitive.'
    ];

    guide.interviewAnswer =
        'For an Approval Process issue, I verify the active process, entry criteria, submitter eligibility, approver routing, approval history, record-lock behavior, and actions for submit, approve, reject, and recall.';

    guide.adminNotes =
        'Check whether the record meets entry criteria before investigating approver routing.';

    return guide;
}

function createEmailGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Email or Notification Delivery Issue';

    guide.summary =
        'An expected email or notification was not received. Confirm that the automation ran, the recipient was valid, deliverability permits sending, and the template and sender configuration are correct.';

    guide.likelyCauses = [
        'The automation did not run.',
        'The recipient email is blank or invalid.',
        'Deliverability is restricted.',
        'The Org-Wide Email Address is not verified.',
        'The template is inactive or inaccessible.',
        'The Email Alert uses the wrong recipients.',
        'The message was filtered as spam.',
        'Email limits were reached.',
        'The Flow followed a fault path.'
    ];

    guide.investigationSteps = [
        'Confirm the automation executed.',
        'Confirm the recipient email value.',
        'Review Deliverability settings.',
        'Review Org-Wide Email Address verification.',
        'Review Email Alert configuration.',
        'Review template access and status.',
        'Review Flow fault handling.',
        'Request email logs.',
        'Check spam and quarantine.',
        'Test with a known valid recipient.'
    ];

    guide.fixChecklist = [
        'Correct the recipient source.',
        'Verify the Org-Wide Email Address.',
        'Correct Deliverability settings.',
        'Correct the Email Alert.',
        'Correct the email template.',
        'Add fault handling.',
        'Document sender and recipient logic.',
        'Retest and review logs.'
    ];

    guide.testCases = [
        'Valid internal recipient.',
        'Valid external recipient.',
        'Blank recipient.',
        'Unverified sender.',
        'Restricted Deliverability.',
        'Fault-path scenario.',
        'Multiple-recipient scenario.'
    ];

    guide.preventionRecommendations = [
        'Use verified Org-Wide Email Addresses.',
        'Document recipient logic.',
        'Add email fault handling.',
        'Monitor email limits.',
        'Test sandbox Deliverability settings.',
        'Use email logs for production investigations.'
    ];

    guide.escalationCriteria = [
        'Email logs show successful delivery but no receipt.',
        'A mail gateway rejects the message.',
        'Email limits are reached.',
        'Compliance-sensitive communication is affected.',
        'Managed-package email behavior is involved.'
    ];

    guide.interviewAnswer =
        'For a missing Salesforce email, I confirm the automation ran, validate the recipient, review Deliverability, Org-Wide Email Addresses, Email Alerts, templates, fault paths, limits, and email logs.';

    guide.adminNotes =
        'A successful Flow does not always mean successful email delivery; confirm both execution and delivery configuration.';

    return guide;
}

function createApexGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Apex Execution Failure';

    guide.summary =
        'Custom Apex encountered an exception. Use the full exception, stack trace, failing line, record context, and debug log to isolate the root cause.';

    guide.likelyCauses = [
        'NullPointerException.',
        'Invalid query assumptions.',
        'DML failure.',
        'Unhandled exception.',
        'Incorrect casting.',
        'Missing record access.',
        'Recursion.',
        'Unexpected data shape.',
        'Managed-package code failure.'
    ];

    guide.investigationSteps = [
        'Capture the complete exception.',
        'Capture the stack trace.',
        'Identify class, trigger, and failing line.',
        'Review debug logs.',
        'Identify affected records.',
        'Review null handling.',
        'Review SOQL assumptions.',
        'Review DML error handling.',
        'Review recursion controls.',
        'Run the relevant Apex test.'
    ];

    guide.fixChecklist = [
        'Correct the failing code path.',
        'Add null checks.',
        'Handle query and DML exceptions.',
        'Add recursion protection.',
        'Bulkify logic.',
        'Add meaningful logging.',
        'Add or update tests.',
        'Run regression tests.'
    ];

    guide.testCases = [
        'Expected data.',
        'Missing related data.',
        'Null values.',
        'Bulk records.',
        'Restricted user.',
        'DML failure.',
        'Recursive update.',
        'Managed-package interaction.'
    ];

    guide.preventionRecommendations = [
        'Maintain meaningful Apex tests.',
        'Bulkify all trigger logic.',
        'Use centralized trigger frameworks where appropriate.',
        'Avoid queries and DML inside loops.',
        'Use exception handling intentionally.',
        'Use logs that identify record context.'
    ];

    guide.escalationCriteria = [
        'Managed-package code is failing.',
        'The issue affects production data.',
        'The code requires architectural redesign.',
        'The issue is intermittent.',
        'Security-sensitive code is involved.'
    ];

    guide.interviewAnswer =
        'For an Apex failure, I start with the full exception and stack trace, identify the failing line and record context, review debug logs, null handling, queries, DML, recursion, and bulk behavior, then add regression tests after the fix.';

    guide.adminNotes =
        'Do not troubleshoot Apex using only the user-facing message; obtain the exception and stack trace.';

    return guide;
}

function createGovernorLimitGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Apex Governor Limit Failure';

    guide.summary =
        'The transaction exceeded a Salesforce platform resource limit. Identify which limit was exceeded and redesign the transaction to reduce queries, DML, CPU, heap, or recursion.';

    guide.likelyCauses = [
        'SOQL inside a loop.',
        'DML inside a loop.',
        'Unbulkified trigger logic.',
        'Recursive automation.',
        'Large in-memory collections.',
        'Complex nested loops.',
        'Too many Flows and triggers in one transaction.',
        'Large synchronous processing.',
        'Inefficient queries.'
    ];

    guide.investigationSteps = [
        'Capture the exact LimitException.',
        'Review the debug log limits section.',
        'Identify all automation in the transaction.',
        'Count SOQL queries and DML statements.',
        'Review loops and nested loops.',
        'Review recursion controls.',
        'Review collection sizes.',
        'Review Flow and Apex overlap.',
        'Test with representative bulk volume.',
        'Identify work that can move asynchronously.'
    ];

    guide.fixChecklist = [
        'Move SOQL outside loops.',
        'Move DML outside loops.',
        'Bulkify logic.',
        'Use collections and maps.',
        'Add recursion protection.',
        'Reduce unnecessary queries.',
        'Move appropriate work asynchronously.',
        'Consolidate overlapping automation.',
        'Add bulk tests.'
    ];

    guide.testCases = [
        'Single record.',
        'Two hundred records.',
        'Repeated updates.',
        'Mixed valid and invalid data.',
        'Recursive conditions.',
        'Large related-record volumes.',
        'Combined Flow and Apex execution.'
    ];

    guide.preventionRecommendations = [
        'Bulkify from the beginning.',
        'Monitor limits in tests.',
        'Use trigger frameworks carefully.',
        'Avoid overlapping automation.',
        'Use asynchronous processing when justified.',
        'Test realistic data volumes.'
    ];

    guide.escalationCriteria = [
        'The solution requires major redesign.',
        'The transaction spans multiple managed packages.',
        'Large data volumes are business-critical.',
        'The issue affects production continuously.',
        'Asynchronous architecture is required.'
    ];

    guide.interviewAnswer =
        'For a governor-limit failure, I identify the exact exceeded limit, review the transaction’s SOQL, DML, CPU, heap, recursion, and automation chain, then bulkify, consolidate operations, and move suitable work asynchronously.';

    guide.adminNotes =
        'Governor-limit failures usually require design changes, not simply retrying the transaction.';

    return guide;
}

function createIntegrationGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Integration or API Failure';

    guide.summary =
        'Salesforce could not successfully communicate with another system. Review authentication, endpoint configuration, request payloads, response handling, timeout behavior, and integration-user access.';

    guide.likelyCauses = [
        'Authentication expired or failed.',
        'Named Credential configuration is incorrect.',
        'The endpoint is incorrect or unavailable.',
        'The request payload is invalid.',
        'The external system returned an error.',
        'The callout timed out.',
        'The integration user lacks access.',
        'JSON parsing failed.',
        'Rate limits were exceeded.'
    ];

    guide.investigationSteps = [
        'Capture endpoint and HTTP method.',
        'Capture HTTP status code.',
        'Capture request payload.',
        'Capture response body.',
        'Review Named Credential.',
        'Review authentication and token status.',
        'Review integration-user permissions.',
        'Review timeout and retry behavior.',
        'Test the endpoint independently.',
        'Review logs on both systems.'
    ];

    guide.fixChecklist = [
        'Correct authentication.',
        'Correct Named Credential.',
        'Correct endpoint.',
        'Correct request payload.',
        'Correct response parsing.',
        'Add retry logic where appropriate.',
        'Add error logging.',
        'Correct integration-user access.',
        'Document failure handling.'
    ];

    guide.testCases = [
        'Successful request.',
        'Expired credential.',
        'Invalid payload.',
        'Unauthorized response.',
        'Timeout.',
        'Server error.',
        'Malformed JSON.',
        'Bulk or repeated requests.'
    ];

    guide.preventionRecommendations = [
        'Use Named Credentials.',
        'Avoid hardcoded secrets.',
        'Log status codes and response bodies securely.',
        'Use documented retry behavior.',
        'Monitor external limits.',
        'Test failure scenarios.',
        'Document ownership and support contacts.'
    ];

    guide.escalationCriteria = [
        'The external system is unavailable.',
        'Security credentials may be compromised.',
        'Production data is inconsistent.',
        'Rate limits are exceeded.',
        'The integration requires architectural redesign.'
    ];

    guide.interviewAnswer =
        'For an integration failure, I capture the endpoint, status code, request, and response, then review Named Credentials, authentication, integration-user permissions, payload structure, response parsing, timeouts, retries, and logs on both systems.';

    guide.adminNotes =
        'The HTTP status code and response body are usually the most valuable starting points.';

    return guide;
}

function createDataGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Data Management Issue';

    guide.summary =
        'A data import, update, or cleanup process failed or produced unexpected results. Review field mappings, required fields, external IDs, ownership, lookup resolution, automation, and failed-result files.';

    guide.likelyCauses = [
        'Incorrect field mapping.',
        'Required fields are missing.',
        'Invalid picklist values.',
        'Lookup IDs cannot be resolved.',
        'External IDs are missing or duplicated.',
        'Record ownership is invalid.',
        'Validation or Duplicate Rules block records.',
        'Automation fails during import.',
        'The wrong operation was selected.'
    ];

    guide.investigationSteps = [
        'Review the failed-results file.',
        'Confirm the target object.',
        'Confirm insert, update, or upsert operation.',
        'Review field mappings.',
        'Review required fields.',
        'Review picklist values.',
        'Review external IDs.',
        'Review lookup and owner values.',
        'Review active automation.',
        'Test a small sample first.'
    ];

    guide.fixChecklist = [
        'Correct mappings.',
        'Populate required fields.',
        'Correct picklist values.',
        'Correct lookup values.',
        'Correct external IDs.',
        'Correct ownership.',
        'Address blocking automation.',
        'Retest with a small batch.',
        'Document final import steps.'
    ];

    guide.testCases = [
        'Small sample import.',
        'Valid record.',
        'Missing required field.',
        'Invalid lookup.',
        'Duplicate external ID.',
        'Restricted picklist.',
        'Bulk import.',
        'Rollback or correction plan.'
    ];

    guide.preventionRecommendations = [
        'Use data templates.',
        'Validate source data before import.',
        'Use external IDs intentionally.',
        'Test in a sandbox.',
        'Start with a small batch.',
        'Archive input and result files.',
        'Document automation impact.'
    ];

    guide.escalationCriteria = [
        'Production data requires rollback.',
        'Large-scale data correction is required.',
        'Relationships were loaded incorrectly.',
        'Duplicate cleanup is extensive.',
        'Data loss may have occurred.'
    ];

    guide.interviewAnswer =
        'For a data-load issue, I review failed-result files, confirm the operation and target object, validate mappings, required fields, picklists, lookups, external IDs, ownership, and active automation, then retest with a small sample.';

    guide.adminNotes =
        'Never begin with the full file. Validate a representative sample first.';

    return guide;
}

function createReportingGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'Report or Dashboard Issue';

    guide.summary =
        'A report or dashboard is missing data, showing unexpected results, or failing to refresh. Review the report type, filters, field access, folder access, source data, running user, and refresh status.';

    guide.likelyCauses = [
        'The report type excludes required records.',
        'Filters remove expected data.',
        'The running user lacks access.',
        'The field is unavailable in the report type.',
        'Source data is incomplete.',
        'Dashboard filters conflict with report filters.',
        'The dashboard has not refreshed.',
        'Folder access is restricted.',
        'Summary formulas are incorrect.'
    ];

    guide.investigationSteps = [
        'Confirm the expected records exist.',
        'Review the report type.',
        'Review all filters.',
        'Review date ranges.',
        'Review the running user.',
        'Review field-level security.',
        'Review folder access.',
        'Review dashboard filters.',
        'Refresh the dashboard.',
        'Compare report results as administrator and affected user.'
    ];

    guide.fixChecklist = [
        'Correct the report type.',
        'Correct filters.',
        'Correct date ranges.',
        'Grant appropriate access.',
        'Add required fields to the report type.',
        'Correct formulas.',
        'Refresh the dashboard.',
        'Document report assumptions.'
    ];

    guide.testCases = [
        'Administrator view.',
        'Affected-user view.',
        'Expected record present.',
        'Expected record excluded.',
        'Different date range.',
        'Dashboard refresh.',
        'Folder access.',
        'Dynamic dashboard behavior.'
    ];

    guide.preventionRecommendations = [
        'Document report definitions.',
        'Use consistent filter naming.',
        'Review running-user access.',
        'Test with representative users.',
        'Document dashboard refresh ownership.',
        'Maintain report-folder governance.'
    ];

    guide.escalationCriteria = [
        'Executive reporting is materially incorrect.',
        'Data visibility may violate security policy.',
        'The report type requires redesign.',
        'Large-scale data quality issues are discovered.',
        'External analytics tools are involved.'
    ];

    guide.interviewAnswer =
        'For a reporting issue, I confirm the source records, review the report type, filters, date ranges, running user, field and folder access, dashboard filters, and refresh status, then compare administrator and affected-user results.';

    guide.adminNotes =
        'Confirm the source record exists before changing the report.';

    return guide;
}

function createGeneralGuide(
    diagnosis,
    originalIssue
) {
    const guide =
        createBaseGuide(
            diagnosis,
            originalIssue
        );

    guide.title =
        'General Salesforce Troubleshooting';

    guide.summary =
        'The issue does not match a specialized diagnostic path, but it contains enough information to begin a structured investigation.';

    guide.likelyCauses = [
        'Recent configuration change.',
        'User permission issue.',
        'Unexpected record data.',
        'Automation conflict.',
        'Environment-specific behavior.',
        'Record-type or page-layout difference.',
        'Managed-package behavior.'
    ];

    guide.investigationSteps = [
        'Reproduce the issue.',
        'Capture the exact error.',
        'Identify the affected user and record.',
        'Compare working and failing scenarios.',
        'Review recent changes.',
        'Review permissions.',
        'Review automation.',
        'Review record type and page layout.',
        'Test in a sandbox.',
        'Document the root cause.'
    ];

    guide.fixChecklist = [
        'Confirm the root cause.',
        'Apply the smallest safe change.',
        'Test the affected scenario.',
        'Run regression tests.',
        'Document the change.',
        'Monitor after deployment.'
    ];

    guide.testCases = [
        'Affected user.',
        'Administrator.',
        'Working record.',
        'Failing record.',
        'Sandbox.',
        'Production-equivalent data.',
        'Regression scenarios.'
    ];

    guide.preventionRecommendations = [
        'Use change documentation.',
        'Maintain regression tests.',
        'Use least-privilege access.',
        'Document automation dependencies.',
        'Monitor production changes.',
        'Maintain issue-resolution notes.'
    ];

    guide.escalationCriteria = [
        'The issue blocks a critical process.',
        'Data integrity may be affected.',
        'The root cause cannot be isolated.',
        'A managed package is involved.',
        'Custom development is required.'
    ];

    guide.interviewAnswer =
        'For an unfamiliar Salesforce issue, I reproduce it, capture the exact error and context, compare working and failing scenarios, review recent changes, permissions, data, automation, and page configuration, then apply the smallest safe fix and regression test it.';

    guide.adminNotes =
        'Use evidence to narrow the issue before changing configuration.';

    return guide;
}