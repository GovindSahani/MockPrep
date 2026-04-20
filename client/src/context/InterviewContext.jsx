import { createContext, useState, useContext } from 'react';
import api from '../services/api';

export const InterviewContext = createContext();

export const useInterview = () => {
  return useContext(InterviewContext);
};

export const InterviewProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const startSession = async (role, difficulty) => {
    setLoading(true);
    try {
      const sessionRes = await api.post('/sessions', { role, difficulty });
      setCurrentSession(sessionRes.data);
      localStorage.setItem('activeSessionId', sessionRes.data._id);
      
      const qRes = await api.get(`/questions/${sessionRes.data._id}`);
      setQuestions(qRes.data);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      
      return sessionRes.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerText, timeTaken, followUpQuestion = null, followUpAnswer = null, integrityData = null) => {
    if (!currentSession || questions.length === 0) return;
    
    const question = questions[currentQuestionIndex];
    try {
      const res = await api.post('/results', {
        sessionId: currentSession._id,
        questionId: question._id,
        questionText: question.text,
        answerText,
        timeTaken,
        questionType: question.type || 'text',
        language: question.language || 'none',
        followUpQuestion,
        followUpAnswer,
        integrityData,
      });
      
      setAnswers((prev) => [...prev, res.data]);
      
      // Move to next question if available
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  };

  const loadSession = async (sessionId) => {
    setLoading(true);
    try {
      const sessionRes = await api.get(`/sessions/${sessionId}`);
      setCurrentSession(sessionRes.data);
      localStorage.setItem('activeSessionId', sessionRes.data._id);
      
      let qRes = await api.get(`/questions/${sessionId}`);
      
      if (!qRes.data || qRes.data.length === 0) {
        const role = sessionRes.data.role || 'general';
        const defaultQuestions = [
          { sessionId, text: `Tell me about your experience with ${role} development.`, timeLimit: 120, order: 1, isAIGenerated: true, type: 'text', language: 'none', starterCode: null },
          { sessionId, text: `Write a function that takes an array of numbers and returns the sum of all even numbers.`, timeLimit: 120, order: 2, isAIGenerated: true, type: 'coding', language: 'javascript', starterCode: null },
          { sessionId, text: `The following function is supposed to reverse a string, but it has bugs. Find and fix all the issues.`, timeLimit: 120, order: 3, isAIGenerated: true, type: 'bugfix', language: 'javascript', starterCode: 'function reverseString(str) {\n  let reversed = "";\n  for (let i = str.length; i >= 0; i--) {\n    reversed += str[i];\n  }\n  return reversed;\n}' },
        ];
        for (const q of defaultQuestions) {
          await api.post('/questions', q);
        }
        qRes = await api.get(`/questions/${sessionId}`);
      }
      
      setQuestions(qRes.data);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      
      return sessionRes.data;
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (integrityLogs = {}) => {
    if (!currentSession) return;
    try {
      await api.put(`/sessions/${currentSession._id}/complete`, integrityLogs);
      setCurrentSession(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      localStorage.removeItem('activeSessionId');
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  return (
    <InterviewContext.Provider 
      value={{ 
        currentSession, 
        questions, 
        currentQuestionIndex, 
        answers, 
        loading, 
        startSession,
        loadSession, 
        submitAnswer, 
        completeSession 
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
