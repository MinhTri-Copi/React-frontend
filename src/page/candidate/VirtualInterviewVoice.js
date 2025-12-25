import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { 
    startVoiceConversation, 
    processVoiceResponse, 
    getConversationHistory 
} from '../../service.js/virtualInterviewVoiceService';
import { getInterview, completeInterview } from '../../service.js/virtualInterviewService';
import { toast } from 'react-toastify';
import './VirtualInterviewVoice.scss';

const VirtualInterviewVoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [interview, setInterview] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recognitionRef = useRef(null);
    const audioPlayerRef = useRef(null);

    useEffect(() => {
        loadInterview();
        return () => {
            // Cleanup
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [id]);

    const loadInterview = async () => {
        setIsLoading(true);
        try {
            const result = await getInterview(id);
            if (result && result.EC === 0) {
                setInterview(result.DT);
                await startConversation();
            } else {
                toast.error(result?.EM || 'Cannot load interview');
                navigate('/candidate/virtual-interview');
            }
        } catch (error) {
            console.error('Error loading interview:', error);
            toast.error('Error loading interview');
            navigate('/candidate/virtual-interview');
        } finally {
            setIsLoading(false);
        }
    };

    const startConversation = async () => {
        try {
            const result = await startVoiceConversation(id);
            if (result && result.EC === 0) {
                const firstQuestion = result.DT.firstQuestion;
                setCurrentQuestion(firstQuestion);
                setConversation([{
                    role: 'assistant',
                    content: firstQuestion,
                    timestamp: new Date()
                }]);
                
                // Play first question
                await playAudio(firstQuestion, interview?.language || 'vi');
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            toast.error('Error starting conversation');
        }
    };

    const initializeSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Speech recognition not supported in this browser');
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = interview?.language === 'vi' ? 'vi-VN' : 'en-US';

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            await handleVoiceInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            toast.error(`Speech recognition error: ${event.error}`);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        return recognition;
    };

    const startRecording = async () => {
        try {
            // Try Web Speech API first (faster, browser-native)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                recognitionRef.current = initializeSpeechRecognition();
                if (recognitionRef.current) {
                    recognitionRef.current.start();
                    setIsRecording(true);
                    return;
                }
            }

            // Fallback to MediaRecorder + OpenAI Whisper
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await handleAudioInput(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('Error accessing microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleVoiceInput = async (transcript) => {
        setIsProcessing(true);
        try {
            // Add user message to conversation
            const userMessage = {
                role: 'user',
                content: transcript,
                timestamp: new Date()
            };
            setConversation(prev => [...prev, userMessage]);

            // Get conversation history for context
            const history = conversation.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Process response
            const result = await processVoiceResponse(id, transcript, history);
            
            if (result && result.EC === 0) {
                const aiResponse = result.DT.aiResponse;
                const assistantMessage = {
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date()
                };
                setConversation(prev => [...prev, assistantMessage]);
                setCurrentQuestion(aiResponse);

                // Play AI response
                await playAudio(aiResponse, interview?.language || 'vi');
            } else {
                toast.error(result?.EM || 'Error processing response');
            }
        } catch (error) {
            console.error('Error handling voice input:', error);
            toast.error('Error processing your response');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAudioInput = async (audioBlob) => {
        // For free tier, we should use Web Speech API instead
        // This function is fallback only if Web Speech API fails
        setIsProcessing(true);
        try {
            // Try to use Web Speech API first (free)
            if (recognitionRef.current) {
                // Web Speech API should have already handled it
                return;
            }
            
            // Fallback: Show message to use Web Speech API
            toast.error('Please use Web Speech API for speech recognition (free). Your browser may not support it.');
        } catch (error) {
            console.error('Error handling audio input:', error);
            toast.error('Error processing audio. Please use Web Speech API.');
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudio = async (text, language) => {
        try {
            setIsPlaying(true);
            
            // Use browser SpeechSynthesis API (FREE - no API cost)
            if ('speechSynthesis' in window) {
                // Stop any ongoing speech
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                // Try to find Vietnamese voice if available
                if (language === 'vi') {
                    const voices = window.speechSynthesis.getVoices();
                    const vietnameseVoice = voices.find(voice => 
                        voice.lang.includes('vi') || voice.name.toLowerCase().includes('vietnamese')
                    );
                    if (vietnameseVoice) {
                        utterance.voice = vietnameseVoice;
                    }
                }

                utterance.onend = () => {
                    setIsPlaying(false);
                };

                utterance.onerror = (error) => {
                    console.error('SpeechSynthesis error:', error);
                    setIsPlaying(false);
                    toast.error('Error playing audio');
                };

                window.speechSynthesis.speak(utterance);
            } else {
                // Fallback: just show text if TTS not supported
                setIsPlaying(false);
                toast.info('Text-to-speech not supported in this browser');
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
            toast.error('Error playing audio');
        }
    };

    // Load voices when component mounts
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // Load voices (may need to wait)
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('Available voices:', voices);
            };
            
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    const handleEndInterview = async () => {
        if (window.confirm(interview?.language === 'vi' 
            ? 'Bạn có chắc muốn kết thúc phỏng vấn?'
            : 'Are you sure you want to end the interview?')) {
            try {
                const result = await completeInterview(id);
                if (result && result.EC === 0) {
                    toast.success(interview?.language === 'vi' 
                        ? 'Phỏng vấn đã kết thúc!'
                        : 'Interview completed!');
                    navigate(`/candidate/virtual-interview/${id}/result`);
                }
            } catch (error) {
                console.error('Error ending interview:', error);
                toast.error('Error ending interview');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="virtual-interview-voice">
                <CandidateNav />
                <div className="container mt-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const language = interview?.language || 'vi';

    return (
        <div className="virtual-interview-voice">
            <CandidateNav />
            <div className="container mt-4 mb-5">
                {/* Header */}
                <div className="voice-header">
                    <div className="header-info">
                        <span className="level-badge">
                            {language === 'vi' 
                                ? `Trình độ: ${interview?.level || ''}`
                                : `Level: ${interview?.level || ''}`}
                        </span>
                        <span className="language-indicator">
                            {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                        </span>
                    </div>
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleEndInterview}
                    >
                        {language === 'vi' ? 'Kết thúc phỏng vấn' : 'End Interview'}
                    </button>
                </div>

                {/* Current Question Display */}
                {currentQuestion && (
                    <div className="current-question-card">
                        <div className="question-label">
                            {language === 'vi' ? 'Câu hỏi từ HR ảo:' : 'AI HR Question:'}
                        </div>
                        <div className="question-text">
                            {currentQuestion}
                        </div>
                        {isPlaying && (
                            <div className="playing-indicator">
                                <span className="spinner-border spinner-border-sm me-2" />
                                {language === 'vi' ? 'Đang phát...' : 'Playing...'}
                            </div>
                        )}
                    </div>
                )}

                {/* Voice Controls */}
                <div className="voice-controls">
                    <button
                        className={`btn btn-record ${isRecording ? 'recording' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing || isPlaying}
                    >
                        {isRecording ? (
                            <>
                                <i className="fas fa-stop-circle me-2" />
                                {language === 'vi' ? 'Dừng ghi âm' : 'Stop Recording'}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-microphone me-2" />
                                {language === 'vi' ? 'Bắt đầu ghi âm' : 'Start Recording'}
                            </>
                        )}
                    </button>
                    {isProcessing && (
                        <div className="processing-indicator">
                            <span className="spinner-border spinner-border-sm me-2" />
                            {language === 'vi' ? 'Đang xử lý...' : 'Processing...'}
                        </div>
                    )}
                </div>

                {/* Conversation Transcript */}
                <div className="conversation-transcript">
                    <h5 className="transcript-title">
                        {language === 'vi' ? 'Lịch sử hội thoại' : 'Conversation History'}
                    </h5>
                    <div className="messages-list">
                        {conversation.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                            >
                                <div className="message-role">
                                    {msg.role === 'user' 
                                        ? (language === 'vi' ? 'Bạn' : 'You')
                                        : (language === 'vi' ? 'HR ảo' : 'AI HR')}
                                </div>
                                <div className="message-content">{msg.content}</div>
                                <div className="message-time">
                                    {msg.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hidden audio player */}
                <audio ref={audioPlayerRef} />
            </div>
            <Footer />
        </div>
    );
};

export default VirtualInterviewVoice;

