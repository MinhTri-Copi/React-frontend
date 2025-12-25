import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { createInterview, generateQuestions } from '../../service.js/virtualInterviewService';
import { toast } from 'react-toastify';
import './VirtualInterviewConfig.scss';

const LEVELS = [
    { value: 'intern', label: 'Intern / Thực tập sinh' },
    { value: 'junior', label: 'Junior / Nhân viên' },
    { value: 'middle', label: 'Middle / Chuyên viên' },
    { value: 'senior', label: 'Senior / Chuyên gia' }
];

const TOPICS = [
    'Java', 'React', 'Node.js', 'SQL', 'System Design', 'HR',
    'JavaScript', 'Python', 'C++', 'Database', 'Algorithm', 'Data Structure'
];

const VirtualInterviewConfig = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('vi');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleTopicToggle = (topic) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    const handleStart = async () => {
        // Validate
        if (!selectedLevel) {
            toast.error('Vui lòng chọn level!');
            return;
        }

        if (selectedTopics.length === 0) {
            toast.error('Vui lòng chọn ít nhất một chủ đề!');
            return;
        }

        setIsLoading(true);
        try {
            // Create interview
            const createResult = await createInterview(selectedLevel, selectedLanguage, selectedTopics);
            
            if (createResult.EC === 0) {
                const interviewId = createResult.DT.id;
                
                // Generate questions
                toast.info('Đang sinh câu hỏi...');
                const generateResult = await generateQuestions(interviewId);
                
                if (generateResult.EC === 0) {
                    toast.success('Tạo phiên phỏng vấn thành công!');
                    navigate(`/candidate/virtual-interview/${interviewId}`);
                } else {
                    toast.error(generateResult.EM || 'Không thể sinh câu hỏi!');
                }
            } else {
                toast.error(createResult.EM || 'Không thể tạo phiên phỏng vấn!');
            }
        } catch (error) {
            console.error('Error starting interview:', error);
            toast.error('Có lỗi xảy ra khi bắt đầu phỏng vấn!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="virtual-interview-config">
            <CandidateNav />
            <div className="container mt-4 mb-5">
                <div className="config-card">
                    <h2 className="config-title">
                        {selectedLanguage === 'vi' ? 'Phỏng vấn ảo - Luyện tập với AI' : 'Virtual Interview - Practice with AI'}
                    </h2>

                    {/* Language Selection */}
                    <div className="form-group">
                        <label className="form-label">
                            {selectedLanguage === 'vi' ? 'Ngôn ngữ' : 'Language'} <span className="text-danger">*</span>
                        </label>
                        <div className="language-options">
                            <button
                                type="button"
                                className={`language-btn ${selectedLanguage === 'vi' ? 'active' : ''}`}
                                onClick={() => setSelectedLanguage('vi')}
                            >
                                🇻🇳 Tiếng Việt
                            </button>
                            <button
                                type="button"
                                className={`language-btn ${selectedLanguage === 'en' ? 'active' : ''}`}
                                onClick={() => setSelectedLanguage('en')}
                            >
                                🇬🇧 English
                            </button>
                        </div>
                        <small className="form-text text-muted">
                            {selectedLanguage === 'vi' 
                                ? 'Ngôn ngữ được chọn sẽ cố định trong suốt phiên phỏng vấn'
                                : 'Selected language will be fixed throughout the interview session'}
                        </small>
                    </div>

                    {/* Level Selection */}
                    <div className="form-group">
                        <label className="form-label">
                            {selectedLanguage === 'vi' ? 'Trình độ' : 'Level'} <span className="text-danger">*</span>
                        </label>
                        <div className="level-options">
                            {LEVELS.map(level => (
                                <button
                                    key={level.value}
                                    type="button"
                                    className={`level-btn ${selectedLevel === level.value ? 'active' : ''}`}
                                    onClick={() => setSelectedLevel(level.value)}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topics Selection */}
                    <div className="form-group">
                        <label className="form-label">
                            {selectedLanguage === 'vi' ? 'Chủ đề' : 'Topics'} <span className="text-danger">*</span>
                        </label>
                        <div className="topics-grid">
                            {TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    type="button"
                                    className={`topic-btn ${selectedTopics.includes(topic) ? 'active' : ''}`}
                                    onClick={() => handleTopicToggle(topic)}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                        <small className="form-text text-muted">
                            {selectedLanguage === 'vi' 
                                ? `Đã chọn ${selectedTopics.length} chủ đề`
                                : `${selectedTopics.length} topics selected`}
                        </small>
                    </div>

                    {/* Start Button */}
                    <div className="form-group">
                        <button
                            className="btn btn-primary btn-lg w-100"
                            onClick={handleStart}
                            disabled={isLoading || !selectedLevel || selectedTopics.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    {selectedLanguage === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                                </>
                            ) : (
                                selectedLanguage === 'vi' ? 'Bắt đầu phỏng vấn' : 'Start Interview'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VirtualInterviewConfig;

