import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { getInterview, saveAnswer, completeInterview } from '../../service.js/virtualInterviewService';
import { toast } from 'react-toastify';
import './VirtualInterviewTaking.scss';

const VirtualInterviewTaking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const answerTextareaRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        loadInterview();
    }, [id]);

    useEffect(() => {
        // Auto-save on blur with debounce
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const loadInterview = async () => {
        setIsLoading(true);
        try {
            const result = await getInterview(id);
            if (result && result.EC === 0) {
                const interviewData = result.DT;
                setInterview(interviewData);
                setQuestions(interviewData.Questions || []);
                
                // Load existing answers
                const answersMap = {};
                if (interviewData.Answers) {
                    interviewData.Answers.forEach(answer => {
                        answersMap[answer.questionId] = answer.answerText;
                    });
                }
                setAnswers(answersMap);
            } else {
                toast.error(result?.EM || 'Không thể tải phiên phỏng vấn!');
                navigate('/candidate/virtual-interview');
            }
        } catch (error) {
            console.error('Error loading interview:', error);
            toast.error('Có lỗi xảy ra khi tải phiên phỏng vấn!');
            navigate('/candidate/virtual-interview');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Auto-save after 2 seconds of no typing
        saveTimeoutRef.current = setTimeout(() => {
            saveAnswerToServer(questionId, value);
        }, 2000);
    };

    const saveAnswerToServer = async (questionId, answerText) => {
        if (!answerText || answerText.trim() === '') return;

        setIsSaving(true);
        try {
            await saveAnswer(id, questionId, answerText);
            // Silent save, no toast
        } catch (error) {
            console.error('Error saving answer:', error);
            // Don't show error toast for auto-save
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleNext = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion) {
            // Save current answer before moving
            const answerText = answers[currentQuestion.id] || '';
            if (answerText.trim()) {
                await saveAnswerToServer(currentQuestion.id, answerText);
            }
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handleComplete = async () => {
        if (window.confirm(interview?.language === 'vi' 
            ? 'Bạn có chắc muốn hoàn thành phiên phỏng vấn?'
            : 'Are you sure you want to complete the interview?')) {
            
            setIsCompleting(true);
            try {
                // Save current answer first
                const currentQuestion = questions[currentQuestionIndex];
                if (currentQuestion) {
                    const answerText = answers[currentQuestion.id] || '';
                    if (answerText.trim()) {
                        await saveAnswerToServer(currentQuestion.id, answerText);
                    }
                }

                const result = await completeInterview(id);
                if (result.EC === 0) {
                    toast.success(interview?.language === 'vi' 
                        ? 'Hoàn thành phỏng vấn! Đang chấm điểm...'
                        : 'Interview completed! Grading...');
                    navigate(`/candidate/virtual-interview/${id}/result`);
                } else {
                    toast.error(result.EM || 'Không thể hoàn thành phỏng vấn!');
                }
            } catch (error) {
                console.error('Error completing interview:', error);
                toast.error('Có lỗi xảy ra khi hoàn thành phỏng vấn!');
            } finally {
                setIsCompleting(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="virtual-interview-taking">
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

    if (!interview || questions.length === 0) {
        return (
            <div className="virtual-interview-taking">
                <CandidateNav />
                <div className="container mt-5 text-center">
                    <p>{interview?.language === 'vi' ? 'Không có câu hỏi' : 'No questions'}</p>
                </div>
                <Footer />
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id] || '';
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim()).length;

    const getLevelLabel = (level) => {
        const labels = {
            'intern': interview.language === 'vi' ? 'Thực tập sinh' : 'Intern',
            'junior': interview.language === 'vi' ? 'Nhân viên' : 'Junior',
            'middle': interview.language === 'vi' ? 'Chuyên viên' : 'Middle',
            'senior': interview.language === 'vi' ? 'Chuyên gia' : 'Senior'
        };
        return labels[level] || level;
    };

    return (
        <div className="virtual-interview-taking">
            <CandidateNav />
            <div className="container mt-4 mb-5">
                {/* Header */}
                <div className="interview-header">
                    <div className="header-info">
                        <span className="level-badge">{getLevelLabel(interview.level)}</span>
                        <span className="language-indicator">
                            {interview.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                        </span>
                    </div>
                    <div className="progress-info">
                        {interview.language === 'vi' 
                            ? `Câu ${currentQuestionIndex + 1} / ${questions.length}`
                            : `Question ${currentQuestionIndex + 1} / ${questions.length}`}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                    <div className="progress" style={{ height: '8px' }}>
                        <div 
                            className="progress-bar bg-primary" 
                            role="progressbar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="progress-text">
                        {interview.language === 'vi' 
                            ? `Đã trả lời: ${answeredCount}/${questions.length}`
                            : `Answered: ${answeredCount}/${questions.length}`}
                    </div>
                </div>

                {/* Question Card */}
                <div className="question-card">
                    <div className="question-header">
                        <span className="topic-badge">{currentQuestion.topic}</span>
                    </div>
                    <div className="question-text">
                        {currentQuestion.questionText}
                    </div>
                    <div className="answer-section">
                        <label className="answer-label">
                            {interview.language === 'vi' ? 'Câu trả lời của bạn' : 'Your Answer'}
                        </label>
                        <textarea
                            ref={answerTextareaRef}
                            className="form-control answer-textarea"
                            rows="8"
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            onBlur={() => {
                                if (currentAnswer.trim()) {
                                    saveAnswerToServer(currentQuestion.id, currentAnswer);
                                }
                            }}
                            placeholder={interview.language === 'vi' 
                                ? 'Nhập câu trả lời của bạn...'
                                : 'Enter your answer...'}
                        />
                        {isSaving && (
                            <small className="text-muted saving-indicator">
                                {interview.language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                            </small>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="navigation-buttons">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        {interview.language === 'vi' ? '← Câu trước' : '← Previous'}
                    </button>
                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                        >
                            {interview.language === 'vi' ? 'Lưu và tiếp tục →' : 'Save and Continue →'}
                        </button>
                    ) : (
                        <button
                            className="btn btn-success"
                            onClick={handleComplete}
                            disabled={isCompleting}
                        >
                            {isCompleting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    {interview.language === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                                </>
                            ) : (
                                interview.language === 'vi' ? 'Hoàn thành' : 'Complete'
                            )}
                        </button>
                    )}
                </div>

                {/* Question List Sidebar (Optional) */}
                <div className="question-list-sidebar">
                    <div className="sidebar-title">
                        {interview.language === 'vi' ? 'Danh sách câu hỏi' : 'Question List'}
                    </div>
                    <div className="question-list">
                        {questions.map((q, index) => (
                            <button
                                key={q.id}
                                className={`question-item ${index === currentQuestionIndex ? 'active' : ''} ${answers[q.id] && answers[q.id].trim() ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestionIndex(index)}
                            >
                                <span className="question-number">{index + 1}</span>
                                <span className="question-topic">{q.topic}</span>
                                {answers[q.id] && answers[q.id].trim() && (
                                    <span className="answered-icon">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VirtualInterviewTaking;

