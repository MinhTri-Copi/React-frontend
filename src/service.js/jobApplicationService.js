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

export {
    applyJob,
    checkApplied
};


