import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { healthContract } from '@notion-ai-assistant/core-contracts';

const ajv = new Ajv();

const client = new S3Client({});

export const main = getHandler(healthContract, { ajv })(async () => {
  const command = new GetObjectCommand({
    Bucket: 'notion-ai-assistant-core-dev-notionbucketf69ce289-zu4u6stm6kj1',
    Key: 'How to Conceive a Good Architecture 8091ba005a94416bb10f2ca778c1c796.md',
  });

  let str = '';
  let output;

  try {
    const response = await client.send(command);
    str = (await response.Body?.transformToString()) ?? '';

    const splitter = new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 800,
      chunkOverlap: 3,
    });
    output = await splitter.createDocuments([str]);
    console.log(output);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: JSON.stringify(output) },
  };
});
