import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import { getMyApplications, startTest } from '../../service.js/jobApplicationService';
import { toast } from 'react-toastify';
import './MyApplications.scss';

const MyApplications = () => {
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [startingTestId, setStartingTestId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchApplications(parsedUser.id);
        }
    }, []);

    const fetchApplications = async (userId) => {
        setIsLoading(true);
        try {
            let res = await getMyApplications(userId);
            if (res && res.data && res.data.EC === 0) {
                setApplications(res.data.DT);
            } else {
                toast.error(res.data.EM);
            }
        } catch (error) {
            console.log(error);
            toast.error('Có lỗi khi tải danh sách ứng tuyển!');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const canStartTest = (app) => {
        const statusId = app.applicationStatusId || app.ApplicationStatus?.id;
        const hasTest = app.JobPosting?.Test;
        if (statusId !== 4 || !hasTest) return { show: false };

        const submission = app.TestSubmissions && app.TestSubmissions.length > 0 ? app.TestSubmissions[0] : null;

        if (submission && submission.Trangthai === 'dacham') {
            return { show: true, disabled: true, label: 'Đã hoàn thành', variant: 'completed' };
        }

        if (submission && submission.Trangthai === 'danglam') {
            return { show: true, disabled: false, label: 'Tiếp tục làm bài', variant: 'resume', submissionId: submission.id };
        }

        if (submission && submission.Trangthai === 'danop') {
            return { show: true, disabled: true, label: 'Đang chấm điểm', variant: 'pending' };
        }

        return { show: true, disabled: false, label: 'Làm bài test', variant: 'start', submissionId: submission?.id };
    };

    const handleStartTest = async (application) => {
        if (!user) return;
        const status = canStartTest(application);
        if (status.disabled && !status.submissionId) return;
        setStartingTestId(application.id);
        try {
            let response;
            if (status.submissionId && status.variant === 'resume') {
                navigate(`/candidate/tests/${status.submissionId}?userId=${user.id}`);
                return;
            }
            response = await startTest(user.id, application.id);
            if (response.data && response.data.EC === 0) {
                const submission = response.data.DT;
                toast.success('Bắt đầu bài test thành công!');
                navigate(`/candidate/tests/${submission.id}?userId=${user.id}`);
            } else {
                toast.error(response.data?.EM || 'Không thể bắt đầu bài test!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi bắt đầu bài test!');
        } finally {
            setStartingTestId(null);
            fetchApplications(user.id);
        }
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!max) return `Từ ${min.toLocaleString('vi-VN')} VNĐ`;
        if (!min) return `Lên đến ${max.toLocaleString('vi-VN')} VNĐ`;
        return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')} VNĐ`;
    };

    return (
        <div className="my-applications-page">
            <CandidateNav />
            <div className="applications-container">
                <div className="container">
                    <div className="page-header">
                        <div>
                            <h1>Đơn ứng tuyển của tôi</h1>
                            <p>Theo dõi những công việc bạn đã nộp hồ sơ</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : applications.length > 0 ? (
                        <div className="applications-list">
                            {applications.map((app) => (
                                <div className="application-card" key={app.id}>
                                    <div className="job-info">
                                        <div className="job-title-row">
                                            <h3>{app.JobPosting?.Tieude}</h3>
                                            <span className={`status-badge status-${app.ApplicationStatus?.id || 0}`}>
                                                {app.ApplicationStatus?.TenTrangThai || 'Chưa xác định'}
                                            </span>
                                        </div>
                                        <p className="company-name">{app.JobPosting?.Company?.Tencongty}</p>
                                        <div className="job-meta">
                                            <span>
                                                <i className="fas fa-map-marker-alt"></i>
                                                {app.JobPosting?.Diadiem}
                                            </span>
                                            <span>
                                                <i className="fas fa-dollar-sign"></i>
                                                {formatSalary(app.JobPosting?.Luongtoithieu, app.JobPosting?.Luongtoida)}
                                            </span>
                                            {app.JobPosting?.Format && (
                                                <span>
                                                    <i className="fas fa-clock"></i>
                                                    {app.JobPosting?.Format?.TenHinhThuc}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="application-meta">
                                        <p>
                                            <span>Ngày nộp:</span>
                                            {formatDate(app.Ngaynop)}
                                        </p>
                                        <p>
                                            <span>CV đã dùng:</span>
                                            {app.Record?.Tieude}
                                        </p>
                                        <div className="actions">
                                            <a href={app.Record?.File_url} target="_blank" rel="noopener noreferrer">
                                                Xem CV
                                            </a>
                                            <a href={`/candidate/jobs/${app.JobPosting?.id}`}>
                                                Xem chi tiết job
                                            </a>
                                            {(() => {
                                                const testState = canStartTest(app);
                                                if (!testState.show) return null;
                                                const isLoadingBtn = startingTestId === app.id;
                                                const btnLabel = isLoadingBtn ? 'Đang mở bài test...' : testState.label;
                                                const isDisabled = testState.disabled || isLoadingBtn;
                                                return (
                                                    <button
                                                        className={`btn-test btn-${testState.variant || 'start'}`}
                                                        disabled={isDisabled}
                                                        onClick={() => handleStartTest(app)}
                                                    >
                                                        <i className="fas fa-pencil-alt"></i>
                                                        {btnLabel}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="empty" />
                            <h3>Bạn chưa ứng tuyển công việc nào</h3>
                            <p>Hãy khám phá các cơ hội việc làm phù hợp và nộp hồ sơ ngay hôm nay!</p>
                            <a className="btn-explore" href="/candidate/jobs">
                                Khám phá việc làm
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;


