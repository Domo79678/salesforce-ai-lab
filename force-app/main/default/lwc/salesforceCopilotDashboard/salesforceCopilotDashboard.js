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
            iconName: 'utility:success',
            title: 'Org Context Service v1.1 completed',
            detail:
                'Salesforce Copilot now retrieves live organization, object, field, relationship, record-type, and access metadata.'
        },
        {
            id: 'activity-2',
            iconName: 'utility:success',
            title: 'Automation Advisor v1.0 completed',
            detail:
                'The rules-based recommendation engine evaluates business requirements and produces architecture, testing, deployment, and interview guidance.'
        },
        {
            id: 'activity-3',
            iconName: 'utility:warning',
            title: 'Troubleshooting Assistant MVP built',
            detail:
                'The new diagnostic engine classifies Salesforce problems and generates investigation paths, fix checklists, tests, and escalation guidance.'
        },
        {
            id: 'activity-4',
            iconName: 'utility:connected_apps',
            title: 'Modular architecture expanded',
            detail:
                'Flow Intelligence, Org Explorer, Automation Advisor, and Troubleshooting Assistant operate as independent reusable LWCs.'
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

        this.currentView = destination;
    }

    backToDashboard() {
        this.currentView = 'dashboard';
    }
}