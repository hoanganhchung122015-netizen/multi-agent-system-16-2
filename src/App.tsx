import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Camera, Image as ImageIcon, History, 
  Send, Sparkles, Volume2, ChevronRight, Brain, 
  Lightbulb, Target, RefreshCcw, X
} from 'lucide-react';
import { Layout } from '../components/Layout';
import CameraScanner from '../components/CameraScanner';
import { Subject, AgentType, FullAnalysisResponse, DiaryEntry } from '../types';
import { fetchFullAnalysis, optimizeImage, speakText } from '../services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'HOME' | 'INPUT' | 'ANALYSIS' | 'DIARY'>('HOME');
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FullAnalysisResponse | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.SPEED);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // --- EFFECT: Load Diary ---
  useEffect(() => {
    const saved = localStorage.getItem('symbiotic_diary');
    if (saved) setDiary(JSON.parse(saved));
  }, []);

  // --- CORE LOGIC: Xử lý chính ---
  const processAI = async (currentSubject: Subject, currentInput: string, currentImage: string | null) => {
    setLoading(true);
    try {
      // 1. Tối ưu ảnh (nếu có)
      let finalImg = undefined;
      if (currentImage) {
        finalImg = await optimizeImage(currentImage);
        setImage(finalImg); // Cập nhật lại ảnh đã nén lên giao diện
      }

      // 2. Gọi API
      const data = await fetchFullAnalysis(currentSubject, currentInput, finalImg);
      
      // 3. Hiển thị kết quả
      setResults(data);
      setView('ANALYSIS');
      
      // 4. Lưu vào nhật ký
      const newEntry: DiaryEntry = {
        date: new Date().toLocaleString('vi-VN'),
        subject: currentSubject,
        input: currentInput,
        image: finalImg,
        results: data
      };
      const updatedDiary = [newEntry, ...diary].slice(0, 20);
      setDiary(updatedDiary);
      localStorage.setItem('symbiotic_diary', JSON.stringify(updatedDiary));
    } catch (error) {
      console.error(error);
      alert("AI đang bận hoặc ảnh quá nặng, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleManualSend = () => {
    if (!input && !image) return;
    processAI(subject, input, image);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        // Tự động giải luôn khi tải ảnh lên cho tiện
        processAI(subject, input, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- RENDER: Màn hình chính ---
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        {Object.values(Subject).filter(s => s !== Subject.DIARY).map((s) => (
          <button
            key={s}
            onClick={() => { setSubject(s); setView('INPUT'); }}
            className={`p-6 rounded-[2.5rem] border-2 transition-all duration-300 text-left space-y-3 ${
              subject === s ? 'border-indigo-600 bg-indigo-50/50 shadow-xl' : 'border-slate-100 hover:border-indigo-200'
            }`}
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
              {s === Subject.MATH && <Target size={24} />}
              {s === Subject.PHYSICS && <Sparkles size={24} />}
              {s === Subject.CHEMISTRY && <Brain size={24} />}
            </div>
            <div className="font-black text-slate-800 uppercase tracking-tight">{s}</div>
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => setView('DIARY')}
        className="w-full p-6 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-between group hover:bg-slate-800 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <History size={24} />
          </div>
          <div className="text-left">
            <div className="font-black uppercase tracking-widest text-xs opacity-60">Lịch sử học tập</div>
            <div className="text-lg font-bold">Xem lại nhật ký giải bài</div>
          </div>
        </div>
        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  // --- RENDER: Màn hình nhập liệu ---
  const renderInput = () => (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div className="bg-slate-50 rounded-[3rem] p-8 space-y-6 border border-slate-100">
        <div className="flex justify-between items-center">
          <span className="px-4 py-1.5 bg-white rounded-full text-xs font-black text-indigo-600 border border-indigo-50 shadow-sm uppercase tracking-widest">
            Đang chọn: {subject}
          </span>
          <button onClick={() => {setImage(null); setInput('');}} className="text-slate-400 hover:text-rose-500 transition-colors">
            <RefreshCcw size={20} />
          </button>
        </div>

        {image ? (
          <div className="relative group">
            <img src={image} alt="Input" className="w-full h-64 object-cover rounded-[2rem] shadow-lg" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-rose-500 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => setShowScanner(true)}
              className="flex-1 h-32 bg-indigo-600 rounded-[2rem] flex flex-col items-center justify-center text-white gap-2 shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all"
            >
              <Camera size={32} />
              <span className="font-bold text-xs uppercase tracking-widest">Quét đề bài</span>
            </button>
            <label className="flex-1 h-32 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-500 gap-2 hover:border-indigo-300 hover:text-indigo-500 cursor-pointer transition-all">
              <ImageIcon size={32} />
              <span className="font-bold text-xs uppercase tracking-widest">Tải ảnh lên</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hoặc nhập câu hỏi tại đây..."
          className="w-full bg-white border-none rounded-[2rem] p-6 text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50 min-h-[150px] shadow-inner text-lg"
        />

        <button
          onClick={handleManualSend}
          disabled={loading || (!input && !image)}
          className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${
            loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <><Send size={20} /> Giải bài ngay</>
          )}
        </button>
      </div>
    </div>
  );

  // --- RENDER: Màn hình kết quả ---
  const renderAnalysis = () => {
    if (!results) return null;
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] gap-1 overflow-x-auto no-scrollbar">
          {Object.values(AgentType).map((agent) => (
            <button
              key={agent}
              onClick={() => setActiveAgent(agent)}
              className={`flex-1 py-4 px-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                activeAgent === agent ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${activeAgent === AgentType.SPEED ? 'bg-amber-100 text-amber-600' : activeAgent === AgentType.SOCRATIC ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {activeAgent === AgentType.SPEED ? <Target size={18}/> : activeAgent === AgentType.SOCRATIC ? <Lightbulb size={18}/> : <Brain size={18}/>}
            </div>
            <span className="font-black text-slate-800 uppercase text-xs tracking-tighter">
              {activeAgent === AgentType.SPEED ? 'Chuyên gia giải nhanh' : activeAgent === AgentType.SOCRATIC ? 'Giáo sư Sư phạm' : 'Trợ lý Luyện tập'}
            </span>
          </div>
          <button 
            onClick={() => speakText(results.tts_summary)}
            className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:scale-110 transition-all active:scale-90"
          >
            <Volume2 size={20} />
          </button>
        </div>

        <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-100 border border-slate-50 min-h-[400px]">
          <article className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-xs">
            {activeAgent === AgentType.SPEED && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-slate-400">Đáp án</h4>
                  <div className="text-2xl font-bold text-indigo-600 bg-indigo-50/50 p-6 rounded-3xl">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{results.prof1.answer}</ReactMarkdown>
                  </div>
                </section>
                {results.prof1.casio && (
                  <section>
                    <h4 className="text-slate-400">CASIO 580VNX</h4>
                    <div className="bg-slate-900 text-emerald-400 p-6 rounded-3xl font-mono text-sm border-l-4 border-emerald-500">
                      {results.prof1.casio}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeAgent === AgentType.SOCRATIC && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-slate-400">Giải thích chi tiết</h4>
                  <div className="text-slate-600 leading-relaxed text-lg">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{results.prof2.explanation}</ReactMarkdown>
                  </div>
                </section>
                <section>
                  <h4 className="text-slate-400">Mẹo giải</h4>
                  <div className="bg-blue-50 text-blue-700 p-6 rounded-3xl italic border-l-4 border-blue-400">
                    {results.prof2.method}
                  </div>
                </section>
              </div>
            )}

            {activeAgent === AgentType.PERPLEXITY && (
              <div className="space-y-8">
                <h4 className="text-slate-400">Câu hỏi luyện tập</h4>
                {results.prof3.quizzes.map((q, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <p className="font-bold text-slate-800 text-lg">{i+1}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl text-sm border border-slate-200 font-medium">
                          {String.fromCharCode(65 + idx)}. {opt}
                        </div>
                      ))}
                    </div>
                    <details className="group">
                      <summary className="list-none cursor-pointer text-xs font-black text-indigo-600 uppercase tracking-widest bg-white w-max px-4 py-2 rounded-full shadow-sm border border-indigo-50">
                        Đáp án & giải thích
                      </summary>
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl text-emerald-700 text-sm">
                        <span className="font-black">Đúng: {q.answer}</span>. {q.explanation}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
    );
  };

  // --- RENDER: Màn hình nhật ký ---
  const renderDiary = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Nhật ký giải bài</h3>
        <button onClick={() => { if(confirm('Xóa hết?')) { setDiary([]); localStorage.removeItem('symbiotic_diary'); }}} className="text-xs font-bold text-rose-500 uppercase">Xóa tất cả</button>
      </div>
      {diary.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <History size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400">Chưa có bài giải nào.</p>
        </div>
      ) : (
        diary.map((entry, i) => (
          <button
            key={i}
            onClick={() => { setResults(entry.results); setSubject(entry.subject); setView('ANALYSIS'); }}
            className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex gap-4 items-center group"
          >
            {entry.image && <img src={entry.image} className="w-16 h-16 rounded-2xl object-cover" alt="Hist" />}
            <div className="flex-1">
              <div className="text-[10px] font-black text-indigo-600 uppercase mb-1">{entry.subject} • {entry.date}</div>
              <div className="text-slate-800 font-bold line-clamp-1">{entry.input || "Bài tập hình ảnh"}</div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </button>
        ))
      )}
    </div>
  );

  return (
    <Layout 
      onBack={view !== 'HOME' ? () => setView('HOME') : undefined}
      title={view === 'INPUT' ? 'Nhập câu hỏi' : view === 'ANALYSIS' ? 'Phân tích đa tác tử' : view === 'DIARY' ? 'Nhật ký' : undefined}
    >
      {view === 'HOME' && renderHome()}
      {view === 'INPUT' && renderInput()}
      {view === 'ANALYSIS' && renderAnalysis()}
      {view === 'DIARY' && renderDiary()}

      {showScanner && (
        <CameraScanner 
          onCapture={(data) => { 
            setImage(data); 
            setShowScanner(false); 
            setView('INPUT');
            processAI(subject, input, data); // Tự động chạy ngay sau khi chụp & crop
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </Layout>
  );
};

export default App;
