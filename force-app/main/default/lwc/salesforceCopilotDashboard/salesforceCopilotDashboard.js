import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {
    currentView = 'dashboard';

    capabilities = [
        {
            name: 'flowIntelligence',
            title: '🧠 Flow Intelligence',
            description: 'Analyze Salesforce Flows, identify risks, generate testing plans, documentation, and interview insights.',
            status: 'Available'
        },
        {
            name: 'orgExplorer',
            title: '🗺️ Org Explorer',
            description: 'Explore objects, fields, relationships, page layouts, and metadata throughout your Salesforce org.',
            status: 'Available'
        },
        {
            name: 'automationAdvisor',
            title: '⚙️ Automation Advisor',
            description: 'Recommend the best automation solution using Flows, Approval Processes, Validation Rules, or Apex.',
            status: 'Coming Soon'
        },
        {
            name: 'documentationGenerator',
            title: '📄 Documentation Generator',
            description: 'Generate admin guides, release notes, and testing documentation.',
            status: 'Coming Soon'
        },
        {
            name: 'aiLearningCoach',
            title: '🎓 AI Learning Coach',
            description: 'Interactive Salesforce learning, certification preparation, quizzes, and interview coaching.',
            status: 'Coming Soon'
        },
        {
            name: 'troubleshootingAssistant',
            title: '🛠️ Troubleshooting Assistant',
            description: 'Diagnose Flow failures, validation rules, permission issues, and configuration problems.',
            status: 'Coming Soon'
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

    handleLaunch(event) {
        this.currentView = event.target.dataset.name;
    }

    backToDashboard() {
        this.currentView = 'dashboard';
    }
}