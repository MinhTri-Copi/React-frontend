import React, { useState, useEffect } from 'react';
import CandidateNav from '../../components/Navigation/CandidateNav';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import { getListCompany, searchCompany } from '../../service.js/companyService';
import './CompanyList.scss';

const CompanyList = () => {
    const [companies, setCompanies] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        fetchCompanies(1);
    }, []);

    const fetchCompanies = async (page) => {
        setIsLoading(true);
        try {
            let res = await getListCompany(page, 10);
            
            if (res && res.data && res.data.EC === 0) {
                setCompanies(res.data.DT.companies);
                setTotalPages(res.data.DT.totalPages);
            } else {
                toast.error(res.data.EM);
            }
        } catch (error) {
            console.log(error);
            toast.error('Có lỗi khi tải danh sách công ty!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchKeyword.trim()) {
            fetchCompanies(1);
            return;
        }

        setIsLoading(true);
        try {
            let res = await searchCompany(searchKeyword, 1, 10);
            
            if (res && res.data && res.data.EC === 0) {
                setCompanies(res.data.DT.companies);
                setTotalPages(res.data.DT.totalPages);
                setCurrentPage(1);
            } else {
                toast.error(res.data.EM);
            }
        } catch (error) {
            console.log(error);
            toast.error('Có lỗi khi tìm kiếm công ty!');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageClick = (event) => {
        setCurrentPage(event.selected + 1);
        if (searchKeyword.trim()) {
            handleSearchWithPage(event.selected + 1);
        } else {
            fetchCompanies(event.selected + 1);
        }
    };

    const handleSearchWithPage = async (page) => {
        setIsLoading(true);
        try {
            let res = await searchCompany(searchKeyword, page, 10);
            
            if (res && res.data && res.data.EC === 0) {
                setCompanies(res.data.DT.companies);
                setTotalPages(res.data.DT.totalPages);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    // Calculate random rating (trong thực tế sẽ lưu trong DB)
    const getRandomRating = (id) => {
        const ratings = [4.5, 4.7, 4.8, 4.9, 5.0];
        return ratings[id % ratings.length];
    };

    // Calculate random recommendation percentage
    const getRandomRecommendation = (id) => {
        const percentages = [96, 97, 98, 99, 100];
        return percentages[id % percentages.length];
    };

    return (
        <div className="company-list-page">
            <CandidateNav />
            
            <div className="company-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-content">
                        <h1 className="page-title">Các công ty IT hàng đầu</h1>
                        <p className="page-subtitle">
                            Khám phá những công ty công nghệ tốt nhất để làm việc
                        </p>

                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm công ty theo tên, ngành nghề..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button className="btn-search" onClick={handleSearch}>
                                <i className="fas fa-search"></i>
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Company List Section */}
                <div className="companies-section">
                    <div className="container">
                        {isLoading ? (
                            <div className="loading-container">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Đang tải danh sách công ty...</p>
                            </div>
                        ) : (
                            <>
                                <div className="companies-list">
                                    {companies && companies.length > 0 ? (
                                        companies.map((company, index) => {
                                            const rank = (currentPage - 1) * 10 + index + 1;
                                            const rating = getRandomRating(company.id);
                                            const recommendation = getRandomRecommendation(company.id);
                                            
                                            return (
                                                <div key={company.id} className="company-card">
                                                    {/* Rank Badge */}
                                                    <div className={`rank-badge ${rank <= 3 ? 'top-rank' : ''}`}>
                                                        <div className="rank-number">{rank}</div>
                                                    </div>

                                                    <div className="company-main">
                                                        {/* Company Logo */}
                                                        <div className="company-logo">
                                                            {company.Tencongty ? company.Tencongty.charAt(0) : 'C'}
                                                        </div>

                                                        {/* Company Info */}
                                                        <div className="company-info">
                                                            <div className="company-header">
                                                                <h3 className="company-name">{company.Tencongty}</h3>
                                                                <span className="featured-badge">
                                                                    <i className="fas fa-star"></i>
                                                                    Đánh giá nổi bật
                                                                </span>
                                                            </div>

                                                            <p className="company-description">
                                                                {company.Mota 
                                                                    ? (company.Mota.length > 200 
                                                                        ? company.Mota.substring(0, 200) + '...' 
                                                                        : company.Mota)
                                                                    : 'Công ty công nghệ hàng đầu với môi trường làm việc chuyên nghiệp và năng động.'
                                                                }
                                                            </p>

                                                            <div className="company-details">
                                                                {company.Nganhnghe && (
                                                                    <div className="detail-item">
                                                                        <i className="fas fa-industry"></i>
                                                                        <span>{company.Nganhnghe}</span>
                                                                    </div>
                                                                )}
                                                                {company.Quymo && (
                                                                    <div className="detail-item">
                                                                        <i className="fas fa-users"></i>
                                                                        <span>{company.Quymo} nhân viên</span>
                                                                    </div>
                                                                )}
                                                                {company.Diachi && (
                                                                    <div className="detail-item">
                                                                        <i className="fas fa-map-marker-alt"></i>
                                                                        <span>{company.Diachi}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="company-footer">
                                                                <a href="#" className="link-detail">
                                                                    <i className="fas fa-arrow-right"></i>
                                                                    Xem chi tiết
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* Rating Section */}
                                                        <div className="company-rating">
                                                            <div className="rating-box">
                                                                <i className="fas fa-star star-icon"></i>
                                                                <div className="rating-content">
                                                                    <div className="rating-score">{rating}</div>
                                                                    <div className="rating-label">Đánh giá chung</div>
                                                                    <a href="#" className="rating-link">Xem chi tiết</a>
                                                                </div>
                                                            </div>

                                                            <div className="recommendation-box">
                                                                <i className="fas fa-thumbs-up thumbs-icon"></i>
                                                                <div className="recommendation-content">
                                                                    <div className="recommendation-score">{recommendation}%</div>
                                                                    <div className="recommendation-label">
                                                                        Khuyến khích làm việc tại đây
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-companies">
                                            <i className="fas fa-building"></i>
                                            <p>Không tìm thấy công ty phù hợp</p>
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

export default CompanyList;

