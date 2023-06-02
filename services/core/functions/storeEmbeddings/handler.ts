import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { HttpStatusCodes } from '@swarmion/serverless-contracts';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { getEnvVariable, getSecretValue } from 'helpers';

const client = new S3Client({});
const SUPABASE_URL = getEnvVariable('SUPABASE_URL');

export const main = async (): Promise<unknown> => {
  const fileName =
    'How to Conceive a Good Architecture 8091ba005a94416bb10f2ca778c1c796.md';
  const command = new GetObjectCommand({
    Bucket: getEnvVariable('S3_BUCKET_NAME'),
    Key: fileName,
  });

  let notionDatabase = '';

  const response = await client.send(command);
  notionDatabase = (await response.Body?.transformToString()) ?? '';

  const splitter = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 800,
    chunkOverlap: 3,
  });
  const documents = await splitter.createDocuments([notionDatabase]);

  const SUPABASE_KEY = await getSecretValue(getEnvVariable('SUPABASE_KEY_ARN'));

  // Put outside of main to run during cold start
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const OPENAI_API_KEY = await getSecretValue(
    getEnvVariable('OPENAI_API_KEY_ARN'),
  );

  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const saveVectorEmbed = async (chunk: string) => {
    const embed = await openAIEmbeddings.embedQuery(chunk);

    await supabase.from('documents').insert({
      title: fileName,
      body: chunk,
      embedding: embed,
    });
  };

  await Promise.all(
    documents.map(document => saveVectorEmbed(document.pageContent)),
  );

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: 'ok' },
  };
};
