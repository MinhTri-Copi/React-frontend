import React, { useEffect, useMemo, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import { getTestSubmissions } from '../../service.js/hrService';
import './TestSubmissionList.scss';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'danop', label: 'Đã nộp' },
    { value: 'dacham', label: 'Đã chấm' }
];

const TestSubmissionList = ({ userId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [jobOptions, setJobOptions] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, graded: 0 });
    const [statusFilter, setStatusFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ totalRows: 0, totalPages: 0, currentPage: 1, limit: 10 });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, statusFilter, jobFilter, searchKeyword, currentPage]);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const res = await getTestSubmissions(userId, {
                status: statusFilter,
                jobPostingId: jobFilter,
                search: searchKeyword.trim(),
                page: currentPage
            });

            if (res && res.EC === 0) {
                setSubmissions(res.DT?.submissions || []);
                setJobOptions(res.DT?.filterOptions?.jobPostings || []);
                setStats(res.DT?.stats || { total: 0, pending: 0, graded: 0 });
                setPagination(res.DT?.pagination || { totalRows: 0, totalPages: 0, currentPage: 1, limit: 10 });
            } else {
                toast.error(res?.EM || 'Không thể tải danh sách bài test đã nộp!');
                setSubmissions([]);
            }
        } catch (error) {
            console.error('Error fetching test submissions:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách bài test đã nộp!');
            setSubmissions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleJobChange = (e) => {
        setJobFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value);
        setCurrentPage(1);
    };

    const handlePageClick = (event) => {
        setCurrentPage(event.selected + 1);
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString('vi-VN');
    };

    const statusBadgeClass = useMemo(() => ({
        danop: 'badge-submitted',
        dacham: 'badge-graded',
        danglam: 'badge-doing',
        chuabatdau: 'badge-pending'
    }), []);

    return (
        <div className="test-submission-page">
            <div className="cp-header">
                <div className="cp-header-left">
                    <div className="company-logo">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="company-title">
                        <h1>Danh sách ứng viên nộp bài test</h1>
                        <p className="company-industry">Theo dõi các bài test đã nộp và chuẩn bị chấm điểm</p>
                    </div>
                </div>
            </div>

            <div className="ts-stats">
                <div className="stat-card total">
                    <div>
                        <p>Tổng số bài nộp</p>
                        <h3>{stats.total}</h3>
                    </div>
                    <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-card pending">
                    <div>
                        <p>Chờ chấm</p>
                        <h3>{stats.pending}</h3>
                    </div>
                    <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-card graded">
                    <div>
                        <p>Đã chấm</p>
                        <h3>{stats.graded}</h3>
                    </div>
                    <i className="fas fa-check-circle"></i>
                </div>
            </div>

            <div className="ts-filters">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                        value={searchKeyword}
                        onChange={handleSearchChange}
                    />
                    {searchKeyword && (
                        <button className="clear-search" onClick={() => setSearchKeyword('')}>
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                <div className="filter-group">
                    <select value={jobFilter} onChange={handleJobChange}>
                        <option value="all">Tất cả tin tuyển dụng</option>
                        {jobOptions.map(job => (
                            <option key={job.id} value={job.id}>
                                {job.title} - {job.companyName}
                            </option>
                        ))}
                    </select>
                    <div className="status-filters">
                        {STATUS_FILTERS.map(option => (
                            <button
                                key={option.value}
                                className={statusFilter === option.value ? 'active' : ''}
                                onClick={() => handleStatusChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="ts-table-container">
                {isLoading ? (
                    <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-folder-open"></i>
                        <p>Chưa có ứng viên nào nộp bài test!</p>
                    </div>
                ) : (
                    <>
                        <table className="ts-table">
                            <thead>
                                <tr>
                                    <th>Ứng viên</th>
                                    <th>Bài test</th>
                                    <th>Tin tuyển dụng</th>
                                    <th>Điểm</th>
                                    <th>Trạng thái</th>
                                    <th>Cập nhật</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(sub => (
                                    <tr key={sub.id}>
                                        <td>
                                            <div className="candidate-info">
                                                <div className="avatar">
                                                    {sub.User?.Hoten ? sub.User.Hoten.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <strong>{sub.User?.Hoten || 'N/A'}</strong>
                                                    <small>{sub.User?.email}</small>
                                                    {sub.User?.SDT && <small><i className="fas fa-phone"></i> {sub.User.SDT}</small>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="test-info">
                                                <strong>{sub.Test?.Tieude}</strong>
                                                <small>Mã bài: #{sub.Test?.id}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="job-info">
                                                <strong>{sub.Test?.JobPosting?.Tieude}</strong>
                                                <small>{sub.Test?.JobPosting?.Company?.Tencongty}</small>
                                            </div>
                                        </td>
                                        <td className="score-col">
                                            {sub.Trangthai === 'dacham'
                                                ? `${(sub.Tongdiemdatduoc || 0).toFixed(1)} / ${(sub.Test?.Tongdiem || 100)}`
                                                : '--'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusBadgeClass[sub.Trangthai] || ''}`}>
                                                {sub.Trangthai === 'danop' && 'Đã nộp bài'}
                                                {sub.Trangthai === 'dacham' && 'Đã chấm điểm'}
                                                {sub.Trangthai === 'danglam' && 'Đang làm bài'}
                                                {sub.Trangthai === 'chuabatdau' && 'Chưa bắt đầu'}
                                            </span>
                                        </td>
                                        <td>{formatDateTime(sub.updatedAt)}</td>
                                        <td>
                                            <button
                                                className="btn-grade"
                                                onClick={() => toast.info('Nút chấm bài sẽ được mở khi quy trình hoàn tất!')}
                                                disabled
                                            >
                                                <i className="fas fa-pen"></i>
                                                Chấm bài
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {pagination.totalPages > 1 && (
                            <div className="ts-pagination">
                                <div className="pagination-info">
                                    Hiển thị {(pagination.currentPage - 1) * pagination.limit + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalRows)} / {pagination.totalRows} bài nộp
                                </div>
                                <ReactPaginate
                                    nextLabel={<i className="fas fa-chevron-right"></i>}
                                    previousLabel={<i className="fas fa-chevron-left"></i>}
                                    onPageChange={handlePageClick}
                                    forcePage={pagination.currentPage - 1}
                                    pageCount={pagination.totalPages}
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={3}
                                    containerClassName="pagination"
                                    pageClassName="page-item"
                                    pageLinkClassName="page-link"
                                    previousClassName="page-item"
                                    previousLinkClassName="page-link"
                                    nextClassName="page-item"
                                    nextLinkClassName="page-link"
                                    activeClassName="active"
                                    breakLabel="..."
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TestSubmissionList;