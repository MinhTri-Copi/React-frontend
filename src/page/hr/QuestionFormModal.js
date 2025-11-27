import React, { useState } from 'react';
import './QuestionFormModal.scss';
import { addMultipleQuestions } from '../../service.js/testService';
import { toast } from 'react-toastify';

const QuestionFormModal = ({ show, onClose, onSuccess, testId, userId }) => {
    const [questions, setQuestions] = useState([{
        Cauhoi: '',
        Dapan: '',
        Loaicauhoi: 'tuluan',
        Diem: 10
    }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show) return null;

    const handleAddMore = () => {
        setQuestions([...questions, {
            Cauhoi: '',
            Dapan: '',
            Loaicauhoi: 'tuluan',
            Diem: 10
        }]);
    };

    const handleRemove = (index) => {
        if (questions.length === 1) {
            toast.warning('Phải có ít nhất 1 câu hỏi!');
            return;
        }
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].Cauhoi.trim()) {
                toast.error(`Vui lòng nhập câu hỏi ${i + 1}!`);
                return;
            }
            if (!questions[i].Dapan.trim()) {
                toast.error(`Vui lòng nhập đáp án cho câu ${i + 1}!`);
                return;
            }
            if (questions[i].Diem <= 0) {
                toast.error(`Điểm câu ${i + 1} phải lớn hơn 0!`);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const res = await addMultipleQuestions(userId, testId, questions);

            if (res && res.EC === 0) {
                // Reset form
                setQuestions([{
                    Cauhoi: '',
                    Dapan: '',
                    Loaicauhoi: 'tuluan',
                    Diem: 10
                }]);
                onSuccess();
            } else {
                toast.error(res.EM || 'Không thể thêm câu hỏi!');
            }
        } catch (error) {
            console.error('Error adding questions:', error);
            toast.error('Có lỗi xảy ra khi thêm câu hỏi!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="question-form-modal-overlay" onClick={onClose}>
            <div className="question-form-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Thêm Câu Hỏi</h2>
                    <button className="btn-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {questions.map((question, index) => (
                            <div key={index} className="question-form-item">
                                <div className="question-form-header">
                                    <h4>Câu hỏi {index + 1}</h4>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => handleRemove(index)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Câu hỏi <span className="required">*</span></label>
                                    <textarea
                                        value={question.Cauhoi}
                                        onChange={(e) => handleChange(index, 'Cauhoi', e.target.value)}
                                        placeholder="Nhập nội dung câu hỏi..."
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Đáp án chuẩn <span className="required">*</span></label>
                                    <textarea
                                        value={question.Dapan}
                                        onChange={(e) => handleChange(index, 'Dapan', e.target.value)}
                                        placeholder="Nhập đáp án chuẩn..."
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Loại câu hỏi</label>
                                        <select
                                            value={question.Loaicauhoi}
                                            onChange={(e) => handleChange(index, 'Loaicauhoi', e.target.value)}
                                        >
                                            <option value="tuluan">Tự luận</option>
                                            <option value="tracnghiem">Trắc nghiệm</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Điểm <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            value={question.Diem}
                                            onChange={(e) => handleChange(index, 'Diem', parseInt(e.target.value))}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn-add-more"
                            onClick={handleAddMore}
                        >
                            <i className="fas fa-plus"></i> Thêm câu hỏi
                        </button>
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Đang lưu...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check"></i> Lưu câu hỏi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuestionFormModal;

