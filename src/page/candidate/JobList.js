import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import { getListJobPosting } from '../../service.js/jobPostingService';
import './JobList.scss';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [filterExperience, setFilterExperience] = useState('');
    const [filterSalary, setFilterSalary] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs(1);
    }, []);

    const fetchJobs = async (page) => {
        setIsLoading(true);
        try {
            const filters = {};
            if (searchKeyword) filters.keyword = searchKeyword;
            if (searchLocation) filters.location = searchLocation;
            if (filterExperience) filters.experience = filterExperience;
            if (filterSalary) filters.minSalary = filterSalary;

            let res = await getListJobPosting(page, 12, filters);
            
            if (res && res.data && res.data.EC === 0) {
                setJobs(res.data.DT.jobs);
                setTotalPages(res.data.DT.totalPages);
                setTotalRows(res.data.DT.totalRows);
                setCurrentPage(page);
            } else {
                toast.error(res.data.EM);
            }
        } catch (error) {
            console.log(error);
            toast.error('Có lỗi khi tải danh sách việc làm!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        fetchJobs(1);
    };

    const handlePageClick = (event) => {
        fetchJobs(event.selected + 1);
        window.scrollTo(0, 0);
    };

    const handleClearFilters = () => {
        setSearchKeyword('');
        setSearchLocation('');
        setFilterExperience('');
        setFilterSalary('');
        setTimeout(() => fetchJobs(1), 100);
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
        return min ? `Từ ${formatNumber(min)}` : `Đến ${formatNumber(max)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="job-list-page">
            <CandidateNav />
            
            <div className="job-list-container">
                {/* Search & Filter Section */}
                <div className="search-filter-section">
                    <div className="container">
                        <h1 className="page-title">Tìm việc làm IT</h1>
                        
                        <div className="search-box">
                            <div className="search-input-group">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Vị trí, kỹ năng, công ty..."
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

                        <div className="filter-bar">
                            <select 
                                className="filter-select"
                                value={filterExperience}
                                onChange={(e) => {
                                    setFilterExperience(e.target.value);
                                    setTimeout(() => fetchJobs(1), 100);
                                }}
                            >
                                <option value="">Kinh nghiệm</option>
                                <option value="Chưa có kinh nghiệm">Chưa có kinh nghiệm</option>
                                <option value="Dưới 1 năm">Dưới 1 năm</option>
                                <option value="1-2 năm">1-2 năm</option>
                                <option value="2-3 năm">2-3 năm</option>
                                <option value="3+ năm">3+ năm</option>
                                <option value="5+ năm">5+ năm</option>
                            </select>

                            <select 
                                className="filter-select"
                                value={filterSalary}
                                onChange={(e) => {
                                    setFilterSalary(e.target.value);
                                    setTimeout(() => fetchJobs(1), 100);
                                }}
                            >
                                <option value="">Mức lương</option>
                                <option value="10000000">Trên 10 triệu</option>
                                <option value="15000000">Trên 15 triệu</option>
                                <option value="20000000">Trên 20 triệu</option>
                                <option value="30000000">Trên 30 triệu</option>
                                <option value="50000000">Trên 50 triệu</option>
                            </select>

                            {(searchKeyword || searchLocation || filterExperience || filterSalary) && (
                                <button className="btn-clear-filter" onClick={handleClearFilters}>
                                    <i className="fas fa-times"></i>
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Jobs List Section */}
                <div className="jobs-content">
                    <div className="container">
                        {isLoading ? (
                            <div className="loading-container">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Đang tải việc làm...</p>
                            </div>
                        ) : (
                            <>
                                <div className="results-header">
                                    <h2>Tìm thấy {totalRows} việc làm</h2>
                                </div>

                                {jobs && jobs.length > 0 ? (
                                    <div className="jobs-grid">
                                        {jobs.map((job) => (
                                            <div 
                                                key={job.id} 
                                                className="job-card"
                                                onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                                            >
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
                                                    <div className="job-date">
                                                        {formatDate(job.Ngaydang)}
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
                                                    {job.Format && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-clock"></i>
                                                            <span>{job.Format.TenHinhThuc}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="job-tags">
                                                    {job.majors && job.majors.slice(0, 4).map((major, index) => (
                                                        <span key={index} className="tag">{major.TenHinhThuc}</span>
                                                    ))}
                                                    {job.majors && job.majors.length > 4 && (
                                                        <span className="tag more">+{job.majors.length - 4}</span>
                                                    )}
                                                </div>

                                                <div className="job-footer">
                                                    <button className="btn-apply">
                                                        Ứng tuyển ngay
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-jobs">
                                        <i className="fas fa-search"></i>
                                        <p>Không tìm thấy việc làm phù hợp</p>
                                        <button className="btn-clear" onClick={handleClearFilters}>
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <div className="pagination-container">
                                        <ReactPaginate
                                            nextLabel="next >"
                                            onPageChange={handlePageClick}
                                            pageRangeDisplayed={3}
                                            marginPagesDisplayed={2}
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
                                            forcePage={currentPage - 1}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobList;

