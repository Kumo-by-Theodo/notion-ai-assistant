import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';

import { healthContract } from '@notion-ai-assistant/core-contracts';

const ajv = new Ajv();

export const main = getHandler(healthContract, { ajv })(async () => {
  const body = await Promise.resolve({ message: 'ok' });

  return { statusCode: HttpStatusCodes.OK, body };
});
