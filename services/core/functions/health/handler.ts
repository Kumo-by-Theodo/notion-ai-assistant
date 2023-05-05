import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getHandler, HttpStatusCodes } from '@swarmion/serverless-contracts';
import Ajv from 'ajv';
import { CharacterTextSplitter } from 'langchain/text_splitter';

import { healthContract } from '@notion-ai-assistant/core-contracts';

import { embedDocuments } from 'libs/utils/embedDocuments';

const ajv = new Ajv();

const client = new S3Client({});

export const main = getHandler(healthContract, { ajv })(async () => {
  const command = new GetObjectCommand({
    Bucket: 'notion-ai-assistant-core-dev-notionbucketf69ce289-ixgv7hanz4vx',
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
    /*
    embeds is an array of array
    const textArr = ['The quick brown fox', 'Jumped over the lazy dog'];
    const embedResult = [
      [0.1, 0.2, 0.3, ..., 0.9], // embedding for 'The quick brown fox'
      [0.2, 0.3, 0.4, ..., 0.8]  // embedding for 'Jumped over the lazy dog'
    ];
    In our case, we can use it as:
    const embedsWithTexts = embeds.forEach((embed, index) => ({
      embed,
      chunk: documentsTexts[index],
    }));
    */

    embeds = await embedDocuments(documentsTexts);
  } catch (err) {
    console.error(err);
  }

  return {
    statusCode: HttpStatusCodes.OK,
    body: { message: JSON.stringify(embeds) },
  };
});
