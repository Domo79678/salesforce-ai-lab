import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {
    currentView = 'dashboard';

    capabilities = [
        {
            name: 'flowIntelligence',
            title: 'Flow Intelligence',
            iconName: 'utility:flow',
            description:
                'Analyze Salesforce Flows, identify risks, generate testing plans, documentation, and interview insights.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 85,
            progressLabel: '85% complete',
            phase: 'Live Module',
            disabled: false
        },
        {
            name: 'orgExplorer',
            title: 'Org Explorer',
            iconName: 'utility:connected_apps',
            description:
                'Explore live Salesforce objects, fields, relationships, permissions, and metadata.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 75,
            progressLabel: '75% complete',
            phase: 'Live Module',
            disabled: false
        },
        {
            name: 'orgHealthDashboard',
            title: 'Org Health',
            iconName: 'utility:shield',
            description:
                'Evaluate Salesforce automation, security, metadata, documentation, testing, performance, and deployment readiness.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 80,
            progressLabel: '80% complete',
            phase: 'Knowledge Layer MVP',
            disabled: false
        },
        {
            name: 'automationAdvisor',
            title: 'Automation Advisor',
            iconName: 'utility:settings',
            description:
                'Recommend the best Salesforce automation solution using Flow, Validation Rules, Approval Processes, configuration, or Apex.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 100,
            progressLabel: '100% complete',
            phase: 'Rules-Based Advisor v1.0',
            disabled: false
        },
        {
            name: 'troubleshootingAssistant',
            title: 'Troubleshooting Assistant',
            iconName: 'utility:warning',
            description:
                'Diagnose Flow failures, save errors, permissions, integrations, duplicate rules, Apex problems, and configuration issues.',
            status: 'MVP Testing',
            statusClass: 'status-badge status-available',
            progress: 90,
            progressLabel: '90% complete',
            phase: 'Rules-Based Assistant v1.0',
            disabled: false
        },
        {
            name: 'documentationGenerator',
            title: 'Documentation Generator',
            iconName: 'utility:knowledge_base',
            description:
                'Generate administrator guides, technical documentation, release notes, and testing plans.',
            status: 'Planned',
            statusClass: 'status-badge status-planned',
            progress: 5,
            progressLabel: '5% complete',
            phase: 'Next Module',
            disabled: true
        },
        {
            name: 'aiLearningCoach',
            title: 'AI Learning Coach',
            iconName: 'utility:education',
            description:
                'Practice Salesforce concepts, certification questions, scenarios, interviews, and administrator skills.',
            status: 'Planned',
            statusClass: 'status-badge status-planned',
            progress: 5,
            progressLabel: '5% complete',
            phase: 'Upcoming Module',
            disabled: true
        }
    ];

    recentActivity = [
        {
            id: 'activity-1',
            iconName: 'utility:shield',
            title: 'Org Health Dashboard deployed',
            detail:
                'Salesforce Copilot now displays Org Health scoring, category risks, findings, recommendations, Daily Admin Brief content, and Deployment Readiness.'
        },
        {
            id: 'activity-2',
            iconName: 'utility:success',
            title: 'Org Knowledge Layer v1.0 deployed',
            detail:
                'Shared models, utilities, rules, scoring, and orchestration services now power reusable Salesforce intelligence.'
        },
        {
            id: 'activity-3',
            iconName: 'utility:success',
            title: 'Org Context Service v1.1 completed',
            detail:
                'Salesforce Copilot retrieves live organization, object, field, relationship, record-type, and access metadata.'
        },
        {
            id: 'activity-4',
            iconName: 'utility:success',
            title: 'Automation Advisor v1.0 completed',
            detail:
                'The rules-based recommendation engine evaluates business requirements and produces architecture, testing, deployment, and interview guidance.'
        },
        {
            id: 'activity-5',
            iconName: 'utility:warning',
            title: 'Troubleshooting Assistant MVP built',
            detail:
                'The diagnostic engine classifies Salesforce problems and generates investigation paths, fix checklists, tests, and escalation guidance.'
        }
    ];

    get showDashboard() {
        return this.currentView === 'dashboard';
    }

    get showFlowIntelligence() {
        return this.currentView === 'flowIntelligence';
    }

    get showOrgExplorer() {
        return this.currentView === 'orgExplorer';
    }

    get showOrgHealthDashboard() {
        return this.currentView === 'orgHealthDashboard';
    }

    get showAutomationAdvisor() {
        return this.currentView === 'automationAdvisor';
    }

    get showTroubleshootingAssistant() {
        return this.currentView === 'troubleshootingAssistant';
    }

    handleLaunch(event) {
        const capabilityName =
            event.currentTarget.dataset.name;

        if (!capabilityName) {
            return;
        }

        const capability = this.capabilities.find(
            (item) => item.name === capabilityName
        );

        if (!capability || capability.disabled) {
            return;
        }

        this.currentView = capabilityName;
    }

    handleQuickAction(event) {
        const destination =
            event.currentTarget.dataset.destination;

        if (!destination) {
            return;
        }

        const capability = this.capabilities.find(
            (item) => item.name === destination
        );

        if (!capability || capability.disabled) {
            return;
        }

        this.currentView = destination;
    }

    backToDashboard() {
        this.currentView = 'dashboard';
    }
}