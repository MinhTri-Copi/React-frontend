import axios from 'axios';

const getHrDashboard = async (userId) => {
    try {
        const res = await axios.get(`http://localhost:8082/api/hr/dashboard?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching HR dashboard:', error);
        throw error;
    }
};

const getMyJobPostings = async (userId, page = 1, limit = 10) => {
    try {
        const res = await axios.get(`http://localhost:8082/api/hr/job-postings?userId=${userId}&page=${page}&limit=${limit}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching job postings:', error);
        throw error;
    }
};

const getJobPostingDetail = async (userId, jobId) => {
    try {
        const res = await axios.get(`http://localhost:8082/api/hr/job-postings/detail?userId=${userId}&jobId=${jobId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching job posting detail:', error);
        throw error;
    }
};

const deleteJobPosting = async (userId, jobId) => {
    try {
        const res = await axios.delete(`http://localhost:8082/api/hr/job-postings/${jobId}?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error deleting job posting:', error);
        throw error;
    }
};

const createJobPosting = async (userId, data) => {
    try {
        const res = await axios.post(`http://localhost:8082/api/hr/job-postings?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error creating job posting:', error);
        throw error;
    }
};

const updateJobPosting = async (userId, jobId, data) => {
    try {
        const res = await axios.put(`http://localhost:8082/api/hr/job-postings/${jobId}?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error updating job posting:', error);
        throw error;
    }
};

export { 
    getHrDashboard, 
    getMyJobPostings, 
    getJobPostingDetail,
    deleteJobPosting,
    createJobPosting,
    updateJobPosting 
};
