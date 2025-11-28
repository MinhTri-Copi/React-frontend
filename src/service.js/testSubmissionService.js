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

export {
    submitTest,
    getSubmissionForGrading,
    gradeAnswer,
    finalizeGrading,
    getSubmissionResult
};

