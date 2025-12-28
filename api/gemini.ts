export const config = { runtime: 'edge' };

export default async function (req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });

  try {
    const { subject, prompt, image } = await req.json();

    const systemInstruction = `
      Bạn là một hệ thống 3 Giáo sư (Professor) hỗ trợ học tập môn ${subject}. 
      Hãy phân tích đề bài và trả về DUY NHẤT một cấu trúc JSON như sau (không kèm văn bản ngoài):
      {
        "prof1": { "answer": "Đáp án ngắn gọn, dùng LaTeX", "casio": "Hướng dẫn bấm máy Casio 580VNX nếu là toán" },
        "prof2": { "explanation": "Giải thích chi tiết từng bước, dùng LaTeX", "method": "Mẹo giải nhanh hoặc công thức mấu chốt" },
        "prof3": { "quizzes": [ { "question": "Câu hỏi tương tự 1", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "Giải thích ngắn" } ] },
        "tts_summary": "Tóm tắt mấu chốt trong 1 câu ngắn gọn để đọc"
      }
      Lưu ý: Luôn dùng LaTeX cho công thức toán học (kẹp trong dấu $).
    `;

    const contents = [{
      parts: [
        { text: `${systemInstruction}\n\nĐề bài: ${prompt || "Hình ảnh đính kèm"}` },
        ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }] : [])
      ]
    }];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents, 
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 } 
      })
    });

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    return new Response(content, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
  }
}