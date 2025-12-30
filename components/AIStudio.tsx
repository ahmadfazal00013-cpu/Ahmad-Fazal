import React, { useState, useRef, useEffect } from 'react';
import { AppLanguage, AspectRatio, ImageSize } from '../types';
import { t } from '../i18n';
import { 
  chatWithGemini, 
  generateImage, 
  editImage, 
  generateVideo, 
  analyzeMedia, 
  transcribeAudio, 
  generateSpeech
} from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface AIStudioProps {
  language: AppLanguage;
}

type StudioMode = 'chat' | 'create' | 'analyze';
type ChatMode = 'text' | 'voice';
type CreationMode = 'image-gen' | 'image-edit' | 'video-gen';

const AIStudio: React.FC<AIStudioProps> = ({ language }) => {
  const [mode, setMode] = useState<StudioMode>('chat');
  
  // Chat State
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatTool, setChatTool] = useState<'none'|'search'|'maps'>('none');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  
  // Creation State
  const [createMode, setCreateMode] = useState<CreationMode>('image-gen');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Analysis State
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Helpers
  const ensureApiKey = async () => {
    // Cast window to any to access aistudio injection without type conflicts
    const win = window as any;
    if (win.aistudio && !(await win.aistudio.hasSelectedApiKey())) {
      await win.aistudio.openSelectKey();
      // Wait a bit for state propagation, though usually not needed if logic relies on checking again
    }
    return true;
  };

  // --- CHAT LOGIC ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    const response = await chatWithGemini(userMsg, chatTool, language);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    
    // TTS for text mode response if desired (optional, kept manual for now)
    setIsChatLoading(false);
  };

  const handleLiveToggle = async () => {
    if (isLiveActive) {
        // Stop
        liveSessionRef.current?.close();
        setIsLiveActive(false);
    } else {
        // Start Live API
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Handle webkitAudioContext for Safari compatibility via casting
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const inputAudioContext = new AudioContext({sampleRate: 16000});
            const outputAudioContext = new AudioContext({sampleRate: 24000});
            const inputNode = inputAudioContext.createGain();
            const outputNode = outputAudioContext.createGain();
            
            let nextStartTime = 0;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
                },
                callbacks: {
                    onopen: () => {
                        setIsLiveActive(true);
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                            
                            const blob = {
                                data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
                                mimeType: 'audio/pcm;rate=16000'
                            };
                            sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64) {
                            const binary = atob(base64);
                            const bytes = new Uint8Array(binary.length);
                            for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
                            
                            // Simple Decode
                            const dataInt16 = new Int16Array(bytes.buffer);
                            const buffer = outputAudioContext.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for(let i=0; i<dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                            const source = outputAudioContext.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputNode);
                            outputNode.connect(outputAudioContext.destination);
                            
                            nextStartTime = Math.max(outputAudioContext.currentTime, nextStartTime);
                            source.start(nextStartTime);
                            nextStartTime += buffer.duration;
                        }
                    },
                    onclose: () => setIsLiveActive(false)
                }
            });
            liveSessionRef.current = { close: () => sessionPromise.then(s => s.close()) };

        } catch (e) {
            console.error("Live API Error", e);
            alert("Could not start Live Voice. Check permissions.");
        }
    }
  };

  // --- CREATION LOGIC ---
  const handleCreation = async () => {
    if (!prompt.trim()) return;
    // Check key for Pro/Veo models
    if (createMode === 'image-gen' || createMode === 'video-gen') {
      await ensureApiKey();
    }

    setIsGenerating(true);
    setGeneratedMedia(null);

    let result: string | null = null;

    if (createMode === 'image-gen') {
      result = await generateImage(prompt, imageSize, aspectRatio);
    } else if (createMode === 'image-edit' && uploadFile) {
      result = await editImage(uploadFile, prompt);
    } else if (createMode === 'video-gen') {
      // Veo only supports 16:9 or 9:16
      const veoRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
      result = await generateVideo(prompt, veoRatio, uploadFile || undefined);
    }

    if (result) {
      setGeneratedMedia(result);
    } else {
      alert("Generation failed or timed out.");
    }
    setIsGenerating(false);
  };

  // --- ANALYSIS LOGIC ---
  const handleAnalyze = async () => {
    if (!analyzeFile) return;
    setIsAnalyzing(true);
    
    // Check if audio for transcription
    if (analyzeFile.type.startsWith('audio')) {
      const text = await transcribeAudio(analyzeFile);
      setAnalysisResult(text);
    } else {
      // Image/Video
      const text = await analyzeMedia(analyzeFile, "Analyze this content in detail.", language);
      setAnalysisResult(text);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in text-white px-4 pb-24">
      {/* HEADER */}
      <div className="mb-6 pt-4">
        <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">AI Studio</span>
        </h2>
        
        {/* MODE SWITCHER */}
        <div className="flex bg-white/10 rounded-2xl p-1 mb-6 border border-white/5">
           {(['chat', 'create', 'analyze'] as StudioMode[]).map(m => (
             <button
               key={m}
               onClick={() => setMode(m)}
               className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
             >
               {t(m, language)}
             </button>
           ))}
        </div>
      </div>

      {/* CHAT MODE */}
      {mode === 'chat' && (
        <div className="flex flex-col flex-1 h-[60vh]">
          {/* Chat Tool Toggle */}
          <div className="flex gap-2 mb-4 overflow-x-auto scroll-hide">
             <button onClick={() => setChatMode('text')} className={`px-4 py-2 rounded-full text-xs font-bold border ${chatMode === 'text' ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                <i className="fa-solid fa-message mr-2"></i> {t('text_mode', language)}
             </button>
             <button onClick={() => setChatMode('voice')} className={`px-4 py-2 rounded-full text-xs font-bold border ${chatMode === 'voice' ? 'bg-pink-500 border-pink-500' : 'border-white/20'}`}>
                <i className="fa-solid fa-microphone mr-2"></i> {t('voice_mode', language)}
             </button>
          </div>

          {chatMode === 'text' ? (
             <div className="glass-panel-dark rounded-[2rem] flex-1 flex flex-col overflow-hidden border border-white/10">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                   {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}>
                            {m.text}
                         </div>
                      </div>
                   ))}
                   {isChatLoading && <div className="text-center text-xs text-white/40 animate-pulse">Gemini is thinking...</div>}
                </div>
                
                <div className="p-2 bg-black/20">
                   <div className="flex gap-2 mb-2 px-2">
                      <button onClick={() => setChatTool(chatTool === 'search' ? 'none' : 'search')} className={`text-[10px] px-2 py-1 rounded border ${chatTool === 'search' ? 'bg-blue-500 border-blue-500' : 'border-white/20 text-white/50'}`}><i className="fa-brands fa-google"></i> Search</button>
                      <button onClick={() => setChatTool(chatTool === 'maps' ? 'none' : 'maps')} className={`text-[10px] px-2 py-1 rounded border ${chatTool === 'maps' ? 'bg-green-500 border-green-500' : 'border-white/20 text-white/50'}`}><i className="fa-solid fa-map-location-dot"></i> Maps</button>
                   </div>
                   <div className="flex gap-2">
                      <input 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        placeholder={t('prompt_placeholder', language)}
                        className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white/10 transition-all"
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button onClick={handleSendMessage} className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-all">
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center glass-panel-dark rounded-[2rem] border border-white/10 relative overflow-hidden">
                {isLiveActive && <div className="absolute inset-0 bg-gradient-to-b from-pink-500/20 to-indigo-500/20 animate-pulse"></div>}
                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl mb-6 transition-all duration-500 ${isLiveActive ? 'bg-white text-black scale-110 shadow-[0_0_50px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white/50'}`}>
                   <i className="fa-solid fa-microphone-lines"></i>
                </div>
                <p className="text-sm font-bold text-white/60 mb-8">{isLiveActive ? "Listening..." : "Tap to Start Conversation"}</p>
                <button 
                  onClick={handleLiveToggle}
                  className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs transition-all ${isLiveActive ? 'bg-red-500 text-white shadow-xl' : 'bg-indigo-600 text-white'}`}
                >
                  {isLiveActive ? "End Session" : "Connect Live"}
                </button>
             </div>
          )}
        </div>
      )}

      {/* CREATE MODE */}
      {mode === 'create' && (
        <div className="space-y-6">
           <div className="flex gap-2 overflow-x-auto scroll-hide">
              {(['image-gen', 'image-edit', 'video-gen'] as CreationMode[]).map(cm => (
                 <button key={cm} onClick={() => setCreateMode(cm)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap ${createMode === cm ? 'bg-white text-black border-white' : 'border-white/20 text-white/50'}`}>
                    {t(cm.replace('-', '_'), language)}
                 </button>
              ))}
           </div>

           <div className="glass-panel-dark p-6 rounded-[2rem] border border-white/10 space-y-4">
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t('prompt_placeholder', language)}
                className="w-full h-24 bg-white/5 rounded-xl p-4 text-sm outline-none resize-none focus:bg-white/10"
              />
              
              <div className="grid grid-cols-2 gap-4">
                 {createMode !== 'image-edit' && (
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className="bg-white/5 rounded-xl p-3 text-xs outline-none">
                       <option value="1:1">1:1 (Square)</option>
                       <option value="16:9">16:9 (Landscape)</option>
                       <option value="9:16">9:16 (Portrait)</option>
                       <option value="4:3">4:3</option>
                       <option value="3:4">3:4</option>
                    </select>
                 )}
                 {createMode === 'image-gen' && (
                    <select value={imageSize} onChange={e => setImageSize(e.target.value as ImageSize)} className="bg-white/5 rounded-xl p-3 text-xs outline-none">
                       <option value="1K">1K</option>
                       <option value="2K">2K (High)</option>
                       <option value="4K">4K (Ultra)</option>
                    </select>
                 )}
              </div>

              {(createMode === 'image-edit' || createMode === 'video-gen') && (
                 <div className="relative">
                    <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" />
                    <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 text-center">
                       {uploadFile ? <span className="text-green-400 text-xs font-bold">{uploadFile.name}</span> : <span className="text-white/40 text-xs">Upload Reference Image</span>}
                    </div>
                 </div>
              )}

              <button 
                onClick={handleCreation}
                disabled={isGenerating || !prompt}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 {isGenerating ? (
                    <><i className="fa-solid fa-spinner animate-spin"></i> {t('generating', language)}</>
                 ) : (
                    <><i className="fa-solid fa-wand-magic-sparkles"></i> {t('generate', language)}</>
                 )}
              </button>
           </div>

           {generatedMedia && (
             <div className="animate-fade-in rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                {createMode.includes('video') ? (
                   <video src={generatedMedia} controls className="w-full" autoPlay loop />
                ) : (
                   <img src={generatedMedia} alt="Generated" className="w-full" />
                )}
                <a href={generatedMedia} download="gemini_creation" className="block text-center bg-white text-black py-3 text-xs font-bold uppercase">Download</a>
             </div>
           )}
        </div>
      )}

      {/* ANALYZE MODE */}
      {mode === 'analyze' && (
         <div className="glass-panel-dark p-6 rounded-[2rem] border border-white/10 flex-1 flex flex-col">
            <div className="border-2 border-dashed border-white/20 rounded-2xl flex-1 flex flex-col items-center justify-center relative mb-4 transition-all hover:bg-white/5">
               <input type="file" onChange={e => setAnalyzeFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" />
               {analyzeFile ? (
                  <div className="text-center">
                     <i className="fa-solid fa-file-circle-check text-4xl text-green-400 mb-2"></i>
                     <p className="text-xs font-bold">{analyzeFile.name}</p>
                  </div>
               ) : (
                  <div className="text-center text-white/40">
                     <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
                     <p className="text-xs font-bold uppercase tracking-widest">{t('upload_media', language)}</p>
                     <p className="text-[10px]">Image, Video, or Audio</p>
                  </div>
               )}
            </div>

            <button 
               onClick={handleAnalyze}
               disabled={isAnalyzing || !analyzeFile}
               className="w-full bg-indigo-600 py-4 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 mb-4"
            >
               {isAnalyzing ? t('analyzing', language) : "Deep Analyze"}
            </button>

            {analysisResult && (
               <div className="bg-black/20 rounded-xl p-4 max-h-40 overflow-y-auto custom-scroll border border-white/5">
                  <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
               </div>
            )}
         </div>
      )}
    </div>
  );
};

export default AIStudio;