import { readiness } from './readiness';
import { concepts } from './concepts';
import { deterrenceChecklist } from './deterrenceChecklist';
import { intelSources } from './intelSources';
import { threats } from './threats';
import { stockpile } from './stockpile';
import { brigade } from './brigade';
import { rescueProtocol } from './rescueProtocol';
import { pledge } from './pledge';
import { fundBuckets } from './fundBuckets';
import { billTemplate } from './billTemplate';
import { deprogramming } from './deprogramming';
import { detoxChecklist } from './detoxChecklist';
import { timeline } from './timeline';
import { metrics } from './metrics';
import { covenant } from './covenant';
import { glossary } from './glossary';

// dataKey (from .mdx frontmatter `tool.dataKey`) -> the data passed to the widget.
export const toolData: Record<string, unknown> = {
  readiness,
  concepts,
  deterrenceChecklist,
  intelSources,
  threats,
  stockpile,
  brigade,
  rescueProtocol,
  pledge,
  fundBuckets,
  billTemplate,
  deprogramming,
  detoxChecklist,
  timeline,
  metrics,
  covenant,
  glossary,
};

// Glossary is also folded into the search index.
export { glossary };
