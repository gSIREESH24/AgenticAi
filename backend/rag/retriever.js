import { getCollection } from './vectorStore.js';
import { createEmbedding } from './embedder.js';

export async function searchChunks(query, sourceFilename) {
  try {
    const collection = await getCollection();
    const queryEmbedding = await createEmbedding(query);
    const queryParams = {
      queryEmbeddings: [queryEmbedding],
      nResults: 3
    };
    if (sourceFilename) {
      queryParams.where = { source: sourceFilename };
    }
    const result = await collection.query(queryParams);
    return result;
  } catch (error) {
    console.error('Error in searchChunks:', error);
    return {
      documents: [[]],
      ids: [[]],
      metadatas: [[]],
      distances: [[]]
    };
  }
}
