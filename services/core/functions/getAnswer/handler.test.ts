import {
  getAPIGatewayEventHandlerContextMock,
  getAPIGatewayEventRequestContextMock,
} from '@swarmion/serverless-helpers';

import { main } from './handler';

describe('getAnswer handler', () => {
  // TODO: test the getAnswer handler
  it.skip('should return "ok"', async () => {
    expect(
      await main(
        {
          body: null,
          headers: {},
          multiValueHeaders: {},
          httpMethod: '',
          isBase64Encoded: false,
          path: '',
          pathParameters: null,
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          stageVariables: null,
          requestContext: getAPIGatewayEventRequestContextMock(),
          resource: '',
        },
        getAPIGatewayEventHandlerContextMock(),
        () => null,
      ),
    ).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({ message: 'ok' }),
    });
  });
});
