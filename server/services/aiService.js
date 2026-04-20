const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let groqClient = null;
let genAI = null;

const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Call OpenRouter API (3rd fallback) using fetch.
 * Model: gpt-oss-120b (free tier via OpenRouter).
 */
const callOpenRouter = async (prompt, { temperature = 0.3, max_tokens = 500, jsonMode = false } = {}) => {
  const body = {
    model: 'gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mockprep.app',
      'X-Title': 'MockPrep',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
};

/**
 * Build the evaluation prompt based on question type + integrity data.
 */
const buildEvaluationPrompt = (questionText, answerText, questionType = 'text', language = 'none', integrityData = null, followUpQuestion = null, followUpAnswer = null) => {
  // Build follow-up section if available
  let followUpSection = '';
  if (followUpQuestion && followUpAnswer) {
    followUpSection = `\n\nFollow-Up Question: "${followUpQuestion}"\nFollow-Up Answer: "${followUpAnswer}"\nAlso evaluate the follow-up answer to assess depth of understanding.`;
  }

  // Build integrity section if available
  let integritySection = '';
  if (integrityData) {
    integritySection = `\n\nAdditionally, here is the candidate's session behavior data:
- Tab switches: ${integrityData.tabSwitchCount || 0} (log: ${JSON.stringify(integrityData.tabSwitchLog || [])})
- Paste events: ${(integrityData.pasteLog || []).length} (log: ${JSON.stringify(integrityData.pasteLog || [])})
- Time per question: ${JSON.stringify(integrityData.timeLog || [])}
- Integrity Score: ${integrityData.integrityScore ?? 100}/100

Factor this behavior into your overall assessment. If integrity is low, mention it diplomatically in the feedback. Do not be harsh, but note that independent answering could not be fully verified.`;
  }

  // ── Code-specific prompt (coding & bugfix) ──
  if (questionType === 'coding' || questionType === 'bugfix') {
    const taskLabel = questionType === 'bugfix'
      ? 'The candidate was given buggy code and asked to fix it.'
      : 'The candidate was asked to write code from scratch.';

    return `You are an expert technical interviewer evaluating a coding answer.

${taskLabel}
Language: ${language !== 'none' ? language : 'unspecified'}

Question / Prompt:
"${questionText}"

Candidate's Code:
\`\`\`
${answerText}
\`\`\`
${followUpSection}

Provide your evaluation as a JSON object with this EXACT structure (no markdown, no code fences, just raw JSON):
{
  "scores": {
    "overall": <number 0-100>,
    "technical": <number 0-100>,
    "communication": <number 0-100>,
    "depth": <number 0-100>
  },
  "aiFeedback": "<2-3 sentence constructive feedback>"
}

Scoring guidelines:
- overall: Holistic quality — does the code solve the problem correctly?
- technical: Correctness of logic, proper use of language features, edge-case handling
- communication: Code readability, naming conventions, structure and comments
- depth: Efficiency, consideration of edge cases, and robustness

If the answer is "No answer provided." or empty, give very low scores (5-15) and note that the candidate did not provide code.
${integritySection}
Return ONLY the JSON object, nothing else.`;
  }

  // ── Default text prompt ──
  return `You are an expert technical interviewer. Evaluate the following interview answer.

Question: "${questionText}"
Answer: "${answerText}"
${followUpSection}

Provide your evaluation as a JSON object with this EXACT structure (no markdown, no code fences, just raw JSON):
{
  "scores": {
    "overall": <number 0-100>,
    "technical": <number 0-100>,
    "communication": <number 0-100>,
    "depth": <number 0-100>
  },
  "aiFeedback": "<2-3 sentence constructive feedback about the answer, highlighting strengths and areas for improvement>"
}

Scoring guidelines:
- overall: Holistic quality of the answer
- technical: Accuracy of technical concepts mentioned
- communication: Clarity, structure, and articulation
- depth: Level of detail and thoroughness

If the answer is "No answer provided." or empty, give very low scores (5-15) and note that the candidate did not provide an answer.
${integritySection}
Return ONLY the JSON object, nothing else.`;
};

/**
 * Evaluate a user's interview answer using Gemini → Groq → OpenRouter.
 * Returns { scores, aiFeedback }.
 */
const evaluateAnswer = async (questionText, answerText, questionType = 'text', language = 'none', integrityData = null, followUpQuestion = null, followUpAnswer = null) => {
  const prompt = buildEvaluationPrompt(questionText, answerText, questionType, language, integrityData, followUpQuestion, followUpAnswer);

  let text = '';

  try {
    // ── 1st attempt: Gemini ──
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        }
      });
      text = result.response.text();
    } catch (geminiError) {
      console.warn('Gemini API evaluation failed. Falling back to Groq:', geminiError.message);

      // ── 2nd attempt: Groq ──
      try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_completion_tokens: 500,
          response_format: { type: 'json_object' },
        });
        text = chatCompletion.choices[0]?.message?.content?.trim();
      } catch (groqError) {
        console.warn('Groq API evaluation failed. Falling back to OpenRouter:', groqError.message);

        // ── 3rd attempt: OpenRouter (gpt-oss-120b) ──
        text = await callOpenRouter(prompt, { temperature: 0.3, max_tokens: 500, jsonMode: true });
      }
    }

    if (!text) {
      throw new Error('Empty response from all AI providers');
    }

    const parsed = JSON.parse(text);

    return {
      scores: {
        overall: Math.min(100, Math.max(0, parsed.scores?.overall || 0)),
        technical: Math.min(100, Math.max(0, parsed.scores?.technical || 0)),
        communication: Math.min(100, Math.max(0, parsed.scores?.communication || 0)),
        depth: Math.min(100, Math.max(0, parsed.scores?.depth || 0)),
      },
      aiFeedback: parsed.aiFeedback || 'No feedback generated.',
    };
  } catch (error) {
    console.error('AI evaluation total error:', error.message);
    return {
      scores: { overall: 0, technical: 0, communication: 0, depth: 0 },
      aiFeedback: 'AI evaluation could not be completed at this time. Please try again later.',
    };
  }
};

/**
 * Generate a follow-up question based on the original Q&A.
 * Uses Gemini → Groq → OpenRouter cascade.
 * Returns plain text question string.
 */
const generateFollowUp = async (questionText, answerText) => {
  const prompt = `The candidate was asked: "${questionText}". They answered: "${answerText}". Generate 1 sharp follow-up question to test if they truly understand what they wrote. Return only the follow-up question as plain text, nothing else.`;

  try {
    let text = '';

    // ── 1st attempt: Gemini ──
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 150
        }
      });
      text = result.response.text();
    } catch (geminiError) {
      console.warn('Gemini API follow-up generation failed. Falling back to Groq:', geminiError.message);

      // ── 2nd attempt: Groq ──
      try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.5,
          max_completion_tokens: 150,
        });
        text = chatCompletion.choices[0]?.message?.content?.trim();
      } catch (groqError) {
        console.warn('Groq API follow-up generation failed. Falling back to OpenRouter:', groqError.message);

        // ── 3rd attempt: OpenRouter (gpt-oss-120b) ──
        text = await callOpenRouter(prompt, { temperature: 0.5, max_tokens: 150 });
      }
    }

    return text?.trim() || 'Can you elaborate more on your approach?';
  } catch (error) {
    console.error('AI follow-up generation total error:', error.message);
    return 'Can you explain your reasoning in more detail?';
  }
};

/**
 * Review a resume using Gemini → Groq → OpenRouter.
 * Returns { atsScore, strengths, weaknesses, recommendations, detailedFeedback }.
 */
const reviewResume = async (resumeText) => {
  const prompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist. Analyze the following resume text thoroughly.

Resume Text:
"""
${resumeText}
"""

Provide your analysis as a JSON object with this EXACT structure (no markdown, no code fences, just raw JSON):
{
  "atsScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths as strings>],
  "weaknesses": [<array of 3-5 specific weaknesses as strings>],
  "recommendations": [<array of 4-6 actionable improvement recommendations as strings>],
  "detailedFeedback": "<comprehensive 3-5 paragraph analysis covering formatting, keyword optimization, impact statements, and overall impression>"
}

ATS Score Guidelines:
- 90-100: Excellent — well-optimized, strong keywords, clean formatting
- 70-89: Good — minor improvements needed
- 50-69: Fair — several areas need attention
- 30-49: Needs Work — significant improvements required
- 0-29: Poor — major overhaul needed

Focus on:
1. Keyword optimization for ATS systems
2. Quantifiable achievements vs vague descriptions
3. Formatting and structure clarity
4. Action verbs and impact-driven language
5. Skills section relevance and completeness
6. Professional summary effectiveness
7. Consistency in formatting (dates, bullet points, etc.)

Return ONLY the JSON object, nothing else.`;

  let text = '';

  try {
    // ── 1st attempt: Gemini ──
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: "application/json"
        }
      });
      text = result.response.text();
    } catch (geminiError) {
      console.warn('Gemini API resume review failed. Falling back to Groq:', geminiError.message);

      // ── 2nd attempt: Groq ──
      try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_completion_tokens: 2000,
          response_format: { type: 'json_object' },
        });
        text = chatCompletion.choices[0]?.message?.content?.trim();
      } catch (groqError) {
        console.warn('Groq API resume review failed. Falling back to OpenRouter:', groqError.message);

        // ── 3rd attempt: OpenRouter (gpt-oss-120b) ──
        text = await callOpenRouter(prompt, { temperature: 0.3, max_tokens: 2000, jsonMode: true });
      }
    }

    if (!text) {
      throw new Error('Empty response from all AI providers');
    }

    const parsed = JSON.parse(text);

    return {
      atsScore: Math.min(100, Math.max(0, parsed.atsScore || 0)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      detailedFeedback: parsed.detailedFeedback || 'No detailed feedback generated.',
    };
  } catch (error) {
    console.error('AI resume review total error:', error.message);
    return {
      atsScore: 0,
      strengths: [],
      weaknesses: ['Unable to analyze resume at this time.'],
      recommendations: ['Please try uploading your resume again later.'],
      detailedFeedback: 'AI resume review could not be completed at this time. Please try again later.',
    };
  }
};

module.exports = { evaluateAnswer, generateFollowUp, reviewResume };