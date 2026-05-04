const Session = require('../models/Session');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const AIInsight = require('../models/AIInsight');

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// GET /api/ai-insights/session/:sessionId
async function getSessionInsight(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.faculty_id.toString() !== req.user.id) return res.status(403).json({ error: 'Not your session' });

    // Return cached if fresh
    const cached = await AIInsight.findOne({ session_id: sessionId });
    if (cached && Date.now() - cached.generated_at < CACHE_TTL) {
      return res.json({ data: cached, cached: true });
    }

    // Aggregate poll data
    const polls = await Poll.find({ session_id: sessionId });
    if (!polls.length) return res.status(400).json({ error: 'No polls in session' });

    const pollData = await Promise.all(polls.map(async (poll) => {
      const responses = await Response.find({ poll_id: poll._id });
      const distribution = poll.options.map((opt, i) => ({
        option: opt,
        count: responses.filter(r => r.answer_index === i).length,
      }));
      const correctCount = poll.correct_index !== null
        ? responses.filter(r => r.answer_index === poll.correct_index).length
        : null;
      const accuracy = correctCount !== null && responses.length
        ? Math.round((correctCount / responses.length) * 100)
        : null;
      return {
        question: poll.question,
        tags: poll.tags,
        total_responses: responses.length,
        accuracy_pct: accuracy,
        distribution,
      };
    }));

    // Build prompt for Claude API
    const prompt = `You are an expert educational analyst. Analyze this live quiz session data and provide insights.

Session: "${session.title}"
Total polls: ${polls.length}

Poll Results:
${pollData.map((p, i) => `
Q${i + 1}: ${p.question}
Tags: ${p.tags.join(', ') || 'none'}
Responses: ${p.total_responses}
Accuracy: ${p.accuracy_pct !== null ? p.accuracy_pct + '%' : 'N/A (no correct answer set)'}
Distribution: ${p.distribution.map(d => `"${d.option}": ${d.count}`).join(', ')}
`).join('\n')}

Respond ONLY with a JSON object (no markdown, no extra text) in this exact format:
{
  "summary": "One paragraph summarizing the session performance and class understanding",
  "suggestions": ["Teaching suggestion 1", "Teaching suggestion 2", "Teaching suggestion 3"],
  "gaps": ["Knowledge gap 1", "Knowledge gap 2", "Knowledge gap 3"]
}`;

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      return res.status(502).json({ error: 'AI API error', detail: errBody });
    }

    const apiData = await apiRes.json();
    const rawText = apiData.content?.find(c => c.type === 'text')?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch (e) {
      return res.status(502).json({ error: 'Failed to parse AI response', raw: rawText });
    }

    // Cache result
    const insight = await AIInsight.findOneAndUpdate(
      { session_id: sessionId },
      { summary: parsed.summary, suggestions: parsed.suggestions, gaps: parsed.gaps, generated_at: Date.now() },
      { upsert: true, new: true }
    );

    res.json({ data: insight, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getSessionInsight };
