import { CloudFormationContract } from '@swarmion/serverless-contracts';

import { projectName } from '@notion-ai-assistant/serverless-configuration';

export const httpApiResourceContract = new CloudFormationContract({
  id: 'core-httpApi',
  name: `CoreHttpApi-${projectName}`,
});
