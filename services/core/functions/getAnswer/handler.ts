import { createClient } from '@supabase/supabase-js';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import { LLMChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';

import { getAnswerContract } from '@notion-ai-assistant/core-contracts';

import { getSecretValue } from 'helpers';

const ajv = new Ajv();

type SupabaseMatchDocumentsResponse = {
  id: number;
  title: string;
  body: string;
  similarity: number;
}[];

export const main = getHandler(getAnswerContract, { ajv })(async event => {
  const SUPABASE_URL = getEnvVariable('SUPABASE_URL');

  const OPENAI_API_KEY = await getSecretValue(
    getEnvVariable('OPENAI_API_KEY_ARN'),
  );

  const openAIModel = new OpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0,
  });

  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const SUPABASE_KEY = await getSecretValue(getEnvVariable('SUPABASE_KEY_ARN'));

  // Put outside of main to run during cold start
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { question } = event.body;

  let closestChunks: SupabaseMatchDocumentsResponse;
  let chatgptResponse: ChainValues = {};

  try {
    const questionEmbedding = await openAIEmbeddings.embedQuery(question);

    const findClosestChunk = async (queryEmbedding: number[]) => {
      const { data } = (await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.78, // Choose an appropriate threshold for your data
        match_count: 5, // Choose the number of matches
      })) as { data: SupabaseMatchDocumentsResponse };

      return data;
    };

    closestChunks = await findClosestChunk(questionEmbedding);
    closestChunks.sort((a, b) => a.id - b.id);
    const concatenatedChunk = closestChunks.reduce(
      (previousValue, currentValue) => previousValue + '\n' + currentValue.body,
      '',
    );

    const prompt = PromptTemplate.fromTemplate(
      'Answer with one sentance. Given the following context: {concatenatedChunk} \n Answer the following question: {question}',
    );

    const chain = new LLMChain({ llm: openAIModel, prompt });
    chatgptResponse = await chain.call({
      question,
      concatenatedChunk,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const answer = chatgptResponse.text;
    console.log('answer', answer);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { answer: JSON.stringify(chatgptResponse) },
  };
});
