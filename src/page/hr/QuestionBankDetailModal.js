import React from 'react';
import './QuestionBankDetailModal.scss';

const QuestionBankDetailModal = ({ show, onClose, bank }) => {
    if (!show || !bank) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content question-bank-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <i className="fas fa-book"></i>
                        Chi tiết bộ đề
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-section">
                        <h4>Thông tin chung</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Tên bộ đề:</label>
                                <span>{bank.Ten}</span>
                            </div>
                            {bank.Mota && (
                                <div className="info-item full-width">
                                    <label>Mô tả:</label>
                                    <span>{bank.Mota}</span>
                                </div>
                            )}
                            <div className="info-item">
                                <label>File:</label>
                                <span>{bank.FileName}</span>
                            </div>
                            <div className="info-item">
                                <label>Loại file:</label>
                                <span className="file-type-badge">{bank.FileType?.toUpperCase()}</span>
                            </div>
                            <div className="info-item">
                                <label>Ngày upload:</label>
                                <span>{formatDate(bank.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {bank.items && bank.items.length > 0 && (
                        <div className="detail-section">
                            <h4>
                                Danh sách câu hỏi ({bank.items.length})
                            </h4>
                            <div className="questions-list">
                                {bank.items.map((item, index) => (
                                    <div key={item.id} className="question-item">
                                        <div className="question-header">
                                            <span className="question-number">Câu {index + 1}</span>
                                            <div className="question-meta">
                                                {item.Chude && (
                                                    <span className="topic-badge">{item.Chude}</span>
                                                )}
                                                <span className="type-badge">
                                                    {item.Loaicauhoi === 'tracnghiem' ? 'Trắc nghiệm' : 'Tự luận'}
                                                </span>
                                                <span className="difficulty-badge">
                                                    {item.Dokho === 'de' ? 'Dễ' : 
                                                     item.Dokho === 'kho' ? 'Khó' : 'Trung bình'}
                                                </span>
                                                <span className="score-badge">{item.Diem} điểm</span>
                                            </div>
                                        </div>
                                        <div className="question-content">
                                            <p className="question-text">
                                                <strong>Câu hỏi:</strong> {item.Cauhoi}
                                            </p>
                                            <p className="answer-text">
                                                <strong>Đáp án:</strong> {item.Dapan}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bank.Metadata && (
                        <div className="detail-section">
                            <h4>Thống kê</h4>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <i className="fas fa-question-circle"></i>
                                    <div>
                                        <span className="stat-value">{bank.Metadata.totalQuestions || bank.items?.length || 0}</span>
                                        <span className="stat-label">Tổng câu hỏi</span>
                                    </div>
                                </div>
                                {bank.Metadata.topics && (
                                    <div className="stat-card">
                                        <i className="fas fa-tags"></i>
                                        <div>
                                            <span className="stat-value">{bank.Metadata.topics.length}</span>
                                            <span className="stat-label">Chủ đề</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionBankDetailModal;

