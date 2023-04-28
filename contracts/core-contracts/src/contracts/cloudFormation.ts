import { CloudFormationContract } from '@swarmion/serverless-contracts';

import { projectName } from '@test-supabase-nextauth-swarmion/serverless-configuration';

export const httpApiResourceContract = new CloudFormationContract({
  id: 'core-httpApi',
  name: `CoreHttpApi-${projectName}`,
});
