import React, { useState, useEffect } from 'react';
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

    const handleLeaveMeeting = async () => {
        console.log('handleLeaveMeeting called - isHR:', isHR);
        
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
        
        // If HR, grant moderator status and update status
        if (isHR) {
            api.addEventListener('videoConferenceJoined', () => {
                console.log('✅ HR joined - Setting as moderator');
                // Update status to running
                updateStatusToRunning();
                
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

