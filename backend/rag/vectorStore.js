import { ChromaClient } from 'chromadb';

const urlStr = process.env.CHROMA_URL || 'http://localhost:8000';
let host = 'localhost';
let port = 8000;
let ssl = false;

try {
  const parsed = new URL(urlStr);
  host = parsed.hostname;
  port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  ssl = parsed.protocol === 'https:';
} catch {}

const client = new ChromaClient({
  host,
  port,
  ssl
});

const dummyEmbedder = {
  generate: async (texts) => {
    return [];
  }
};

export async function getCollection() {
  try {
    return await client.getCollection({
      name: 'documents',
      embeddingFunction: dummyEmbedder
    });
  } catch {
    return await client.createCollection({
      name: 'documents',
      embeddingFunction: dummyEmbedder
    });
  }
}
