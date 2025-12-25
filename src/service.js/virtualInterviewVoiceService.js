import axiosInstance from '../utils/axiosConfig';

/**
 * Start voice conversation
 */
const startVoiceConversation = async (interviewId) => {
    try {
        const res = await axiosInstance.post(`/virtual-interview/${interviewId}/voice/start`);
        return res.data;
    } catch (error) {
        console.error('Error starting voice conversation:', error);
        throw error;
    }
};

/**
 * Process voice response (text)
 */
const processVoiceResponse = async (interviewId, candidateText, conversationHistory = []) => {
    try {
        const res = await axiosInstance.post(`/virtual-interview/${interviewId}/voice/response`, {
            candidateText,
            conversationHistory
        });
        return res.data;
    } catch (error) {
        console.error('Error processing voice response:', error);
        throw error;
    }
};

/**
 * Convert text to speech
 */
const textToSpeech = async (text, language = 'vi') => {
    try {
        const res = await axiosInstance.post('/virtual-interview/voice/text-to-speech', {
            text,
            language
        });
        return res.data;
    } catch (error) {
        console.error('Error converting text to speech:', error);
        throw error;
    }
};

/**
 * Convert speech to text (upload audio file)
 */
const speechToText = async (audioBlob, language = 'vi') => {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('language', language);

        const res = await axiosInstance.post('/virtual-interview/voice/speech-to-text', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    } catch (error) {
        console.error('Error converting speech to text:', error);
        throw error;
    }
};

/**
 * Get conversation history
 */
const getConversationHistory = async (interviewId) => {
    try {
        const res = await axiosInstance.get(`/virtual-interview/${interviewId}/voice/history`);
        return res.data;
    } catch (error) {
        console.error('Error getting conversation history:', error);
        throw error;
    }
};

export {
    startVoiceConversation,
    processVoiceResponse,
    textToSpeech,
    speechToText,
    getConversationHistory
};

