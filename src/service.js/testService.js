import axios from 'axios';

/**
 * Tạo bài test mới
 */
const createTest = async (userId, data) => {
    try {
        const res = await axios.post(`http://localhost:8082/api/hr/tests?userId=${userId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error;
    }
};

/**
 * Thêm câu hỏi vào bài test
 */
const addQuestion = async (userId, testId, questionData) => {
    try {
        const res = await axios.post(
            `http://localhost:8082/api/hr/tests/questions?userId=${userId}&testId=${testId}`,
            questionData
        );
        return res.data;
    } catch (error) {
        console.error('Error adding question:', error);
        throw error;
    }
};

/**
 * Thêm nhiều câu hỏi cùng lúc
 */
const addMultipleQuestions = async (userId, testId, questions) => {
    try {
        const res = await axios.post(
            `http://localhost:8082/api/hr/tests/questions/bulk?userId=${userId}&testId=${testId}`,
            { questions }
        );
        return res.data;
    } catch (error) {
        console.error('Error adding multiple questions:', error);
        throw error;
    }
};

/**
 * Lấy danh sách bài test
 */
const getMyTests = async (userId, page = 1, limit = 10) => {
    try {
        const res = await axios.get(
            `http://localhost:8082/api/hr/tests?userId=${userId}&page=${page}&limit=${limit}`
        );
        return res.data;
    } catch (error) {
        console.error('Error fetching tests:', error);
        throw error;
    }
};

/**
 * Lấy chi tiết bài test
 */
const getTestDetail = async (userId, testId) => {
    try {
        const res = await axios.get(
            `http://localhost:8082/api/hr/tests/detail?userId=${userId}&testId=${testId}`
        );
        return res.data;
    } catch (error) {
        console.error('Error fetching test detail:', error);
        throw error;
    }
};

export {
    createTest,
    addQuestion,
    addMultipleQuestions,
    getMyTests,
    getTestDetail
};

