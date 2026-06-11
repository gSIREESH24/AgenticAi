import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './PdfExtractor.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function PdfExtractor({
  isDark,
  onToggleTheme,
  onToggleSidebar,
  token,
  activePdfId,
  setActivePdfId,
  pdfs,
  setPdfs
}) {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedChunkId, setCopiedChunkId] = useState(null);
  const [subTab, setSubTab] = useState('upload');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activePdfId) {
      loadPdfSession(activePdfId);
    } else {
      setFile(null);
      setChunks([]);
      setQuery('');
      setSearchResults(null);
      setAnswer('');
      setError(null);
    }
  }, [activePdfId]);

  const loadPdfSession = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/pdfs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pdf = res.data;
      setFile({ name: pdf.fileName, size: pdf.fileSize });
      setChunks(pdf.chunks || []);
      setQuery('');
      setSearchResults(null);
      setAnswer('');
    } catch (err) {
      console.error(err);
      setError('Failed to load PDF session.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file.');
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const uploadPdf = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      const newPdf = response.data;
      setChunks(newPdf.chunks || []);
      setActivePdfId(newPdf._id);
      setPdfs(prev => [newPdf, ...prev]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to parse PDF file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (chunks.length === 0) return;
    const fullText = chunks.map(c => c.content).join('\n\n');
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyChunk = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedChunkId(id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const handleDownload = () => {
    if (chunks.length === 0) return;
    const fullText = chunks.map(c => `--- Chunk ${c.id + 1} (Source: ${c.source}) ---\n${c.content}`).join('\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name?.replace(/\.[^/.]+$/, '') || 'chunks'}-text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetUploader = () => {
    setFile(null);
    setChunks([]);
    setError(null);
    setActivePdfId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const askQuestion = async () => {
    if (!query.trim()) return;
    setQaLoading(true);
    setAnswer('');
    setError(null);
    try {
      const answerRes = await axios.post(
        `${API_BASE}/ask`,
        { question: query.trim(), sourceFilename: file?.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswer(answerRes.data.answer);

      const searchRes = await axios.post(
        `${API_BASE}/search`,
        { query: query.trim(), sourceFilename: file?.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(searchRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to get answer from document.');
    } finally {
      setQaLoading(false);
    }
  };

  const performSearchOnly = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchResults(null);
    setAnswer('');
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/search`,
        { query: query.trim(), sourceFilename: file?.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to search vector database.');
    } finally {
      setSearchLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <main className="pdf-extractor-area">
      <header className="chat-header">
        <div className="hdr-left">
          <button className="hdr-menu-btn" onClick={onToggleSidebar} title="Toggle sidebar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="hdr-brand-wrap">
            <span className="hdr-brand">SYNTHETIX <span>AI</span></span>
            <div className="hdr-agent-pill">
              <span className="hdr-pill-dot" style={{ background: '#f59e0b', boxShadow: '0 0 7px #f59e0b' }}/>
              PDF RAG Tool
            </div>
          </div>
        </div>
        <div className="hdr-tabs">
          <button className={`hdr-tab-btn ${subTab === 'upload' ? 'active' : ''}`} onClick={() => setSubTab('upload')}>
            Upload
          </button>
          <button className={`hdr-tab-btn ${subTab === 'search' ? 'active' : ''}`} onClick={() => setSubTab('search')}>
            AI Q&A
          </button>
        </div>
        <div className="hdr-right">
          <button className="hdr-icon-btn theme-toggle-btn" onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <SunIcon/> : <MoonIcon/>}
          </button>
        </div>
      </header>

      <div className="extractor-viewport">
        {subTab === 'upload' ? (
          chunks.length === 0 && !loading ? (
            <div className="extractor-card">
              <h2 className="extractor-title">PDF Text Extractor</h2>
              <p className="extractor-subtitle">Upload a PDF document to extract all its textual content instantly.</p>

              <div
                className={`dropzone ${dragOver ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!file ? triggerFileSelect : undefined}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden-file-input"
                  onChange={handleFileChange}
                />
                
                <div className="dropzone-inner">
                  {file ? (
                    <div className="file-info-view">
                      <div className="pdf-file-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="file-name-label">{file.name}</span>
                      <span className="file-size-label">{formatSize(file.size)}</span>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <div className="upload-cloud-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="prompt-headline">Drag & drop PDF here</span>
                      <span className="prompt-subtext">or click to browse local files</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="extractor-error">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {file && (
                <div className="extractor-action-buttons">
                  <button className="btn-secondary" onClick={resetUploader}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={uploadPdf}>
                    Extract Text
                  </button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="extractor-loading">
              <div className="loading-orb-wrap">
                <div className="loading-ring-1"/>
                <div className="loading-ring-2"/>
                <div className="loading-orb"/>
              </div>
              <h3 className="loading-text">Processing PDF...</h3>
              <p className="loading-subtext">Parsing text, creating embeddings, and storing chunks in vector DB.</p>
            </div>
          ) : (
            <div className="results-container">
              <div className="results-header">
                <div className="results-meta">
                  <span className="results-title">Extracted Chunks</span>
                  <span className="results-filename">{file?.name} (Total: {chunks.length})</span>
                </div>
                <div className="results-actions">
                  <button className="btn-icon" onClick={handleCopy} title="Copy all chunks text">
                    {copied ? (
                      <svg viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="1.8" width="15" height="15">
                        <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                    <span>{copied ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button className="btn-icon" onClick={handleDownload} title="Download as .txt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Download</span>
                  </button>
                  <button className="btn-accent" onClick={resetUploader}>
                    Upload New
                  </button>
                </div>
              </div>
              <div className="chunks-list-container">
                {chunks.map((chunk, index) => (
                  <div key={chunk.id} className="chunk-card">
                    <div className="chunk-card-header">
                      <span className="chunk-card-title">Chunk {index + 1}</span>
                      <div className="chunk-card-meta">
                        <span className="chunk-meta-badge">Source: {chunk.source}</span>
                        <span className="chunk-meta-badge">ID: {chunk.id}</span>
                        <span className="chunk-meta-badge">Chars: {chunk.content.length}</span>
                        <button
                          className="chunk-copy-btn"
                          onClick={() => handleCopyChunk(chunk.id, chunk.content)}
                          title="Copy chunk text"
                        >
                          {copiedChunkId === chunk.id ? (
                            <svg viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="1.8" width="12" height="12">
                              <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="chunk-card-body">
                      <p className="chunk-text-content">{chunk.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="search-tab-container">
            <div className="search-query-section">
              <h2 className="search-headline">Document AI Q&A</h2>
              <p className="search-tagline">Ask questions based on your document. The AI will answer strictly using the retrieved context.</p>
              
              <div className="search-bar-wrap">
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Ask a question about this document..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                  disabled={qaLoading || searchLoading}
                />
                <button
                  className="search-submit-btn"
                  onClick={askQuestion}
                  disabled={!query.trim() || qaLoading || searchLoading}
                  style={{ marginRight: '6px' }}
                >
                  {qaLoading ? 'Analyzing...' : 'Ask AI'}
                </button>
                <button
                  className="search-submit-btn"
                  onClick={performSearchOnly}
                  disabled={!query.trim() || qaLoading || searchLoading}
                  style={{ background: 'rgba(217, 119, 6, 0.12)', border: '1px solid var(--b-mid)', color: 'var(--a-300)', boxShadow: 'none' }}
                >
                  {searchLoading ? 'Searching...' : 'Search Chunks'}
                </button>
              </div>

              {error && (
                <div className="extractor-error" style={{ width: '100%', maxWidth: '720px' }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {(qaLoading || searchLoading) ? (
              <div className="extractor-loading" style={{ margin: '40px auto 0' }}>
                <div className="loading-orb-wrap" style={{ width: '64px', height: '64px' }}>
                  <div className="loading-ring-1"/>
                  <div className="loading-ring-2"/>
                  <div className="loading-orb" style={{ top: '20px', left: '20px', width: '24px', height: '24px' }}/>
                </div>
                <h3 className="loading-text" style={{ fontSize: '15px' }}>{qaLoading ? 'Formulating Answer...' : 'Retrieving Semantic Chunks...'}</h3>
              </div>
            ) : (
              <div className="search-results-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                {answer && (
                  <div className="qa-answer-card">
                    <div className="qa-answer-header">
                      <span className="qa-answer-title">Synthetix RAG Assistant</span>
                      <button
                        className="chunk-copy-btn"
                        onClick={() => handleCopyChunk('qa-answer', answer)}
                        title="Copy answer"
                      >
                        {copiedChunkId === 'qa-answer' ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="1.8" width="14" height="14">
                            <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="qa-answer-body">
                      <p className="qa-answer-text">{answer}</p>
                    </div>
                  </div>
                )}

                {searchResults && searchResults.documents && searchResults.documents[0] && (
                  <div className="search-results-section">
                    <div className="results-header" style={{ marginBottom: '10px' }}>
                      <span className="results-title" style={{ fontSize: '13px', color: 'var(--t-muted)' }}>
                        {answer ? 'Reference Document Context Chunks' : `Retrieved Semantic Chunks (${searchResults.documents[0].length} matches)`}
                      </span>
                    </div>
                    
                    {searchResults.documents[0].length === 0 ? (
                      <div className="no-matches-view">No relevant chunks found in the database. Try uploading some documents first.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {searchResults.documents[0].map((doc, idx) => {
                          const meta = searchResults.metadatas[0][idx];
                          const distance = searchResults.distances ? searchResults.distances[0][idx] : null;
                          const matchPct = distance !== null ? Math.max(0, Math.min(100, Math.round((1 - distance) * 100))) : null;
                          
                          return (
                            <div key={idx} className="chunk-card">
                              <div className="chunk-card-header">
                                <span className="chunk-card-title" style={{ color: '#fb923c' }}>Reference Source {idx + 1}</span>
                                <div className="chunk-card-meta">
                                  {meta && meta.source && <span className="chunk-meta-badge">File: {meta.source}</span>}
                                  {matchPct !== null && <span className="chunk-meta-badge" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.05)', borderColor: 'rgba(74,222,128,0.15)' }}>{matchPct}% Match</span>}
                                  <button
                                    className="chunk-copy-btn"
                                    onClick={() => handleCopyChunk(`search-${idx}`, doc)}
                                    title="Copy chunk text"
                                  >
                                    {copiedChunkId === `search-${idx}` ? (
                                      <svg viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="1.8" width="12" height="12">
                                        <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="chunk-card-body">
                                <p className="chunk-text-content">{doc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
