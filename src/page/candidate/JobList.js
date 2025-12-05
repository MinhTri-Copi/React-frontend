import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import { getListJobPosting, getFilterOptions } from '../../service.js/jobPostingService';
import './JobList.scss';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filter options from API
    const [filterOptions, setFilterOptions] = useState({
        majors: [],
        formats: [],
        companies: [],
        locations: [],
        experiences: [],
        salaryRanges: []
    });
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);
    
    // Active filters
    const [filters, setFilters] = useState({
        keyword: '',
        location: '',
        experience: '',
        salaryRange: '',
        companyId: '',
        formatId: '',
        majorId: ''
    });
    
    // Selected major tags
    const [selectedMajors, setSelectedMajors] = useState([]);
    
    // Sort option
    const [sortOption, setSortOption] = useState('newest');

    const navigate = useNavigate();

    useEffect(() => {
        fetchFilterOptions();
        fetchJobs(1);
    }, []);

    const fetchFilterOptions = async () => {
        setIsLoadingFilters(true);
        try {
            const res = await getFilterOptions();
            if (res && res.data && res.data.EC === 0) {
                setFilterOptions(res.data.DT);
            }
        } catch (error) {
            console.log('Error fetching filter options:', error);
        } finally {
            setIsLoadingFilters(false);
        }
    };

    const fetchJobs = useCallback(async (page, currentFilters = filters) => {
        setIsLoading(true);
        try {
            // Build filter object
            const apiFilters = {
                keyword: currentFilters.keyword,
                location: currentFilters.location,
                experience: currentFilters.experience,
                companyId: currentFilters.companyId,
                formatId: currentFilters.formatId,
                majorId: currentFilters.majorId
            };

            // Handle salary range
            if (currentFilters.salaryRange) {
                const range = filterOptions.salaryRanges.find(r => r.value === currentFilters.salaryRange);
                if (range) {
                    apiFilters.minSalary = range.min;
                    if (range.max) apiFilters.maxSalary = range.max;
                }
            }

            let res = await getListJobPosting(page, 12, apiFilters);
            
            if (res && res.data && res.data.EC === 0) {
                let jobList = res.data.DT.jobs;
                
                // Sort jobs
                if (sortOption === 'newest') {
                    jobList.sort((a, b) => new Date(b.Ngaydang) - new Date(a.Ngaydang));
                } else if (sortOption === 'salary') {
                    jobList.sort((a, b) => (b.Luongtoida || 0) - (a.Luongtoida || 0));
                }
                
                setJobs(jobList);
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
    }, [filters, filterOptions.salaryRanges, sortOption]);

    const handleSearch = () => {
        fetchJobs(1, filters);
    };

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        fetchJobs(1, newFilters);
    };

    const handleMajorClick = (majorId) => {
        if (selectedMajors.includes(majorId)) {
            setSelectedMajors(selectedMajors.filter(id => id !== majorId));
            handleFilterChange('majorId', '');
        } else {
            setSelectedMajors([majorId]);
            handleFilterChange('majorId', majorId);
        }
    };

    const handlePageClick = (event) => {
        fetchJobs(event.selected + 1);
        window.scrollTo(0, 0);
    };

    const handleClearFilters = () => {
        setFilters({
            keyword: '',
            location: '',
            experience: '',
            salaryRange: '',
            companyId: '',
            formatId: '',
            majorId: ''
        });
        setSelectedMajors([]);
        fetchJobs(1, {});
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
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const endDate = new Date(deadline);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const hasActiveFilters = filters.keyword || filters.location || filters.experience || 
                            filters.salaryRange || filters.companyId || filters.formatId || 
                            filters.majorId;

    return (
        <div className="job-list-page">
            <CandidateNav />
            
            <div className="job-list-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <div className="container">
                        <h1 className="page-title">Việc làm IT</h1>
                        <p className="page-subtitle">Việc làm IT xịn dành cho Developer chất</p>
                        
                        {/* Quick category tags */}
                        <div className="quick-tags">
                            <span className="quick-tag"><i className="fas fa-check-circle"></i> Backend</span>
                            <span className="quick-tag"><i className="fas fa-check-circle"></i> Frontend</span>
                            <span className="quick-tag"><i className="fas fa-check-circle"></i> Tester</span>
                            <span className="quick-tag"><i className="fas fa-check-circle"></i> Business Analyst</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Section */}
                <div className="filter-section">
                    <div className="container">
                        {/* Main Search Box */}
                        <div className="search-box">
                            <div className="search-input-group">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Tên công việc, vị trí bạn muốn ứng tuyển..."
                                    value={filters.keyword}
                                    onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            
                            <div className="filter-dropdowns">
                                <select 
                                    className="filter-select"
                                    value={filters.location}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                >
                                    <option value="">Tất cả tỉnh/thành phố</option>
                                    {filterOptions.locations.map((loc, index) => (
                                        <option key={index} value={loc}>{loc}</option>
                                    ))}
                                </select>

                                <select 
                                    className="filter-select"
                                    value={filters.experience}
                                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                                >
                                    <option value="">Tất cả cấp bậc</option>
                                    {filterOptions.experiences.map((exp, index) => (
                                        <option key={index} value={exp.value}>{exp.label}</option>
                                    ))}
                                </select>

                                <select 
                                    className="filter-select"
                                    value={filters.salaryRange}
                                    onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                                >
                                    <option value="">Tất cả mức lương</option>
                                    {filterOptions.salaryRanges.map((range, index) => (
                                        <option key={index} value={range.value}>{range.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="btn-search" onClick={handleSearch}>
                                <i className="fas fa-search"></i>
                                Tìm kiếm
                            </button>
                        </div>

                        {/* Major Tags */}
                        <div className="major-tags">
                            {!isLoadingFilters && filterOptions.majors.slice(0, 6).map((major) => (
                                <button 
                                    key={major.id}
                                    className={`major-tag ${selectedMajors.includes(major.id) ? 'active' : ''}`}
                                    onClick={() => handleMajorClick(major.id)}
                                >
                                    {major.TenNghanhNghe}
                                    <span className="count">{major.jobCount || 0}</span>
                                </button>
                            ))}
                            {filterOptions.majors.length > 6 && (
                                <button className="major-tag more">
                                    Khác
                                    <span className="count">{filterOptions.majors.slice(6).reduce((sum, m) => sum + (m.jobCount || 0), 0)}</span>
                                </button>
                            )}
                        </div>

                        {/* Results count */}
                        <div className="results-info">
                            <p>
                                Tìm thấy <strong>{totalRows}</strong> việc làm phù hợp với yêu cầu của bạn.
                            </p>
                            {hasActiveFilters && (
                                <button className="btn-clear-filters" onClick={handleClearFilters}>
                                    <i className="fas fa-times"></i>
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sort Options */}
                <div className="sort-section">
                    <div className="container">
                        <div className="sort-options">
                            <span className="sort-label">Ưu tiên hiển thị:</span>
                            <label className={`sort-option ${sortOption === 'newest' ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="sort" 
                                    checked={sortOption === 'newest'}
                                    onChange={() => setSortOption('newest')}
                                />
                                <i className="far fa-circle"></i>
                                <i className="fas fa-check-circle"></i>
                                Tin mới nhất
                            </label>
                            <label className={`sort-option ${sortOption === 'urgent' ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="sort" 
                                    checked={sortOption === 'urgent'}
                                    onChange={() => setSortOption('urgent')}
                                />
                                <i className="far fa-circle"></i>
                                <i className="fas fa-check-circle"></i>
                                Cần tuyển gấp
                            </label>
                            <label className={`sort-option ${sortOption === 'salary' ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="sort" 
                                    checked={sortOption === 'salary'}
                                    onChange={() => setSortOption('salary')}
                                />
                                <i className="far fa-circle"></i>
                                <i className="fas fa-check-circle"></i>
                                Lương cao nhất
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <div className="container">
                        <div className="content-wrapper">
                            {/* Jobs List */}
                            <div className="jobs-column">
                                {isLoading ? (
                                    <div className="loading-container">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        <p>Đang tải việc làm...</p>
                                    </div>
                                ) : jobs && jobs.length > 0 ? (
                                    <div className="jobs-list">
                                        {jobs.map((job) => {
                                            const daysRemaining = getDaysRemaining(job.Ngayhethan);
                                            return (
                                                <div 
                                                    key={job.id} 
                                                    className="job-card"
                                                    onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                                                >
                                                    {/* Hot badge */}
                                                    {job.isHot && (
                                                        <span className="hot-badge">HOT</span>
                                                    )}
                                                    
                                                    <div className="job-card-content">
                                                        <div className="company-logo">
                                                            {job.Company?.Tencongty?.charAt(0) || 'C'}
                                                        </div>
                                                        
                                                        <div className="job-info">
                                                            <h3 className="job-title">
                                                                {job.Tieude}
                                                                {job.isVerified && (
                                                                    <i className="fas fa-check-circle verified"></i>
                                                                )}
                                                            </h3>
                                                            <p className="company-name">{job.Company?.Tencongty}</p>
                                                            <p className="update-time">Cập nhật {formatDate(job.Ngaydang)}</p>
                                                            
                                                            <div className="job-tags">
                                                                {job.majors && job.majors.slice(0, 3).map((major, index) => (
                                                                    <span key={index} className="tag">{major.TenNghanhNghe}</span>
                                                                ))}
                                                                {job.majors && job.majors.length > 3 && (
                                                                    <span className="tag more">{job.majors.length - 3}+</span>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="job-meta">
                                                                <span className="location">
                                                                    <i className="fas fa-map-marker-alt"></i>
                                                                    {job.Diadiem}
                                                                </span>
                                                                {job.interviewRoundsCount > 0 && (
                                                                    <span className="interview-rounds">
                                                                        <i className="fas fa-users"></i>
                                                                        {job.interviewRoundsCount} vòng phỏng vấn
                                                                    </span>
                                                                )}
                                                                {daysRemaining !== null && (
                                                                    <span className="deadline">
                                                                        <i className="far fa-clock"></i>
                                                                        Còn {daysRemaining} ngày để ứng tuyển
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="job-actions">
                                                            <div className="salary">
                                                                <i className="fas fa-dollar-sign"></i>
                                                                {formatSalary(job.Luongtoithieu, job.Luongtoida)}
                                                            </div>
                                                            <button className="btn-apply">Ứng tuyển</button>
                                                            <button className="btn-save">
                                                                <i className="far fa-heart"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                            nextLabel="Tiếp >"
                                            onPageChange={handlePageClick}
                                            pageRangeDisplayed={3}
                                            marginPagesDisplayed={2}
                                            pageCount={totalPages}
                                            previousLabel="< Trước"
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
                            </div>

                            {/* Sidebar - Top Companies */}
                            <div className="sidebar-column">
                                <div className="sidebar-card">
                                    <h3 className="sidebar-title">Top công ty nổi bật</h3>
                                    <div className="company-list">
                                        {filterOptions.companies.slice(0, 5).map((company) => (
                                            <div 
                                                key={company.id} 
                                                className="company-item"
                                                onClick={() => handleFilterChange('companyId', company.id)}
                                            >
                                                <div className="company-logo-small">
                                                    {company.Tencongty?.charAt(0) || 'C'}
                                                </div>
                                                <div className="company-info">
                                                    <h4>{company.Tencongty}</h4>
                                                    <p>{company.jobCount} việc làm</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Format Filter */}
                                <div className="sidebar-card">
                                    <h3 className="sidebar-title">Hình thức làm việc</h3>
                                    <div className="format-list">
                                        {filterOptions.formats.map((format) => (
                                            <label 
                                                key={format.id} 
                                                className={`format-item ${filters.formatId === format.id ? 'active' : ''}`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="format"
                                                    checked={filters.formatId === format.id}
                                                    onChange={() => handleFilterChange('formatId', format.id)}
                                                />
                                                <span>{format.TenHinhThuc}</span>
                                            </label>
                                        ))}
                                        {filters.formatId && (
                                            <button 
                                                className="btn-clear-format"
                                                onClick={() => handleFilterChange('formatId', '')}
                                            >
                                                Xóa lọc
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default JobList;
