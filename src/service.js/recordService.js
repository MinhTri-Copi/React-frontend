import axios from 'axios';

const getMyRecords = async (userId) => {
    return await axios.get(`http://localhost:8082/api/records?userId=${userId}`);
};

const getRecordById = async (id, userId) => {
    return await axios.get(`http://localhost:8082/api/records/${id}?userId=${userId}`);
};

const createRecord = async (data) => {
    return await axios.post('http://localhost:8082/api/records', data);
};

const updateRecord = async (id, data) => {
    return await axios.put(`http://localhost:8082/api/records/${id}`, data);
};

const deleteRecord = async (id, userId) => {
    return await axios.delete(`http://localhost:8082/api/records/${id}`, {
        data: { userId: userId }
    });
};

const uploadCV = async (file, userId) => {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('userId', userId);

    return await axios.post('http://localhost:8082/api/upload-cv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export { 
    getMyRecords, 
    getRecordById, 
    createRecord, 
    updateRecord, 
    deleteRecord,
    uploadCV
};

