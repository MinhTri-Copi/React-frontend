import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { getResult } from '../../service.js/virtualInterviewService';
import { toast } from 'react-toastify';
import './VirtualInterviewResult.scss';

const VirtualInterviewResult = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        loadResult();
        
        // Poll for results if still grading
        let pollInterval;
        if (result && result.interview) {
            pollInterval = setInterval(() => {
                // Check if grading is done by checking if totalScore exists
                if (result.interview.status === 'completed' && !result.interview.totalScore && !isPolling) {
                    setIsPolling(true);
                    loadResult();
                }
            }, 3000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [id]);

    const loadResult = async () => {
        try {
            const resultData = await getResult(id);
            if (resultData && resultData.EC === 0) {
                setResult(resultData.DT);
                setIsPolling(false);
            } else {
                toast.error(resultData?.EM || 'Không thể tải kết quả!');
            }
        } catch (error) {
            console.error('Error loading result:', error);
            toast.error('Có lỗi xảy ra khi tải kết quả!');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="virtual-interview-result">
                <CandidateNav />
                <div className="container mt-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!result || !result.interview) {
        return (
            <div className="virtual-interview-result">
                <CandidateNav />
                <div className="container mt-5 text-center">
                    <p>{language === 'vi' ? 'Không tìm thấy kết quả' : 'Result not found'}</p>
                </div>
                <Footer />
            </div>
        );
    }

    const interview = result.interview;
    const language = interview.language || 'vi';
    const topicScores = result.topicScores || [];
    const levelAssessment = result.levelAssessment || {};

    const getLevelLabel = (level) => {
        const labels = {
            'intern': language === 'vi' ? 'Thực tập sinh' : 'Intern',
            'junior': language === 'vi' ? 'Nhân viên' : 'Junior',
            'middle': language === 'vi' ? 'Chuyên viên' : 'Middle',
            'senior': language === 'vi' ? 'Chuyên gia' : 'Senior'
        };
        return labels[level] || level;
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pass': language === 'vi' ? 'Đạt chuẩn' : 'Pass',
            'fail': language === 'vi' ? 'Dưới chuẩn' : 'Below Standard',
            'exceed': language === 'vi' ? 'Vượt chuẩn' : 'Exceed Standard'
        };
        return labels[status] || status;
    };

    const totalPercentage = interview.maxScore > 0 
        ? ((interview.totalScore / interview.maxScore) * 100).toFixed(1)
        : 0;

    return (
        <div className="virtual-interview-result">
            <CandidateNav />
            <div className="container mt-4 mb-5">
                {/* Header */}
                <div className="result-header">
                    <h2 className="result-title">
                        {language === 'vi' ? 'Kết quả phỏng vấn ảo - Luyện tập' : 'Virtual Interview Result - Practice'}
                    </h2>
                    <div className="language-indicator">
                        {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="disclaimer-banner">
                    {language === 'vi' 
                        ? 'Kết quả này chỉ dùng để luyện tập và tự đánh giá, không ảnh hưởng đến quy trình tuyển dụng thật'
                        : 'This result is for practice and self-assessment only, does not affect the actual recruitment process'}
                </div>

                {/* Overall Score Card */}
                <div className="overall-score-card">
                    <div className="score-header">
                        <span className="level-badge">{getLevelLabel(interview.level)}</span>
                        <div className="score-main">
                            <div className="score-value">
                                {interview.totalScore?.toFixed(1) || 0} / {interview.maxScore?.toFixed(1) || 0}
                            </div>
                            <div className="score-percentage">{totalPercentage}%</div>
                        </div>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress" style={{ height: '20px' }}>
                            <div 
                                className="progress-bar bg-primary" 
                                role="progressbar"
                                style={{ width: `${totalPercentage}%` }}
                            />
                        </div>
                    </div>
                    <div className="level-assessment">
                        <strong>{getStatusLabel(levelAssessment.status)}</strong>
                        <span className="assessment-message">{levelAssessment.message}</span>
                    </div>
                    {interview.overallFeedback && (
                        <div className="overall-feedback">
                            <h5>{language === 'vi' ? 'Nhận xét tổng quan' : 'Overall Feedback'}</h5>
                            <p>{interview.overallFeedback}</p>
                        </div>
                    )}
                </div>

                {/* Topic Breakdown */}
                <div className="topic-breakdown">
                    <h4 className="section-title">
                        {language === 'vi' ? 'Điểm theo chủ đề' : 'Scores by Topic'}
                    </h4>
                    <div className="topic-cards">
                        {topicScores.map((topicScore, index) => (
                            <div key={index} className="topic-card">
                                <div className="topic-header">
                                    <h5 className="topic-name">{topicScore.topic}</h5>
                                    <span className="topic-percentage">
                                        {topicScore.percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="topic-score">
                                    {topicScore.averageScore.toFixed(1)} / {topicScore.maxScore.toFixed(1)}
                                </div>
                                <div className="progress" style={{ height: '8px', marginTop: '0.5rem' }}>
                                    <div 
                                        className="progress-bar" 
                                        role="progressbar"
                                        style={{ 
                                            width: `${topicScore.percentage}%`,
                                            backgroundColor: topicScore.percentage >= 70 ? '#28a745' : topicScore.percentage >= 50 ? '#ffc107' : '#dc3545'
                                        }}
                                    />
                                </div>
                                {topicScore.feedback && (
                                    <div className="topic-feedback">
                                        <small>{topicScore.feedback}</small>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Improvement Suggestions */}
                {interview.improvementSuggestions && (
                    <div className="improvement-suggestions">
                        <h4 className="section-title">
                            {language === 'vi' ? 'Gợi ý cải thiện' : 'Improvement Suggestions'}
                        </h4>
                        <div className="suggestions-content">
                            <p>{interview.improvementSuggestions}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="result-actions">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => navigate(`/candidate/virtual-interview/${id}`)}
                    >
                        {language === 'vi' ? 'Xem lại câu trả lời' : 'Review Answers'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/candidate/virtual-interview')}
                    >
                        {language === 'vi' ? 'Làm lại phỏng vấn' : 'Start New Interview'}
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/candidate/virtual-interview/history')}
                    >
                        {language === 'vi' ? 'Xem lịch sử' : 'View History'}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VirtualInterviewResult;

