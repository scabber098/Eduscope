const QuestionBank = require('../models/QuestionBank');

// POST /api/question-bank
async function createQuestion(req, res) {
  try {
    const { question, options, correct_index, tags, difficulty, subject } = req.body || {};
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'question and at least 2 options required' });
    }
    const q = await QuestionBank.create({
      faculty_id: req.user.id,
      university_id: req.user.university_id || null,
      question: question.trim(),
      options: options.map(o => String(o).trim()),
      correct_index: Number.isInteger(correct_index) ? correct_index : null,
      tags: Array.isArray(tags) ? tags : [],
      difficulty: difficulty || 'medium',
      subject: subject || '',
    });
    res.status(201).json({ data: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/question-bank
async function listQuestions(req, res) {
  try {
    const { tag, subject, difficulty, search, page = 1, limit = 20 } = req.query;
    const filter = { faculty_id: req.user.id, archived: false };
    if (tag) filter.tags = tag;
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.question = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      QuestionBank.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      QuestionBank.countDocuments(filter),
    ]);
    res.json({ data: questions, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/question-bank/:id — soft delete
async function deleteQuestion(req, res) {
  try {
    const q = await QuestionBank.findOne({ _id: req.params.id, faculty_id: req.user.id });
    if (!q) return res.status(404).json({ error: 'Not found' });
    q.archived = true;
    await q.save();
    res.json({ data: { archived: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/question-bank/bulk-import
async function bulkImport(req, res) {
  try {
    const { questions } = req.body || {};
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ error: 'questions array required' });

    const valid = [];
    const errors = [];
    questions.forEach((q, i) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        errors.push({ index: i, reason: 'missing question or < 2 options' });
        return;
      }
      valid.push({
        faculty_id: req.user.id,
        university_id: req.user.university_id || null,
        question: String(q.question).trim(),
        options: q.options.map(o => String(o).trim()),
        correct_index: Number.isInteger(q.correct_index) ? q.correct_index : null,
        tags: Array.isArray(q.tags) ? q.tags : [],
        difficulty: q.difficulty || 'medium',
        subject: q.subject || '',
      });
    });

    const inserted = valid.length ? await QuestionBank.insertMany(valid) : [];
    res.json({ data: { inserted: inserted.length, errors } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/question-bank/suggestions
async function suggestions(req, res) {
  try {
    const tags = [].concat(req.query['tags[]'] || req.query.tags || []);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    if (!tags.length) return res.json({ data: [] });

    const questions = await QuestionBank.find({ faculty_id: req.user.id, archived: false, tags: { $in: tags } })
      .sort({ usage_count: -1 })
      .limit(limit)
      .select('question options correct_index tags difficulty subject usage_count');
    res.json({ data: questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/question-bank/:id/use
async function markUsed(req, res) {
  try {
    const q = await QuestionBank.findOneAndUpdate(
      { _id: req.params.id, faculty_id: req.user.id },
      { $inc: { usage_count: 1 } },
      { new: true }
    );
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json({ data: { usage_count: q.usage_count } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createQuestion, listQuestions, deleteQuestion, bulkImport, suggestions, markUsed };
