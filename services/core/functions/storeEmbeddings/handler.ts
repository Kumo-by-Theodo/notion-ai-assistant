import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { embedQuery } from 'libs/utils/embedDocuments';

const client = new S3Client({});

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

  const supabaseUrl = 'https://ydkcfsqbwtvgbhktjegg.supabase.co';
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlka2Nmc3Fid3R2Z2Joa3RqZWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU3MTIwODIsImV4cCI6MjAwMTI4ODA4Mn0.QkxDXfhMxFqrU7BClb2t-3Aj0yMNUzOu6g5hx9m_Pmc';
  // Create a single supabase client for interacting with your database
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const saveVectorEmbed = async (chunk: string) => {
    const embed = await embedQuery(chunk);

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
