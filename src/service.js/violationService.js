import axios from 'axios';

const BASE_URL = 'http://localhost:8082/api';

/**
 * Log a violation during test taking
 */
const logViolation = async (testSubmissionId, userId, violation_type, message) => {
    return await axios.post(`${BASE_URL}/violations/log`, {
        testSubmissionId,
        userId,
        violation_type,
        message
    });
};

/**
 * Get violation count for a submission
 */
const getViolationCount = async (submissionId, userId) => {
    return await axios.get(`${BASE_URL}/violations/${submissionId}/count`, {
        params: { userId }
    });
};

/**
 * Get all violations for a submission (HR view)
 */
const getViolationsForSubmission = async (submissionId) => {
    return await axios.get(`${BASE_URL}/violations/${submissionId}`);
};

export {
    logViolation,
    getViolationCount,
    getViolationsForSubmission
};

