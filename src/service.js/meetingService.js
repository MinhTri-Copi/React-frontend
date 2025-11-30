import axiosInstance from '../utils/axiosConfig';

const getMeetingsForHr = async (userId, filters = {}) => {
    try {
        const params = new URLSearchParams({ userId });
        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters.jobApplicationId) {
            params.append('jobApplicationId', filters.jobApplicationId);
        }
        const res = await axiosInstance.get(`/hr/meetings?${params.toString()}`);
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
        const res = await axiosInstance.get(`/candidate/meetings?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meetings for candidate:', error);
        throw error;
    }
};

const getMeetingByRoomName = async (roomName, userId) => {
    try {
        // userId is not needed in query since JWT token contains it
        // But we keep it for backward compatibility and logging
        const res = await axiosInstance.get(`/meetings/room/${roomName}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meeting by roomName:', error);
        throw error;
    }
};

const getMeetingById = async (meetingId, userId, role = 'hr') => {
    try {
        const params = new URLSearchParams({ userId, role });
        const res = await axiosInstance.get(`/meetings/${meetingId}?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching meeting:', error);
        throw error;
    }
};

const createMeeting = async (userId, data) => {
    try {
        const res = await axiosInstance.post(`/hr/meetings?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error creating meeting:', error);
        throw error;
    }
};

const updateMeetingStatus = async (meetingId, userId, status, role = 'hr') => {
    try {
        const params = new URLSearchParams({ userId, status, role });
        const res = await axiosInstance.put(`/meetings/${meetingId}/status?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error('Error updating meeting status:', error);
        throw error;
    }
};

const updateMeeting = async (meetingId, userId, data) => {
    try {
        const res = await axiosInstance.put(`/hr/meetings/${meetingId}?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error updating meeting:', error);
        throw error;
    }
};

const cancelMeeting = async (meetingId, userId) => {
    try {
        const res = await axiosInstance.delete(`/hr/meetings/${meetingId}?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error canceling meeting:', error);
        throw error;
    }
};

export {
    getMeetingsForHr,
    getMeetingsForCandidate,
    getMeetingByRoomName,
    getMeetingById,
    createMeeting,
    updateMeetingStatus,
    updateMeeting,
    cancelMeeting
};

