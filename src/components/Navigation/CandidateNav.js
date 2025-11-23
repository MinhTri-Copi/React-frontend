import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CandidateNav.scss';

const CandidateNav = () => {
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        toast.success('Đăng xuất thành công!');
        navigate('/login');
    };

    return (
        <nav className="candidate-navbar">
            <div className="container-fluid">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className="navbar-brand">
                        <NavLink to="/candidate" className="brand-link">
                            <i className="fas fa-briefcase"></i>
                            <span>JobPortal</span>
                        </NavLink>
                    </div>

                    {/* Menu chính */}
                    <div className="navbar-menu">
                        <NavLink 
                            to="/candidate" 
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                            end
                        >
                            <i className="fas fa-home"></i>
                            Việc làm
                        </NavLink>
                        
                        <NavLink 
                            to="/candidate/companies" 
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                        >
                            <i className="fas fa-building"></i>
                            Công ty
                        </NavLink>
                        
                        <NavLink 
                            to="/candidate/my-records" 
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                        >
                            <i className="fas fa-file-alt"></i>
                            Hồ sơ của tôi
                        </NavLink>
                        
                        <NavLink 
                            to="/candidate/my-applications" 
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                        >
                            <i className="fas fa-paper-plane"></i>
                            Đơn ứng tuyển
                        </NavLink>
                    </div>

                    {/* User profile */}
                    <div className="navbar-user">
                        {user ? (
                            <div className="user-dropdown">
                                <div 
                                    className="user-info" 
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <div className="user-avatar">
                                        {user.Hoten ? user.Hoten.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span className="user-name">{user.Hoten}</span>
                                    <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'}`}></i>
                                </div>

                                {showDropdown && (
                                    <div className="dropdown-menu">
                                        <NavLink to="/candidate/profile" className="dropdown-item">
                                            <i className="fas fa-user"></i>
                                            Thông tin cá nhân
                                        </NavLink>
                                        <NavLink to="/candidate/settings" className="dropdown-item">
                                            <i className="fas fa-cog"></i>
                                            Cài đặt
                                        </NavLink>
                                        <div className="dropdown-divider"></div>
                                        <div className="dropdown-item" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt"></i>
                                            Đăng xuất
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button 
                                className="btn-login" 
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default CandidateNav;

