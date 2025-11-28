import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './HrDashboard.scss';
import JobManagement from './JobManagement';
import CandidateManagement from './CandidateManagement';
import CompanyProfile from './CompanyProfile';
import HrStatistics from './HrStatistics';
import TestManagement from './TestManagement';
import TestSubmissionList from './TestSubmissionList';

const sidebarItems = [
    { id: 'analytics', label: 'Thống kê', icon: 'fas fa-chart-line' },
    { id: 'jobs', label: 'Quản lý tin tuyển dụng', icon: 'fas fa-briefcase' },
    { id: 'tests', label: 'Quản lý bài test', icon: 'fas fa-file-alt' },
    { id: 'test-submissions', label: 'DS bài test đã nộp', icon: 'fas fa-clipboard-check' },
    { id: 'candidates', label: 'QL ứng viên', icon: 'fas fa-user-friends' },
    { id: 'company', label: 'QL hồ sơ công ty', icon: 'fas fa-building' },
    { id: 'applications', label: 'Danh sách ứng viên ', icon: 'fas fa-clipboard-list' },
];

const HrDashboard = () => {
    const [user, setUser] = useState(null);
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
        } else if (path === '/hr/tests') {
            setActiveMenu('tests');
        } else if (path === '/hr/test-submissions') {
            setActiveMenu('test-submissions');
        } else if (path === '/hr') {
            // Don't override if already set to 'jobs' or 'analytics'
            // Only set to 'analytics' on initial load
            setActiveMenu(prev => (prev === 'jobs' || prev === 'analytics') ? prev : 'analytics');
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
            // fetchDashboard is no longer needed - HrStatistics handles its own data
        } else {
            navigate('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMenuClick = (itemId) => {
        setActiveMenu(itemId);
        if (itemId === 'analytics') {
            navigate('/hr');
        } else if (itemId === 'jobs') {
            // Only navigate if not already on /hr
            if (location.pathname !== '/hr') {
                navigate('/hr');
            }
        } else if (itemId === 'tests') {
            navigate('/hr/tests');
        } else if (itemId === 'test-submissions') {
            navigate('/hr/test-submissions');
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
                    ) : activeMenu === 'tests' ? (
                        <TestManagement userId={user?.id} />
                    ) : activeMenu === 'test-submissions' ? (
                        <TestSubmissionList userId={user?.id} />
                    ) : activeMenu === 'candidates' ? (
                        <CandidateManagement />
                    ) : activeMenu === 'company' ? (
                        <CompanyProfile />
                    ) : activeMenu === 'analytics' ? (
                        <HrStatistics />
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
