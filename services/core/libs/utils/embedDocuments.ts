import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain/llms/openai';

const KEY = 'KEY';

export const openAIModel = new OpenAI({ openAIApiKey: KEY, temperature: 0.9 });

export const openAIEmbeddings = new OpenAIEmbeddings({ openAIApiKey: KEY });

export const embedDocuments = async (
  documents: string[],
): Promise<number[][]> => await openAIEmbeddings.embedDocuments(documents);

export const embedQuery = async (query: string): Promise<number[]> =>
  await openAIEmbeddings.embedQuery(query);
