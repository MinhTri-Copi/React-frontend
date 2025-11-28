import React, { useState, useEffect } from 'react';
import './TestManagement.scss';
import { getMyTests, getTestDetail } from '../../service.js/testService';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import TestFormModal from './TestFormModal';
import TestDetailModal from './TestDetailModal';
import QuestionFormModal from './QuestionFormModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const TestManagement = ({ userId }) => {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalTests, setTotalTests] = useState(0);
    const limit = 10;

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [createdTestId, setCreatedTestId] = useState(null);

    useEffect(() => {
        fetchTests(currentPage);
    }, [currentPage]);

    const fetchTests = async (page) => {
        try {
            setIsLoading(true);
            const res = await getMyTests(userId, page, limit);

            if (res && res.EC === 0) {
                setTests(res.DT.tests);
                const pagination = res.DT.pagination || {};
                setTotalPages(pagination.totalPages || 0);
                setTotalTests(
                    typeof pagination.totalRows === 'number' ? pagination.totalRows : (res.DT.tests?.length || 0)
                );
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

    const handleTestCreated = (testData) => {
        setShowFormModal(false);
        if (testData && testData.id) {
            // Lưu testId và mở modal tạo câu hỏi
            setCreatedTestId(testData.id);
            setShowQuestionModal(true);
        }
        fetchTests(currentPage);
    };

    const handleQuestionsAdded = () => {
        setShowQuestionModal(false);
        setCreatedTestId(null);
        fetchTests(currentPage);
        toast.success('Thêm câu hỏi thành công!');
    };

    const handleQuestionModalClose = () => {
        setShowQuestionModal(false);
        setCreatedTestId(null);
    };

    const handleDeleteTest = (test) => {
        setTestToDelete(test);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        // TODO: Implement delete API call
        toast.info('Chức năng xóa bài test đang được phát triển');
        setShowDeleteConfirm(false);
        setTestToDelete(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setTestToDelete(null);
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
            return { badge: <span className="badge badge-inactive">Không hoạt động</span>, status: 'inactive' };
        }

        if (endDate && now > endDate) {
            return { badge: <span className="badge badge-expired">Hết hạn</span>, status: 'expired' };
        }

        if (startDate && now < startDate) {
            return { badge: <span className="badge badge-pending">Chưa bắt đầu</span>, status: 'pending' };
        }

        return { badge: <span className="badge badge-active">Đang hoạt động</span>, status: 'active' };
    };

    const canEditOrDelete = (test) => {
        const statusInfo = getStatusBadge(test);
        return statusInfo.status === 'pending';
    };

    if (isLoading) {
        return <div className="test-management-loading">Đang tải...</div>;
    }

    return (
        <div className="test-management-container">
            <div className="cp-header">
                <div className="cp-header-left">
                    <div className="company-logo">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div className="company-title">
                        <h1>Quản lý bài test</h1>
                        <p className="company-industry">Thiết kế và theo dõi các bài đánh giá ứng viên</p>
                    </div>
                </div>
                <div className="cp-header-right">
                    <button className="btn-create-test" onClick={handleCreateTest}>
                        <i className="fas fa-plus"></i> Tạo bài test mới
                    </button>
                </div>
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
                        {tests.map(test => {
                            const statusInfo = getStatusBadge(test);
                            const editable = canEditOrDelete(test);
                            const hasNoQuestions = !test.questionCount || test.questionCount === 0;

                            return (
                                <div key={test.id} className="test-card">
                                    <div className="test-card-header">
                                        <h3>{test.Tieude}</h3>
                                        <div className="header-badges">
                                            {statusInfo.badge}
                                            {hasNoQuestions && (
                                                <span className="badge badge-warning" title="Chưa có câu hỏi">
                                                    <i className="fas fa-exclamation-triangle"></i>
                                                </span>
                                            )}
                                        </div>
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
                                        {editable && (
                                            <button 
                                                className="btn-delete-test"
                                                onClick={() => handleDeleteTest(test)}
                                                title="Xóa bài test"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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

            <ConfirmModal
                show={showDeleteConfirm}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Xác nhận xóa bài test"
                message={`Bạn có chắc chắn muốn xóa bài test "${testToDelete?.Tieude}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />

            <QuestionFormModal
                show={showQuestionModal}
                onClose={handleQuestionModalClose}
                onSuccess={handleQuestionsAdded}
                testId={createdTestId}
                userId={userId}
                mode="create"
            />
        </div>
    );
};

export default TestManagement;

