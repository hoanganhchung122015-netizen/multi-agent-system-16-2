import { GoogleGenerativeAI } from "@google/generative-ai";

// BẮT BUỘC: Chuyển sang Edge Runtime để không bị giới hạn 10 giây
export const config = {
  runtime: 'edge',
};

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { subject, prompt, image } = await req.json();

    // Dùng 1.5-flash để tốc độ là nhanh nhất
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Giải bài tập ${subject}. Chỉ trả về JSON, không chào hỏi, không diễn giải ngoài lề.
    Cấu trúc:
    {
      "prof1": { "answer": "Đáp án", "casio": "Cách bấm" },
      "prof2": { "explanation": "Giải thích nhanh", "method": "Công thức" },
      "prof3": { "quizzes": [{"question": "..", "options": [".."], "answer": "..", "explanation": ".."}] },
      "tts_summary": "Tóm tắt 1 câu"
    }`;

    const parts: any[] = [
      { text: systemPrompt },
      { text: `Câu hỏi: ${prompt || "Giải bài tập trong ảnh"}` }
    ];

    if (image) {
      parts.push({
        inlineData: {
          data: image.split(',')[1] || image,
          mimeType: "image/jpeg"
        }
      });
    }

    // Gọi API
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();

    return new Response(text, {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' 
      },
    });

  } catch (error: any) {
    console.error("Lỗi API:", error);
    return new Response(
      JSON.stringify({ error: "AI không phản hồi kịp, hãy thử lại với ảnh nhỏ hơn." }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
