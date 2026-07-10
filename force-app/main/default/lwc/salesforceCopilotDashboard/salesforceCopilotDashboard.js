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
                'Recommend the best Salesforce automation solution using Flow, Validation Rules, Approval Processes, or Apex.',
            status: 'Available',
            statusClass: 'status-badge status-available',
            progress: 45,
            progressLabel: '45% complete',
            phase: 'Rules-Based Advisor v0.1',
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
            phase: 'Phase 2',
            disabled: true
        },
        {
            name: 'troubleshootingAssistant',
            title: 'Troubleshooting Assistant',
            iconName: 'utility:warning',
            description:
                'Diagnose Flow failures, validation rules, permissions, automation conflicts, and configuration problems.',
            status: 'Planned',
            statusClass: 'status-badge status-planned',
            progress: 5,
            progressLabel: '5% complete',
            phase: 'Phase 3',
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
            phase: 'Phase 4',
            disabled: true
        }
    ];

    recentActivity = [
        {
            id: 'activity-1',
            iconName: 'utility:success',
            title: 'Automation Advisor workspace built',
            detail:
                'The first rules-based recommendation engine now evaluates Salesforce business requirements.'
        },
        {
            id: 'activity-2',
            iconName: 'utility:success',
            title: 'Modular architecture deployed',
            detail:
                'Flow Intelligence, Org Explorer, and Automation Advisor operate as separate LWCs.'
        },
        {
            id: 'activity-3',
            iconName: 'utility:database',
            title: 'Live metadata connected',
            detail:
                'Org Explorer retrieves real object and field metadata through Apex.'
        },
        {
            id: 'activity-4',
            iconName: 'utility:field_sales',
            title: 'Field Explorer improved',
            detail:
                'Field metadata displays in a polished, readable card layout.'
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

    handleLaunch(event) {
        const capabilityName = event.currentTarget.dataset.name;

        if (!capabilityName) {
            return;
        }

        this.currentView = capabilityName;
    }

    handleQuickAction(event) {
        const destination = event.currentTarget.dataset.destination;

        if (!destination) {
            return;
        }

        this.currentView = destination;
    }

    backToDashboard() {
        this.currentView = 'dashboard';
    }
}