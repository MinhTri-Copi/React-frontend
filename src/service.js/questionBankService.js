import axiosInstance from '../utils/axiosConfig';

/**
 * Upload question bank file
 */
const uploadQuestionBank = async (userId, file, data) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('Ten', data.Ten);
        if (data.Mota) {
            formData.append('Mota', data.Mota);
        }

        const res = await axiosInstance.post('/hr/question-banks/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 180000 // 3 minutes - LLM processing may take time
        });
        return res.data;
    } catch (error) {
        console.error('Error uploading question bank:', error);
        throw error;
    }
};

/**
 * Get all question banks for HR
 */
const getQuestionBanks = async (userId) => {
    try {
        const res = await axiosInstance.get(`/hr/question-banks?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching question banks:', error);
        throw error;
    }
};

/**
 * Get question bank detail
 */
const getQuestionBankDetail = async (userId, bankId) => {
    try {
        const res = await axiosInstance.get(`/hr/question-banks/${bankId}?userId=${userId}`);
        return res.data;
    } catch (error) {
        console.error('Error fetching question bank detail:', error);
        throw error;
    }
};

/**
 * Delete question bank
 */
const deleteQuestionBank = async (userId, bankId) => {
    try {
        const res = await axiosInstance.delete(`/hr/question-banks/${bankId}`, {
            data: { userId }
        });
        return res.data;
    } catch (error) {
        console.error('Error deleting question bank:', error);
        throw error;
    }
};

/**
 * Update question bank item
 */
const updateQuestionBankItem = async (userId, itemId, updateData) => {
    try {
        const res = await axiosInstance.put(`/hr/question-banks/items/${itemId}`, {
            userId,
            ...updateData
        });
        return res.data;
    } catch (error) {
        console.error('Error updating question bank item:', error);
        throw error;
    }
};

export {
    uploadQuestionBank,
    getQuestionBanks,
    getQuestionBankDetail,
    deleteQuestionBank,
    updateQuestionBankItem
};

