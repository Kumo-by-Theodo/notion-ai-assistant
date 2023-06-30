import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { S3Event } from 'aws-lambda';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { getSecretValue } from 'helpers';

const client = new S3Client({});
const SUPABASE_URL = getEnvVariable('SUPABASE_URL');

export const main = async (event: S3Event): Promise<unknown> => {
  const SUPABASE_KEY = await getSecretValue(getEnvVariable('SUPABASE_KEY_ARN'));

  const splitter = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 800,
    chunkOverlap: 3,
  });

  const notionDatabase: string[] = [];
  const metadatas: { title: string }[] = [];

  await Promise.all(
    event.Records.map(async record => {
      const fileName = record.s3.object.key;

      const command = new GetObjectCommand({
        Bucket: getEnvVariable('S3_BUCKET_NAME'),
        Key: fileName,
      });
      let fileContent = '';

      const response = await client.send(command);
      fileContent = (await response.Body?.transformToString()) ?? '';
      notionDatabase.push(fileContent);
      metadatas.push({ title: fileName });
    }),
  );

  // @ts-expect-error wrong typing of Document
  const documents: Document<{ title: string }>[] =
    await splitter.createDocuments(notionDatabase, metadatas);

  // Put outside of main to run during cold start
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const OPENAI_API_KEY = await getSecretValue(
    getEnvVariable('OPENAI_API_KEY_ARN'),
  );

  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const saveVectorEmbed = async ({
    chunk,
    fileName,
  }: {
    chunk: string;
    fileName: string;
  }) => {
    const embed = await openAIEmbeddings.embedQuery(chunk);

    await supabase.from('documents').insert({
      title: fileName,
      body: chunk,
      embedding: embed,
    });
  };

  await Promise.all(
    documents.map(document =>
      saveVectorEmbed({
        chunk: document.pageContent,
        fileName: document.metadata.title,
      }),
    ),
  );

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: 'ok' },
  };
};
