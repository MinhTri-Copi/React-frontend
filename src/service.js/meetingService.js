import axios from 'axios';

const BASE_URL = 'http://localhost:8082/api';

const getMeetingsForHr = async (userId, filters = {}) => {
    try {
        const params = new URLSearchParams({ userId });
        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters.jobApplicationId) {
            params.append('jobApplicationId', filters.jobApplicationId);
        }
        const res = await axios.get(`${BASE_URL}/hr/meetings?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meetings for HR:', error);
        throw error;
    }
};

const getMeetingsForCandidate = async (userId, filters = {}) => {
    try {
        const params = new URLSearchParams({ userId });
        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        const res = await axios.get(`${BASE_URL}/candidate/meetings?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meetings for candidate:', error);
        throw error;
    }
};

const getMeetingById = async (meetingId, userId, role = 'hr') => {
    try {
        const params = new URLSearchParams({ userId, role });
        const res = await axios.get(`${BASE_URL}/meetings/${meetingId}?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meeting:', error);
        throw error;
    }
};

const createMeeting = async (userId, data) => {
    try {
        const res = await axios.post(`${BASE_URL}/hr/meetings?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error creating meeting:', error);
        throw error;
    }
};

const updateMeetingStatus = async (meetingId, userId, status, role = 'hr') => {
    try {
        const params = new URLSearchParams({ userId, status, role });
        const res = await axios.put(`${BASE_URL}/meetings/${meetingId}/status?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error updating meeting status:', error);
        throw error;
    }
};

const updateMeeting = async (meetingId, userId, data) => {
    try {
        const res = await axios.put(`${BASE_URL}/hr/meetings/${meetingId}?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error updating meeting:', error);
        throw error;
    }
};

const cancelMeeting = async (meetingId, userId) => {
    try {
        const res = await axios.delete(`${BASE_URL}/hr/meetings/${meetingId}?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error canceling meeting:', error);
        throw error;
    }
};

export {
    getMeetingsForHr,
    getMeetingsForCandidate,
    getMeetingById,
    createMeeting,
    updateMeetingStatus,
    updateMeeting,
    cancelMeeting
};

