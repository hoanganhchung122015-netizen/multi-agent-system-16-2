import { Subject, FullAnalysisResponse } from "../types";

// Hàm tối ưu ảnh trước khi gửi
export const optimizeImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1280; 
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  });
};

// Hàm gọi API tổng hợp 3 Professor
export const fetchFullAnalysis = async (
  subject: Subject, 
  prompt: string, 
  image?: string
): Promise<FullAnalysisResponse> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, prompt, image }),
  });

  if (!response.ok) throw new Error('Lỗi kết nối AI');
  return await response.json();
};

// Hàm đọc văn bản (TTS) sử dụng trình duyệt (miễn phí và nhanh)
export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    // Hủy các yêu cầu đọc cũ nếu có
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};