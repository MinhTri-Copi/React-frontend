import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { 
    getMeetingsForHr, 
    createMeeting, 
    updateMeetingStatus,
    cancelMeeting 
} from '../../service.js/meetingService';
import { getJobApplications } from '../../service.js/hrService';
import { getInterviewRounds } from '../../service.js/interviewRoundService';
import MeetingEvaluationModal from './MeetingEvaluationModal';
import './MeetingManagement.scss';

const MeetingManagement = ({ userId }) => {
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        interviewRoundId: '',
        jobApplicationId: '',
        candidateUserId: '',
        scheduledAt: '',
        notes: ''
    });
    const [jobApplications, setJobApplications] = useState([]);
    const [interviewRounds, setInterviewRounds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMeetingForEvaluation, setSelectedMeetingForEvaluation] = useState(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchMeetings();
            fetchJobApplications();
        }
    }, [userId, statusFilter]);

    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const res = await getMeetingsForHr(userId, { status: statusFilter });
            if (res && res.EC === 0) {
                setMeetings(res.DT || []);
            } else {
                toast.error(res?.EM || 'Không thể tải danh sách meeting!');
                setMeetings([]);
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách meeting!');
            setMeetings([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJobApplications = async () => {
        try {
            const res = await getJobApplications(userId, 7, 'all', 1, 100); // Only "Chuẩn bị phỏng vấn" (statusId=7)
            if (res && res.EC === 0) {
                setJobApplications(res.DT?.applications || []);
            }
        } catch (error) {
            console.error('Error fetching job applications:', error);
        }
    };

    const handleCreateMeeting = () => {
        setFormData({
            interviewRoundId: '',
            jobApplicationId: '',
            candidateUserId: '',
            scheduledAt: '',
            notes: ''
        });
        setShowCreateModal(true);
    };

    const handleJobApplicationChange = async (applicationId) => {
        if (!applicationId) {
            setFormData(prev => ({
                ...prev,
                jobApplicationId: '',
                candidateUserId: '',
                interviewRoundId: ''
            }));
            setInterviewRounds([]);
            return;
        }

        const application = jobApplications.find(app => app.id === parseInt(applicationId));
        if (application) {
            setFormData(prev => ({
                ...prev,
                jobApplicationId: applicationId,
                candidateUserId: application.Record?.User?.id || ''
            }));

            // Fetch interview rounds for this job posting
            if (application.JobPosting?.id) {
                try {
                    const roundsRes = await getInterviewRounds(userId, { 
                        jobPostingId: application.JobPosting.id 
                    });
                    if (roundsRes && roundsRes.EC === 0) {
                        setInterviewRounds(roundsRes.DT?.rounds || []);
                    }
                } catch (error) {
                    console.error('Error fetching interview rounds:', error);
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.interviewRoundId || !formData.jobApplicationId || !formData.candidateUserId || !formData.scheduledAt) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createMeeting(userId, formData);
            if (res && res.EC === 0) {
                toast.success('Tạo meeting thành công! Email đã được gửi cho ứng viên.');
                setShowCreateModal(false);
                fetchMeetings();
            } else {
                toast.error(res?.EM || 'Không thể tạo meeting!');
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
            toast.error('Có lỗi xảy ra khi tạo meeting!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinMeeting = (roomName) => {
        // Use navigate instead of window.open to maintain session
        window.location.href = `/meeting/${roomName}`;
    };

    const handleCancelMeeting = async (meetingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy meeting này?')) {
            return;
        }

        try {
            const res = await cancelMeeting(meetingId, userId);
            if (res && res.EC === 0) {
                toast.success('Hủy meeting thành công!');
                fetchMeetings();
            } else {
                toast.error(res?.EM || 'Không thể hủy meeting!');
            }
        } catch (error) {
            console.error('Error canceling meeting:', error);
            toast.error('Có lỗi xảy ra khi hủy meeting!');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { text: 'Chờ bắt đầu', class: 'status-pending', icon: 'fa-clock' },
            running: { text: 'Đang diễn ra', class: 'status-running', icon: 'fa-video' },
            done: { text: 'Đã hoàn thành', class: 'status-done', icon: 'fa-check-circle' },
            cancel: { text: 'Đã hủy', class: 'status-cancel', icon: 'fa-times-circle' },
            rescheduled: { text: 'Đã dời lịch', class: 'status-rescheduled', icon: 'fa-calendar-alt' }
        };
        const statusInfo = statusMap[status] || { text: status, class: 'status-default', icon: 'fa-question' };
        return (
            <span className={`status-badge ${statusInfo.class}`}>
                <i className={`fas ${statusInfo.icon}`}></i>
                {statusInfo.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="meeting-management">
            <div className="page-header">
                <div className="header-left">
                    <h1>
                        <i className="fas fa-video"></i>
                        Quản lý Meeting
                    </h1>
                    <p>Quản lý các cuộc phỏng vấn trực tuyến</p>
                </div>
                <div className="header-right">
                    <button className="btn-create-meeting" onClick={handleCreateMeeting}>
                        <i className="fas fa-plus"></i>
                        Tạo Meeting
                    </button>
                </div>
            </div>

            <div className="filters-section">
                <div className="filter-group">
                    <label>Lọc theo trạng thái:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ bắt đầu</option>
                        <option value="running">Đang diễn ra</option>
                        <option value="done">Đã hoàn thành</option>
                        <option value="cancel">Đã hủy</option>
                        <option value="rescheduled">Đã dời lịch</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải danh sách meeting...</p>
                </div>
            ) : meetings.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-video-slash"></i>
                    <h3>Chưa có meeting nào</h3>
                    <p>Hãy tạo meeting đầu tiên để bắt đầu phỏng vấn ứng viên!</p>
                    <button className="btn-create-first" onClick={handleCreateMeeting}>
                        <i className="fas fa-plus"></i>
                        Tạo Meeting
                    </button>
                </div>
            ) : (
                <div className="meetings-list">
                    {meetings.map((meeting) => (
                        <div key={meeting.id} className="meeting-card">
                            <div className="meeting-header">
                                <div className="meeting-title">
                                    <h3>
                                        {meeting.InterviewRound && (
                                            <>Vòng {meeting.InterviewRound.roundNumber}: {meeting.InterviewRound.title}</>
                                        )}
                                        {!meeting.InterviewRound && 'Meeting phỏng vấn'}
                                    </h3>
                                    <p>
                                        {meeting.JobApplication?.JobPosting?.Tieude && (
                                            <>{meeting.JobApplication.JobPosting.Tieude} - </>
                                        )}
                                        {meeting.JobApplication?.JobPosting?.Company?.Tencongty}
                                    </p>
                                </div>
                                {getStatusBadge(meeting.status)}
                            </div>
                            <div className="meeting-body">
                                <div className="meeting-info">
                                    <div className="info-item">
                                        <i className="fas fa-user"></i>
                                        <span>
                                            <strong>Ứng viên:</strong> {meeting.Candidate?.Hoten || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>
                                            <strong>Thời gian:</strong> {formatDate(meeting.scheduledAt)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-door-open"></i>
                                        <span>
                                            <strong>Phòng:</strong> {meeting.roomName}
                                        </span>
                                    </div>
                                    {meeting.InterviewRound?.duration && (
                                        <div className="info-item">
                                            <i className="fas fa-clock"></i>
                                            <span>
                                                <strong>Thời lượng:</strong> {meeting.InterviewRound.duration} phút
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {meeting.notes && (
                                    <div className="meeting-notes">
                                        <strong>Ghi chú:</strong> {meeting.notes}
                                    </div>
                                )}
                            </div>
                            <div className="meeting-actions">
                                {(meeting.status === 'pending' || meeting.status === 'running') && (
                                    <button 
                                        className="btn-join"
                                        onClick={() => handleJoinMeeting(meeting.roomName)}
                                    >
                                        <i className="fas fa-video"></i>
                                        Tham gia Meeting
                                    </button>
                                )}
                                {meeting.status === 'pending' && (
                                    <button 
                                        className="btn-cancel"
                                        onClick={() => handleCancelMeeting(meeting.id)}
                                    >
                                        <i className="fas fa-times"></i>
                                        Hủy Meeting
                                    </button>
                                )}
                                {meeting.status === 'done' && (
                                    <>
                                        {meeting.score !== null && meeting.score !== undefined ? (
                                            <div className="meeting-evaluated">
                                                <div className="evaluation-info">
                                                    <i className="fas fa-star"></i>
                                                    <span>Điểm: {meeting.score}/100</span>
                                                </div>
                                                <button 
                                                    className="btn-view-evaluation"
                                                    onClick={() => {
                                                        setSelectedMeetingForEvaluation(meeting);
                                                        setShowEvaluationModal(true);
                                                    }}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                    Xem đánh giá
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                className="btn-evaluate"
                                                onClick={() => {
                                                    setSelectedMeetingForEvaluation(meeting);
                                                    setShowEvaluationModal(true);
                                                }}
                                            >
                                                <i className="fas fa-star"></i>
                                                Đánh giá
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Meeting Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Tạo Meeting Mới</h2>
                            <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>
                                    Đơn ứng tuyển <span className="required">*</span>
                                </label>
                                <select
                                    value={formData.jobApplicationId}
                                    onChange={(e) => handleJobApplicationChange(e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn đơn ứng tuyển --</option>
                                    {jobApplications.map(app => (
                                        <option key={app.id} value={app.id}>
                                            {app.JobPosting?.Tieude} - {app.Record?.User?.Hoten}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.jobApplicationId && (
                                <div className="form-group">
                                    <label>
                                        Vòng phỏng vấn <span className="required">*</span>
                                    </label>
                                    <select
                                        value={formData.interviewRoundId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, interviewRoundId: e.target.value }))}
                                        required
                                    >
                                        <option value="">-- Chọn vòng phỏng vấn --</option>
                                        {interviewRounds.map(round => (
                                            <option key={round.id} value={round.id}>
                                                Vòng {round.roundNumber}: {round.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    Thời gian phỏng vấn <span className="required">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Ghi chú</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows="3"
                                    placeholder="Ghi chú thêm về buổi phỏng vấn..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check"></i> Tạo Meeting
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Meeting Evaluation Modal */}
            {showEvaluationModal && selectedMeetingForEvaluation && (
                <MeetingEvaluationModal
                    meeting={selectedMeetingForEvaluation}
                    isOpen={showEvaluationModal}
                    onClose={() => {
                        setShowEvaluationModal(false);
                        setSelectedMeetingForEvaluation(null);
                    }}
                    onSuccess={() => {
                        fetchMeetings();
                    }}
                />
            )}
        </div>
    );
};

export default MeetingManagement;

