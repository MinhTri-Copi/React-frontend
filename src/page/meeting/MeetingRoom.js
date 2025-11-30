import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMeetingById } from '../../service.js/meetingService';
import './MeetingRoom.scss';

const MeetingRoom = () => {
    const { roomName } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showGuide, setShowGuide] = useState(true);
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);
    
    const isHR = user?.roleId === 2;

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchMeeting(parsedUser.id, parsedUser.roleId === 2 ? 'hr' : 'candidate');
        } else {
            toast.error('Vui lòng đăng nhập để tham gia phỏng vấn!');
            navigate('/login');
        }
    }, [roomName]);

    const fetchMeeting = async (userId, role) => {
        setIsLoading(true);
        try {
            // First, try to get meeting by roomName
            // We'll need to add an endpoint for this, or search by roomName
            // For now, we'll load Jitsi directly with roomName
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching meeting:', error);
            toast.error('Không thể tải thông tin meeting!');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Suppress console errors for Jitsi resource loading (404, ERR_FAILED)
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalLog = console.log;
        
        // Filter function for Jitsi-related errors
        const shouldIgnore = (msg) => {
            const errorMsg = msg.toLowerCase();
            return (
                errorMsg.includes('failed to load resource') ||
                errorMsg.includes('404') ||
                errorMsg.includes('err_failed') ||
                errorMsg.includes('net::err_') ||
                errorMsg.includes('the server responded with a status of 404') ||
                errorMsg.includes('worker has not been initialized') ||
                errorMsg.includes('face-landmarks')
            );
        };
        
        console.error = (...args) => {
            const errorMsg = args.join(' ');
            if (shouldIgnore(errorMsg)) {
                // Silently ignore - these are usually non-critical
                return;
            }
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            const warnMsg = args.join(' ');
            if (shouldIgnore(warnMsg)) {
                return;
            }
            originalWarn.apply(console, args);
        };
        
        // Also suppress some INFO logs from Jitsi
        console.log = (...args) => {
            const logMsg = args.join(' ');
            // Only suppress very verbose Jitsi logs
            if (
                logMsg.includes('Worker has not been initialized') ||
                logMsg.includes('face-landmarks')
            ) {
                return;
            }
            originalLog.apply(console, args);
        };
        
        // Global error handler for uncaught errors from iframe
        const handleError = (event) => {
            if (event.message && shouldIgnore(event.message)) {
                event.preventDefault();
                return false;
            }
        };
        
        const handleUnhandledRejection = (event) => {
            if (event.reason && shouldIgnore(event.reason.toString())) {
                event.preventDefault();
                return false;
            }
        };
        
        window.addEventListener('error', handleError, true);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
        // Check if returning from Jitsi login redirect
        const storedRoomName = sessionStorage.getItem('jitsi-room-name');
        if (storedRoomName && storedRoomName !== roomName) {
            // Clear old stored data
            sessionStorage.removeItem('jitsi-room-name');
            sessionStorage.removeItem('jitsi-return-url');
        }
        
        if (!isLoading && roomName && jitsiContainerRef.current) {
            // Small delay to ensure container is rendered
            const timer = setTimeout(() => {
                loadJitsi();
            }, 100);
            
            return () => {
                clearTimeout(timer);
                // Restore original console methods
                console.error = originalError;
                console.warn = originalWarn;
                console.log = originalLog;
                // Remove event listeners
                window.removeEventListener('error', handleError, true);
                window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            };
        }
        
        return () => {
            // Restore original console methods
            console.error = originalError;
            console.warn = originalWarn;
            console.log = originalLog;
            // Remove event listeners
            window.removeEventListener('error', handleError, true);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [isLoading, roomName, user]);

    // Handle window resize and visibility change (for login redirect)
    useEffect(() => {
        const handleResize = () => {
            if (jitsiContainerRef.current) {
                const iframe = jitsiContainerRef.current.querySelector('iframe');
                if (iframe) {
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                }
            }
        };

        // Reload Jitsi when page becomes visible again (after login redirect)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Check if iframe exists and is properly loaded
                if (jitsiContainerRef.current) {
                    const iframe = jitsiContainerRef.current.querySelector('iframe');
                    if (!iframe || iframe.clientHeight === 0) {
                        console.log('Reloading Jitsi after visibility change...');
                        loadJitsi();
                    }
                }
            }
        };

        // Handle focus for cases where visibility doesn't change
        const handleFocus = () => {
            if (jitsiContainerRef.current) {
                const iframe = jitsiContainerRef.current.querySelector('iframe');
                if (!iframe || iframe.clientHeight === 0) {
                    console.log('Reloading Jitsi after focus...');
                    setTimeout(() => loadJitsi(), 500);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [roomName, user]);

    // Cleanup Jitsi when component unmounts
    useEffect(() => {
        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
            }
        };
    }, []);

    const loadJitsi = () => {
        // Clear any existing iframe first
        if (jitsiContainerRef.current) {
            jitsiContainerRef.current.innerHTML = '';
        }
        
        // Dispose existing API if any
        if (apiRef.current) {
            try {
                apiRef.current.dispose();
            } catch (e) {
                console.log('Error disposing Jitsi:', e);
            }
            apiRef.current = null;
        }
        
        if (window.JitsiMeetExternalAPI) {
            const domain = 'meet.jit.si';
            
            const options = {
                roomName: roomName,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                configOverwrite: {
                    prejoinPageEnabled: false,
                    disableThirdPartyRequests: true
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    MOBILE_APP_PROMO: false,
                },
                userInfo: {
                    displayName: user?.Hoten || 'User',
                }
            };

            try {
                // Store roomName in sessionStorage for recovery after login redirect
                sessionStorage.setItem('jitsi-room-name', roomName);
                sessionStorage.setItem('jitsi-return-url', window.location.href);
                
                apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

                apiRef.current.addEventListeners({
                    readyToClose: () => {
                        console.log('Jitsi ready to close');
                        sessionStorage.removeItem('jitsi-room-name');
                        sessionStorage.removeItem('jitsi-return-url');
                        handleLeaveMeeting();
                    },
                    participantLeft: (participant) => {
                        console.log('Participant left:', participant);
                    },
                    participantJoined: (participant) => {
                        console.log('Participant joined:', participant);
                    },
                    videoConferenceJoined: (participant) => {
                        console.log('✅ Video conference joined:', participant);
                        if (isHR) {
                            console.log('✅ HR auto-joined as moderator');
                        }
                        // Clear stored data after successful join
                        sessionStorage.removeItem('jitsi-room-name');
                        sessionStorage.removeItem('jitsi-return-url');
                    },
                    videoConferenceLeft: () => {
                        console.log('Video conference left');
                        sessionStorage.removeItem('jitsi-room-name');
                        sessionStorage.removeItem('jitsi-return-url');
                        handleLeaveMeeting();
                    },
                    displayNameChange: (payload) => {
                        console.log('Display name changed:', payload);
                    },
                    // 🚀 Handle connection errors (especially lobby errors)
                    conferenceError: (error) => {
                        console.error('❌ Conference error:', error);
                        if (error === 'conference.connectionError.membersOnly' || error?.error === 'conference.connectionError.membersOnly') {
                            console.error('⚠️ Lobby is still enabled! Trying to force join...');
                            toast.warning('Đang thử kết nối lại...');
                            // Try to force join by reloading
                            setTimeout(() => {
                                if (apiRef.current) {
                                    loadJitsi();
                                }
                            }, 2000);
                        }
                    },
                    // Handle when API is ready
                    ready: () => {
                        console.log('✅ Jitsi API ready - Auto-joining room...');
                    },
                    // Ignore resource loading errors (404, ERR_FAILED)
                    error: (error) => {
                        // Ignore common Jitsi resource loading errors
                        if (error && (
                            error.toString().includes('404') ||
                            error.toString().includes('ERR_FAILED') ||
                            error.toString().includes('Failed to load resource')
                        )) {
                            // Silently ignore - these are usually non-critical resources
                            return;
                        }
                        console.error('Jitsi error:', error);
                    },
                    // Ignore resource loading errors (404, ERR_FAILED)
                    error: (error) => {
                        // Ignore common Jitsi resource loading errors
                        if (error && (
                            error.toString().includes('404') ||
                            error.toString().includes('ERR_FAILED') ||
                            error.toString().includes('Failed to load resource')
                        )) {
                            // Silently ignore - these are usually non-critical resources
                            return;
                        }
                        console.error('Jitsi error:', error);
                    }
                });
            } catch (error) {
                console.error('Error loading Jitsi:', error);
                toast.error('Không thể tải phòng phỏng vấn!');
            }
        } else {
            // Load Jitsi script if not loaded
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.onload = () => {
                loadJitsi();
            };
            script.onerror = () => {
                toast.error('Không thể tải Jitsi Meet!');
            };
            document.body.appendChild(script);
        }
    };

    const handleLeaveMeeting = () => {
        if (apiRef.current) {
            apiRef.current.dispose();
        }
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="meeting-room-loading">
                <div className="loading-container">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải phòng phỏng vấn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="meeting-room-page">
            <div className="meeting-header">
                <div className="meeting-info">
                    <h2>Phòng phỏng vấn: {roomName}</h2>
                    {meeting && (
                        <p>
                            {meeting.InterviewRound && `Vòng ${meeting.InterviewRound.roundNumber}: ${meeting.InterviewRound.title}`}
                            {meeting.JobApplication?.JobPosting && ` - ${meeting.JobApplication.JobPosting.Tieude}`}
                        </p>
                    )}
                </div>
                <div className="header-actions">
                    <span className={`role-badge ${isHR ? 'hr' : 'candidate'}`}>
                        <i className={`fas ${isHR ? 'fa-user-tie' : 'fa-user'}`}></i>
                        {isHR ? 'HR' : 'Ứng viên'}
                    </span>
                    <button className="btn-reload" onClick={() => loadJitsi()} title="Tải lại phòng họp">
                        <i className="fas fa-sync-alt"></i>
                        Tải lại
                    </button>
                    <button className="btn-leave" onClick={handleLeaveMeeting}>
                        <i className="fas fa-times"></i>
                        Rời phòng
                    </button>
                </div>
            </div>
            
            {showGuide && (
                <div className="meeting-guide">
                    <div className="guide-content">
                        <button className="btn-close-guide" onClick={() => setShowGuide(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                        {isHR ? (
                            <>
                                <h3><i className="fas fa-info-circle"></i> Hướng dẫn cho HR</h3>
                                <ul>
                                    <li><strong>Bước 1:</strong> Bạn sẽ tự động vào phòng họp (không cần login)</li>
                                    <li><strong>Bước 2:</strong> Bạn sẽ tự động trở thành <span className="highlight">moderator</span> vì là người đầu tiên vào phòng</li>
                                    <li><strong>Bước 3:</strong> Sau khi vào phòng thành công, hãy đợi ứng viên tham gia</li>
                                </ul>
                                <p className="note">✅ <strong>Lưu ý:</strong> Bạn phải vào phòng trước khi gửi link cho ứng viên. Ứng viên sẽ join trực tiếp mà không cần đợi!</p>
                            </>
                        ) : (
                            <>
                                <h3><i className="fas fa-info-circle"></i> Hướng dẫn cho Ứng viên</h3>
                                <ul>
                                    <li>Bạn sẽ tự động vào phòng họp (không cần login)</li>
                                    <li>Cho phép trình duyệt truy cập micro và camera khi được yêu cầu</li>
                                    <li>HR đã vào phòng trước, bạn có thể tham gia ngay</li>
                                </ul>
                                <p className="note">✅ Bạn sẽ join trực tiếp vào phòng họp mà không cần đợi!</p>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <div className="jitsi-container" ref={jitsiContainerRef}></div>
        </div>
    );
};

export default MeetingRoom;

