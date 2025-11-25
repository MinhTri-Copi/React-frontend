import axios from 'axios';

const getListJobPosting = async (page, limit, filters = {}) => {
    let queryParams = `page=${page}&limit=${limit}`;
    
    if (filters.keyword) queryParams += `&keyword=${filters.keyword}`;
    if (filters.location) queryParams += `&location=${filters.location}`;
    if (filters.experience) queryParams += `&experience=${filters.experience}`;
    if (filters.minSalary) queryParams += `&minSalary=${filters.minSalary}`;
    
    return await axios.get(`http://localhost:8082/api/jobs?${queryParams}`);
};

const getJobPostingById = async (id) => {
    return await axios.get(`http://localhost:8082/api/jobs/${id}`);
};

const createJobPosting = async (data) => {
    return await axios.post('http://localhost:8082/api/jobs', data);
};

const updateJobPosting = async (id, data) => {
    return await axios.put(`http://localhost:8082/api/jobs/${id}`, data);
};

const deleteJobPosting = async (id) => {
    return await axios.delete(`http://localhost:8082/api/jobs/${id}`);
};

export { 
    getListJobPosting, 
    getJobPostingById, 
    createJobPosting, 
    updateJobPosting, 
    deleteJobPosting
};

