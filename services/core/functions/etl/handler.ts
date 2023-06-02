import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import { LLMChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

import { etlFunctionContract } from '@notion-ai-assistant/core-contracts';

import { getEnvVariable, getSecretValue } from 'helpers';

const ajv = new Ajv();

const client = new S3Client({});

export const main = getHandler(etlFunctionContract, { ajv })(async () => {
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

  const question = 'what is a good architecture';

  const command = new GetObjectCommand({
    Bucket: getEnvVariable('S3_BUCKET_NAME'),
    Key: 'How to Conceive a Good Architecture 8091ba005a94416bb10f2ca778c1c796.md',
  });

  let notionDatabase = '';
  let closestChunk = {};
  let chatgptResponse: ChainValues = {};

  try {
    const response = await client.send(command);
    notionDatabase = (await response.Body?.transformToString()) ?? '';

    const splitter = new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 800,
      chunkOverlap: 3,
    });
    const documents = await splitter.createDocuments([notionDatabase]);

    const vectorStore = await MemoryVectorStore.fromTexts(
      documents.map(document => document.pageContent),
      documents.map((_, index) => ({ id: index })),
      openAIEmbeddings,
    );

    closestChunk = await vectorStore.similaritySearch(question, 1);
    const template = 'Knowing {closestChunk}, {question}';
    const prompt = new PromptTemplate({
      template,
      inputVariables: ['closestChunk', 'question'],
    });

    const chain = new LLMChain({ llm: openAIModel, prompt });
    chatgptResponse = await chain.call({ closestChunk, question });
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: JSON.stringify(chatgptResponse) },
  };
});
