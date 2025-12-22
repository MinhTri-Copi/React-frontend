import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { toast } from 'react-toastify';
import { getMeetingByRoomName, updateMeetingStatus } from '../service.js/meetingService';
import './JitsiRoom.scss';

const JitsiRoom = () => {
    const { roomName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isHR, setIsHR] = useState(false);
    const [meetingConfig, setMeetingConfig] = useState(null);
    
    // Recording refs
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);

    useEffect(() => {
        // Get user from storage
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('JitsiRoom - Parsed user:', parsedUser);
                
                if (!parsedUser || !parsedUser.id) {
                    console.error('User data invalid:', parsedUser);
                    toast.error('Thông tin người dùng không hợp lệ!');
                    navigate('/login');
                    return;
                }
                
                setUser(parsedUser);
                setIsHR(parsedUser.roleId === 2);
                
                // Fetch meeting data to verify access
                if (roomName) {
                    fetchMeeting(parsedUser.id, parsedUser);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                toast.error('Lỗi đọc thông tin người dùng!');
                navigate('/login');
            }
        } else {
            toast.error('Vui lòng đăng nhập để tham gia phỏng vấn!');
            navigate('/login');
        }
    }, [roomName, navigate]);

    const fetchMeeting = async (userId, userData) => {
        try {
            setLoading(true);
            console.log('Fetching meeting - roomName:', roomName, 'userId:', userId);
            
            const res = await getMeetingByRoomName(roomName, userId);
            console.log('Meeting response:', res);
            
            if (res && res.EC === 0) {
                // Meeting found and user has access
                console.log('✅ Meeting access granted');
                setMeetingConfig({
                    roomName: roomName,
                    domain: 'meet.jit.si',
                    configOverwrite: {
                        // ===== DISABLE PREJOIN & LOBBY COMPLETELY =====
                        prejoinPageEnabled: false,
                        enablePrejoinPage: false,
                        skipPrejoin: true,
                        enableLobby: false,
                        lobbyEnabled: false,
                        enableKnockingLobby: false,
                        enableLobbyChat: false,
                        enableWelcomePage: false,
                        enableClosePage: false,
                        disableDeepLinking: true,
                        
                        // ===== DISABLE AUTHENTICATION =====
                        enableOAuth: false,
                        enableGoogleOAuth: false,
                        enableGithubOAuth: false,
                        enableJwtAuthentication: false,
                        enableAuthentication: false,
                        
                        // ===== AUTO-JOIN IMMEDIATELY =====
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        
                        // ===== DISABLE MODERATOR REQUIREMENT =====
                        requireDisplayName: false,
                        disableModeratorIndicator: true,
                        enableUserRolesBasedOnToken: false,
                        
                        // ===== DISABLE UNNECESSARY FEATURES =====
                        enableInsecureRoomNameWarning: false,
                        enableDisplayNameInStats: false,
                        
                        // ===== FORCE DIRECT JOIN =====
                        enableLayerSuspension: false,
                        enableNoAudioDetection: false,
                        enableNoisyMicDetection: false,
                        
                        // ===== PREVENT TIMEOUT/AUTHENTICATION ERRORS =====
                        enableRemb: true,
                        enableTcc: true,
                        
                        // ===== ALLOW ANYONE TO JOIN =====
                        enableRemoteVideoMenu: true
                    },
                    interfaceConfigOverwrite: {
                        MOBILE_APP_PROMO: false,
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_BRAND_WATERMARK: false,
                        HIDE_INVITE_MORE_HEADER: true
                    },
                    userInfo: {
                        displayName: userData?.Hoten || 'User'
                    }
                });
                setLoading(false);
            } else {
                console.error('❌ Meeting access denied:', res);
                toast.error(res?.EM || 'Không tìm thấy phòng phỏng vấn!');
                // Navigate back based on role
                if (isHR) {
                    navigate('/hr/meetings');
                } else {
                    navigate('/candidate');
                }
            }
        } catch (error) {
            console.error('Error fetching meeting:', error);
            console.error('Error details:', error.response?.data || error.message);
            toast.error('Không thể tải thông tin meeting!');
            // Navigate back based on role
            if (isHR) {
                navigate('/hr/meetings');
            } else {
                navigate('/candidate');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Start recording screen + audio (chỉ cho HR)
     */
    const startRecording = async () => {
        try {
            console.log('🎥 Bắt đầu recording...');
            
            // Request screen + audio permission
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser', // Record browser tab/window
                    cursor: 'always'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            recordingStreamRef.current = stream;
            
            // Create MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };
            
            // Fallback to webm if vp9 not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
            }
            
            // Final fallback
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }
            
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            
            // Handle data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    console.log('📹 Chunk recorded:', event.data.size, 'bytes');
                }
            };
            
            // Handle stop
            mediaRecorder.onstop = () => {
                console.log('🛑 Recording stopped, preparing download...');
                
                // Create blob from chunks
                const blob = new Blob(recordedChunksRef.current, {
                    type: 'video/webm'
                });
                
                // Generate filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `meeting-${roomName}-${timestamp}.webm`;
                
                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Cleanup
                URL.revokeObjectURL(url);
                recordedChunksRef.current = [];
                
                toast.success('✅ Đã tải video recording xuống!');
                console.log('✅ Video downloaded:', filename);
            };
            
            // Handle errors
            mediaRecorder.onerror = (event) => {
                console.error('❌ Recording error:', event.error);
                toast.error('Lỗi khi recording: ' + event.error.message);
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every 1 second
            console.log('✅ Recording started');
            toast.info('🎥 Đang ghi lại cuộc họp...');
            
            // Handle stream end (user stops sharing)
            stream.getVideoTracks()[0].onended = () => {
                console.log('⚠️ User stopped sharing screen');
                stopRecording();
            };
            
        } catch (error) {
            console.error('❌ Error starting recording:', error);
            if (error.name === 'NotAllowedError') {
                toast.error('Bạn cần cho phép chia sẻ màn hình để recording!');
            } else if (error.name === 'NotFoundError') {
                toast.error('Không tìm thấy thiết bị để recording!');
            } else {
                toast.error('Không thể bắt đầu recording: ' + error.message);
            }
        }
    };
    
    /**
     * Stop recording and download video
     */
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            console.log('🛑 Stopping recording...');
            mediaRecorderRef.current.stop();
            
            // Stop all tracks
            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach(track => track.stop());
                recordingStreamRef.current = null;
            }
            
            mediaRecorderRef.current = null;
        }
    };

    const handleLeaveMeeting = async () => {
        console.log('handleLeaveMeeting called - isHR:', isHR);
        
        // Stop recording if HR is leaving
        if (isHR) {
            stopRecording();
        }
        
        // Update meeting status to "done" if HR leaves
        if (isHR && user && roomName) {
            try {
                // Get meeting info to update status
                const meetingRes = await getMeetingByRoomName(roomName, user.id);
                if (meetingRes && meetingRes.EC === 0 && meetingRes.DT) {
                    const meeting = meetingRes.DT;
                    // Only update if meeting is still running
                    if (meeting.status === 'running' || meeting.status === 'pending') {
                        await updateMeetingStatus(meeting.id, user.id, 'done', 'hr');
                        console.log('✅ Meeting status updated to done');
                    }
                }
            } catch (error) {
                console.error('Error updating meeting status:', error);
                // Don't block navigation if update fails
            }
        }
        
        // Navigate back based on role
        if (isHR) {
            navigate('/hr/meetings');
        } else {
            navigate('/candidate');
        }
    };

    const handleApiReady = (api) => {
        console.log('✅ Jitsi API ready');
        
        // Update meeting status to "running" when meeting starts
        const updateStatusToRunning = async () => {
            if (isHR && user && roomName) {
                try {
                    const meetingRes = await getMeetingByRoomName(roomName, user.id);
                    if (meetingRes && meetingRes.EC === 0 && meetingRes.DT) {
                        const meeting = meetingRes.DT;
                        // Only update if meeting is still pending
                        if (meeting.status === 'pending') {
                            await updateMeetingStatus(meeting.id, user.id, 'running', 'hr');
                            console.log('✅ Meeting status updated to running');
                        }
                    }
                } catch (error) {
                    console.error('Error updating meeting status to running:', error);
                }
            }
        };
        
        // If HR, grant moderator status, update status, and start recording
        if (isHR) {
            api.addEventListener('videoConferenceJoined', () => {
                console.log('✅ HR joined - Setting as moderator');
                // Update status to running
                updateStatusToRunning();
                
                // Start recording automatically for HR
                setTimeout(() => {
                    startRecording();
                }, 1000); // Delay 1s to ensure meeting is fully loaded
                
                setTimeout(() => {
                    try {
                        const myUserID = api._myUserID || api.getMyUserId();
                        if (myUserID) {
                            console.log('Granting moderator to user:', myUserID);
                            api.executeCommand('grantModerator', myUserID);
                        } else {
                            console.log('Trying alternative method to grant moderator');
                            api.executeCommand('grantModerator');
                        }
                    } catch (error) {
                        console.error('Error granting moderator:', error);
                    }
                }, 500);
            });
        }
    };
    
    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    if (loading || !meetingConfig) {
        return (
            <div className="jitsi-room-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải phòng phỏng vấn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="jitsi-room-page">
            <div className="meeting-header">
                <div className="meeting-info">
                    <h3>Phòng phỏng vấn: {roomName}</h3>
                    <span className="role-badge">{isHR ? 'HR' : 'Ứng viên'}</span>
                </div>
                <button className="btn-leave" onClick={handleLeaveMeeting}>
                    <i className="fas fa-times"></i> Rời phòng
                </button>
            </div>
            <div className="jitsi-container">
                <JitsiMeeting
                    roomName={meetingConfig.roomName}
                    domain={meetingConfig.domain}
                    configOverwrite={meetingConfig.configOverwrite}
                    interfaceConfigOverwrite={meetingConfig.interfaceConfigOverwrite}
                    userInfo={meetingConfig.userInfo}
                    getIFrameRef={(iframe) => {
                        if (iframe) {
                            iframe.style.height = 'calc(100vh - 60px)';
                            iframe.style.width = '100%';
                        }
                    }}
                    onApiReady={handleApiReady}
                    onReadyToClose={handleLeaveMeeting}
                    onVideoConferenceLeft={handleLeaveMeeting}
                />
            </div>
        </div>
    );
};

export default JitsiRoom;

