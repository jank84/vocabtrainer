import { decodeHTML, slugify } from '../utils/text.js';
import { storeVocabFile, loadVocabFile, deleteVocabFile } from '../utils/db.js';

// =========================================================================
// Constants
// =========================================================================
export const DEFAULT_VOCAB_FILE = 'pol_ lesson 1 + 2.txt';
const FILES_REGISTRY_KEY = 'anki_scribe_files';
const ACTIVE_FILE_KEY = 'anki_scribe_active_file';
const DEFAULT_BATCH_SIZE = 20;

export const RATING_INTERVALS = {
  again: 1 * 60 * 1000,
  hard: 6 * 60 * 1000,
  good: 10 * 60 * 1000,
  easy: 3 * 24 * 60 * 60 * 1000
};

export const MASTERY_SCORES = { again: 10, hard: 40, good: 75, easy: 100 };

// =========================================================================
// Reactive State (Svelte 5 runes via module-level $state)
// We use a single state object to keep everything centralized.
// =========================================================================
function createAppState() {
  let vocabulary = $state([]);
  let activeFileSlug = $state('');
  let currentBatch = $state([]);
  let currentVocab = $state(null);
  let isChecking = $state(false);
  let isShowingResult = $state(false);
  let lastCheckResult = $state(null);
  let isLoading = $state(true);
  let loadingStatus = $state('Ready!');
  let loadingProgress = $state(1.0);
  let statsModalOpen = $state(false);
  let filePickerOpen = $state(false);
  let statsCache = $state({});

  // =========================================================================
  // File Registry (localStorage)
  // =========================================================================
  function getFileRegistry() {
    try {
      const raw = localStorage.getItem(FILES_REGISTRY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveFileRegistry(files) {
    localStorage.setItem(FILES_REGISTRY_KEY, JSON.stringify(files));
  }

  function registerFile(slug, displayName) {
    const files = getFileRegistry();
    if (!files.find(f => f.slug === slug)) {
      files.push({ slug, name: displayName });
      saveFileRegistry(files);
    }
  }

  function unregisterFile(slug) {
    const files = getFileRegistry().filter(f => f.slug !== slug);
    saveFileRegistry(files);
  }

  function getActiveFileSlug() {
    return localStorage.getItem(ACTIVE_FILE_KEY) || '';
  }

  function setActiveFileSlug(slug) {
    localStorage.setItem(ACTIVE_FILE_KEY, slug);
    activeFileSlug = slug;
  }

  // =========================================================================
  // Stats Storage
  // =========================================================================
  function getStorageKey() { return 'anki_scribe_stats_' + activeFileSlug; }
  function getBatchKey() { return 'anki_scribe_batch_' + activeFileSlug; }
  function getBatchSizeKey() { return 'anki_scribe_batch_size_' + activeFileSlug; }

  function migrateLegacyStats(slug) {
    const legacyStats = localStorage.getItem('anki_scribe_stats');
    const legacyBatch = localStorage.getItem('anki_scribe_batch');
    const legacyBatchSize = localStorage.getItem('anki_scribe_batch_size');
    const newStatsKey = 'anki_scribe_stats_' + slug;
    if (!localStorage.getItem(newStatsKey) && legacyStats) {
      localStorage.setItem(newStatsKey, legacyStats);
      if (legacyBatch) localStorage.setItem('anki_scribe_batch_' + slug, legacyBatch);
      if (legacyBatchSize) localStorage.setItem('anki_scribe_batch_size_' + slug, legacyBatchSize);
      localStorage.removeItem('anki_scribe_stats');
      localStorage.removeItem('anki_scribe_batch');
      localStorage.removeItem('anki_scribe_batch_size');
    }
  }

  function loadStatsFromStorage() {
    try {
      const raw = localStorage.getItem(getStorageKey());
      statsCache = raw ? JSON.parse(raw) : {};
    } catch { statsCache = {}; }
  }

  function loadStats() {
    return statsCache;
  }

  function saveStats(stats) {
    localStorage.setItem(getStorageKey(), JSON.stringify(stats));
    statsCache = { ...stats };
  }

  function recordAttempt(vocabId, rating) {
    const stats = { ...statsCache };
    if (!stats[vocabId]) {
      stats[vocabId] = { attempts: 0, correct: 0, wrong: 0, again: 0, hard: 0, good: 0, easy: 0, history: [] };
    }
    const s = { ...stats[vocabId], history: [...(stats[vocabId].history || [])] };
    s.attempts++;
    if (rating === 'again' || rating === 'hard') {
      s.wrong++;
    } else {
      s.correct++;
    }
    s[rating] = (s[rating] || 0) + 1;
    s.dueAt = Date.now() + RATING_INTERVALS[rating];
    s.history.push({
      timestamp: Date.now(),
      correct: rating === 'good' || rating === 'easy',
      rating: rating
    });
    stats[vocabId] = s;
    saveStats(stats);
  }

  function clearStats() {
    localStorage.removeItem(getStorageKey());
    statsCache = {};
  }

  // =========================================================================
  // Batch System
  // =========================================================================
  function getBatchSize() {
    try {
      const v = parseInt(localStorage.getItem(getBatchSizeKey()));
      return (v && v > 0) ? v : DEFAULT_BATCH_SIZE;
    } catch { return DEFAULT_BATCH_SIZE; }
  }

  function setBatchSize(size) {
    const s = Math.max(1, Math.min(size, vocabulary.length || 999));
    localStorage.setItem(getBatchSizeKey(), s);
    return s;
  }

  function loadBatch() {
    try {
      const raw = localStorage.getItem(getBatchKey());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveBatch(batchIds) {
    localStorage.setItem(getBatchKey(), JSON.stringify(batchIds));
  }

  function generateNewBatch() {
    const size = getBatchSize();
    const stats = loadStats();
    const sorted = [...vocabulary].map(v => {
      const s = stats[v.id];
      const attempts = s ? s.attempts : 0;
      const correctRate = s && s.attempts > 0 ? s.correct / s.attempts : 0;
      return { vocab: v, attempts, correctRate, rand: Math.random() };
    });
    sorted.sort((a, b) => {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      if (a.correctRate !== b.correctRate) return a.correctRate - b.correctRate;
      return a.rand - b.rand;
    });
    const picked = sorted.slice(0, Math.min(size, sorted.length));
    const batchIds = picked.map(p => p.vocab.id);
    saveBatch(batchIds);
    return batchIds;
  }

  function resolveBatch() {
    let batchIds = loadBatch();
    if (!batchIds || batchIds.length === 0) {
      batchIds = generateNewBatch();
    }
    const vocabMap = new Map(vocabulary.map(v => [v.id, v]));
    currentBatch = batchIds.map(id => vocabMap.get(id)).filter(Boolean);
    if (currentBatch.length === 0) {
      batchIds = generateNewBatch();
      currentBatch = batchIds.map(id => vocabMap.get(id)).filter(Boolean);
    }
    return currentBatch;
  }

  // =========================================================================
  // Progress Tracking
  // =========================================================================
  function getWordMastery(vocabId) {
    const stats = loadStats();
    const s = stats[vocabId];
    if (!s || !s.history || s.history.length === 0) return 0;
    const lastRating = s.history[s.history.length - 1].rating;
    return MASTERY_SCORES[lastRating] || 0;
  }

  function calculateBatchMastery() {
    if (currentBatch.length === 0) return 0;
    const total = currentBatch.reduce((sum, v) => sum + getWordMastery(v.id), 0);
    return Math.round(total / currentBatch.length);
  }

  function calculateOverallProgress() {
    const stats = loadStats();
    let mastered = 0, learning = 0, unseen = 0;
    for (const v of vocabulary) {
      const s = stats[v.id];
      if (!s || !s.history || s.history.length === 0) {
        unseen++;
      } else {
        const lastRating = s.history[s.history.length - 1].rating;
        if (lastRating === 'easy' || lastRating === 'good') {
          mastered++;
        } else {
          learning++;
        }
      }
    }
    const totalMastery = vocabulary.length > 0
      ? Math.round(vocabulary.reduce((sum, v) => sum + getWordMastery(v.id), 0) / vocabulary.length)
      : 0;
    return { mastered, learning, unseen, total: vocabulary.length, totalMastery };
  }

  // =========================================================================
  // Vocabulary Parsing
  // =========================================================================
  function parseVocabularyText(text) {
    const lines = text.split('\n');
    const vocab = [];
    let idCounter = 1;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split('\t');
      if (parts.length < 2) continue;
      const prompt = decodeHTML(parts[0].trim());
      const answerRaw = decodeHTML(parts[1].trim());
      const answerClean = answerRaw.replace(/\s*\([^)]*\)\s*$/, '').trim();
      vocab.push({
        id: 'v' + idCounter++,
        prompt,
        answer: answerClean,
        answerDisplay: answerRaw
      });
    }
    return vocab;
  }

  // =========================================================================
  // Vocabulary Loading
  // =========================================================================
  async function fetchAndStoreDefaultVocab() {
    const response = await fetch(DEFAULT_VOCAB_FILE);
    const text = await response.text();
    const slug = slugify(DEFAULT_VOCAB_FILE);
    const displayName = DEFAULT_VOCAB_FILE.replace(/\.[^.]+$/, '');
    await storeVocabFile(slug, displayName, text);
    registerFile(slug, displayName);
    return { slug, displayName, vocab: parseVocabularyText(text) };
  }

  async function loadVocabularyForSlug(slug) {
    const record = await loadVocabFile(slug);
    if (!record) return null;
    const vocab = parseVocabularyText(record.text);
    return { slug: record.slug, displayName: record.name, vocab };
  }

  // =========================================================================
  // Word Picking (weighted selection based on spaced repetition)
  // =========================================================================
  function pickNextVocab() {
    const pool = currentBatch.length > 0 ? currentBatch : vocabulary;
    const stats = loadStats();
    const now = Date.now();
    const weighted = pool.map(v => {
      const s = stats[v.id];
      if (!s) return { vocab: v, weight: 10 };
      const wrongRate = s.attempts > 0 ? s.wrong / s.attempts : 0;
      const overdue = s.dueAt ? Math.max(0, (now - s.dueAt) / (1000 * 60)) : 10;
      const notYetDue = s.dueAt && s.dueAt > now;
      let weight;
      if (notYetDue) {
        weight = 0.1;
      } else {
        weight = Math.max(1, (wrongRate * 5) + Math.min(overdue / 10, 10) - (s.correct * 0.5));
      }
      return { vocab: v, weight };
    });

    const candidates = weighted.filter(w => !currentVocab || w.vocab.id !== currentVocab.id);
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const c of candidates) {
      rand -= c.weight;
      if (rand <= 0) return c.vocab;
    }
    return candidates[candidates.length - 1]?.vocab || pool[0];
  }

  // =========================================================================
  // Export/Import
  // =========================================================================
  function exportStats() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      activeFile: activeFileSlug,
      files: getFileRegistry(),
      stats: loadStats(),
      batch: loadBatch(),
      batchSize: getBatchSize()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `anki-scribe-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importStats(file, mode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || typeof data.stats !== 'object') {
            reject('Invalid backup file: missing stats data.');
            return;
          }
          if (mode === 'replace') {
            saveStats(data.stats);
            if (data.batch && Array.isArray(data.batch)) saveBatch(data.batch);
            if (data.batchSize && typeof data.batchSize === 'number') setBatchSize(data.batchSize);
          } else {
            const current = loadStats();
            const incoming = data.stats;
            for (const id of Object.keys(incoming)) {
              const inc = incoming[id];
              const cur = current[id];
              if (!cur || (inc.attempts || 0) > (cur.attempts || 0)) {
                current[id] = inc;
              }
            }
            saveStats(current);
          }
          resolveBatch();
          const wordCount = Object.keys(data.stats).length;
          resolve(wordCount);
        } catch (err) {
          reject('Failed to parse backup file: ' + err.message);
        }
      };
      reader.onerror = () => reject('Failed to read file.');
      reader.readAsText(file);
    });
  }

  // =========================================================================
  // Public Actions
  // =========================================================================
  async function switchVocabFile(slug) {
    const result = await loadVocabularyForSlug(slug);
    if (!result) return false;
    vocabulary = result.vocab;
    setActiveFileSlug(slug);
    loadStatsFromStorage();
    resolveBatch();
    lastCheckResult = null;
    currentVocab = pickNextVocab();
    isShowingResult = false;
    return true;
  }

  function skipCurrentBatch() {
    generateNewBatch();
    resolveBatch();
    lastCheckResult = null;
    currentVocab = pickNextVocab();
    isShowingResult = false;
  }

  function skipWordInBatch(vocabId) {
    let batchIds = loadBatch() || [];
    const batchSet = new Set(batchIds);
    const candidates = vocabulary.filter(v => !batchSet.has(v.id));
    if (candidates.length === 0) return;
    const stats = loadStats();
    const scored = candidates.map(v => {
      const s = stats[v.id];
      const attempts = s ? s.attempts : 0;
      return { vocab: v, score: Math.random() - attempts * 0.1 };
    });
    scored.sort((a, b) => b.score - a.score);
    const replacement = scored[0].vocab;
    batchIds = batchIds.map(id => id === vocabId ? replacement.id : id);
    saveBatch(batchIds);
    resolveBatch();
  }

  function showNextWord() {
    currentVocab = pickNextVocab();
    isShowingResult = false;
    lastCheckResult = null;
  }

  function nextWord(rating) {
    if (lastCheckResult) {
      recordAttempt(lastCheckResult.vocabId, rating);
      lastCheckResult = null;
    }
    currentVocab = pickNextVocab();
    isShowingResult = false;
  }

  function showAnswer() {
    if (isShowingResult) return;
    lastCheckResult = { vocabId: currentVocab.id, isCorrect: false };
    isShowingResult = true;
  }

  function setCheckResult(recognized, isCorrect) {
    lastCheckResult = { vocabId: currentVocab.id, isCorrect };
    isShowingResult = true;
  }

  async function importVocabFile(file) {
    const text = await file.text();
    const slug = slugify(file.name);
    const displayName = file.name.replace(/\.[^.]+$/, '');

    const existing = getFileRegistry().find(f => f.slug === slug);
    if (existing) {
      if (!confirm(`A file "${existing.name}" already exists. Overwrite it?`)) {
        return false;
      }
    }

    const vocab = parseVocabularyText(text);
    if (vocab.length === 0) {
      alert('No vocabulary entries found in this file.\nExpected format: English[TAB]Translation (one per line).');
      return false;
    }

    await storeVocabFile(slug, displayName, text);
    registerFile(slug, displayName);
    await switchVocabFile(slug);
    return true;
  }

  async function deleteFile(slug) {
    await deleteVocabFile(slug);
    unregisterFile(slug);
    localStorage.removeItem('anki_scribe_stats_' + slug);
    localStorage.removeItem('anki_scribe_batch_' + slug);
    localStorage.removeItem('anki_scribe_batch_size_' + slug);

    if (slug === activeFileSlug) {
      const remaining = getFileRegistry();
      if (remaining.length > 0) {
        await switchVocabFile(remaining[0].slug);
      }
    }
  }

  async function init() {
    isLoading = true;
    const savedSlug = getActiveFileSlug();
    let vocabLoaded = false;

    if (savedSlug) {
      const result = await loadVocabularyForSlug(savedSlug);
      if (result) {
        vocabulary = result.vocab;
        activeFileSlug = savedSlug;
        vocabLoaded = true;
      }
    }

    if (!vocabLoaded) {
      try {
        const result = await fetchAndStoreDefaultVocab();
        vocabulary = result.vocab;
        activeFileSlug = result.slug;
        migrateLegacyStats(result.slug);
      } catch (err) {
        console.error('Failed to load default vocabulary:', err);
        vocabulary = [];
      }
    }

    setActiveFileSlug(activeFileSlug);
    loadStatsFromStorage();
    resolveBatch();
    currentVocab = pickNextVocab();
  }

  function getActiveFileName() {
    const files = getFileRegistry();
    const file = files.find(f => f.slug === activeFileSlug);
    const name = file ? file.name : 'PL';
    return name.length > 14 ? name.substring(0, 12) + '..' : name;
  }

  return {
    // Reactive state getters
    get vocabulary() { return vocabulary; },
    get activeFileSlug() { return activeFileSlug; },
    get currentBatch() { return currentBatch; },
    get currentVocab() { return currentVocab; },
    get isChecking() { return isChecking; },
    set isChecking(v) { isChecking = v; },
    get isShowingResult() { return isShowingResult; },
    get lastCheckResult() { return lastCheckResult; },
    get isLoading() { return isLoading; },
    set isLoading(v) { isLoading = v; },
    get loadingStatus() { return loadingStatus; },
    set loadingStatus(v) { loadingStatus = v; },
    get loadingProgress() { return loadingProgress; },
    set loadingProgress(v) { loadingProgress = v; },
    get statsModalOpen() { return statsModalOpen; },
    set statsModalOpen(v) { statsModalOpen = v; },
    get filePickerOpen() { return filePickerOpen; },
    set filePickerOpen(v) { filePickerOpen = v; },

    // Methods
    init,
    getFileRegistry,
    getActiveFileName,
    switchVocabFile,
    skipCurrentBatch,
    skipWordInBatch,
    showNextWord,
    nextWord,
    showAnswer,
    setCheckResult,
    importVocabFile,
    deleteFile,
    loadStats,
    clearStats,
    getBatchSize,
    setBatchSize,
    calculateBatchMastery,
    calculateOverallProgress,
    getWordMastery,
    exportStats,
    importStats,
    resolveBatch,
    parseVocabularyText,
  };
}

export const appState = createAppState();
