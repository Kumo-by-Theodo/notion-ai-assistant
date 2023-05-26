import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import { getEnvVariable } from '@swarmion/serverless-helpers';
import Ajv from 'ajv';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { healthContract } from '@notion-ai-assistant/core-contracts';

import { embedDocuments } from 'libs/utils/embedDocuments';

const ajv = new Ajv();

const client = new S3Client({});

export const main = getHandler(healthContract, { ajv })(async () => {
  const command = new GetObjectCommand({
    Bucket: getEnvVariable('S3_BUCKET_NAME'),
    Key: 'How to Conceive a Good Architecture 8091ba005a94416bb10f2ca778c1c796.md',
  });

  let str = '';

  let embeds: number[][] = [];
  try {
    const response = await client.send(command);
    str = (await response.Body?.transformToString()) ?? '';

    const splitter = new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 800,
      chunkOverlap: 3,
    });
    const documents = await splitter.createDocuments([str]);

    const documentsTexts = documents.map(document => document.pageContent);

    embeds = await embedDocuments(documentsTexts);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: JSON.stringify(embeds) },
  };
});
