import { createClient } from '@supabase/supabase-js';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import { LLMChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';

import { getAnswerFunctionContract } from '@notion-ai-assistant/core-contracts';

import { getEnvVariable, getSecretValue } from 'helpers';

const ajv = new Ajv();
const SUPABASE_URL = getEnvVariable('SUPABASE_URL');
type SupabaseMatchDocumentsResponse = {
  id: number;
  title: string;
  body: string;
  similarity: number;
}[];

export const main = getHandler(getAnswerFunctionContract, { ajv })(async () => {
  const OPENAI_API_KEY = await getSecretValue(
    getEnvVariable('OPENAI_API_KEY_ARN'),
  );

  const openAIModel = new OpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.9,
  });

  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const SUPABASE_KEY = await getSecretValue(getEnvVariable('SUPABASE_KEY_ARN'));

  // Put outside of main to run during cold start
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const question = 'what is a good architecture';

  let closestChunks: SupabaseMatchDocumentsResponse;
  let chatgptResponse: ChainValues = {};

  try {
    const questionEmbedding = await openAIEmbeddings.embedQuery(question);

    const findClosestChunk = async (queryEmbedding: number[]) => {
      const { data } = (await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.78, // Choose an appropriate threshold for your data
        match_count: 10, // Choose the number of matches
      })) as { data: SupabaseMatchDocumentsResponse };

      return data;
    };

    closestChunks = await findClosestChunk(questionEmbedding);
    closestChunks.sort((a, b) => a.id - b.id);
    console.log({ closestChunks });
    const concatenatedChunk = closestChunks.reduce(
      (previousValue, currentValue) => previousValue + '\n' + currentValue.body,
      '',
    );
    console.log({ concatenatedChunk });

    const template = 'Knowing {closestChunk}, {question}';
    const prompt = new PromptTemplate({
      template,
      inputVariables: ['closestChunk', 'question'],
    });

    const chain = new LLMChain({ llm: openAIModel, prompt });
    chatgptResponse = await chain.call({
      closestChunk: concatenatedChunk,
      question,
    });
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: JSON.stringify(chatgptResponse) },
  };
});
