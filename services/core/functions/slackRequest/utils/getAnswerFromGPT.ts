import { OpenAI } from 'langchain';

import { getEnvVariable, getSecretValue } from 'helpers';

export const getAnswerFromGPT = async (question: string): Promise<string> => {
  const OPENAI_API_KEY = await getSecretValue(
    getEnvVariable('OPENAI_API_KEY_ARN'),
  );

  const openAIModel = new OpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.9,
  });

  return await openAIModel.call(question);
};
