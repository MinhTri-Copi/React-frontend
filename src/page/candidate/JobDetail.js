import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getJobPostingById } from '../../service.js/jobPostingService';
import CandidateNav from '../../components/Navigation/CandidateNav';
import './JobDetail.scss';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchJobDetail();
    }, [id]);

    const fetchJobDetail = async () => {
        setIsLoading(true);
        try {
            let res = await getJobPostingById(id);
            if (res && res.data && res.data.EC === 0) {
                setJob(res.data.DT);
            } else {
                toast.error(res.data.EM || 'Không tìm thấy tin tuyển dụng!');
                navigate('/candidate/jobs');
            }
        } catch (error) {
            console.error('Error fetching job detail:', error);
            toast.error('Đã xảy ra lỗi khi tải thông tin!');
            navigate('/candidate/jobs');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!max) return `Từ ${min.toLocaleString('vi-VN')} VNĐ`;
        if (!min) return `Lên đến ${max.toLocaleString('vi-VN')} VNĐ`;
        return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')} VNĐ`;
    };

    const handleApply = () => {
        // TODO: Implement apply logic later
        toast.info('Chức năng ứng tuyển đang được phát triển!');
    };

    const handleBack = () => {
        navigate('/candidate/jobs');
    };

    if (isLoading) {
        return (
            <div className="job-detail-page">
                <CandidateNav />
                <div className="loading-container">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return null;
    }

    return (
        <div className="job-detail-page">
            <CandidateNav />
            
            <div className="job-detail-container">
                {/* Header Section */}
                <div className="job-header-section">
                    <div className="container">
                        <button className="btn-back" onClick={handleBack}>
                            <i className="fas fa-arrow-left"></i>
                            Quay lại
                        </button>

                        <div className="job-header-content">
                            <div className="company-logo-large">
                                {job.Company?.Tencongty?.charAt(0) || 'C'}
                            </div>
                            <div className="job-header-info">
                                <h1 className="job-title">{job.Tieude}</h1>
                                <div className="company-info">
                                    <h3 className="company-name">
                                        <i className="fas fa-building"></i>
                                        {job.Company?.Tencongty || 'Unknown Company'}
                                    </h3>
                                    {job.Company?.Diachi && (
                                        <p className="company-address">
                                            <i className="fas fa-map-marker-alt"></i>
                                            {job.Company.Diachi}
                                        </p>
                                    )}
                                </div>
                                <div className="job-quick-info">
                                    <div className="info-item">
                                        <i className="fas fa-dollar-sign"></i>
                                        <span>{formatSalary(job.Luongtoithieu, job.Luongtoida)}</span>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <span>{job.Diadiem}</span>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-briefcase"></i>
                                        <span>{job.Kinhnghiem || 'Không yêu cầu'}</span>
                                    </div>
                                    {job.Format && (
                                        <div className="info-item">
                                            <i className="fas fa-clock"></i>
                                            <span>{job.Format.TenHinhThuc}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="btn-apply-large" onClick={handleApply}>
                                    <i className="fas fa-paper-plane"></i>
                                    Ứng tuyển ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="job-content-section">
                    <div className="container">
                        <div className="content-wrapper">
                            {/* Left Column - Job Details */}
                            <div className="job-details-column">
                                {/* Job Description */}
                                <div className="detail-card">
                                    <h2 className="card-title">
                                        <i className="fas fa-file-alt"></i>
                                        Mô tả công việc
                                    </h2>
                                    <div className="card-content">
                                        <p className="job-description">
                                            {job.Mota || 'Không có mô tả'}
                                        </p>
                                    </div>
                                </div>

                                {/* Job Requirements */}
                                <div className="detail-card">
                                    <h2 className="card-title">
                                        <i className="fas fa-check-circle"></i>
                                        Yêu cầu công việc
                                    </h2>
                                    <div className="card-content">
                                        <div className="requirement-item">
                                            <strong>Kinh nghiệm:</strong>
                                            <span>{job.Kinhnghiem || 'Không yêu cầu'}</span>
                                        </div>
                                        {job.majors && job.majors.length > 0 && (
                                            <div className="requirement-item">
                                                <strong>Ngành nghề:</strong>
                                                <div className="majors-list">
                                                    {job.majors.map((major, index) => (
                                                        <span key={index} className="major-tag">
                                                            {major.TenNghanhNghe}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {job.Format && (
                                            <div className="requirement-item">
                                                <strong>Hình thức làm việc:</strong>
                                                <span>{job.Format.TenHinhThuc}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Benefits */}
                                <div className="detail-card">
                                    <h2 className="card-title">
                                        <i className="fas fa-gift"></i>
                                        Quyền lợi
                                    </h2>
                                    <div className="card-content">
                                        <ul className="benefits-list">
                                            <li>
                                                <i className="fas fa-check"></i>
                                                Mức lương: {formatSalary(job.Luongtoithieu, job.Luongtoida)}
                                            </li>
                                            <li>
                                                <i className="fas fa-check"></i>
                                                Làm việc trong môi trường chuyên nghiệp
                                            </li>
                                            <li>
                                                <i className="fas fa-check"></i>
                                                Cơ hội phát triển nghề nghiệp
                                            </li>
                                            <li>
                                                <i className="fas fa-check"></i>
                                                Đầy đủ chế độ theo quy định
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Company & Info */}
                            <div className="job-sidebar-column">
                                {/* Apply Card */}
                                <div className="sidebar-card apply-card">
                                    <button className="btn-apply-sidebar" onClick={handleApply}>
                                        <i className="fas fa-paper-plane"></i>
                                        Ứng tuyển ngay
                                    </button>
                                    <div className="deadline-info">
                                        <i className="fas fa-calendar-alt"></i>
                                        <div>
                                            <p className="deadline-label">Hạn nộp hồ sơ:</p>
                                            <p className="deadline-date">
                                                {formatDate(job.Ngayhethan) || 'Không giới hạn'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Info Card */}
                                <div className="sidebar-card company-card">
                                    <h3 className="sidebar-title">
                                        <i className="fas fa-building"></i>
                                        Thông tin công ty
                                    </h3>
                                    <div className="company-details">
                                        <div className="company-logo-sidebar">
                                            {job.Company?.Tencongty?.charAt(0) || 'C'}
                                        </div>
                                        <h4 className="company-name-sidebar">
                                            {job.Company?.Tencongty}
                                        </h4>
                                        
                                        {job.Company?.Nganhnghe && (
                                            <div className="company-detail-item">
                                                <i className="fas fa-industry"></i>
                                                <span>{job.Company.Nganhnghe}</span>
                                            </div>
                                        )}
                                        
                                        {job.Company?.Quymo && (
                                            <div className="company-detail-item">
                                                <i className="fas fa-users"></i>
                                                <span>{job.Company.Quymo}</span>
                                            </div>
                                        )}
                                        
                                        {job.Company?.Diachi && (
                                            <div className="company-detail-item">
                                                <i className="fas fa-map-marker-alt"></i>
                                                <span>{job.Company.Diachi}</span>
                                            </div>
                                        )}
                                        
                                        {job.Company?.Website && (
                                            <div className="company-detail-item">
                                                <i className="fas fa-globe"></i>
                                                <a href={job.Company.Website} target="_blank" rel="noopener noreferrer">
                                                    {job.Company.Website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Job Info Card */}
                                <div className="sidebar-card info-card">
                                    <h3 className="sidebar-title">
                                        <i className="fas fa-info-circle"></i>
                                        Thông tin chung
                                    </h3>
                                    <div className="info-details">
                                        <div className="info-detail-item">
                                            <strong>Ngày đăng:</strong>
                                            <span>{formatDate(job.Ngaydang)}</span>
                                        </div>
                                        {job.JobPostingStatus && (
                                            <div className="info-detail-item">
                                                <strong>Trạng thái:</strong>
                                                <span className="status-badge">
                                                    {job.JobPostingStatus.TenTrangThai}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Card */}
                                {job.Recruiter && (
                                    <div className="sidebar-card contact-card">
                                        <h3 className="sidebar-title">
                                            <i className="fas fa-user-tie"></i>
                                            Người liên hệ
                                        </h3>
                                        <div className="contact-details">
                                            {job.Recruiter.User && (
                                                <div className="contact-item">
                                                    <i className="fas fa-user"></i>
                                                    <span>{job.Recruiter.User.Hoten}</span>
                                                </div>
                                            )}
                                            {job.Recruiter.Chucvu && (
                                                <div className="contact-item">
                                                    <i className="fas fa-briefcase"></i>
                                                    <span>{job.Recruiter.Chucvu}</span>
                                                </div>
                                            )}
                                            {job.Recruiter.SDT && (
                                                <div className="contact-item">
                                                    <i className="fas fa-phone"></i>
                                                    <span>{job.Recruiter.SDT}</span>
                                                </div>
                                            )}
                                            {job.Recruiter.User?.email && (
                                                <div className="contact-item">
                                                    <i className="fas fa-envelope"></i>
                                                    <span>{job.Recruiter.User.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetail;

