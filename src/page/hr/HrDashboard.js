import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getHrDashboard } from '../../service.js/hrService';
import './HrDashboard.scss';
import JobManagement from './JobManagement';
import CandidateManagement from './CandidateManagement';
import CompanyProfile from './CompanyProfile';

const sidebarItems = [
    { id: 'analytics', label: 'Thống kê', icon: 'fas fa-chart-line' },
    { id: 'jobs', label: 'Quản lý tin tuyển dụng', icon: 'fas fa-briefcase' },
    { id: 'candidates', label: 'QL ứng viên', icon: 'fas fa-user-friends' },
    { id: 'company', label: 'QL hồ sơ công ty', icon: 'fas fa-building' },
    { id: 'applications', label: 'Danh sách ứng viên ', icon: 'fas fa-clipboard-list' },
];

const HrDashboard = () => {
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('analytics');
    const navigate = useNavigate();
    const location = useLocation();

    // Set active menu based on URL
    useEffect(() => {
        const path = location.pathname;
        if (path === '/hr/candidates') {
            setActiveMenu('candidates');
        } else if (path === '/hr/company-profile') {
            setActiveMenu('company');
        } else if (path === '/hr/applications') {
            setActiveMenu('applications');
        } else {
            setActiveMenu('analytics');
        }
    }, [location.pathname]);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.roleId !== 2) {
                toast.error('Bạn không có quyền truy cập trang này!');
                navigate('/');
                return;
            }
            setUser(parsedUser);
            fetchDashboard(parsedUser.id);
        } else {
            navigate('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboard = async (userId) => {
        setIsLoading(true);
        try {
            const res = await getHrDashboard(userId);
            if (res && res.data && res.data.EC === 0) {
                setData(res.data.DT);
            } else {
                toast.error(res?.data?.EM || 'Không thể tải dữ liệu dashboard!');
            }
        } catch (error) {
            console.log(error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu!');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatusSummary = () => {
        if (!data?.statusSummary) return null;
        const entries = Object.entries(data.statusSummary);
        return entries.map(([status, count]) => (
            <div className="status-chip" key={status}>
                <span className="status-name">{status}</span>
                <span className="status-count">{count}</span>
            </div>
        ));
    };

    const handleMenuClick = (itemId) => {
        setActiveMenu(itemId);
        if (itemId === 'analytics') {
            navigate('/hr');
        } else if (itemId === 'jobs') {
            navigate('/hr');
        } else if (itemId === 'candidates') {
            navigate('/hr/candidates');
        } else if (itemId === 'company') {
            navigate('/hr/company-profile');
        } else if (itemId === 'applications') {
            navigate('/hr/applications');
        } else {
            toast.info('Tính năng đang được phát triển!');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        toast.success('Đã đăng xuất thành công!');
        navigate('/login');
    };

    return (
        <div className="hr-dashboard-page">
            <div className="hr-layout">
                <aside className="hr-sidebar">
                    <div className="sidebar-brand">
                        <div className="brand-icon">
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <div>
                            <h2>HR Center</h2>
                            <p>{user?.Hoten || 'HR Manager'}</p>
                        </div>
                    </div>
                    <nav className="sidebar-menu">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                className={`sidebar-item ${activeMenu === item.id ? 'active' : ''}`}
                                onClick={() => handleMenuClick(item.id)}
                            >
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="sidebar-footer">
                        <button className="logout-btn" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                <div className="hr-main">
                    {activeMenu === 'jobs' ? (
                        <JobManagement userId={user?.id} />
                    ) : activeMenu === 'candidates' ? (
                        <CandidateManagement />
                    ) : activeMenu === 'company' ? (
                        <CompanyProfile />
                    ) : isLoading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Đang tải dữ liệu dashboard...</p>
                        </div>
                    ) : activeMenu === 'analytics' ? (
                        <div className="dashboard-container">
                            <div className="stats-grid">
                                <div className="stat-card primary">
                                    <div className="stat-icon">
                                        <i className="fas fa-briefcase"></i>
                                    </div>
                                    <div>
                                        <p>Tổng tin tuyển dụng</p>
                                        <h3>{data?.stats?.totalJobs || 0}</h3>
                                    </div>
                                </div>
                                <div className="stat-card success">
                                    <div className="stat-icon">
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <div>
                                        <p>Đang mở</p>
                                        <h3>{data?.stats?.activeJobs || 0}</h3>
                                    </div>
                                </div>
                                <div className="stat-card warning">
                                    <div className="stat-icon">
                                        <i className="fas fa-archive"></i>
                                    </div>
                                    <div>
                                        <p>Đã đóng</p>
                                        <h3>{data?.stats?.closedJobs || 0}</h3>
                                    </div>
                                </div>
                                <div className="stat-card accent">
                                    <div className="stat-icon">
                                        <i className="fas fa-paper-plane"></i>
                                    </div>
                                    <div>
                                        <p>Tổng đơn ứng tuyển</p>
                                        <h3>{data?.stats?.totalApplications || 0}</h3>
                                        <small>+{data?.stats?.newApplications || 0} trong 7 ngày qua</small>
                                    </div>
                                </div>
                            </div>

                            <div className="status-summary">
                                <h3>Tình trạng tin tuyển dụng</h3>
                                <div className="status-list">
                                    {renderStatusSummary()}
                                </div>
                            </div>

                            <div className="dashboard-panels">
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3>Tin tuyển dụng gần đây</h3>
                                        <button onClick={() => navigate('/hr/jobs')}>
                                            Quản lý tin
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                    {data?.recentJobs && data.recentJobs.length > 0 ? (
                                        <div className="panel-body">
                                            {data.recentJobs.map(job => (
                                                <div className="job-row" key={job.id}>
                                                    <div>
                                                        <h4>{job.Tieude}</h4>
                                                        <p>{job.Company?.Tencongty} • {job.Format?.TenHinhThuc}</p>
                                                    </div>
                                                    <div className="job-meta">
                                                        <span>{job.JobPostingStatus?.TenTrangThai || 'Chưa xác định'}</span>
                                                        <small>Đăng ngày {job.Ngaydang ? new Date(job.Ngaydang).toLocaleDateString('vi-VN') : '--'}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-panel">Chưa có tin tuyển dụng nào.</div>
                                    )}
                                </div>

                                <div className="panel">
                                    <div className="panel-header">
                                        <h3>Đơn ứng tuyển mới nhất</h3>
                                        <button onClick={() => navigate('/hr/applications')}>
                                            Quản lý đơn
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                    {data?.recentApplications && data.recentApplications.length > 0 ? (
                                        <div className="panel-body">
                                            {data.recentApplications.map(app => (
                                                <div className="application-row" key={app.id}>
                                                    <div className="candidate-info">
                                                        <h4>{app.Record?.User?.Hoten || 'Ứng viên'}</h4>
                                                        <p>{app.JobPosting?.Tieude}</p>
                                                    </div>
                                                    <div className="application-meta">
                                                        <span className={`status-badge status-${app.ApplicationStatus?.id || 0}`}>
                                                            {app.ApplicationStatus?.TenTrangThai}
                                                        </span>
                                                        <small>Nộp ngày {app.Ngaynop ? new Date(app.Ngaynop).toLocaleDateString('vi-VN') : '--'}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-panel">Chưa có đơn ứng tuyển nào.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="feature-under-development">
                            <i className="fas fa-tools"></i>
                            <h3>Tính năng "{sidebarItems.find(item => item.id === activeMenu)?.label}" đang được phát triển!</h3>
                            <p>Vui lòng quay lại sau.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HrDashboard;
