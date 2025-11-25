import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../../service.js/loginRegister';
import './Login.scss';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async () => {
        // Validate input
        if (!email || !password) {
            toast.error('Vui lòng nhập đầy đủ email và mật khẩu!');
            return;
        }

        setIsLoading(true);

        try {
            let res = await loginUser(email, password);

            if (res && res.data && res.data.EC === 0) {
                toast.success(res.data.EM);
                
                // Save user info to storage
                const userData = JSON.stringify(res.data.DT);
                localStorage.setItem('user', userData);
                sessionStorage.setItem('user', userData);
                
                // Navigate based on role
                if (res.data.DT && res.data.DT.roleId) {
                    switch (res.data.DT.roleId) {
                        case 1:
                            navigate('/admin');
                            break;
                        case 2:
                            navigate('/hr');
                            break;
                        case 3:
                            navigate('/candidate');
                            break;
                        default:
                            navigate('/home');
                    }
                }
            } else {
                toast.error(res.data.EM);
            }
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.EM);
            } else {
                toast.error('Có lỗi xảy ra khi đăng nhập!');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-background">
            <div className="login-container">
                <div className="login-content row">
                    <div className="col-12 text-login">Đăng Nhập</div>
                    
                    <div className="col-12 form-group login-input">
                        <label>Email:</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    
                    <div className="col-12 form-group login-input">
                        <label>Mật khẩu:</label>
                        <div className="custom-input-password">
                            <input
                                type={isShowPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <span
                                onClick={() => setIsShowPassword(!isShowPassword)}
                            >
                                <i className={isShowPassword ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
                            </span>
                        </div>
                    </div>
                    
                    <div className="col-12">
                        <button
                            className={isLoading ? 'btn-login disabled' : 'btn-login'}
                            onClick={() => handleLogin()}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                                </>
                            ) : (
                                'Đăng Nhập'
                            )}
                        </button>
                    </div>
                    
                    <div className="col-12">
                        <span className="forgot-password">Quên mật khẩu?</span>
                    </div>
                    
                    <div className="col-12 text-center mt-3">
                        <span className="text-other-login">Hoặc đăng nhập bằng</span>
                    </div>
                    
                    <div className="col-12 social-login">
                        <i className="fab fa-google google"></i>
                        <i className="fab fa-facebook-f facebook"></i>
                    </div>
                    
                    <div className="col-12 text-center">
                        <span className="register-text">
                            Chưa có tài khoản? 
                            <span className="register-link" onClick={() => navigate('/register')}>
                                {' '}Đăng ký ngay
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

