import { Subject, FullAnalysisResponse } from "../types";

// Hàm tối ưu ảnh trước khi gửi (Bản nâng cấp ổn định)
export const optimizeImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1280; // Giới hạn chiều rộng để giảm dung lượng
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Không thể khởi tạo canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Trả về ảnh JPEG với chất lượng 0.7 để cân bằng giữa độ nét và dung lượng
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = (err) => reject(err);
  });
};

// Hàm gọi API tổng hợp 3 Professor
export const fetchFullAnalysis = async (
  subject: Subject, 
  prompt: string, 
  image?: string
): Promise<FullAnalysisResponse> => {
  // Nếu có ảnh, đảm bảo ảnh là chuỗi base64 hợp lệ
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, prompt, image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi kết nối AI');
  }
  
  return await response.json();
};

// Hàm đọc văn bản (TTS) sử dụng trình duyệt
export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1; // Tăng tốc độ đọc một chút cho tự nhiên
    window.speechSynthesis.speak(utterance);
  }
};
