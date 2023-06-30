import {
  ApiGatewayContract,
  HttpStatusCodes,
} from '@swarmion/serverless-contracts';

const bodySchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
  },
  required: ['question'],
  additionalProperties: false,
} as const;

const outputSuccessSchema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
  additionalProperties: false,
} as const;

export const getAnswerContract = new ApiGatewayContract({
  id: 'core-get-answer',
  path: '/get-answer',
  method: 'POST',
  integrationType: 'restApi',
  bodySchema: bodySchema,
  outputSchemas: {
    [HttpStatusCodes.OK]: outputSuccessSchema,
  },
});
