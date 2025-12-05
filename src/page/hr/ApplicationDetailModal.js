import React from 'react';
import './ApplicationDetailModal.scss';

const ApplicationDetailModal = ({ application, onClose, onApprove, onReject }) => {
    if (!application) return null;

    const candidate = application.Record?.User;
    const job = application.JobPosting;
    const company = job?.Company;
    const status = application.ApplicationStatus;

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} VNĐ`;
        if (min) return `Từ ${min.toLocaleString()} VNĐ`;
        return `Lên đến ${max.toLocaleString()} VNĐ`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = () => {
        const statusMap = {
            1: { text: 'Đang chờ', class: 'pending', icon: 'fa-clock' },
            2: { text: 'Đã được nhận', class: 'reviewing', icon: 'fa-eye' },
            3: { text: 'Không đạt', class: 'rejected', icon: 'fa-times-circle' },
            4: { text: 'Đã xét duyệt', class: 'approved', icon: 'fa-check-circle' },
            5: { text: 'Đã hủy', class: 'cancelled', icon: 'fa-ban' },
            6: { text: 'Đã phỏng vấn', class: 'interviewed', icon: 'fa-user-check' }
        };
        const statusInfo = statusMap[status?.id] || { text: status?.TenTrangThai || 'N/A', class: 'default', icon: 'fa-question' };
        return (
            <span className={`status-badge ${statusInfo.class}`}>
                <i className={`fas ${statusInfo.icon}`}></i>
                {statusInfo.text}
            </span>
        );
    };

    return (
        <div className="application-detail-modal-overlay" onClick={onClose}>
            <div className="application-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết đơn ứng tuyển</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Application Status */}
                    <div className="status-section">
                        <h3>Trạng thái đơn ứng tuyển</h3>
                        <div className="status-info">
                            {getStatusBadge()}
                            <div className="dates">
                                <span><i className="fas fa-calendar-plus"></i> Nộp: {formatDate(application.Ngaynop)}</span>
                                {application.Ngaycapnhat && (
                                    <span><i className="fas fa-calendar-check"></i> Cập nhật: {formatDate(application.Ngaycapnhat)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Candidate Information */}
                    <div className="candidate-section">
                        <h3><i className="fas fa-user"></i> Thông tin ứng viên</h3>
                        <div className="candidate-card">
                            <div className="candidate-avatar-large">
                                {candidate?.Hoten?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="candidate-details">
                                <h4>{candidate?.Hoten || 'N/A'}</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <i className="fas fa-envelope"></i>
                                        <div>
                                            <label>Email</label>
                                            <span>{candidate?.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-phone"></i>
                                        <div>
                                            <label>Số điện thoại</label>
                                            <span>{candidate?.SDT || 'Chưa cập nhật'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CV Information */}
                    <div className="cv-section">
                        <h3><i className="fas fa-file-alt"></i> Hồ sơ ứng tuyển</h3>
                        <div className="cv-card">
                            <div className="cv-icon">
                                <i className="fas fa-file-pdf"></i>
                            </div>
                            <div className="cv-info">
                                <h4>{application.Record?.Tieude || 'Chưa có tiêu đề'}</h4>
                                <p>Ngày tạo: {formatDate(application.Record?.Ngaytao)}</p>
                            </div>
                            {application.Record?.File_url && (
                                <a 
                                    href={`http://localhost:8082${application.Record.File_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-download-cv"
                                >
                                    <i className="fas fa-download"></i>
                                    Tải CV
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Cover Letter */}
                    {application.Thugioithieu && (
                        <div className="cover-letter-section">
                            <h3><i className="fas fa-envelope-open-text"></i> Thư giới thiệu</h3>
                            <div className="cover-letter-content">
                                <p>{application.Thugioithieu}</p>
                            </div>
                        </div>
                    )}

                    {/* Job Information */}
                    <div className="job-section">
                        <h3><i className="fas fa-briefcase"></i> Vị trí ứng tuyển</h3>
                        <div className="job-card">
                            <h4>{job?.Tieude || 'N/A'}</h4>
                            <div className="job-details">
                                <div className="detail-item">
                                    <i className="fas fa-money-bill-wave"></i>
                                    <span>{formatSalary(job?.Luongtoithieu, job?.Luongtoida)}</span>
                                </div>
                                <div className="detail-item">
                                    <i className="fas fa-laptop"></i>
                                    <span>{job?.Format?.TenHinhThuc || 'N/A'}</span>
                                </div>
                                {job?.Ngaydang && job?.Ngayhethan && (
                                    <div className="detail-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>Từ {formatDate(job.Ngaydang)} - {formatDate(job.Ngayhethan)}</span>
                                    </div>
                                )}
                            </div>
                            {job?.Mota && (
                                <div className="job-description">
                                    <h5>Mô tả công việc</h5>
                                    <p>{job.Mota}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="company-section">
                        <h3><i className="fas fa-building"></i> Thông tin công ty</h3>
                        <div className="company-card">
                            <div className="company-logo-placeholder">
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="company-info">
                                <h4>{company?.Tencongty || 'N/A'}</h4>
                                {company?.Diachi && (
                                    <p><i className="fas fa-map-marker-alt"></i> {company.Diachi}</p>
                                )}
                                {company?.Website && (
                                    <p>
                                        <i className="fas fa-globe"></i>
                                        <a href={company.Website} target="_blank" rel="noopener noreferrer">
                                            {company.Website}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {application.applicationStatusId === 1 && (
                    <div className="modal-footer">
                        <button className="btn-reject-action" onClick={onReject}>
                            <i className="fas fa-times-circle"></i>
                            Từ chối
                        </button>
                        <button className="btn-approve-action" onClick={onApprove}>
                            <i className="fas fa-check-circle"></i>
                            Duyệt ứng viên
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationDetailModal;

