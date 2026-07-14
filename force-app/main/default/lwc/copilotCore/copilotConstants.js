/*
 * copilotConstants.js
 *
 * Shared constants for the Salesforce Copilot Platform.
 *
 * This module provides one source of truth for:
 * - workspace identifiers
 * - platform status labels
 * - metadata categories
 * - health categories
 * - risk and severity levels
 * - score thresholds
 * - cache behavior
 * - refresh events
 * - default business objects
 */

export const COPILOT_PLATFORM_VERSION =
    '1.0';

export const COPILOT_CORE_VERSION =
    '1.0';

export const WORKSPACE_IDS =
    Object.freeze({
        DASHBOARD:
            'dashboard',

        FLOW_INTELLIGENCE:
            'flowIntelligence',

        ORG_EXPLORER:
            'orgExplorer',

        ORG_HEALTH:
            'orgHealthDashboard',

        AUTOMATION_ADVISOR:
            'automationAdvisor',

        TROUBLESHOOTING_ASSISTANT:
            'troubleshootingAssistant',

        METADATA_DIAGNOSTIC:
            'metadataDiagnostic',

        EXPLAIN_THIS:
            'explainThis',

        CHANGE_IMPACT:
            'changeImpact',

        DEPLOYMENT_READINESS:
            'deploymentReadiness',

        DOCUMENTATION_GENERATOR:
            'documentationGenerator',

        DAILY_ADMIN_BRIEF:
            'dailyAdminBrief',

        AI_LEARNING_COACH:
            'aiLearningCoach',

        GLOBAL_SEARCH:
            'globalSearch',

        PORTFOLIO_MODE:
            'portfolioMode'
    });

export const WORKSPACE_LABELS =
    Object.freeze({
        [WORKSPACE_IDS.DASHBOARD]:
            'Dashboard',

        [WORKSPACE_IDS.FLOW_INTELLIGENCE]:
            'Flow Intelligence',

        [WORKSPACE_IDS.ORG_EXPLORER]:
            'Org Explorer',

        [WORKSPACE_IDS.ORG_HEALTH]:
            'Org Health',

        [WORKSPACE_IDS.AUTOMATION_ADVISOR]:
            'Automation Advisor',

        [WORKSPACE_IDS.TROUBLESHOOTING_ASSISTANT]:
            'Troubleshooting Assistant',

        [WORKSPACE_IDS.METADATA_DIAGNOSTIC]:
            'Metadata Diagnostic',

        [WORKSPACE_IDS.EXPLAIN_THIS]:
            'Explain This',

        [WORKSPACE_IDS.CHANGE_IMPACT]:
            'Change Impact Analyzer',

        [WORKSPACE_IDS.DEPLOYMENT_READINESS]:
            'Deployment Readiness',

        [WORKSPACE_IDS.DOCUMENTATION_GENERATOR]:
            'Documentation Generator',

        [WORKSPACE_IDS.DAILY_ADMIN_BRIEF]:
            'Daily Admin Brief',

        [WORKSPACE_IDS.AI_LEARNING_COACH]:
            'AI Learning Coach',

        [WORKSPACE_IDS.GLOBAL_SEARCH]:
            'Global Search',

        [WORKSPACE_IDS.PORTFOLIO_MODE]:
            'Portfolio Mode'
    });

export const MODULE_STATUSES =
    Object.freeze({
        AVAILABLE:
            'Available',

        LIVE:
            'Live',

        MVP:
            'MVP',

        TESTING:
            'MVP Testing',

        IN_PROGRESS:
            'In Progress',

        PLANNED:
            'Planned',

        DISABLED:
            'Disabled',

        ERROR:
            'Error'
    });

export const DATA_SOURCE_TYPES =
    Object.freeze({
        LIVE:
            'live',

        LIVE_PARTIAL:
            'livePartial',

        DEMO:
            'demo',

        CACHE:
            'cache',

        UNAVAILABLE:
            'unavailable'
    });

export const DATA_SOURCE_LABELS =
    Object.freeze({
        [DATA_SOURCE_TYPES.LIVE]:
            'Live Salesforce Metadata',

        [DATA_SOURCE_TYPES.LIVE_PARTIAL]:
            'Live Salesforce Metadata — Partial Coverage',

        [DATA_SOURCE_TYPES.DEMO]:
            'Demo Metadata Snapshot',

        [DATA_SOURCE_TYPES.CACHE]:
            'Cached Salesforce Metadata',

        [DATA_SOURCE_TYPES.UNAVAILABLE]:
            'Salesforce Metadata Unavailable'
    });

export const METADATA_CATEGORIES =
    Object.freeze({
        ORGANIZATION:
            'organization',

        OBJECTS:
            'objects',

        FIELDS:
            'fields',

        RELATIONSHIPS:
            'relationships',

        RECORD_TYPES:
            'recordTypes',

        FLOWS:
            'flows',

        VALIDATION_RULES:
            'validationRules',

        DUPLICATE_RULES:
            'duplicateRules',

        MATCHING_RULES:
            'matchingRules',

        PERMISSION_SETS:
            'permissionSets',

        PROFILES:
            'profiles',

        QUEUES:
            'queues',

        ROLES:
            'roles',

        SHARING_RULES:
            'sharingRules',

        APPROVAL_PROCESSES:
            'approvalProcesses',

        APEX_CLASSES:
            'apexClasses',

        APEX_TRIGGERS:
            'apexTriggers',

        APEX_COVERAGE:
            'apexCoverage',

        REPORTS:
            'reports',

        DASHBOARDS:
            'dashboards',

        FORMULAS:
            'formulas',

        EMAIL_ALERTS:
            'emailAlerts',

        CUSTOM_METADATA:
            'customMetadata',

        CUSTOM_SETTINGS:
            'customSettings',

        NAMED_CREDENTIALS:
            'namedCredentials',

        CONNECTED_APPS:
            'connectedApps'
    });

export const HEALTH_CATEGORIES =
    Object.freeze({
        AUTOMATION:
            'Automation',

        SECURITY:
            'Security',

        DATA_MODEL:
            'Data Model',

        METADATA:
            'Metadata',

        DOCUMENTATION:
            'Documentation',

        TESTING:
            'Testing',

        PERFORMANCE:
            'Performance',

        DEPLOYMENT:
            'Deployment'
    });

export const SEVERITY_LEVELS =
    Object.freeze({
        CRITICAL:
            'Critical',

        HIGH:
            'High',

        MEDIUM:
            'Medium',

        LOW:
            'Low',

        INFORMATIONAL:
            'Informational'
    });

export const RISK_LEVELS =
    Object.freeze({
        CRITICAL:
            'Critical',

        HIGH:
            'High',

        MEDIUM:
            'Medium',

        LOW:
            'Low',

        NONE:
            'None',

        UNKNOWN:
            'Unknown'
    });

export const READINESS_STATUSES =
    Object.freeze({
        READY:
            'Ready',

        READY_WITH_WARNINGS:
            'Ready with warnings',

        NOT_READY:
            'Not ready',

        UNKNOWN:
            'Unknown'
    });

export const SCORE_THRESHOLDS =
    Object.freeze({
        EXCELLENT:
            95,

        HEALTHY:
            90,

        NEEDS_ATTENTION:
            75,

        AT_RISK:
            60,

        CRITICAL:
            0
    });

export const CACHE_KEYS =
    Object.freeze({
        METADATA_SNAPSHOT:
            'copilot.metadataSnapshot',

        ORG_HEALTH:
            'copilot.orgHealth',

        ORG_CONTEXT:
            'copilot.orgContext',

        LAST_REFRESH:
            'copilot.lastRefresh',

        COVERAGE:
            'copilot.coverage'
    });

export const CACHE_DEFAULTS =
    Object.freeze({
        SNAPSHOT_TTL_MILLISECONDS:
            5 * 60 * 1000,

        ORG_CONTEXT_TTL_MILLISECONDS:
            10 * 60 * 1000,

        MAXIMUM_ENTRIES:
            25
    });

export const REFRESH_EVENTS =
    Object.freeze({
        REQUESTED:
            'copilotrefreshrequested',

        STARTED:
            'copilotrefreshstarted',

        COMPLETED:
            'copilotrefreshcompleted',

        FAILED:
            'copilotrefreshfailed',

        SNAPSHOT_UPDATED:
            'copilotsnapshotupdated',

        CACHE_CLEARED:
            'copilotcachecleared'
    });

export const SNAPSHOT_STATUSES =
    Object.freeze({
        IDLE:
            'idle',

        LOADING:
            'loading',

        READY:
            'ready',

        PARTIAL:
            'partial',

        ERROR:
            'error'
    });

export const DEFAULT_BUSINESS_OBJECTS =
    Object.freeze([
        'Account',
        'Contact',
        'Lead',
        'Opportunity',
        'Case',
        'User'
    ]);

export const DEFAULT_SNAPSHOT_OPTIONS =
    Object.freeze({
        objectApiNames:
            DEFAULT_BUSINESS_OBJECTS,

        inventoryLimit:
            200,

        includeInventory:
            true,

        includeSetupMetadata:
            true,

        forceRefresh:
            false
    });

export const PLATFORM_MESSAGES =
    Object.freeze({
        LOADING_METADATA:
            'Loading Salesforce metadata...',

        REFRESHING_METADATA:
            'Refreshing Salesforce metadata...',

        SNAPSHOT_READY:
            'Salesforce metadata snapshot is ready.',

        PARTIAL_COVERAGE:
            'Some Salesforce metadata categories are not yet available.',

        METADATA_UNAVAILABLE:
            'Salesforce metadata could not be retrieved.',

        RETRY:
            'Retry',

        NO_RESULTS:
            'No results were found.',

        NO_FINDINGS:
            'No findings require attention.',

        NO_RECOMMENDATIONS:
            'No recommendations were generated.'
    });

export function getScoreStatus(
    score = 0
) {
    const normalizedScore =
        Math.max(
            0,
            Math.min(
                100,
                Number(score) || 0
            )
        );

    if (
        normalizedScore >=
        SCORE_THRESHOLDS.EXCELLENT
    ) {
        return 'Excellent';
    }

    if (
        normalizedScore >=
        SCORE_THRESHOLDS.HEALTHY
    ) {
        return 'Healthy';
    }

    if (
        normalizedScore >=
        SCORE_THRESHOLDS.NEEDS_ATTENTION
    ) {
        return 'Needs attention';
    }

    if (
        normalizedScore >=
        SCORE_THRESHOLDS.AT_RISK
    ) {
        return 'At risk';
    }

    return 'Critical';
}

export function getWorkspaceLabel(
    workspaceId = ''
) {
    return (
        WORKSPACE_LABELS[
            workspaceId
        ] ||
        'Salesforce Copilot'
    );
}

export function isLiveDataSource(
    sourceType = ''
) {
    return [
        DATA_SOURCE_TYPES.LIVE,
        DATA_SOURCE_TYPES.LIVE_PARTIAL,
        DATA_SOURCE_TYPES.CACHE
    ].includes(
        sourceType
    );
}