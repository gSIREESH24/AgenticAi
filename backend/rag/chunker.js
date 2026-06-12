export default function chunkText(text, maxSize = 1000, overlap = 200) {
  if (!text || typeof text !== 'string') return [];

  // Normalize newlines: replace carriage returns
  const normalizedText = text.replace(/\r\n/g, '\n');
  
  // Split into raw paragraphs (separated by 2 or more newlines)
  const rawParagraphs = normalizedText.split(/\n{2,}/);
  
  const units = [];
  
  for (const rawPara of rawParagraphs) {
    // Clean up the paragraph: replace single newlines with spaces
    const cleanPara = rawPara
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (!cleanPara) continue;
    
    if (cleanPara.length <= maxSize) {
      units.push(cleanPara);
    } else {
      // Paragraph is too large, split it into sentences
      // Match sentence endings followed by space or end of string
      const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s+|$)/g) || [cleanPara];
      for (let sentence of sentences) {
        sentence = sentence.trim();
        if (!sentence) continue;
        
        if (sentence.length <= maxSize) {
          units.push(sentence);
        } else {
          // Sentence is still too large, split it by words
          const words = sentence.split(' ');
          let currentWordChunk = '';
          for (const word of words) {
            if (currentWordChunk.length + 1 + word.length > maxSize) {
              if (currentWordChunk) units.push(currentWordChunk);
              currentWordChunk = word;
            } else {
              currentWordChunk = currentWordChunk ? currentWordChunk + ' ' + word : word;
            }
          }
          if (currentWordChunk) {
            units.push(currentWordChunk);
          }
        }
      }
    }
  }

  // Now, group the units into chunks with overlap
  const chunks = [];
  let currentChunk = '';
  
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    
    if (!currentChunk) {
      currentChunk = unit;
    } else if (currentChunk.length + 1 + unit.length <= maxSize) {
      currentChunk += ' ' + unit;
    } else {
      chunks.push(currentChunk);
      
      // Calculate overlap: find how many preceding units we can include as overlap
      let overlapChunk = '';
      let j = i - 1;
      while (j >= 0 && overlapChunk.length + 1 + units[j].length <= overlap) {
        overlapChunk = units[j] + (overlapChunk ? ' ' + overlapChunk : '');
        j--;
      }
      
      currentChunk = overlapChunk ? overlapChunk + ' ' + unit : unit;
      // Truncate currentChunk if it somehow exceeds maxSize
      if (currentChunk.length > maxSize) {
        currentChunk = currentChunk.slice(-maxSize);
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
