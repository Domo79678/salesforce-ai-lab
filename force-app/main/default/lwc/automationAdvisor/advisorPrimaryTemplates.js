/*
 * advisorTemplates.js
 *
 * Builds detailed recommendations for the primary Salesforce
 * automation and configuration options.
 *
 * advisorRules.js decides WHICH solution to recommend.
 * This file defines WHAT the recommendation contains.
 */

import { getRecommendationMetadata } from './advisorConfidence';

import { RECOMMENDATION_TYPES } from './advisorRules';

export function buildRecommendation(
    type,
    requirement,
    parsedRequirement,
    ruleResult = {}
) {
    let recommendation;

    switch (type) {
        case RECOMMENDATION_TYPES.RECORD_TRIGGERED_FLOW:
            recommendation = createRecordTriggeredFlow(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.BEFORE_SAVE_FLOW:
            recommendation = createBeforeSaveFlow(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.SCREEN_FLOW:
            recommendation = createScreenFlow(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.SCHEDULE_TRIGGERED_FLOW:
            recommendation = createScheduledFlow(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.VALIDATION_RULE:
            recommendation = createValidationRule(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.APPROVAL_PROCESS:
            recommendation = createApprovalProcess(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.QUICK_ACTION:
            recommendation = createQuickAction(
                requirement,
                parsedRequirement
            );
            break;

        case RECOMMENDATION_TYPES.SUBFLOW:
            recommendation = createSubflow(
                requirement,
                parsedRequirement
            );
            break;

        default:
            recommendation = createRecordTriggeredFlow(
                requirement,
                parsedRequirement
            );
            break;
    }

    return applyRuleDetails(recommendation, ruleResult);
}

function createBaseRecommendation(
    requirement,
    parsedRequirement
) {
    return {
        requirement,
        parsedRequirement,

        solution: '',
        solutionIcon: 'utility:settings',
        summary: '',

        confidence: '90%',
        status: 'Recommended',
        complexity: 'Medium',
        estimatedBuildTime: '1–2 hours',
        maintenanceLevel: 'Admin-friendly',
        recommendedTiming:
            parsedRequirement?.timing || 'To be confirmed',

        matchedRule: '',
        ruleReasons: [],

        whyThisFits: [],
        architectureSteps: [],
        risks: [],
        testCases: [],
        acceptanceCriteria: [],
        buildChecklist: [],
        deploymentChecklist:
            createDefaultDeploymentChecklist(),
        rollbackPlan:
            createDefaultRollbackPlan(),
        alternatives: [],

        userStory: '',
        interviewAnswer: ''
    };
}

function applyRuleDetails(recommendation, ruleResult) {
    if (!ruleResult) {
        return recommendation;
    }

    if (
        typeof ruleResult.confidence === 'number'
    ) {
        recommendation.confidence =
            `${ruleResult.confidence}%`;
    }

    recommendation.matchedRule =
        ruleResult.matchedRule || '';

    recommendation.ruleReasons =
        Array.isArray(ruleResult.reasons)
            ? [...ruleResult.reasons]
            : [];

    return recommendation;
}

function createRecordTriggeredFlow(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Record-Triggered Flow';

    recommendation.solutionIcon =
        'utility:flow';

    recommendation.summary =
        'Use a Record-Triggered Flow when Salesforce should automatically respond after a record is created or updated.';

    recommendation.confidence = '94%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '30–60 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';

    recommendation.recommendedTiming =
        'After Save unless only the triggering record must be updated';

    recommendation.userStory =
        `As a Salesforce user, I want ${requirement.toLowerCase()} so that the business process occurs consistently without manual follow-up.`;

    recommendation.whyThisFits = [
        'The requirement describes an automated response to a record change.',
        'Flow supports record creation, record updates, decisions, notifications, and reusable subflows.',
        'The solution can be built declaratively without custom Apex.',
        'The automation can be maintained by a Salesforce Administrator.'
    ];

    recommendation.architectureSteps = [
        'Select the triggering Salesforce object.',
        'Choose whether the Flow runs when the record is created, updated, or both.',
        'Define narrow and measurable entry criteria.',
        'Choose after-save timing for related records, notifications, or additional actions.',
        'Add Decision elements for business branches.',
        'Create or update the required records.',
        'Send notifications or email alerts where needed.',
        'Add fault paths to every data operation.',
        'Prevent unintended repeated execution.',
        'Test positive, negative, repeated-update, permission, and bulk scenarios.'
    ];

    recommendation.risks = [
        'Broad entry criteria may cause the Flow to run unnecessarily.',
        'Missing duplicate-prevention logic may create repeated records or notifications.',
        'Multiple automations on the same object may create order-of-execution problems.',
        'Missing fault paths may hide automation failures.',
        'Hardcoded IDs may make the Flow difficult to deploy between orgs.'
    ];

    recommendation.testCases = [
        'A record meets all entry criteria.',
        'A record does not meet the entry criteria.',
        'The record is updated more than once.',
        'The related record already exists.',
        'A user has limited permissions.',
        'Multiple records are updated in bulk.',
        'A data operation fails and follows the fault path.'
    ];

    recommendation.acceptanceCriteria = [
        'The Flow runs only when documented criteria are met.',
        'Required records and notifications are created successfully.',
        'Repeated edits do not create unintended duplicates.',
        'Failures are captured through documented fault handling.',
        'Bulk updates complete without governor-limit errors.'
    ];

    recommendation.buildChecklist = [
        'Confirm the triggering object.',
        'Confirm create, update, or create-and-update behavior.',
        'Document entry criteria.',
        'Choose before-save or after-save timing.',
        'Create Decisions and data actions.',
        'Add duplicate-prevention controls.',
        'Add fault paths.',
        'Add descriptions to the Flow and elements.',
        'Test with multiple user permission levels.',
        'Activate only after regression testing.'
    ];

    recommendation.alternatives = [
        {
            name: 'Before-Save Flow',
            recommendation:
                'Use for same-record field updates',
            reason:
                'Before-save Flow is faster when the requirement only changes fields on the triggering record.'
        },
        {
            name: 'Invocable Apex',
            recommendation:
                'Use only when necessary',
            reason:
                'Use Apex when the requirement includes advanced integrations, scale, or transaction control that Flow cannot safely support.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Record-Triggered Flow because the requirement responds to a record change and can be handled declaratively. I would use narrow entry criteria, select the correct timing, add fault paths, prevent duplicate execution, and test both single-record and bulk scenarios.';

    return recommendation;
}

function createBeforeSaveFlow(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Before-Save Record-Triggered Flow';

    recommendation.solutionIcon =
        'utility:flow';

    recommendation.summary =
        'Use a Before-Save Flow for fast field updates on the triggering record before Salesforce commits it to the database.';

    recommendation.confidence = '95%';
    recommendation.complexity = 'Low';
    recommendation.estimatedBuildTime =
        '20–45 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'Before Save / Fast Field Updates';

    recommendation.userStory =
        `As a Salesforce user, I want ${requirement.toLowerCase()} so that record data is correct before it is saved.`;

    recommendation.whyThisFits = [
        'The requirement updates fields on the triggering record.',
        'Before-save Flow is optimized for fast field updates.',
        'No additional database update is required.',
        'The solution is declarative and easy for administrators to maintain.'
    ];

    recommendation.architectureSteps = [
        'Select the triggering Salesforce object.',
        'Choose Fast Field Updates.',
        'Define precise entry criteria.',
        'Use Assignment elements to update fields on $Record.',
        'Avoid related-record creation and after-save actions.',
        'Protect valid user-entered values from being overwritten.',
        'Test record creation, record update, and bulk scenarios.'
    ];

    recommendation.risks = [
        'Before-save Flow cannot create related records.',
        'It cannot directly send notifications or perform many after-save actions.',
        'Incorrect assignments may overwrite valid user data.',
        'Broad criteria may update more records than intended.'
    ];

    recommendation.testCases = [
        'The target field is populated on record creation.',
        'The target field is recalculated on update.',
        'Existing valid values are preserved when required.',
        'A record outside the entry criteria is unchanged.',
        'Bulk updates complete successfully.'
    ];

    recommendation.acceptanceCriteria = [
        'The triggering record is updated before database commit.',
        'No unnecessary second database update occurs.',
        'Only documented fields are changed.',
        'Valid user-entered values are preserved.',
        'Bulk updates complete successfully.'
    ];

    recommendation.buildChecklist = [
        'Confirm that only triggering-record fields need updates.',
        'Choose Fast Field Updates.',
        'Document entry criteria.',
        'Create Assignment elements.',
        'Protect existing values where appropriate.',
        'Add Flow and element descriptions.',
        'Test create, update, and bulk scenarios.'
    ];

    recommendation.alternatives = [
        {
            name: 'Formula Field',
            recommendation:
                'Use for dynamic display values',
            reason:
                'Use a Formula Field when the value should always calculate dynamically and does not need to be stored.'
        },
        {
            name: 'After-Save Flow',
            recommendation:
                'Use for related records or notifications',
            reason:
                'After-save timing is required when the automation creates related records, sends messages, or performs additional actions.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Before-Save Flow because only fields on the triggering record need to change. Before-save Flow is optimized for fast field updates and avoids an unnecessary second database operation.';

    return recommendation;
}

function createValidationRule(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Validation Rule';

    recommendation.solutionIcon =
        'utility:block_visitor';

    recommendation.summary =
        'Use a Validation Rule when Salesforce must prevent users or integrations from saving invalid or incomplete data.';

    recommendation.confidence = '92%';
    recommendation.complexity = 'Low';
    recommendation.estimatedBuildTime =
        '15–30 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'During record validation before save';

    recommendation.userStory =
        `As a business owner, I want Salesforce to enforce the requirement that ${requirement.toLowerCase()} so that invalid data cannot be saved.`;

    recommendation.whyThisFits = [
        'The requirement focuses on stopping an invalid save.',
        'No background record processing is required.',
        'Validation Rules provide immediate feedback to users.',
        'The solution is lightweight and maintainable.'
    ];

    recommendation.architectureSteps = [
        'Identify the object and fields involved.',
        'Translate the business requirement into a formula.',
        'Determine whether blank values require special handling.',
        'Define approved bypass users or conditions.',
        'Write a clear and actionable error message.',
        'Choose the correct field or page error location.',
        'Test valid, invalid, integration, and bulk scenarios.'
    ];

    recommendation.risks = [
        'An overly broad formula may block legitimate users.',
        'Integrations and data loads may fail if bypass scenarios are not considered.',
        'A poor error message may make troubleshooting difficult.',
        'Multiple Validation Rules may produce confusing user experiences.',
        'Hardcoded profile names or IDs may create deployment problems.'
    ];

    recommendation.testCases = [
        'A valid record saves successfully.',
        'An invalid record is blocked.',
        'Blank and null values behave correctly.',
        'The user receives the expected error message.',
        'Integration-user behavior is tested.',
        'Bulk data-load behavior is tested.',
        'Approved bypass logic works correctly.'
    ];

    recommendation.acceptanceCriteria = [
        'Invalid data is blocked.',
        'Valid data saves successfully.',
        'Users receive a clear error message.',
        'Approved bypass users behave as documented.',
        'Integration and bulk-load behavior is confirmed.'
    ];

    recommendation.buildChecklist = [
        'Confirm the business condition.',
        'Identify source fields.',
        'Write and validate the formula.',
        'Add bypass logic where necessary.',
        'Create the error message.',
        'Select the error location.',
        'Add a description.',
        'Test UI, integration, and bulk scenarios.'
    ];

    recommendation.alternatives = [
        {
            name: 'Before-Save Flow',
            recommendation:
                'Use to correct data automatically',
            reason:
                'Use a Before-Save Flow when Salesforce should normalize or populate the value instead of blocking the user.'
        },
        {
            name: 'Required Field',
            recommendation:
                'Use for simple universal requirements',
            reason:
                'Field-level requiredness may be sufficient when the field must always contain a value without conditional logic.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Validation Rule because the requirement is to stop invalid data from being saved. I would keep the formula focused, write a clear error message, consider integrations and bypass users, and test both valid and invalid scenarios.';

    return recommendation;
}

function createApprovalProcess(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Approval Process with Flow Support';

    recommendation.solutionIcon =
        'utility:approval';

    recommendation.summary =
        'Use an Approval Process when a record requires formal authorization, approver routing, approval history, and approve or reject actions.';

    recommendation.confidence = '91%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '45–90 minutes';
    recommendation.maintenanceLevel =
        'Moderate';
    recommendation.recommendedTiming =
        'Formal submission and approval lifecycle';

    recommendation.userStory =
        `As an approver, I want ${requirement.toLowerCase()} so that controlled business decisions are documented and auditable.`;

    recommendation.whyThisFits = [
        'The requirement includes formal authorization or review.',
        'Salesforce must track who approved or rejected the request.',
        'Approval actions may lock the record or update fields.',
        'Flow can support submission preparation and post-approval automation.'
    ];

    recommendation.architectureSteps = [
        'Define approval entry criteria.',
        'Identify the submitter and approvers.',
        'Configure approver routing and escalation.',
        'Configure initial submission actions.',
        'Configure approval, rejection, recall, and final actions.',
        'Determine whether the record should be locked.',
        'Use Flow for supporting automation where appropriate.',
        'Test submission, approval, rejection, recall, delegation, and reassignment.'
    ];

    recommendation.risks = [
        'Incorrect approver routing may delay business processes.',
        'Record locking may interfere with integrations or automation.',
        'Approval criteria may conflict with Flow or Validation Rules.',
        'Missing rejection handling may leave records in an unclear state.',
        'Hardcoded approver IDs may prevent deployment between orgs.'
    ];

    recommendation.testCases = [
        'A record qualifies for approval.',
        'A record does not qualify for approval.',
        'The correct approver receives the request.',
        'The approver approves the record.',
        'The approver rejects the record.',
        'The submitter recalls the request.',
        'A delegated approver completes the request.',
        'Post-approval automation executes successfully.'
    ];

    recommendation.acceptanceCriteria = [
        'Only qualifying records can be submitted.',
        'The correct approver receives the request.',
        'Approval and rejection actions update the record correctly.',
        'Approval history is retained.',
        'Recall, reassignment, and delegation work as documented.'
    ];

    recommendation.buildChecklist = [
        'Confirm approval criteria.',
        'Define approver routing.',
        'Configure submission actions.',
        'Configure approval actions.',
        'Configure rejection actions.',
        'Document record-locking behavior.',
        'Configure recall behavior.',
        'Add supporting Flow automation if required.',
        'Test the full approval lifecycle.'
    ];

    recommendation.alternatives = [
        {
            name: 'Screen Flow',
            recommendation:
                'Use for guided review without formal history',
            reason:
                'A Screen Flow may be appropriate when users need guidance but formal approve or reject tracking is unnecessary.'
        },
        {
            name: 'Record-Triggered Flow',
            recommendation:
                'Use as supporting automation',
            reason:
                'Flow can prepare records for submission and respond to approval-status changes.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected an Approval Process because the requirement needs formal authorization, approver routing, approval history, and approve or reject actions. I would use Flow where necessary for submission preparation and post-approval automation.';

    return recommendation;
}

function createScreenFlow(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Screen Flow';

    recommendation.solutionIcon =
        'utility:screen';

    recommendation.summary =
        'Use a Screen Flow when users need a guided, interactive, multi-step experience to enter information or complete a business process.';

    recommendation.confidence = '93%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '45–90 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'User initiated';

    recommendation.userStory =
        `As a Salesforce user, I want a guided process to ${requirement.toLowerCase()} so that I can complete the task accurately and consistently.`;

    recommendation.whyThisFits = [
        'The requirement includes guided user interaction.',
        'Screen Flow can collect and validate information.',
        'Conditional visibility can simplify the user experience.',
        'The Flow can be embedded in Lightning pages or launched from an action.',
        'The solution avoids unnecessary custom UI development.'
    ];

    recommendation.architectureSteps = [
        'Define the user journey.',
        'Identify the required screens and questions.',
        'Add input validation.',
        'Add conditional visibility.',
        'Use Decision elements for branching.',
        'Create or update the required records.',
        'Add confirmation and error screens.',
        'Determine where the Screen Flow will be launched.',
        'Test desktop and mobile behavior.'
    ];

    recommendation.risks = [
        'Too many screens may frustrate users.',
        'Missing validation may allow incomplete submissions.',
        'Poor navigation may cause users to abandon the process.',
        'Permissions may prevent record operations.',
        'Large amounts of data may create slow or confusing screens.'
    ];

    recommendation.testCases = [
        'A user completes the successful path.',
        'Required values are missing.',
        'Conditional fields appear correctly.',
        'The user navigates backward.',
        'The user cancels the process.',
        'Record creation or update fails.',
        'A restricted user attempts the process.',
        'The mobile layout remains usable.'
    ];

    recommendation.acceptanceCriteria = [
        'Users can complete the guided process.',
        'Required values are validated.',
        'Conditional content displays correctly.',
        'Records are created or updated successfully.',
        'Errors are understandable and recoverable.',
        'The experience works on supported devices.'
    ];

    recommendation.buildChecklist = [
        'Map the user journey.',
        'Design screens.',
        'Add field validation.',
        'Add conditional visibility.',
        'Add Decisions.',
        'Configure record actions.',
        'Create confirmation and error paths.',
        'Configure launch location.',
        'Test desktop and mobile.'
    ];

    recommendation.alternatives = [
        {
            name: 'Quick Action',
            recommendation:
                'Use for a simple one-step process',
            reason:
                'A standard Quick Action may be sufficient when the user only needs a small number of fields and no branching.'
        },
        {
            name: 'Lightning Web Component',
            recommendation:
                'Use for highly customized interaction',
            reason:
                'Choose an LWC when the interface or interaction requirements exceed Screen Flow capabilities.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Screen Flow because users need a guided experience. I would design the screens around the business journey, use conditional visibility, validate input, and handle both successful and failed record operations.';

    return recommendation;
}

function createScheduledFlow(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Schedule-Triggered Flow';

    recommendation.solutionIcon =
        'utility:event';

    recommendation.summary =
        'Use a Schedule-Triggered Flow when Salesforce must evaluate and process qualifying records on a recurring schedule.';

    recommendation.confidence = '90%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '30–75 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'Scheduled recurring execution';

    recommendation.userStory =
        `As a process owner, I want Salesforce to ${requirement.toLowerCase()} on a recurring schedule so that the work happens consistently.`;

    recommendation.whyThisFits = [
        'The requirement describes recurring execution.',
        'The process does not depend on an immediate record change.',
        'Flow can select qualifying records and process them.',
        'The schedule can be maintained without custom Apex.'
    ];

    recommendation.architectureSteps = [
        'Choose the frequency and start time.',
        'Select the target Salesforce object.',
        'Define narrow record criteria.',
        'Determine whether the Flow runs once per record.',
        'Process each qualifying record.',
        'Prevent duplicate processing.',
        'Add fault handling and notifications.',
        'Confirm expected record volume.',
        'Test with representative data volumes.'
    ];

    recommendation.risks = [
        'Broad criteria may process too many records.',
        'Large record volumes may exceed Flow limits.',
        'Repeated runs may duplicate actions.',
        'Schedule timing may conflict with integrations or maintenance windows.',
        'A failed scheduled run may require monitoring and recovery.'
    ];

    recommendation.testCases = [
        'Qualifying records are processed.',
        'Non-qualifying records are ignored.',
        'Previously processed records are not duplicated.',
        'The Flow handles no matching records.',
        'A data operation follows the fault path.',
        'Representative record volume is processed successfully.'
    ];

    recommendation.acceptanceCriteria = [
        'The process runs on the expected schedule.',
        'Only qualifying records are processed.',
        'Previously processed records are not duplicated.',
        'Faults are logged or surfaced.',
        'Expected record volume completes successfully.'
    ];

    recommendation.buildChecklist = [
        'Confirm the execution schedule.',
        'Define the object.',
        'Define narrow criteria.',
        'Build processing logic.',
        'Prevent duplicate processing.',
        'Add fault handling.',
        'Document monitoring ownership.',
        'Test representative record volume.'
    ];

    recommendation.alternatives = [
        {
            name: 'Scheduled Apex',
            recommendation:
                'Use for advanced scale or logic',
            reason:
                'Scheduled Apex may be required for complex processing, advanced callouts, or transaction control.'
        },
        {
            name: 'Record-Triggered Flow',
            recommendation:
                'Use for immediate processing',
            reason:
                'A Record-Triggered Flow is more appropriate when processing should happen immediately after a record changes.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Schedule-Triggered Flow because the requirement runs on a recurring schedule rather than immediately after a record change. I would control record volume, prevent duplicate processing, add fault handling, and test platform limits.';

    return recommendation;
}

function createQuickAction(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Quick Action';

    recommendation.solutionIcon =
        'utility:touch_action';

    recommendation.summary =
        'Use a Quick Action when users need a fast and contextual way to create or update records or launch another guided process.';

    recommendation.confidence = '89%';
    recommendation.complexity = 'Low';
    recommendation.estimatedBuildTime =
        '15–45 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'User initiated';

    recommendation.userStory =
        `As a Salesforce user, I want a Quick Action to ${requirement.toLowerCase()} so that I can complete the task with fewer clicks.`;

    recommendation.whyThisFits = [
        'The process is explicitly initiated by a user.',
        'Quick Actions can appear directly on record pages.',
        'Default field values can reduce manual input.',
        'The action can launch a Screen Flow if more guidance is required.'
    ];

    recommendation.architectureSteps = [
        'Choose an object-specific or global action.',
        'Select create, update, or Flow as the action type.',
        'Configure action fields and default values.',
        'Add the action to the appropriate page layout or Lightning page.',
        'Configure dynamic visibility where required.',
        'Review permissions.',
        'Test desktop and mobile behavior.'
    ];

    recommendation.risks = [
        'Too many actions may clutter the page.',
        'Incorrect default values may create inaccurate data.',
        'Page-layout placement may vary by profile or record type.',
        'Permissions may prevent users from completing the action.'
    ];

    recommendation.testCases = [
        'The action is visible to intended users.',
        'The action is hidden from restricted users where required.',
        'Default values populate correctly.',
        'Required fields are enforced.',
        'The record saves successfully.',
        'The mobile experience is usable.'
    ];

    recommendation.acceptanceCriteria = [
        'The action appears in the correct context.',
        'Only intended users can access it.',
        'Default and required values work correctly.',
        'The action completes successfully.',
        'Desktop and mobile behavior is acceptable.'
    ];

    recommendation.buildChecklist = [
        'Choose action type.',
        'Configure fields.',
        'Configure default values.',
        'Add the action to the page.',
        'Configure visibility.',
        'Review permissions.',
        'Test desktop and mobile.'
    ];

    recommendation.alternatives = [
        {
            name: 'Screen Flow',
            recommendation:
                'Use for multi-step guidance',
            reason:
                'A Screen Flow is more appropriate when users need branching, validation, or multiple screens.'
        },
        {
            name: 'LWC Quick Action',
            recommendation:
                'Use for a custom interface',
            reason:
                'Choose an LWC Quick Action when the interaction exceeds standard Quick Action or Screen Flow capabilities.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Quick Action because the process is user initiated and should be available directly in context. I would configure sensible defaults, review security, and test both desktop and mobile behavior.';

    return recommendation;
}

function createSubflow(
    requirement,
    parsedRequirement
) {
    const recommendation =
        createBaseRecommendation(
            requirement,
            parsedRequirement
        );

    recommendation.solution =
        'Reusable Subflow';

    recommendation.solutionIcon =
        'utility:flow';

    recommendation.summary =
        'Use a reusable Subflow when multiple Salesforce Flows need the same declarative business logic.';

    recommendation.confidence = '90%';
    recommendation.complexity = 'Medium';
    recommendation.estimatedBuildTime =
        '30–75 minutes';
    recommendation.maintenanceLevel =
        'Admin-friendly';
    recommendation.recommendedTiming =
        'Called by parent Flows';

    recommendation.userStory =
        `As a Salesforce Administrator, I want reusable automation for ${requirement.toLowerCase()} so that shared logic is maintained in one location.`;

    recommendation.whyThisFits = [
        'The requirement describes logic shared by multiple Flows.',
        'Subflows reduce duplicate automation logic.',
        'Centralized logic is easier to maintain.',
        'Parent Flows can pass inputs and receive outputs.'
    ];

    recommendation.architectureSteps = [
        'Identify the reusable business logic.',
        'Create an autolaunched Flow.',
        'Define available-for-input variables.',
        'Define available-for-output variables.',
        'Build the shared logic.',
        'Add fault handling.',
        'Call the Subflow from parent Flows.',
        'Document every parent Flow dependency.',
        'Test each calling context.'
    ];

    recommendation.risks = [
        'Changes to the Subflow may affect multiple parent Flows.',
        'Poor variable naming may create confusion.',
        'Faults must be handled by both the Subflow and parent Flow.',
        'Circular or overly deep dependencies should be avoided.',
        'Updates require regression testing across every parent Flow.'
    ];

    recommendation.testCases = [
        'The Subflow runs successfully by itself.',
        'Each parent passes the correct input variables.',
        'Outputs return correctly.',
        'A fault is handled correctly.',
        'A parent handles the Subflow failure.',
        'Bulk calling scenarios complete successfully.'
    ];

    recommendation.acceptanceCriteria = [
        'Parent Flows can call the Subflow.',
        'Inputs and outputs are documented.',
        'Shared logic returns consistent results.',
        'Fault handling works in each context.',
        'Changes are regression tested across all parent Flows.'
    ];

    recommendation.buildChecklist = [
        'Identify reusable logic.',
        'Create autolaunched Flow.',
        'Define inputs.',
        'Define outputs.',
        'Build shared steps.',
        'Add fault handling.',
        'Update parent Flows.',
        'Document dependencies.',
        'Regression test all callers.'
    ];

    recommendation.alternatives = [
        {
            name: 'Invocable Apex',
            recommendation:
                'Use for complex reusable services',
            reason:
                'Invocable Apex may be more appropriate for advanced reusable logic, integrations, or transaction handling.'
        },
        {
            name: 'Duplicate Flow Logic',
            recommendation:
                'Avoid',
            reason:
                'Duplicating the same logic across multiple Flows increases maintenance and inconsistency risk.'
        }
    ];

    recommendation.interviewAnswer =
        'I selected a Subflow because multiple automations need the same logic. This reduces duplication, centralizes maintenance, and allows parent Flows to pass inputs and receive outputs.';

    return recommendation;
}

function createDefaultDeploymentChecklist() {
    return [
        'Validate the solution in a sandbox.',
        'Complete documented test scenarios.',
        'Confirm object permissions and field-level security.',
        'Review automation order and dependencies.',
        'Prepare deployment notes.',
        'Deploy through a controlled change process.',
        'Run post-deployment smoke testing.',
        'Confirm monitoring and support ownership.'
    ];
}

function createDefaultRollbackPlan() {
    return [
        'Document the previous configuration.',
        'Retain a recoverable previous version where appropriate.',
        'Identify records affected during deployment.',
        'Define how to deactivate or revert the new solution.',
        'Prepare corrective data steps if records were changed.',
        'Confirm rollback criteria with the business owner.'
    ];
}