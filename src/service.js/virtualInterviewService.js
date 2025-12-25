import axiosInstance from '../utils/axiosConfig';

/**
 * Create a new virtual interview
 */
const createInterview = async (level, language, topics) => {
    try {
        const res = await axiosInstance.post('/virtual-interview/create', {
            level,
            language,
            topics
        });
        return res.data;
    } catch (error) {
        console.error('Error creating virtual interview:', error);
        throw error;
    }
};

/**
 * Generate questions for interview
 */
const generateQuestions = async (interviewId, questionCount = null) => {
    try {
        const res = await axiosInstance.post(`/virtual-interview/${interviewId}/generate-questions`, {
            questionCount
        });
        return res.data;
    } catch (error) {
        console.error('Error generating questions:', error);
        throw error;
    }
};

/**
 * Get interview details
 */
const getInterview = async (interviewId) => {
    try {
        const res = await axiosInstance.get(`/virtual-interview/${interviewId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching interview:', error);
        throw error;
    }
};

/**
 * Get a specific question
 */
const getQuestion = async (interviewId, questionId) => {
    try {
        const res = await axiosInstance.get(`/virtual-interview/${interviewId}/question/${questionId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching question:', error);
        throw error;
    }
};

/**
 * Save answer
 */
const saveAnswer = async (interviewId, questionId, answerText) => {
    try {
        const res = await axiosInstance.post(`/virtual-interview/${interviewId}/answer`, {
            questionId,
            answerText
        });
        return res.data;
    } catch (error) {
        console.error('Error saving answer:', error);
        throw error;
    }
};

/**
 * Complete interview
 */
const completeInterview = async (interviewId) => {
    try {
        const res = await axiosInstance.post(`/virtual-interview/${interviewId}/complete`);
        return res.data;
    } catch (error) {
        console.error('Error completing interview:', error);
        throw error;
    }
};

/**
 * Get interview result
 */
const getResult = async (interviewId) => {
    try {
        const res = await axiosInstance.get(`/virtual-interview/${interviewId}/result`);
        return res.data;
    } catch (error) {
        console.error('Error fetching result:', error);
        throw error;
    }
};

/**
 * Get interview history
 */
const getHistory = async (page = 1, limit = 10, status = 'all') => {
    try {
        const res = await axiosInstance.get('/virtual-interview/history', {
            params: {
                page,
                limit,
                status
            }
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
};

/**
 * Delete interview
 */
const deleteInterview = async (interviewId) => {
    try {
        const res = await axiosInstance.delete(`/virtual-interview/${interviewId}`);
        return res.data;
    } catch (error) {
        console.error('Error deleting interview:', error);
        throw error;
    }
};

export {
    createInterview,
    generateQuestions,
    getInterview,
    getQuestion,
    saveAnswer,
    completeInterview,
    getResult,
    getHistory,
    deleteInterview
};

