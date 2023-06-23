import { getSlackClient } from './slackClient';

export const sendMessage = async ({
  channelId,
  text,
}: {
  channelId: string;
  text: string;
}): Promise<void> => {
  const web = await getSlackClient();
  await web.chat.postMessage({ channel: channelId, text });
};
