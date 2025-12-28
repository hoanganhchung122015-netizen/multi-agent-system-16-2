export const config = { runtime: 'edge' };

export default async function (req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });

  try {
    const { subject, prompt, image } = await req.json();

const systemPrompt = `
Bạn là một trợ lý giải bài tập đa năng. Hãy giải bài tập trong ảnh/văn bản theo đúng cấu trúc JSON sau, không được thêm lời dẫn giải thừa thãi:

{
  "prof1": {
    "answer": "Ghi trực tiếp đáp án cuối cùng và kết quả số học. Ngắn gọn nhất có thể.",
    "casio": "Các bước bấm máy tính Casio 580VNX (nếu có)."
  },
  "prof2": {
    "explanation": "Các bước giải ngắn gọn, súc tích, đi thẳng vào trọng tâm.",
    "method": "Công thức chính hoặc mẹo giải nhanh của bài này."
  },
  "prof3": {
    "quizzes": [
      {
        "question": "Câu hỏi trắc nghiệm tương tự 1",
        "options": ["A...", "B...", "C...", "D..."],
        "answer": "Đáp án đúng",
        "explanation": "Giải thích nhanh"
      },
      {
        "question": "Câu hỏi trắc nghiệm tương tự 2",
        "options": ["A...", "B...", "C...", "D..."],
        "answer": "Đáp án đúng",
        "explanation": "Giải thích nhanh"
      }
    ]
  },
  "tts_summary": "Tóm tắt bài giải trong 2 câu để đọc Audio."
}

Yêu cầu: 
1. Sử dụng định dạng LaTeX cho công thức toán học (ví dụ: $x^2$).
2. Trả về DUY NHẤT mã JSON, không có ký tự ngoài.
3. Không cần đóng vai, không chào hỏi.
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
