// controllers/quizFromFileController.js
// NEW — reads questions.json, filters, returns poll-shaped questions.
// Does NOT touch any existing controller or model.

const path = require('path');
const fs   = require('fs');

const QUESTIONS_PATH = path.join(__dirname, '..', 'questions.json');

function loadQuestions() {
  const raw = fs.readFileSync(QUESTIONS_PATH, 'utf8');
  return JSON.parse(raw);
}

// GET /api/quiz/from-file/meta
// Returns the available topics and difficulties so the frontend can build dropdowns.
function getMeta(req, res) {
  try {
    const questions = loadQuestions();
    const topics      = [...new Set(questions.map(q => q.topic))].sort();
    const difficulties = ['easy', 'medium', 'hard'];
    res.json({ data: { topics, difficulties } });
  } catch (err) {
    console.error('[quizFromFile] meta error:', err.message);
    res.status(500).json({ error: 'Could not read questions file.' });
  }
}

// POST /api/quiz/from-file
// Body: { topic, difficulty, numberOfQuestions }
function generateFromFile(req, res) {
  try {
    const { topic, difficulty, numberOfQuestions } = req.body || {};

    // ── Validation ────────────────────────────────────────────────
    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'topic and difficulty are required.' });
    }
    const numQ = parseInt(numberOfQuestions, 10);
    if (!numQ || numQ < 1 || numQ > 30) {
      return res.status(400).json({ error: 'numberOfQuestions must be between 1 and 30.' });
    }

    console.log('BODY:', req.body);

    // ── Filter ────────────────────────────────────────────────────
    const questions = loadQuestions();
    const count = Number(numberOfQuestions);
    const filtered = questions.filter(
      q => q.topic.toLowerCase() === topic.toLowerCase() &&
           q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );

    if (filtered.length === 0) {
      return res.status(404).json({
        error: `No questions found for topic "${topic}" with difficulty "${difficulty}".`,
      });
    }

    // ── Random selection ──────────────────────────────────────────
    const selected = [...filtered]
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    // ── Format exactly like existing poll question shape ──────────
    // Poll schema: { question, options: [String], correctIndex, tags }
    const formatted = selected.map(q => ({
      question:     q.question,
      options:      q.options,
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : null,
      tags:         [q.topic, q.difficulty],
    }));

    res.json({
      data: {
        questions: formatted,
        meta: {
          topic,
          difficulty,
          requested: count,
          returned:  formatted.length,
          available: filtered.length,
        },
      },
    });
  } catch (err) {
    console.log('FULL ERROR:', err);
    res.status(500).json({ error: 'Quiz generation failed: ' + err.message });
  }
}

module.exports = { getMeta, generateFromFile, getTopics };

// GET /api/questions/topics — simple flat array of unique topics
function getTopics(req, res) {
  try {
    const questions = loadQuestions();
    const topics = [...new Set(questions.map(q => q.topic))].sort();
    console.log('Topics from file:', topics);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Could not read topics.' });
  }
}
