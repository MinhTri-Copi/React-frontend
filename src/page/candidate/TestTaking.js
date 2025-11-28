import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import { getTestSubmissionDetail } from '../../service.js/jobApplicationService';
import { submitTest } from '../../service.js/testSubmissionService';
import { toast } from 'react-toastify';
import './TestTaking.scss';

const TestTaking = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
    }, [navigate]);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!user || !submissionId) return;
            setIsLoading(true);
            try {
                const res = await getTestSubmissionDetail(submissionId, user.id);
                if (res.data && res.data.EC === 0) {
                    setSubmission(res.data.DT);
                } else {
                    toast.error(res.data?.EM || 'Không thể tải thông tin bài test!');
                    navigate('/candidate/applications');
                }
            } catch (error) {
                console.error(error);
                toast.error('Có lỗi xảy ra khi tải thông tin bài test!');
                navigate('/candidate/applications');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubmission();
    }, [user, submissionId, navigate]);

    useEffect(() => {
        if (submission?.Test?.Questions) {
            setAnswers(prev => {
                const nextAnswers = { ...prev };
                submission.Test.Questions.forEach(question => {
                    if (nextAnswers[question.id] === undefined) {
                        nextAnswers[question.id] = '';
                    }
                });
                return nextAnswers;
            });
        }
    }, [submission]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmitAttempt = async () => {
        if (!user || !submission) return;

        // Check if submission is already submitted
        if (submission.Trangthai === 'danop' || submission.Trangthai === 'dacham') {
            toast.warning('Bài test đã được nộp rồi!');
            return;
        }

        // Confirm submission
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn nộp bài test?\n\n' +
            'Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời.'
        );

        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            const res = await submitTest(user.id, submission.id, answers);
            
            if (res.data && res.data.EC === 0) {
                toast.success('Nộp bài test thành công! HR sẽ chấm điểm và thông báo kết quả cho bạn.');
                
                // Refresh submission data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                toast.error(res.data?.EM || 'Không thể nộp bài test!');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            toast.error('Có lỗi xảy ra khi nộp bài test!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDateTime = (value) => {
        if (!value) return 'Không giới hạn';
        return new Date(value).toLocaleString('vi-VN');
    };

    if (!user) return null;

    return (
        <div className="candidate-test-page">
            <CandidateNav />
            <div className="test-wrapper">
                {isLoading ? (
                    <div className="loading-card">
                        <i className="fas fa-spinner fa-spin"></i>
                        Đang tải bài test...
                    </div>
                ) : !submission ? (
                    <div className="loading-card error">
                        <i className="fas fa-exclamation-triangle"></i>
                        Không tìm thấy thông tin bài test!
                    </div>
                ) : (
                    <div className="test-content">
                        <div className="test-header">
                            <div>
                                <p className="job-title">{submission.JobApplication?.JobPosting?.Tieude}</p>
                                <h2>{submission.Test?.Tieude}</h2>
                                <p className="subtitle">
                                    Thời gian làm bài: {submission.Test?.Thoigiantoida || 60} phút
                                </p>
                            </div>
                            <div className="status-box">
                                <span className={`status-badge status-${submission.Trangthai}`}>
                                    {submission.Trangthai === 'danglam' && 'Đang làm bài'}
                                    {submission.Trangthai === 'chuabatdau' && 'Chưa bắt đầu'}
                                    {submission.Trangthai === 'dacham' && 'Đã chấm điểm'}
                                    {submission.Trangthai === 'danop' && 'Đã nộp'}
                                </span>
                                <button className="btn-primary" disabled>
                                    <i className="fas fa-laptop-code"></i>
                                    Tính năng đang phát triển
                                </button>
                            </div>
                        </div>

                        <div className="info-grid">
                            <div className="info-card">
                                <p>Thời gian bắt đầu</p>
                                <h4>{submission.Thoigianbatdau ? formatDateTime(submission.Thoigianbatdau) : 'Chưa bắt đầu'}</h4>
                            </div>
                            <div className="info-card">
                                <p>Hạn hoàn thành</p>
                                <h4>{formatDateTime(submission.Hanhethan)}</h4>
                            </div>
                            <div className="info-card">
                                <p>Số câu hỏi</p>
                                <h4>{submission.Test?.Questions?.length || 0}</h4>
                            </div>
                            <div className="info-card">
                                <p>Điểm tối đa</p>
                                <h4>{submission.Test?.Tongdiem || 100}</h4>
                            </div>
                        </div>

                        <div className="test-body">
                            <div className="test-body-header">
                                <div>
                                    <h3>Bài làm của bạn</h3>
                                    <p>
                                        Vui lòng đọc kỹ từng câu hỏi và nhập câu trả lời trực tiếp vào ô tương ứng.
                                        Bạn có thể lưu nháp ngay trên trang này trước khi hệ thống mở tính năng nộp bài.
                                    </p>
                                </div>
                                <div className="test-actions">
                                    <button className="btn-outline" type="button" onClick={() => window.print()}>
                                        <i className="fas fa-print"></i>
                                        Xuất ra PDF
                                    </button>
                                    <button 
                                        className="btn-submit" 
                                        type="button" 
                                        onClick={handleSubmitAttempt}
                                        disabled={isSubmitting || submission.Trangthai === 'danop' || submission.Trangthai === 'dacham'}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Đang nộp bài...
                                            </>
                                        ) : submission.Trangthai === 'danop' || submission.Trangthai === 'dacham' ? (
                                            <>
                                                <i className="fas fa-check-circle"></i>
                                                Đã nộp bài
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i>
                                                Nộp bài
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="questions-preview">
                                {submission.Test?.Questions?.map((question, index) => {
                                    const isEssay = question.Loaicauhoi === 'tuluan';
                                    return (
                                        <div key={question.id} className="question-item">
                                            <div className="question-header">
                                                <div className="question-number">Câu {index + 1}</div>
                                                <div className="question-meta">
                                                    <span className="type">{isEssay ? 'Tự luận' : 'Trắc nghiệm'}</span>
                                                    <span className="score">{question.Diem} điểm</span>
                                                </div>
                                            </div>
                                            <div className="question-text">{question.Cauhoi}</div>
                                            <div className="answer-field">
                                                {isEssay ? (
                                                    <textarea
                                                        rows="4"
                                                        placeholder="Nhập câu trả lời của bạn..."
                                                        value={answers[question.id] || ''}
                                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Nhập đáp án (ví dụ: A, B, C hoặc nội dung ngắn gọn)"
                                                        value={answers[question.id] || ''}
                                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!submission.Test?.Questions || submission.Test?.Questions.length === 0) && (
                                    <div className="empty-questions">
                                        <p>Bài test hiện chưa có câu hỏi.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestTaking;

