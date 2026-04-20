const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc Generate interview questions using Gemini AI
const generateQuestions = async (role, difficulty, numQuestions = 5) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Generate ${numQuestions} short mock interview questions for a ${difficulty} level ${role} position. Return ONLY a valid JSON array of strings, where each string is a question. Do not include markdown formatting or backticks.`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Attempt to strip formatting if AI still returned backticks
    if (text.startsWith('```json')) text = text.replace('```json', '');
    if (text.startsWith('```')) text = text.replace('```', '');
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text.trim());
  } catch (error) {
    console.error('AI Service Error (Generate Questions):', error);
    // Fallback static questions just in case
    return [
      `What motivated you to apply for this ${role} role?`,
      `Explain a challenging technical problem you solved recently.`
    ];
  }
};

// @desc Evaluate an interview answer
const evaluateAnswer = async (questionText, answerText) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Evaluate the following interview answer.
    Question: ${questionText}
    Answer: ${answerText}
    
    Return ONLY a valid JSON object with the following structure. No markdown formatting:
    {
      "scores": {
        "technical": 80,
        "communication": 85,
        "depth": 70,
        "examples": 60,
        "overall": 75
      },
      "feedback": "Your answer was good but lacked specific examples.",
      "idealAnswer": "A perfect answer would have discussed..."
    }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith('```json')) text = text.replace('```json', '');
    if (text.startsWith('```')) text = text.replace('```', '');
    if (text.endsWith('```')) text = text.slice(0, -3);

    return JSON.parse(text.trim());
  } catch (error) {
    console.error('AI Service Error (Evaluate Answer):', error);
    throw error;
  }
};

module.exports = {
  generateQuestions,
  evaluateAnswer
};
