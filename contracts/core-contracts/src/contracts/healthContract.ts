import {
  ApiGatewayContract,
  HttpStatusCodes,
} from '@swarmion/serverless-contracts';

export const healthContract = new ApiGatewayContract({
  id: 'core-health',
  path: '/health',
  method: 'GET',
  integrationType: 'restApi',

  outputSchemas: {
    [HttpStatusCodes.OK]: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
      additionalProperties: false,
    } as const,
  },
});
