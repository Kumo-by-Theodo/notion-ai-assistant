const KEY = 'KEY';

import { OpenAIEmbeddings } from 'langchain/embeddings';

const embeddings = new OpenAIEmbeddings({ openAIApiKey: KEY });

export const embedDocuments = async (
  documents: string[],
): Promise<number[][]> => await embeddings.embedDocuments(documents);
