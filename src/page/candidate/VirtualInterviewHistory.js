import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { getHistory } from '../../service.js/virtualInterviewService';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import './VirtualInterviewHistory.scss';

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'in_progress', label: 'Đang làm' },
    { value: 'draft', label: 'Nháp' }
];

const VirtualInterviewHistory = () => {
    const [interviews, setInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, [statusFilter, pagination.page]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const result = await getHistory(pagination.page, pagination.limit, statusFilter);
            if (result && result.EC === 0) {
                setInterviews(result.DT.interviews || []);
                setPagination(prev => ({
                    ...prev,
                    total: result.DT.pagination.total,
                    totalPages: result.DT.pagination.totalPages
                }));
            } else {
                toast.error(result?.EM || 'Không thể tải lịch sử!');
            }
        } catch (error) {
            console.error('Error loading history:', error);
            toast.error('Có lỗi xảy ra khi tải lịch sử!');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageClick = (event) => {
        setPagination(prev => ({
            ...prev,
            page: event.selected + 1
        }));
    };

    const getLevelLabel = (level, language) => {
        const labels = {
            'intern': language === 'vi' ? 'Thực tập sinh' : 'Intern',
            'junior': language === 'vi' ? 'Nhân viên' : 'Junior',
            'middle': language === 'vi' ? 'Chuyên viên' : 'Middle',
            'senior': language === 'vi' ? 'Chuyên gia' : 'Senior'
        };
        return labels[level] || level;
    };

    const getStatusLabel = (status, language) => {
        const labels = {
            'draft': language === 'vi' ? 'Nháp' : 'Draft',
            'in_progress': language === 'vi' ? 'Đang làm' : 'In Progress',
            'completed': language === 'vi' ? 'Đã hoàn thành' : 'Completed',
            'abandoned': language === 'vi' ? 'Đã hủy' : 'Abandoned'
        };
        return labels[status] || status;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="virtual-interview-history">
            <CandidateNav />
            <div className="container mt-4 mb-5">
                <h2 className="page-title">Lịch sử phỏng vấn ảo</h2>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="filter-group">
                        <label className="filter-label">Trạng thái:</label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Interview List */}
                {isLoading ? (
                    <div className="text-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="empty-state">
                        <p>Chưa có lịch sử phỏng vấn ảo</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/candidate/virtual-interview')}
                        >
                            Bắt đầu phỏng vấn mới
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="interview-cards">
                            {interviews.map(interview => {
                                const language = interview.language || 'vi';
                                return (
                                    <div
                                        key={interview.id}
                                        className="interview-card"
                                        onClick={() => {
                                            if (interview.status === 'completed') {
                                                navigate(`/candidate/virtual-interview/${interview.id}/result`);
                                            } else {
                                                navigate(`/candidate/virtual-interview/${interview.id}`);
                                            }
                                        }}
                                    >
                                        <div className="card-header">
                                            <span className="level-badge">
                                                {getLevelLabel(interview.level, language)}
                                            </span>
                                            <span className={`status-badge status-${interview.status}`}>
                                                {getStatusLabel(interview.status, language)}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="topics-list">
                                                <strong>Chủ đề: </strong>
                                                {Array.isArray(interview.topics) 
                                                    ? interview.topics.join(', ')
                                                    : interview.topics}
                                            </div>
                                            <div className="card-info">
                                                <div className="info-item">
                                                    <span className="info-label">Ngày tạo:</span>
                                                    <span>{formatDate(interview.createdAt)}</span>
                                                </div>
                                                {interview.completedAt && (
                                                    <div className="info-item">
                                                        <span className="info-label">Hoàn thành:</span>
                                                        <span>{formatDate(interview.completedAt)}</span>
                                                    </div>
                                                )}
                                                {interview.totalScore !== null && (
                                                    <div className="info-item">
                                                        <span className="info-label">Điểm:</span>
                                                        <span className="score-value">
                                                            {interview.totalScore.toFixed(1)} / {interview.maxScore?.toFixed(1) || 0}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination-container">
                                <ReactPaginate
                                    nextLabel="next >"
                                    onPageChange={handlePageClick}
                                    pageRangeDisplayed={3}
                                    marginPagesDisplayed={2}
                                    pageCount={pagination.totalPages}
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
            <Footer />
        </div>
    );
};

export default VirtualInterviewHistory;

