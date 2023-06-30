import { WebClient } from '@slack/web-api';

import { getEnvVariable, getSecretValue } from 'helpers';

export const getSlackClient = async (): Promise<WebClient> => {
  const slackToken = await getSecretValue(getEnvVariable('SLACK_TOKEN_ARN'));
  const web = new WebClient(slackToken);

  return web;
};
