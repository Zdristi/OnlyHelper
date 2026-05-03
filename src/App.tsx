import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Minus, X, Flame } from 'lucide-react';

type Variation = {
  target: string;
  russian: string;
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const COMPACT_WIDTH = 380;
  const COMPACT_HEIGHT = 380;
  const EXPANDED_WIDTH = 750;
  const EXPANDED_HEIGHT = 600;

  const handleSextingMode = useCallback(async () => {
    setIsExpanded(true);
    (window as any).electronAPI?.setWindowSize(EXPANDED_WIDTH, EXPANDED_HEIGHT);
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/gemini/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: translatedText || inputText, mode: "Sexting", count: 3, targetLang }),
      });
      const data = await response.json();
      setVariations(data.result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  }, [translatedText, inputText, targetLang]);

  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onGrabText((text: string) => {
        if (text) {
          setInputText(text);
          autoDetectAndTranslate(text);
        }
      });
      (window as any).electronAPI.onTriggerSexting(() => {
        handleSextingMode();
      });
      (window as any).electronAPI.onResetApp(() => {
        setTranslatedText("");
        setVariations([]);
        setIsExpanded(false);
        (window as any).electronAPI.setWindowSize(COMPACT_WIDTH, COMPACT_HEIGHT);
      });
    }
  }, [handleSextingMode]);

  const autoDetectAndTranslate = async (text: string) => {
    setIsTranslating(true);
    setIsExpanded(false);
    (window as any).electronAPI?.setWindowSize(COMPACT_WIDTH, COMPACT_HEIGHT);

    const isRussian = /[а-яА-ЯёЁ]/.test(text);
    const newTarget = isRussian ? "English" : "Russian";
    setTargetLang(newTarget);

    try {
      const response = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: newTarget }),
      });
      const data = await response.json();
      setTranslatedText(data.result || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateTo = async (lang: string) => {
    setTargetLang(lang);
    setIsTranslating(true);
    try {
      const response = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, targetLang: lang }),
      });
      const data = await response.json();
      setTranslatedText(data.result || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyAndHide = (text: string) => {
    if ((window as any).electronAPI?.copyText) {
      (window as any).electronAPI.copyText(text);
      (window as any).electronAPI.windowHide();
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const isInputRussian = /[а-яА-ЯёЁ]/.test(inputText);
  const availableLangs = isInputRussian ? ["English", "Spanish"] : ["Russian"];

  return (
    <div className="w-full h-full bg-[#0E1013] text-[#E8EAED] flex flex-col overflow-hidden font-sans border border-[#30363D]">
      <div className="h-12 bg-[#16191D] border-b border-[#30363D] flex items-center justify-between px-2 shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center h-full gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {availableLangs.map(lang => (
            <button
              key={lang}
              onClick={() => handleTranslateTo(lang)}
              className={`h-full px-4 text-[11px] font-bold transition-all border-b-2 ${
                targetLang === lang 
                ? 'border-[#4D90FE] text-white bg-[#1C2128]' 
                : 'border-transparent text-[#8B949E] hover:text-white hover:bg-[#21262D]'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => (window as any).electronAPI.windowHide()} className="p-2 text-[#8B949E] hover:text-white hover:bg-[#21262D] rounded">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => (window as any).electronAPI.windowClose()} className="p-2 text-[#8B949E] hover:text-[#F85149] hover:bg-[#21262D] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
        {!isExpanded ? (
          <div className="flex flex-col h-full gap-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  autoDetectAndTranslate(inputText);
                }
              }}
              className="h-20 bg-[#16191D] border border-[#30363D] rounded-md p-3 text-[14px] text-[#E8EAED] resize-none focus:outline-none focus:border-[#4D90FE]"
              placeholder="Enter text here... (Ctrl+Enter to translate)"
            />
            
            <div className="flex-1 bg-[#16191D] border border-[#30363D] rounded-md p-4 overflow-y-auto custom-scrollbar shadow-inner relative group">
              {isTranslating ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4D90FE]" />
                </div>
              ) : (
                <p className="text-[16px] text-[#E8EAED] leading-[1.6] whitespace-pre-wrap select-text font-normal">
                  {translatedText || <span className="text-[#484F58] italic">Result...</span>}
                </p>
              )}
            </div>
            
            <div className="flex gap-3 shrink-0 h-12">
              <button 
                onClick={() => copyAndHide(translatedText)}
                disabled={!translatedText}
                className="flex-1 bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-white text-[12px] font-bold rounded-md uppercase tracking-wide transition-all disabled:opacity-30"
              >
                Copy Result
              </button>
              <button 
                onClick={handleSextingMode}
                disabled={!translatedText && !inputText}
                className="flex-1 bg-[#BF3989] hover:bg-[#D44499] text-white text-[12px] font-bold rounded-md uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-30"
              >
                <Flame className="w-4 h-4 fill-white" />
                Sexting
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#BF3989] fill-[#BF3989]" />
                <span className="text-[13px] font-black text-[#BF3989] tracking-widest uppercase">Expert Variations</span>
              </div>
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  (window as any).electronAPI.setWindowSize(COMPACT_WIDTH, COMPACT_HEIGHT);
                }} 
                className="text-[11px] text-[#58A6FF] hover:underline font-bold uppercase"
              >
                Back to Translator
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {isEnhancing ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#BF3989]" />
                  <span className="text-[11px] text-[#BF3989] font-bold tracking-[0.3em] uppercase">Generating Fire...</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {variations.map((v, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => copyAndHide(v.target)}
                        className="bg-[#16191D] border border-[#30363D] hover:border-[#BF3989] p-5 rounded-lg cursor-pointer transition-all shadow-md group relative"
                      >
                        <span className="text-[9px] font-black text-[#8B949E] uppercase block mb-3">{targetLang}</span>
                        <p className="text-[15px] text-[#E8EAED] leading-relaxed">{v.target}</p>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Flame className="w-3 h-3 text-[#BF3989]" />
                        </div>
                      </div>
                      <div className="bg-[#0D1117] border border-[#21262D] p-5 rounded-lg">
                        <span className="text-[9px] font-black text-[#484F58] uppercase block mb-3">Meaning (RU)</span>
                        <p className="text-[15px] text-[#8B949E] italic leading-relaxed">{v.russian}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363D; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #484F58; }
      `}} />
    </div>
  );
}
