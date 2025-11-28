import axios from 'axios';

const BASE_URL = 'http://localhost:8082/api';

/**
 * Candidate submits test answers
 */
const submitTest = async (userId, submissionId, answers) => {
    return await axios.post(`${BASE_URL}/test-submissions/submit`, {
        userId,
        submissionId,
        answers
    });
};

/**
 * HR gets submission for grading
 */
const getSubmissionForGrading = async (hrUserId, submissionId) => {
    return await axios.get(`${BASE_URL}/test-submissions/${submissionId}/grading`, {
        params: { hrUserId }
    });
};

/**
 * HR grades individual answer
 */
const gradeAnswer = async (hrUserId, answerId, scoreData) => {
    return await axios.post(`${BASE_URL}/test-submissions/answers/${answerId}/grade`, {
        hrUserId,
        ...scoreData
    });
};

/**
 * HR finalizes grading (calculate total score)
 */
const finalizeGrading = async (hrUserId, submissionId) => {
    return await axios.post(`${BASE_URL}/test-submissions/${submissionId}/finalize`, {
        hrUserId,
        submissionId
    });
};

/**
 * Get submission result (for candidate or HR)
 */
const getSubmissionResult = async (userId, submissionId, isHR = false) => {
    return await axios.get(`${BASE_URL}/test-submissions/${submissionId}/result`, {
        params: { userId, isHR }
    });
};

/**
 * Auto-grade submission using AI/NLP
 */
const autoGradeSubmission = async (submissionId) => {
    return await axios.post(`${BASE_URL}/test-submissions/${submissionId}/auto-grade`);
};

/**
 * Get test submissions for candidate
 */
const getMyTestSubmissions = async (userId, { status = 'all', jobPostingId = 'all', page = 1, limit = 10 } = {}) => {
    return await axios.get(`${BASE_URL}/candidate/test-submissions`, {
        params: { userId, status, jobPostingId, page, limit }
    });
};

export {
    submitTest,
    getSubmissionForGrading,
    gradeAnswer,
    finalizeGrading,
    getSubmissionResult,
    autoGradeSubmission,
    getMyTestSubmissions
};

