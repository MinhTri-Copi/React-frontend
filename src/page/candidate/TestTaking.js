import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import { getTestSubmissionDetail } from '../../service.js/jobApplicationService';
import { toast } from 'react-toastify';
import './TestTaking.scss';

const TestTaking = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
                            <h3>Nội dung bài test</h3>
                            <p>
                                Vui lòng chuẩn bị môi trường yên tĩnh trước khi bắt đầu làm bài.
                                Khi tính năng làm bài được mở, hệ thống sẽ khóa thời gian và không thể làm lại nếu quá hạn.
                            </p>

                            <div className="questions-preview">
                                {submission.Test?.Questions?.map((question, index) => (
                                    <div key={question.id} className="question-item">
                                        <div className="question-number">Câu {index + 1}</div>
                                        <div className="question-text">{question.Cauhoi}</div>
                                        <div className="question-meta">
                                            <span className="type">{question.Loaicauhoi === 'tuluan' ? 'Tự luận' : 'Trắc nghiệm'}</span>
                                            <span className="score">{question.Diem} điểm</span>
                                        </div>
                                    </div>
                                ))}
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

