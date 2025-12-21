import axiosInstance from '../utils/axiosConfig';

/**
 * Review CV với AI
 * @param {number} recordId - ID của CV record
 * @param {string[]} jdTexts - Mảng JD texts (tối đa 5)
 * @returns {Promise} API response
 */
const reviewCV = async (recordId, jdTexts) => {
    try {
        if (!recordId) {
            throw new Error('Thiếu recordId!');
        }

        if (!jdTexts || !Array.isArray(jdTexts) || jdTexts.length === 0) {
            throw new Error('Cần ít nhất 1 JD (Job Description)!');
        }

        if (jdTexts.length > 5) {
            throw new Error('Tối đa 5 JD được phép!');
        }

        // Validate JD texts
        const validJdTexts = jdTexts.filter(jd => jd && typeof jd === 'string' && jd.trim().length > 0);
        if (validJdTexts.length === 0) {
            throw new Error('JD không được để trống!');
        }

        const response = await axiosInstance.post('/candidate/review-cv', {
            recordId,
            jdTexts: validJdTexts
        });

        return response.data;
    } catch (error) {
        console.error('Error in reviewCV:', error);
        throw error;
    }
};

export { reviewCV };

