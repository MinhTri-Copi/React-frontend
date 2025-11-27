import React, { useState, useEffect } from 'react';
import './TestFormModal.scss';
import { createTest } from '../../service.js/testService';
import { getMyJobPostings } from '../../service.js/hrService';
import { toast } from 'react-toastify';

const TestFormModal = ({ show, onClose, onSuccess, userId }) => {
    const [formData, setFormData] = useState({
        Tieude: '',
        Mota: '',
        Thoigiantoida: 60,
        Ngaybatdau: '',
        Ngayhethan: '',
        Trangthai: 1,
        jobPostingId: ''
    });

    const [jobPostings, setJobPostings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            fetchJobPostings();
            // Reset form
            setFormData({
                Tieude: '',
                Mota: '',
                Thoigiantoida: 60,
                Ngaybatdau: '',
                Ngayhethan: '',
                Trangthai: 1,
                jobPostingId: ''
            });
        }
    }, [show]);

    const fetchJobPostings = async () => {
        try {
            setIsLoading(true);
            const res = await getMyJobPostings(userId, 1, 100);
            if (res && res.EC === 0) {
                // Chỉ lấy tin đang tuyển (status = 1)
                const activeJobs = res.DT.jobs.filter(job => job.TrangthaiId === 1);
                setJobPostings(activeJobs);
                
                if (activeJobs.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        jobPostingId: activeJobs[0].id
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching job postings:', error);
            toast.error('Không thể tải danh sách tin tuyển dụng!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.Tieude.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài test!');
            return;
        }

        if (!formData.jobPostingId) {
            toast.error('Vui lòng chọn tin tuyển dụng!');
            return;
        }

        if (formData.Thoigiantoida <= 0) {
            toast.error('Thời gian làm bài phải lớn hơn 0!');
            return;
        }

        // Validate dates
        if (formData.Ngaybatdau && formData.Ngayhethan) {
            const startDate = new Date(formData.Ngaybatdau);
            const endDate = new Date(formData.Ngayhethan);
            
            if (endDate <= startDate) {
                toast.error('Ngày hết hạn phải sau ngày bắt đầu!');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const res = await createTest(userId, formData);

            if (res && res.EC === 0) {
                toast.success('Tạo bài test thành công!');
                onSuccess(res.DT);
            } else {
                toast.error(res.EM || 'Không thể tạo bài test!');
            }
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Có lỗi xảy ra khi tạo bài test!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="test-form-modal-overlay" onClick={onClose}>
            <div className="test-form-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tạo Bài Test Mới</h2>
                    <button className="btn-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Tiêu đề */}
                        <div className="form-group">
                            <label>
                                Tiêu đề bài test <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="Tieude"
                                value={formData.Tieude}
                                onChange={handleChange}
                                placeholder="VD: Bài Test JavaScript Cơ Bản"
                                required
                            />
                        </div>

                        {/* Tin tuyển dụng */}
                        <div className="form-group">
                            <label>
                                Tin tuyển dụng <span className="required">*</span>
                            </label>
                            {isLoading ? (
                                <div className="loading-select">Đang tải...</div>
                            ) : jobPostings.length === 0 ? (
                                <div className="no-jobs-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    Bạn chưa có tin tuyển dụng nào đang hoạt động!
                                </div>
                            ) : (
                                <select
                                    name="jobPostingId"
                                    value={formData.jobPostingId}
                                    onChange={handleChange}
                                    required
                                >
                                    {jobPostings.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.Tieude} - {job.Company?.Tencongty}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Mô tả */}
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea
                                name="Mota"
                                value={formData.Mota}
                                onChange={handleChange}
                                placeholder="Mô tả chi tiết về bài test..."
                                rows="4"
                            />
                        </div>

                        {/* Thời gian làm bài */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    Thời gian làm bài (phút) <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="Thoigiantoida"
                                    value={formData.Thoigiantoida}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Trạng thái</label>
                                <select
                                    name="Trangthai"
                                    value={formData.Trangthai}
                                    onChange={handleChange}
                                >
                                    <option value={1}>Hoạt động</option>
                                    <option value={0}>Không hoạt động</option>
                                </select>
                            </div>
                        </div>

                        {/* Ngày bắt đầu và hết hạn */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày bắt đầu</label>
                                <input
                                    type="datetime-local"
                                    name="Ngaybatdau"
                                    value={formData.Ngaybatdau}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Ngày hết hạn</label>
                                <input
                                    type="datetime-local"
                                    name="Ngayhethan"
                                    value={formData.Ngayhethan}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-note">
                            <i className="fas fa-info-circle"></i>
                            <span>Sau khi tạo bài test, bạn có thể thêm câu hỏi vào bài test.</span>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmitting || jobPostings.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Đang tạo...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check"></i> Tạo bài test
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestFormModal;

