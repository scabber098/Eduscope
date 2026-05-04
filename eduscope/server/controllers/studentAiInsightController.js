// === FILE: server/controllers/studentAiInsightController.js ===
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const Lecture = require('../models/Lecture');
const questionsBank = require('../questions.json');

// Build topic map from questions.json
function buildTopicMap() {
  const map = {};
  questionsBank.forEach(q => {
    map[q.question.trim().toLowerCase()] = {
      topic: q.topic,
      correctIndex: q.correctIndex,
      correctAnswer: q.options[q.correctIndex],
      explanation: `Revise ${q.topic} concepts. The correct answer is "${q.options[q.correctIndex]}".`,
      suggestion: `Focus on ${q.topic} (${q.difficulty} level). Practice more ${q.topic} problems.`,
      difficulty: q.difficulty,
    };
  });
  return map;
}

function buildFallbackInsights(wrongQuestions, allQuestionData, topicMap) {
  const weakTopicMap = {};
  wrongQuestions.forEach(wq => {
    const info = topicMap[wq.question.trim().toLowerCase()];
    if (info) {
      if (!weakTopicMap[info.topic]) {
        weakTopicMap[info.topic] = { count: 0, explanations: [], suggestions: [], questions: [] };
      }
      weakTopicMap[info.topic].count++;
      weakTopicMap[info.topic].explanations.push(info.explanation);
      weakTopicMap[info.topic].suggestions.push(info.suggestion);
      weakTopicMap[info.topic].questions.push(wq.question);
    }
  });

  const weakTopics = Object.entries(weakTopicMap).map(([topic, data]) => ({
    topic,
    wrongCount: data.count,
    explanation: data.explanations[0],
    suggestion: data.suggestions[0],
    questions: data.questions,
  }));

  // Study suggestions
  const studySuggestions = weakTopics.map(wt =>
    `Review "${wt.topic}" — you got ${wt.wrongCount} question(s) wrong in this area.`
  );
  if (!studySuggestions.length) studySuggestions.push('Great job! Keep practicing to maintain your performance.');

  // Quick tips
  const quickTips = [];
  if (weakTopics.length > 0) {
    quickTips.push(`Your weakest area is "${weakTopics[0].topic}" — start there.`);
    quickTips.push('Revisit class notes and attempt related practice questions.');
    quickTips.push('Try explaining concepts to a peer — teaching deepens understanding.');
  } else {
    quickTips.push('You answered everything correctly — challenge yourself with harder topics!');
    quickTips.push('Help classmates who may be struggling with these concepts.');
  }

  return { weakTopics, studySuggestions, quickTips, source: 'fallback' };
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
      }),
    });
    if (!resp.ok) {
      console.error('[AI Insight] Gemini API error:', resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[AI Insight] Gemini call failed:', err.message);
    return null;
  }
}

// GET /api/ai-insights/student/session/:sessionId
async function getStudentSessionInsight(req, res) {
  try {
    const { sessionId } = req.params;
    const studentId = req.user.id;

    const polls = await Poll.find({ session_id: sessionId }).lean();
    if (!polls.length) return res.status(400).json({ error: 'No polls in this session' });

    const pollIds = polls.map(p => p._id);
    const responses = await Response.find({ poll_id: { $in: pollIds }, student_id: studentId }).lean();
    if (!responses.length) return res.status(400).json({ error: 'No responses found for this session' });

    const responseMap = {};
    responses.forEach(r => { responseMap[r.poll_id.toString()] = r; });

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const wrongQuestions = [];
    const allQuestionData = [];
    const topicMap = buildTopicMap();

    for (const poll of polls) {
      const resp = responseMap[poll._id.toString()];
      const qKey = poll.question.trim().toLowerCase();
      const topicInfo = topicMap[qKey] || null;
      const topic = topicInfo?.topic || (poll.tags?.length ? poll.tags[0] : 'General');

      const qData = {
        question: poll.question,
        topic,
        options: poll.options,
        correctIndex: poll.correct_index,
        correctAnswer: poll.correct_index != null ? poll.options[poll.correct_index] : null,
      };

      if (!resp) {
        unanswered++;
        qData.studentAnswer = null;
        qData.isCorrect = null;
      } else if (poll.correct_index != null) {
        qData.studentAnswer = poll.options[resp.answer_index];
        qData.studentAnswerIndex = resp.answer_index;
        if (resp.answer_index === poll.correct_index) {
          correct++;
          qData.isCorrect = true;
        } else {
          incorrect++;
          qData.isCorrect = false;
          wrongQuestions.push(qData);
        }
      } else {
        qData.studentAnswer = poll.options[resp.answer_index];
        qData.isCorrect = null;
      }
      allQuestionData.push(qData);
    }

    const performanceChart = { correct, incorrect, unanswered, total: polls.length };

    // Try Gemini first
    let aiResult = null;
    if (wrongQuestions.length > 0 || allQuestionData.length > 0) {
      const prompt = `You are an expert educational tutor. A student just completed a quiz. Analyze their performance and provide personalized insights.

QUIZ DATA:
Total Questions: ${polls.length}
Correct: ${correct}
Incorrect: ${incorrect}

QUESTIONS AND RESPONSES:
${allQuestionData.map((q, i) => `
Q${i + 1}: ${q.question}
Topic: ${q.topic}
Correct Answer: ${q.correctAnswer || 'N/A'}
Student Answer: ${q.studentAnswer || 'Not answered'}
Result: ${q.isCorrect === true ? 'CORRECT' : q.isCorrect === false ? 'WRONG' : 'N/A'}
`).join('\n')}

WRONG QUESTIONS DETAIL:
${wrongQuestions.map(q => `- "${q.question}" (Topic: ${q.topic}) — Student chose "${q.studentAnswer}" but correct was "${q.correctAnswer}"`).join('\n') || 'None — all correct!'}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "weakTopics": [{"topic": "...", "wrongCount": 1, "explanation": "short explanation of the concept", "suggestion": "what to study"}],
  "studySuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "quickTips": ["tip1", "tip2", "tip3"]
}`;

      aiResult = await callGemini(prompt);
    }

    // Fallback if Gemini fails
    if (!aiResult) {
      aiResult = buildFallbackInsights(wrongQuestions, allQuestionData, topicMap);
    } else {
      aiResult.source = 'gemini';
    }

    res.json({
      performanceChart,
      weakTopics: aiResult.weakTopics || [],
      studySuggestions: aiResult.studySuggestions || [],
      quickTips: aiResult.quickTips || [],
      source: aiResult.source || 'fallback',
      questionDetails: allQuestionData,
    });
  } catch (err) {
    console.error('[AI Insight] student insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/ai-insights/student/history — insights from all student responses
async function getStudentHistoryInsight(req, res) {
  try {
    const studentId = req.user.id;
    const responses = await Response.find({ student_id: studentId }).lean();
    if (!responses.length) return res.json({ performanceChart: { correct: 0, incorrect: 0, total: 0 }, weakTopics: [], studySuggestions: [], quickTips: ['Answer some quizzes first!'], source: 'fallback', questionDetails: [] });

    const topicMap = buildTopicMap();
    let correct = 0, incorrect = 0;
    const wrongQuestions = [];
    const allQuestionData = [];

    for (const r of responses) {
      const poll = await Poll.findById(r.poll_id).lean();
      if (!poll) continue;
      const qKey = poll.question.trim().toLowerCase();
      const topicInfo = topicMap[qKey] || null;
      const topic = topicInfo?.topic || (poll.tags?.length ? poll.tags[0] : 'General');

      const qData = {
        question: poll.question,
        topic,
        options: poll.options,
        correctIndex: poll.correct_index,
        correctAnswer: poll.correct_index != null ? poll.options[poll.correct_index] : null,
        studentAnswer: poll.options[r.answer_index],
        studentAnswerIndex: r.answer_index,
      };

      if (poll.correct_index != null) {
        if (r.answer_index === poll.correct_index) {
          correct++;
          qData.isCorrect = true;
        } else {
          incorrect++;
          qData.isCorrect = false;
          wrongQuestions.push(qData);
        }
      } else {
        qData.isCorrect = null;
      }
      allQuestionData.push(qData);
    }

    const performanceChart = { correct, incorrect, total: allQuestionData.length };

    // Try Gemini
    let aiResult = null;
    if (allQuestionData.length > 0) {
      const topicSummary = {};
      allQuestionData.forEach(q => {
        if (!topicSummary[q.topic]) topicSummary[q.topic] = { correct: 0, wrong: 0 };
        if (q.isCorrect === true) topicSummary[q.topic].correct++;
        else if (q.isCorrect === false) topicSummary[q.topic].wrong++;
      });

      const prompt = `You are an expert educational tutor. Analyze a student's overall quiz history and provide insights.

OVERALL PERFORMANCE:
Total Questions Attempted: ${allQuestionData.length}
Correct: ${correct}
Incorrect: ${incorrect}
Accuracy: ${allQuestionData.length ? Math.round((correct / allQuestionData.length) * 100) : 0}%

TOPIC-WISE BREAKDOWN:
${Object.entries(topicSummary).map(([t, d]) => `${t}: ${d.correct} correct, ${d.wrong} wrong`).join('\n')}

WRONG QUESTIONS (latest 10):
${wrongQuestions.slice(-10).map(q => `- "${q.question}" (Topic: ${q.topic})`).join('\n') || 'None'}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "weakTopics": [{"topic": "...", "wrongCount": 1, "explanation": "short explanation", "suggestion": "what to study"}],
  "studySuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "quickTips": ["tip1", "tip2", "tip3"]
}`;

      aiResult = await callGemini(prompt);
    }

    if (!aiResult) {
      aiResult = buildFallbackInsights(wrongQuestions, allQuestionData, topicMap);
    } else {
      aiResult.source = 'gemini';
    }

    res.json({
      performanceChart,
      weakTopics: aiResult.weakTopics || [],
      studySuggestions: aiResult.studySuggestions || [],
      quickTips: aiResult.quickTips || [],
      source: aiResult.source || 'fallback',
      questionDetails: allQuestionData,
    });
  } catch (err) {
    console.error('[AI Insight] student history insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/ai-insights/faculty/session/:sessionId — faculty class overview
async function getFacultySessionInsight(req, res) {
  try {
    const { sessionId } = req.params;

    const polls = await Poll.find({ session_id: sessionId }).lean();
    if (!polls.length) return res.status(400).json({ error: 'No polls in this session' });

    const topicMap = buildTopicMap();
    const pollData = [];

    for (const poll of polls) {
      const responses = await Response.find({ poll_id: poll._id }).lean();
      const totalResp = responses.length;
      const correctCount = poll.correct_index != null
        ? responses.filter(r => r.answer_index === poll.correct_index).length
        : null;
      const accuracy = correctCount != null && totalResp ? Math.round((correctCount / totalResp) * 100) : null;

      const qKey = poll.question.trim().toLowerCase();
      const topicInfo = topicMap[qKey] || null;

      pollData.push({
        question: poll.question,
        topic: topicInfo?.topic || (poll.tags?.length ? poll.tags[0] : 'General'),
        totalResponses: totalResp,
        correctCount: correctCount || 0,
        incorrectCount: totalResp - (correctCount || 0),
        accuracy,
        options: poll.options,
        correctIndex: poll.correct_index,
        distribution: poll.options.map((opt, i) => ({
          option: opt,
          count: responses.filter(r => r.answer_index === i).length,
        })),
      });
    }

    const totalCorrect = pollData.reduce((s, p) => s + (p.correctCount || 0), 0);
    const totalIncorrect = pollData.reduce((s, p) => s + (p.incorrectCount || 0), 0);
    const totalResponses = pollData.reduce((s, p) => s + p.totalResponses, 0);

    // Topic-wise class performance
    const topicPerf = {};
    pollData.forEach(p => {
      if (!topicPerf[p.topic]) topicPerf[p.topic] = { correct: 0, incorrect: 0, total: 0 };
      topicPerf[p.topic].correct += p.correctCount;
      topicPerf[p.topic].incorrect += p.incorrectCount;
      topicPerf[p.topic].total += p.totalResponses;
    });

    const weakTopics = Object.entries(topicPerf)
      .map(([topic, d]) => ({
        topic,
        accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
        totalResponses: d.total,
        correctCount: d.correct,
        incorrectCount: d.incorrect,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // Try Gemini for faculty
    let aiResult = null;
    const prompt = `You are an expert educational analyst. Analyze this class quiz session data.

Total Questions: ${polls.length}
Total Responses: ${totalResponses}
Overall Accuracy: ${totalResponses ? Math.round((totalCorrect / totalResponses) * 100) : 0}%

TOPIC-WISE CLASS PERFORMANCE:
${weakTopics.map(t => `${t.topic}: ${t.accuracy}% accuracy (${t.correctCount}/${t.totalResponses})`).join('\n')}

PER-QUESTION BREAKDOWN:
${pollData.map((p, i) => `Q${i + 1}: "${p.question}" (Topic: ${p.topic}) — Accuracy: ${p.accuracy ?? 'N/A'}%`).join('\n')}

Respond ONLY with a JSON object:
{
  "summary": "one paragraph class performance summary",
  "weakTopics": [{"topic": "...", "accuracy": 50, "suggestion": "teaching suggestion"}],
  "studySuggestions": ["suggestion1", "suggestion2"],
  "quickTips": ["tip1", "tip2"]
}`;

    aiResult = await callGemini(prompt);

    if (!aiResult) {
      aiResult = {
        summary: `Class attempted ${polls.length} questions with ${totalResponses} total responses. Overall accuracy: ${totalResponses ? Math.round((totalCorrect / totalResponses) * 100) : 0}%.`,
        weakTopics: weakTopics.filter(t => t.accuracy < 70).map(t => ({
          topic: t.topic,
          accuracy: t.accuracy,
          suggestion: `Review ${t.topic} — class accuracy is only ${t.accuracy}%.`,
        })),
        studySuggestions: weakTopics.filter(t => t.accuracy < 70).map(t => `Spend more time on ${t.topic} concepts.`),
        quickTips: ['Focus revision sessions on low-accuracy topics.', 'Use peer-teaching for difficult concepts.'],
        source: 'fallback',
      };
    } else {
      aiResult.source = 'gemini';
    }

    res.json({
      performanceChart: { correct: totalCorrect, incorrect: totalIncorrect, total: totalResponses },
      pollData,
      weakTopics: aiResult.weakTopics || weakTopics,
      studySuggestions: aiResult.studySuggestions || [],
      quickTips: aiResult.quickTips || [],
      summary: aiResult.summary || '',
      source: aiResult.source || 'fallback',
    });
  } catch (err) {
    console.error('[AI Insight] faculty insight error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getStudentSessionInsight, getStudentHistoryInsight, getFacultySessionInsight };
