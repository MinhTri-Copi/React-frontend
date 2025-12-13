import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { 
    getMeetingsForHr, 
    createMeeting, 
    updateMeetingStatus,
    cancelMeeting,
    getCandidatesByJobPosting,
    getLatestMeetingByJobPosting
} from '../../service.js/meetingService';
import { getActiveJobPostings } from '../../service.js/hrService';
import { getInterviewRounds } from '../../service.js/interviewRoundService';
import MeetingEvaluationModal from './MeetingEvaluationModal';
import './MeetingManagement.scss';

const MeetingManagement = ({ userId }) => {
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        jobPostingId: '',
        interviewRoundId: '',
        jobApplicationId: '',
        candidateUserId: '',
        scheduledAt: '',
        notes: ''
    });
    const [jobPostings, setJobPostings] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [interviewRounds, setInterviewRounds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMeetingForEvaluation, setSelectedMeetingForEvaluation] = useState(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);

    // Generate binary code strings (stable across renders)
    const generateBinaryCode = (length) => {
        return Array.from({ length }, () => (Math.random() > 0.5 ? '1' : '0'));
    };

    const [binaryColumns] = useState([
        generateBinaryCode(20),
        generateBinaryCode(20),
        generateBinaryCode(20)
    ]);

    useEffect(() => {
        if (userId) {
            fetchMeetings();
            fetchJobPostings();
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

    const fetchJobPostings = async () => {
        try {
            const res = await getActiveJobPostings(userId);
            if (res && res.EC === 0) {
                setJobPostings(res.DT || []);
            }
        } catch (error) {
            console.error('Error fetching job postings:', error);
        }
    };

    const handleCreateMeeting = () => {
        setFormData({
            jobPostingId: '',
            interviewRoundId: '',
            jobApplicationId: '',
            candidateUserId: '',
            scheduledAt: '',
            notes: ''
        });
        setCandidates([]);
        setInterviewRounds([]);
        setShowCreateModal(true);
    };

    const handleJobPostingChange = async (jobPostingId) => {
        if (!jobPostingId) {
            setFormData(prev => ({
                ...prev,
                jobPostingId: '',
                interviewRoundId: '',
                jobApplicationId: '',
                candidateUserId: '',
                scheduledAt: ''
            }));
            setCandidates([]);
            setInterviewRounds([]);
            return;
        }

        setFormData(prev => ({
            ...prev,
            jobPostingId,
            interviewRoundId: '',
            jobApplicationId: '',
            candidateUserId: '',
            scheduledAt: ''
        }));

        // Reset candidates - will be loaded when interview round is selected
        setCandidates([]);

        // Fetch interview rounds for this job posting
        try {
            const roundsRes = await getInterviewRounds(userId, { 
                jobPostingId: parseInt(jobPostingId)
            });
            if (roundsRes && roundsRes.EC === 0) {
                setInterviewRounds(roundsRes.DT?.rounds || []);
            }
        } catch (error) {
            console.error('Error fetching interview rounds:', error);
        }
    };

    const handleCandidateChange = (candidateId) => {
        if (!candidateId) {
            setFormData(prev => ({
                ...prev,
                jobApplicationId: '',
                candidateUserId: ''
            }));
            return;
        }

        const candidate = candidates.find(c => c.candidateId === parseInt(candidateId));
        if (candidate) {
            setFormData(prev => ({
                ...prev,
                jobApplicationId: candidate.applicationId,
                candidateUserId: candidate.candidateId
            }));
        }
    };

    const handleInterviewRoundChange = async (roundId) => {
        setFormData(prev => ({
            ...prev,
            interviewRoundId: roundId,
            candidateUserId: '', // Reset candidate selection when round changes
            jobApplicationId: ''
        }));

        // Filter candidates: exclude those who already have meeting for this round
        if (roundId && formData.jobPostingId) {
            try {
                // Fetch candidates again with interviewRoundId to filter out those who already have meeting
                const candidatesRes = await getCandidatesByJobPosting(userId, formData.jobPostingId, roundId);
                if (candidatesRes && candidatesRes.EC === 0) {
                    setCandidates(candidatesRes.DT || []);
                }
            } catch (error) {
                console.error('Error fetching filtered candidates:', error);
            }

            // Gợi ý thời gian dựa trên meeting gần nhất + duration của round đó + duration của round hiện tại
            try {
                const latestMeetingRes = await getLatestMeetingByJobPosting(userId, formData.jobPostingId);
                if (latestMeetingRes && latestMeetingRes.EC === 0 && latestMeetingRes.DT) {
                    const latestMeeting = latestMeetingRes.DT;
                    const selectedRound = interviewRounds.find(r => r.id === parseInt(roundId));
                    const currentRoundDuration = selectedRound?.duration || 0;

                    if (latestMeeting.scheduledAt) {
                        // Tính thời gian gợi ý = scheduledAt của meeting gần nhất + duration của round đó + duration của round hiện tại
                        const latestDate = new Date(latestMeeting.scheduledAt);
                        const previousRoundDuration = latestMeeting.duration || 0;
                        const suggestedDate = new Date(
                            latestDate.getTime() + 
                            previousRoundDuration * 60000 + // Duration của round trước đó
                            currentRoundDuration * 60000     // Duration của round hiện tại
                        );
                        
                        // Format thành datetime-local
                        const year = suggestedDate.getFullYear();
                        const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
                        const day = String(suggestedDate.getDate()).padStart(2, '0');
                        const hours = String(suggestedDate.getHours()).padStart(2, '0');
                        const minutes = String(suggestedDate.getMinutes()).padStart(2, '0');
                        const suggestedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

                        setFormData(prev => ({
                            ...prev,
                            scheduledAt: suggestedDateTime
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching latest meeting:', error);
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
            <div className="page-header cp-header">
                {/* Animated Background Effects */}
                <div className="header-bg-effects">
                    <div className="animated-gradient"></div>
                    <div className="tech-grid"></div>
                    <svg className="circuit-lines" viewBox="0 0 1000 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                                <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                            </linearGradient>
                        </defs>
                        <line x1="0" y1="50" x2="200" y2="50" stroke="url(#circuitGradient)" strokeWidth="2" className="circuit-line" />
                        <line x1="300" y1="100" x2="500" y2="100" stroke="url(#circuitGradient)" strokeWidth="2" className="circuit-line" />
                        <line x1="600" y1="150" x2="800" y2="150" stroke="url(#circuitGradient)" strokeWidth="2" className="circuit-line" />
                        <line x1="200" y1="50" x2="200" y2="100" stroke="url(#circuitGradient)" strokeWidth="2" className="circuit-line" />
                        <line x1="500" y1="100" x2="500" y2="150" stroke="url(#circuitGradient)" strokeWidth="2" className="circuit-line" />
                        <circle cx="200" cy="50" r="4" fill="rgba(255,255,255,0.6)" className="circuit-dot" />
                        <circle cx="500" cy="100" r="4" fill="rgba(255,255,255,0.6)" className="circuit-dot" />
                        <circle cx="800" cy="150" r="4" fill="rgba(255,255,255,0.6)" className="circuit-dot" />
                    </svg>
                    <div className="binary-code">
                        {binaryColumns.map((column, colIndex) => (
                            <div key={colIndex} className="binary-column">
                                {column.map((digit, i) => (
                                    <span key={i} className="binary-digit">{digit}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="floating-tech-icons">
                        <div className="tech-icon" style={{ '--delay': '0s', '--duration': '15s', '--x': '10%', '--y': '20%' }}>
                            <i className="fab fa-react"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '2s', '--duration': '18s', '--x': '80%', '--y': '30%' }}>
                            <i className="fab fa-node-js"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '4s', '--duration': '20s', '--x': '20%', '--y': '70%' }}>
                            <i className="fab fa-python"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '1s', '--duration': '16s', '--x': '70%', '--y': '60%' }}>
                            <i className="fab fa-js"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '3s', '--duration': '17s', '--x': '50%', '--y': '15%' }}>
                            <i className="fab fa-java"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '5s', '--duration': '19s', '--x': '90%', '--y': '80%' }}>
                            <i className="fas fa-database"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '2.5s', '--duration': '21s', '--x': '15%', '--y': '50%' }}>
                            <i className="fab fa-aws"></i>
                        </div>
                        <div className="tech-icon" style={{ '--delay': '4.5s', '--duration': '14s', '--x': '85%', '--y': '10%' }}>
                            <i className="fab fa-docker"></i>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="cp-header-content">
                    <div className="header-left cp-header-left">
                        <h1>
                            <i className="fas fa-video"></i>
                            Quản lý Meeting
                        </h1>
                        <p>Quản lý các cuộc phỏng vấn trực tuyến</p>
                    </div>
                    <div className="header-right cp-header-right">
                        <button className="btn-create-meeting" onClick={handleCreateMeeting}>
                            <i className="fas fa-plus"></i>
                            Tạo Meeting
                        </button>
                    </div>
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
                                    Tin tuyển dụng <span className="required">*</span>
                                </label>
                                <select
                                    value={formData.jobPostingId}
                                    onChange={(e) => handleJobPostingChange(e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn tin tuyển dụng --</option>
                                    {jobPostings.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.Tieude} - {job.Company?.Tencongty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.jobPostingId && (
                                <div className="form-group">
                                    <label>
                                        Vòng phỏng vấn <span className="required">*</span>
                                    </label>
                                    <select
                                        value={formData.interviewRoundId}
                                        onChange={(e) => handleInterviewRoundChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn vòng phỏng vấn --</option>
                                        {interviewRounds.map(round => (
                                            <option key={round.id} value={round.id}>
                                                Vòng {round.roundNumber}: {round.title} {round.duration ? `(${round.duration} phút)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.jobPostingId && formData.interviewRoundId && (
                                <div className="form-group">
                                    <label>
                                        Ứng viên <span className="required">*</span>
                                    </label>
                                    <select
                                        value={formData.candidateUserId}
                                        onChange={(e) => handleCandidateChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn ứng viên --</option>
                                        {candidates.map(candidate => (
                                            <option key={candidate.candidateId} value={candidate.candidateId}>
                                                {candidate.candidateName} ({candidate.candidateEmail})
                                            </option>
                                        ))}
                                    </select>
                                    {candidates.length === 0 && (
                                        <small className="form-hint">
                                            Không có ứng viên nào ở trạng thái "Chuẩn bị phỏng vấn" hoặc tất cả ứng viên đã tham gia vòng phỏng vấn này.
                                        </small>
                                    )}
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

