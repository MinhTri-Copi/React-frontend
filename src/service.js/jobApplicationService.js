import axios from 'axios';

const applyJob = async (data) => {
    return await axios.post('http://localhost:8082/api/job-applications', data);
};

const checkApplied = async (userId, jobPostingId) => {
    return await axios.get('http://localhost:8082/api/job-applications/check', {
        params: {
            userId,
            jobPostingId
        }
    });
};

const getMyApplications = async (userId) => {
    return await axios.get('http://localhost:8082/api/job-applications', {
        params: { userId }
    });
};

const startTest = async (userId, applicationId) => {
    return await axios.post('http://localhost:8082/api/job-applications/tests/start', {
        userId,
        applicationId
    });
};

const getTestSubmissionDetail = async (submissionId, userId) => {
    return await axios.get(`http://localhost:8082/api/job-applications/tests/submissions/${submissionId}`, {
        params: { userId }
    });
};

export {
    applyJob,
    checkApplied,
    getMyApplications,
    startTest,
    getTestSubmissionDetail
};





