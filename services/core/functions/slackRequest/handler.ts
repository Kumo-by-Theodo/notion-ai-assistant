import { WebAPICallOptions } from '@slack/web-api';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { getAnswerFromGPT } from './utils/getAnswerFromGPT';
import { sendMessage } from './utils/sendMessage';

// An access token (from your Slack app or custom integration - xoxp, xoxb)

type SlackEvent = {
  channel: string;
  text: string;
  user: string;
  bot_id?: string;
};

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.body === null) {
    throw new Error('No body provided');
  }

  const requestBody = JSON.parse(event.body) as WebAPICallOptions;
  const eventType = requestBody.type as string;

  if (eventType === 'url_verification') {
    const challenge = requestBody.challenge;

    return {
      statusCode: 200,
      body: JSON.stringify({ challenge }),
    };
  }

  const { channel: channelId, text, bot_id } = requestBody.event as SlackEvent;

  const isBot = bot_id !== undefined;

  if (!isBot) {
    const response = await getAnswerFromGPT(text);

    await sendMessage({ channelId, text: response });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
};
