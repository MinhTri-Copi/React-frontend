import React, { useState } from 'react';
import './TestDetailModal.scss';
import QuestionFormModal from './QuestionFormModal';
import { toast } from 'react-toastify';

const TestDetailModal = ({ show, onClose, test, userId, onUpdate }) => {
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    if (!show || !test) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Không giới hạn';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const handleAddQuestions = () => {
        setShowQuestionForm(true);
    };

    const handleQuestionsAdded = () => {
        setShowQuestionForm(false);
        onUpdate();
        toast.success('Thêm câu hỏi thành công!');
    };

    return (
        <>
            <div className="test-detail-modal-overlay" onClick={onClose}>
                <div className="test-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{test.Tieude}</h2>
                        <button className="btn-close" onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Thông tin bài test */}
                        <div className="test-info-section">
                            <h3>Thông tin bài test</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Tin tuyển dụng:</span>
                                    <span className="value">{test.JobPosting?.Tieude}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Công ty:</span>
                                    <span className="value">{test.JobPosting?.Company?.Tencongty}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Thời gian làm bài:</span>
                                    <span className="value">{test.Thoigiantoida} phút</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Tổng điểm:</span>
                                    <span className="value">{test.Tongdiem}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Ngày bắt đầu:</span>
                                    <span className="value">{formatDate(test.Ngaybatdau)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Ngày hết hạn:</span>
                                    <span className="value">{formatDate(test.Ngayhethan)}</span>
                                </div>
                            </div>
                            {test.Mota && (
                                <div className="test-description">
                                    <span className="label">Mô tả:</span>
                                    <p>{test.Mota}</p>
                                </div>
                            )}
                        </div>

                        {/* Thống kê */}
                        <div className="statistics-section">
                            <div className="stat-card">
                                <i className="fas fa-users"></i>
                                <div>
                                    <span className="stat-value">{test.statistics?.submissionCount || 0}</span>
                                    <span className="stat-label">Lượt làm bài</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-check-circle"></i>
                                <div>
                                    <span className="stat-value">{test.statistics?.completedCount || 0}</span>
                                    <span className="stat-label">Đã hoàn thành</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-clock"></i>
                                <div>
                                    <span className="stat-value">{test.statistics?.inProgressCount || 0}</span>
                                    <span className="stat-label">Đang làm</span>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách câu hỏi */}
                        <div className="questions-section">
                            <div className="section-header">
                                <h3>Danh sách câu hỏi ({test.Questions?.length || 0})</h3>
                                <button className="btn-add-question" onClick={handleAddQuestions}>
                                    <i className="fas fa-plus"></i> Thêm câu hỏi
                                </button>
                            </div>

                            {!test.Questions || test.Questions.length === 0 ? (
                                <div className="empty-questions">
                                    <i className="fas fa-question-circle"></i>
                                    <p>Chưa có câu hỏi nào</p>
                                    <button className="btn-add-first" onClick={handleAddQuestions}>
                                        Thêm câu hỏi đầu tiên
                                    </button>
                                </div>
                            ) : (
                                <div className="questions-list">
                                    {test.Questions.map((question, index) => (
                                        <div key={question.id} className="question-item">
                                            <div className="question-header">
                                                <span className="question-number">Câu {index + 1}</span>
                                                <span className="question-score">{question.Diem} điểm</span>
                                            </div>
                                            <div className="question-content">
                                                <strong>Câu hỏi:</strong> {question.Cauhoi}
                                            </div>
                                            <div className="question-answer">
                                                <strong>Đáp án:</strong> {question.Dapan}
                                            </div>
                                            <div className="question-type">
                                                <span className={`type-badge ${question.Loaicauhoi}`}>
                                                    {question.Loaicauhoi === 'tuluan' ? 'Tự luận' : 'Trắc nghiệm'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-close-modal" onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Question Form Modal */}
            <QuestionFormModal
                show={showQuestionForm}
                onClose={() => setShowQuestionForm(false)}
                onSuccess={handleQuestionsAdded}
                testId={test.id}
                userId={userId}
            />
        </>
    );
};

export default TestDetailModal;

