import React, { useState, useEffect } from 'react';
import './TestManagement.scss';
import { getMyTests, getTestDetail } from '../../service.js/testService';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import TestFormModal from './TestFormModal';
import TestDetailModal from './TestDetailModal';

const TestManagement = ({ userId }) => {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 10;

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);

    useEffect(() => {
        fetchTests(currentPage);
    }, [currentPage]);

    const fetchTests = async (page) => {
        try {
            setIsLoading(true);
            const res = await getMyTests(userId, page, limit);

            if (res && res.EC === 0) {
                setTests(res.DT.tests);
                setTotalPages(res.DT.pagination.totalPages);
            } else {
                toast.error(res.EM || 'Không thể tải danh sách bài test!');
            }
        } catch (error) {
            console.error('Error fetching tests:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách bài test!');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageClick = (event) => {
        setCurrentPage(event.selected + 1);
    };

    const handleCreateTest = () => {
        setSelectedTest(null);
        setShowFormModal(true);
    };

    const handleViewDetail = async (test) => {
        try {
            const res = await getTestDetail(userId, test.id);
            if (res && res.EC === 0) {
                setSelectedTest(res.DT);
                setShowDetailModal(true);
            } else {
                toast.error(res.EM || 'Không thể tải chi tiết bài test!');
            }
        } catch (error) {
            console.error('Error fetching test detail:', error);
            toast.error('Có lỗi xảy ra!');
        }
    };

    const handleModalClose = () => {
        setShowFormModal(false);
        setShowDetailModal(false);
        setSelectedTest(null);
    };

    const handleTestCreated = () => {
        setShowFormModal(false);
        fetchTests(currentPage);
        toast.success('Tạo bài test thành công!');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không giới hạn';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (test) => {
        const now = new Date();
        const startDate = test.Ngaybatdau ? new Date(test.Ngaybatdau) : null;
        const endDate = test.Ngayhethan ? new Date(test.Ngayhethan) : null;

        if (!test.Trangthai) {
            return <span className="badge badge-inactive">Không hoạt động</span>;
        }

        if (endDate && now > endDate) {
            return <span className="badge badge-expired">Hết hạn</span>;
        }

        if (startDate && now < startDate) {
            return <span className="badge badge-pending">Chưa bắt đầu</span>;
        }

        return <span className="badge badge-active">Đang hoạt động</span>;
    };

    if (isLoading) {
        return <div className="test-management-loading">Đang tải...</div>;
    }

    return (
        <div className="test-management-container">
            <div className="test-management-header">
                <h2>Quản lý Bài Test</h2>
                <button className="btn-create-test" onClick={handleCreateTest}>
                    <i className="fas fa-plus"></i> Tạo bài test mới
                </button>
            </div>

            {tests.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-file-alt"></i>
                    <p>Chưa có bài test nào</p>
                    <button className="btn-create-test" onClick={handleCreateTest}>
                        Tạo bài test đầu tiên
                    </button>
                </div>
            ) : (
                <>
                    <div className="tests-grid">
                        {tests.map(test => (
                            <div key={test.id} className="test-card">
                                <div className="test-card-header">
                                    <h3>{test.Tieude}</h3>
                                    {getStatusBadge(test)}
                                </div>

                                <div className="test-card-body">
                                    <div className="test-info">
                                        <div className="info-item">
                                            <i className="fas fa-briefcase"></i>
                                            <span>{test.JobPosting?.Tieude}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="fas fa-building"></i>
                                            <span>{test.JobPosting?.Company?.Tencongty}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="fas fa-clock"></i>
                                            <span>{test.Thoigiantoida} phút</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="fas fa-calendar"></i>
                                            <span>Hết hạn: {formatDate(test.Ngayhethan)}</span>
                                        </div>
                                    </div>

                                    <div className="test-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{test.questionCount || 0}</span>
                                            <span className="stat-label">Câu hỏi</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{test.Tongdiem}</span>
                                            <span className="stat-label">Tổng điểm</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{test.submissionCount || 0}</span>
                                            <span className="stat-label">Lượt làm</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="test-card-footer">
                                    <button 
                                        className="btn-view-detail"
                                        onClick={() => handleViewDetail(test)}
                                    >
                                        <i className="fas fa-eye"></i> Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <ReactPaginate
                                previousLabel={'‹'}
                                nextLabel={'›'}
                                breakLabel={'...'}
                                pageCount={totalPages}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={3}
                                onPageChange={handlePageClick}
                                containerClassName={'pagination'}
                                activeClassName={'active'}
                                forcePage={currentPage - 1}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <TestFormModal
                show={showFormModal}
                onClose={handleModalClose}
                onSuccess={handleTestCreated}
                userId={userId}
            />

            <TestDetailModal
                show={showDetailModal}
                onClose={handleModalClose}
                test={selectedTest}
                userId={userId}
                onUpdate={() => fetchTests(currentPage)}
            />
        </div>
    );
};

export default TestManagement;

