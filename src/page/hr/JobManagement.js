import React, { useState, useEffect } from 'react';
import './JobManagement.scss';
import { getMyJobPostings, getJobPostingDetail, deleteJobPosting, createJobPosting, updateJobPosting } from '../../service.js/hrService';
import { getAllMajors, getAllFormats, getAllJobPostingStatuses } from '../../service.js/utilityService';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import JobFormModal from './JobFormModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const JobManagement = ({ userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        inactiveJobs: 0
    });
    const [jobs, setJobs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const limit = 10;

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'
    const [selectedJob, setSelectedJob] = useState(null);

    // Confirm delete modal
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);

    // Options for form
    const [companies, setCompanies] = useState([]);
    const [formats, setFormats] = useState([]);
    const [majors, setMajors] = useState([]);
    const [statuses, setStatuses] = useState([]);

    useEffect(() => {
        fetchJobPostings(currentPage);
        fetchFormOptions();
    }, [currentPage]);

    const fetchFormOptions = async () => {
        try {
            const [majorsRes, formatsRes, statusesRes] = await Promise.all([
                getAllMajors(),
                getAllFormats(),
                getAllJobPostingStatuses()
            ]);

            if (majorsRes && majorsRes.EC === 0) setMajors(majorsRes.DT);
            if (formatsRes && formatsRes.EC === 0) setFormats(formatsRes.DT);
            if (statusesRes && statusesRes.EC === 0) setStatuses(statusesRes.DT);

            // Get companies from user's HR dashboard data
            const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // We'll need to get companies from dashboard or recruiter data
                // For now, we'll fetch from the jobs data
            }
        } catch (error) {
            console.error('Error fetching form options:', error);
        }
    };

    const fetchJobPostings = async (page) => {
        try {
            setIsLoading(true);
            const res = await getMyJobPostings(userId, page, limit);

            if (res && res.EC === 0) {
                setStats(res.DT.stats);
                setJobs(res.DT.jobs);
                setTotalPages(res.DT.pagination.totalPages);
                setTotalRows(res.DT.pagination.totalRows);

                // Extract unique companies from jobs
                const uniqueCompanies = [];
                const companyMap = new Map();
                res.DT.jobs.forEach(job => {
                    if (job.Company && !companyMap.has(job.Company.id)) {
                        companyMap.set(job.Company.id, true);
                        uniqueCompanies.push(job.Company);
                    }
                });
                setCompanies(uniqueCompanies);
            } else {
                toast.error(res.EM || 'Không thể tải danh sách tin tuyển dụng!');
            }
        } catch (error) {
            console.error('Error fetching job postings:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu!');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageClick = (event) => {
        setCurrentPage(event.selected + 1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!max) return `${min.toLocaleString('vi-VN')} VNĐ`;
        return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')} VNĐ`;
    };

    const getStatusColor = (statusId) => {
        switch (statusId) {
            case 1: return 'status-active';
            case 2: return 'status-inactive';
            case 3: return 'status-expired';
            case 4: return 'status-draft';
            default: return 'status-default';
        }
    };

    const handleViewDetail = async (jobId) => {
        try {
            const res = await getJobPostingDetail(userId, jobId);
            if (res && res.EC === 0) {
                setSelectedJob(res.DT);
                setModalMode('view');
                setShowModal(true);
            } else {
                toast.error(res.EM || 'Không thể tải thông tin chi tiết!');
            }
        } catch (error) {
            console.error('Error fetching job detail:', error);
            toast.error('Có lỗi xảy ra!');
        }
    };

    const handleEdit = async (jobId) => {
        try {
            const res = await getJobPostingDetail(userId, jobId);
            if (res && res.EC === 0) {
                setSelectedJob(res.DT);
                setModalMode('edit');
                setShowModal(true);
            } else {
                toast.error(res.EM || 'Không thể tải thông tin chi tiết!');
            }
        } catch (error) {
            console.error('Error fetching job detail:', error);
            toast.error('Có lỗi xảy ra!');
        }
    };

    const handleDelete = (jobId) => {
        // Find the job to get its title
        const job = jobs.find(j => j.id === jobId);
        setJobToDelete({ id: jobId, title: job?.Tieude || 'tin tuyển dụng này' });
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;

        try {
            const res = await deleteJobPosting(userId, jobToDelete.id);
            if (res && res.EC === 0) {
                toast.success(res.EM || 'Xóa tin tuyển dụng thành công!');
                setShowConfirmDelete(false);
                setJobToDelete(null);
                // Refresh the list
                fetchJobPostings(currentPage);
            } else {
                toast.error(res.EM || 'Không thể xóa tin tuyển dụng!');
            }
        } catch (error) {
            console.error('Error deleting job posting:', error);
            toast.error('Có lỗi xảy ra khi xóa tin tuyển dụng!');
        }
    };

    const cancelDelete = () => {
        setShowConfirmDelete(false);
        setJobToDelete(null);
    };

    const handleCreate = () => {
        setSelectedJob(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedJob(null);
        setModalMode('view');
    };

    const handleModalSubmit = async (formData) => {
        try {
            let res;
            if (modalMode === 'create') {
                res = await createJobPosting(userId, formData);
            } else if (modalMode === 'edit') {
                res = await updateJobPosting(userId, selectedJob.id, formData);
            }

            if (res && res.EC === 0) {
                toast.success(res.EM || 'Thao tác thành công!');
                handleModalClose();
                // Refresh the list
                fetchJobPostings(currentPage);
            } else {
                toast.error(res.EM || 'Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Có lỗi xảy ra khi thực hiện thao tác!');
        }
    };

    return (
        <div className="job-management">
            {/* Thống kê */}
            <div className="stats-section">
                <div className="stat-card stat-total">
                    <div className="stat-icon">
                        <i className="fas fa-briefcase"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalJobs}</h3>
                        <p>Tổng số bài đăng</p>
                    </div>
                </div>
                <div className="stat-card stat-active">
                    <div className="stat-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.activeJobs}</h3>
                        <p>Đang tuyển</p>
                    </div>
                </div>
                <div className="stat-card stat-inactive">
                    <div className="stat-icon">
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.inactiveJobs}</h3>
                        <p>Ngừng tuyển</p>
                    </div>
                </div>
            </div>

            {/* Header với nút tạo mới */}
            <div className="section-header">
                <h2>Danh sách tin tuyển dụng ({totalRows})</h2>
                <button className="btn-create-job" onClick={handleCreate}>
                    <i className="fas fa-plus"></i>
                    Tạo tin mới
                </button>
            </div>

            {/* Bảng dữ liệu */}
            {isLoading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-inbox"></i>
                    <h3>Chưa có tin tuyển dụng nào</h3>
                    <p>Hãy tạo tin tuyển dụng đầu tiên của bạn!</p>
                    <button className="btn-create-first" onClick={handleCreate}>
                        <i className="fas fa-plus"></i>
                        Tạo tin mới
                    </button>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="job-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tiêu đề</th>
                                    <th>Công ty</th>
                                    <th>Ngành nghề</th>
                                    <th>Địa điểm</th>
                                    <th>Mức lương</th>
                                    <th>Hình thức</th>
                                    <th>Ngày đăng</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>#{job.id}</td>
                                        <td className="job-title">
                                            <div className="title-wrapper">
                                                {job.Tieude}
                                            </div>
                                        </td>
                                        <td>{job.Company?.Tencongty || 'N/A'}</td>
                                        <td>
                                            <div className="majors-list">
                                                {job.majors && job.majors.length > 0
                                                    ? job.majors.map(m => m.TenNghanhNghe).join(', ')
                                                    : 'N/A'}
                                            </div>
                                        </td>
                                        <td>{job.Diadiem || 'N/A'}</td>
                                        <td className="salary">
                                            {formatSalary(job.Luongtoithieu, job.Luongtoida)}
                                        </td>
                                        <td>{job.Format?.TenHinhThuc || 'N/A'}</td>
                                        <td>{formatDate(job.Ngaydang)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(job.TrangthaiId)}`}>
                                                {job.JobPostingStatus?.TenTrangThai || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="actions">
                                            <button
                                                className="btn-action btn-view"
                                                onClick={() => handleViewDetail(job.id)}
                                                title="Xem chi tiết"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(job.id)}
                                                title="Chỉnh sửa"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(job.id)}
                                                title="Xóa"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <ReactPaginate
                                previousLabel={<i className="fas fa-chevron-left"></i>}
                                nextLabel={<i className="fas fa-chevron-right"></i>}
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

            {/* Job Form Modal */}
            <JobFormModal
                show={showModal}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={selectedJob}
                mode={modalMode}
                companies={companies}
                formats={formats}
                majors={majors}
                statuses={statuses}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                show={showConfirmDelete}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa tin tuyển dụng "${jobToDelete?.title}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />
        </div>
    );
};

export default JobManagement;

