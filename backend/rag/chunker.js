export default function chunkText(text, maxSize = 1000) {
  const paragraphs = text.split('\n');
  const chunks = [];
  let currentChunk = '';
  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;
    if (currentChunk.length + p.length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = '';
    }
    currentChunk += p + '\n';
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}
