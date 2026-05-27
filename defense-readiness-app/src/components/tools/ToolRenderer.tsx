import type { ToolProps } from './types';
import ReadinessGauge from './ReadinessGauge';
import ConceptExplorer from './ConceptExplorer';
import RiskChecklist from './RiskChecklist';
import IntelSourceBuilder from './IntelSourceBuilder';
import ThreatMap from './ThreatMap';
import StockpilePlanner from './StockpilePlanner';
import BrigadeBuilder from './BrigadeBuilder';
import ProtocolStepper from './ProtocolStepper';
import PledgeTracker from './PledgeTracker';
import FundAllocationSimulator from './FundAllocationSimulator';
import BillTemplateGenerator from './BillTemplateGenerator';
import DeprogrammingPathway from './DeprogrammingPathway';
import SurveillanceDetoxChecklist from './SurveillanceDetoxChecklist';
import DeploymentTimeline from './DeploymentTimeline';
import MetricsDashboard from './MetricsDashboard';
import CovenantBuilder from './CovenantBuilder';
import AppendixExplorer from './AppendixExplorer';

const REGISTRY: Record<string, (p: ToolProps) => React.ReactNode> = {
  'readiness-gauge': ReadinessGauge,
  'concept-explorer': ConceptExplorer,
  'risk-assessment-checklist': RiskChecklist,
  'intel-source-builder': IntelSourceBuilder,
  'threat-map': ThreatMap,
  'stockpile-planner': StockpilePlanner,
  'brigade-builder': BrigadeBuilder,
  'protocol-stepper': ProtocolStepper,
  'pledge-commitment-tracker': PledgeTracker,
  'fund-allocation-simulator': FundAllocationSimulator,
  'bill-template-generator': BillTemplateGenerator,
  'deprogramming-pathway': DeprogrammingPathway,
  'surveillance-detox-checklist': SurveillanceDetoxChecklist,
  'deployment-timeline': DeploymentTimeline,
  'metrics-dashboard': MetricsDashboard,
  'covenant-builder': CovenantBuilder,
  'appendix-explorer': AppendixExplorer,
};

export default function ToolRenderer({ type, ...props }: ToolProps & { type: string }) {
  const Tool = REGISTRY[type];
  if (!Tool) {
    return (
      <div className="my-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Unknown tool type: <code>{type}</code>
      </div>
    );
  }
  return <Tool {...props} />;
}
