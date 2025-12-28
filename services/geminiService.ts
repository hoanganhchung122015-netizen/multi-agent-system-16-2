import { Subject, FullAnalysisResponse } from "../types";

/**
 * Hàm tối ưu ảnh: Nén siêu nhỏ để vượt qua giới hạn 4.5MB của Vercel
 * Cấu hình: Rộng tối đa 1024px, Chất lượng 0.4 (siêu nén)
 */
export const optimizeImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Giảm độ phân giải xuống 1024px (vẫn đủ rõ để AI đọc chữ)
      const MAX_WIDTH = 1024; 
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context error"));
        return;
      }

      // Vẽ ảnh lên canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Nén mạnh với chất lượng 0.4 (40%) và định dạng JPEG
      // JPEG nén dữ liệu ảnh tốt hơn nhiều so với PNG hoặc dữ liệu gốc
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Hàm gọi API Backend
 */
export const fetchFullAnalysis = async (
  subject: Subject, 
  prompt: string, 
  image?: string
): Promise<FullAnalysisResponse> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      subject, 
      prompt: prompt || "Giải chi tiết bài tập này", 
      image // Đây là chuỗi base64 đã được nén siêu nhỏ
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Ném lỗi cụ thể để App.tsx hiển thị alert
    throw new Error(errorData.error || 'Server không phản hồi');
  }
  
  return await response.json();
};

/**
 * Hàm đọc văn bản (TTS)
 */
export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }
};
