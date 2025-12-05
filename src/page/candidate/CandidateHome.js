import React, { useState, useEffect } from 'react';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import './CandidateHome.scss';

const CandidateHome = () => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [jobs, setJobs] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Dummy data - sẽ thay bằng API call thực tế
    const dummyJobs = [
        {
            id: 1,
            Tieude: 'Senior ReactJS Developer',
            Diadiem: 'Hà Nội',
            Luongtoithieu: 20000000,
            Luongtoida: 35000000,
            Kinhnghiem: '3+ năm',
            Company: {
                Tencongty: 'FPT Software',
                Diachi: 'Hà Nội'
            },
            majors: ['ReactJS', 'NodeJS', 'TypeScript'],
            Format: {
                TenHinhThuc: 'Full-time'
            },
            Ngaydang: '2025-11-20'
        },
        {
            id: 2,
            Tieude: 'Backend Developer (Java Spring Boot)',
            Diadiem: 'Hồ Chí Minh',
            Luongtoithieu: 18000000,
            Luongtoida: 30000000,
            Kinhnghiem: '2+ năm',
            Company: {
                Tencongty: 'VNG Corporation',
                Diachi: 'TP.HCM'
            },
            majors: ['Java', 'Spring Boot', 'MySQL'],
            Format: {
                TenHinhThuc: 'Full-time'
            },
            Ngaydang: '2025-11-21'
        },
        {
            id: 3,
            Tieude: 'DevOps Engineer',
            Diadiem: 'Đà Nẵng',
            Luongtoithieu: 25000000,
            Luongtoida: 40000000,
            Kinhnghiem: '3+ năm',
            Company: {
                Tencongty: 'Gameloft',
                Diachi: 'Đà Nẵng'
            },
            majors: ['Docker', 'Kubernetes', 'AWS'],
            Format: {
                TenHinhThuc: 'Full-time'
            },
            Ngaydang: '2025-11-22'
        }
    ];

    useEffect(() => {
        fetchJobs(0);
    }, []);

    const fetchJobs = (page) => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setJobs(dummyJobs);
            setTotalPages(3);
            setIsLoading(false);
        }, 500);
    };

    const handleSearch = () => {
        if (!searchKeyword && !searchLocation) {
            toast.warning('Vui lòng nhập từ khóa hoặc địa điểm tìm kiếm!');
            return;
        }
        // TODO: Call API with search params
        toast.info('Đang tìm kiếm việc làm...');
        fetchJobs(0);
    };

    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
        fetchJobs(event.selected);
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        const formatNumber = (num) => {
            if (num >= 1000000) return `${num / 1000000} triệu`;
            return `${num / 1000}k`;
        };
        if (min && max) {
            return `${formatNumber(min)} - ${formatNumber(max)}`;
        }
        return formatNumber(min || max);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="candidate-home">
            <CandidateNav />
            
            <div className="home-container">
                {/* Hero Section với Search */}
                <div className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">Tìm việc làm IT mơ ước của bạn</h1>
                        <p className="hero-subtitle">
                            Hơn 1000+ việc làm IT đang chờ đợi bạn
                        </p>

                        <div className="search-box">
                            <div className="search-input-group">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Vị trí tuyển dụng, kỹ năng..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            <div className="search-input-group">
                                <i className="fas fa-map-marker-alt"></i>
                                <input
                                    type="text"
                                    placeholder="Địa điểm"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            <button className="btn-search" onClick={handleSearch}>
                                <i className="fas fa-search"></i>
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Job Listing Section */}
                <div className="jobs-section">
                    <div className="container">
                        <div className="section-header">
                            <h2>Việc làm nổi bật</h2>
                            <p>Cập nhật mới nhất</p>
                        </div>

                        {isLoading ? (
                            <div className="loading-container">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Đang tải việc làm...</p>
                            </div>
                        ) : (
                            <>
                                <div className="jobs-grid">
                                    {jobs && jobs.length > 0 ? (
                                        jobs.map((job) => (
                                            <div key={job.id} className="job-card">
                                                <div className="job-header">
                                                    <div className="company-logo">
                                                        {job.Company?.Tencongty?.charAt(0) || 'C'}
                                                    </div>
                                                    <div className="job-info">
                                                        <h3 className="job-title">{job.Tieude}</h3>
                                                        <p className="company-name">
                                                            {job.Company?.Tencongty || 'Unknown Company'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="job-details">
                                                    <div className="detail-item">
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>{job.Diadiem}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <i className="fas fa-dollar-sign"></i>
                                                        <span>{formatSalary(job.Luongtoithieu, job.Luongtoida)}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <i className="fas fa-briefcase"></i>
                                                        <span>{job.Kinhnghiem || 'Không yêu cầu'}</span>
                                                    </div>
                                                </div>

                                                <div className="job-tags">
                                                    {job.majors && job.majors.map((major, index) => (
                                                        <span key={index} className="tag">{major}</span>
                                                    ))}
                                                </div>

                                                <div className="job-footer">
                                                    <span className="job-date">
                                                        <i className="far fa-clock"></i>
                                                        {new Date(job.Ngaydang).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    <button className="btn-apply">
                                                        Ứng tuyển ngay
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-jobs">
                                            <i className="fas fa-search"></i>
                                            <p>Không tìm thấy việc làm phù hợp</p>
                                        </div>
                                    )}
                                </div>

                                {totalPages > 1 && (
                                    <div className="pagination-container">
                                        <ReactPaginate
                                            nextLabel="next >"
                                            onPageChange={handlePageClick}
                                            pageRangeDisplayed={3}
                                            marginPagesDisplayed={4}
                                            pageCount={totalPages}
                                            previousLabel="< previous"
                                            pageClassName="page-item"
                                            pageLinkClassName="page-link"
                                            previousClassName="page-item"
                                            previousLinkClassName="page-link"
                                            nextClassName="page-item"
                                            nextLinkClassName="page-link"
                                            breakLabel="..."
                                            breakClassName="page-item"
                                            breakLinkClassName="page-link"
                                            containerClassName="pagination"
                                            activeClassName="active"
                                            renderOnZeroPageCount={null}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default CandidateHome;

