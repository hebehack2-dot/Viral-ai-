import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Sparkles, Twitter, Linkedin, Mail, ArrowRight, 
  CheckCircle2, Zap, Lock, Copy, Loader2, Image as ImageIcon, Settings2,
  Upload, TrendingUp, Calendar, Clock, Send, X, Download, Wand2, FileText,
  Video, Mic, Fingerprint, Repeat, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type TabType = 'repurpose' | 'hook' | 'bulk' | 'thumbnail' | 'script' | 'voice' | 'steal' | 'lead';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'pricing'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('repurpose');
  const [credits, setCredits] = useState(3);
  const [input, setInput] = useState('');
  const [tone, setTone] = useState('Professional & Value-Driven');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [brandVoice, setBrandVoice] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [results, setResults] = useState<{ twitter: string, linkedin: string, newsletter: string, imagePrompt: string } | null>(null);
  const [hookResults, setHookResults] = useState<{ analysis: string, hooks: string[] } | null>(null);
  const [bulkResults, setBulkResults] = useState<{ calendar: { day: string, platform: string, content: string }[] } | null>(null);
  const [thumbnailResult, setThumbnailResult] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [schedulingPost, setSchedulingPost] = useState<{ content: string, platform: string } | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [thumbnailMetadata, setThumbnailMetadata] = useState<{ titles: string[], description: string } | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  
  // New Premium Feature States
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [audioResult, setAudioResult] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [clonedVoice, setClonedVoice] = useState<string | null>(null);
  const [stealResult, setStealResult] = useState<string | null>(null);
  const [leadResult, setLeadResult] = useState<string | null>(null);
  const [stealTopic, setStealTopic] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);
        setFileMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert AI prompt engineer. Take the following simple user idea and expand it into a highly detailed, professional, and effective prompt. If it's for an image, make it highly descriptive, cinematic, and specify lighting, camera angles, and style. If it's for text, make it clear, structured, and highly engaging. Return ONLY the enhanced prompt text, nothing else. Do not include quotes around it. \n\nUser idea: "${input}"`,
      });
      if (response.text) {
        setInput(response.text.trim());
      }
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateMetadata = async () => {
    setIsGeneratingMetadata(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert YouTube strategist. Based on this video idea/thumbnail prompt: "${input}", generate 3 highly clickable, professional YouTube titles and a detailed, SEO-optimized description.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING }
            },
            required: ["titles", "description"]
          }
        }
      });
      setThumbnailMetadata(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Failed to generate metadata:", error);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!scriptResult) return;
    setIsGeneratingAudio(true);
    try {
      const spokenText = scriptResult.replace(/\[.*?\]/g, '').trim();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: spokenText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setAudioResult(`data:audio/wav;base64,${base64Audio}`);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim() && !fileBase64) return;
    if (credits <= 0) {
      setView('pricing');
      return;
    }

    setIsGenerating(true);
    setResults(null);
    setHookResults(null);
    setBulkResults(null);
    setThumbnailResult(null);
    setThumbnailMetadata(null);
    setGeneratedImage(null);
    setScriptResult(null);
    setAudioResult(null);
    setClonedVoice(null);
    setStealResult(null);
    setLeadResult(null);

    try {
      const parts: any[] = [];
      if (input.trim()) {
        parts.push({ text: `Input Text (or URL to research): "${input}"` });
      }
      if (fileBase64 && fileMimeType) {
        parts.push({
          inlineData: {
            data: fileBase64,
            mimeType: fileMimeType
          }
        });
      }

      if (activeTab === 'repurpose') {
        parts.unshift({ text: `You are a world-class social media manager and copywriter. 
        Take the following rough idea, blog post, video transcript, or text and repurpose it into three high-converting formats.
        
        TONE OF VOICE: ${tone}
        ${brandVoice ? `CUSTOM BRAND VOICE RULES: ${brandVoice}` : ''}
        ${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : 'General audience'}
        
        1. A highly engaging Twitter thread (use emojis, strong hooks, and line breaks).
        2. A LinkedIn post (use spacing, appropriate tone, and a strong call to action).
        3. An engaging email newsletter intro (personal, conversational, and intriguing).
        4. A highly detailed, cinematic prompt for an AI image generator to create a viral, eye-catching image to accompany the LinkedIn post.`});

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                twitter: { type: Type.STRING, description: "The Twitter thread content" },
                linkedin: { type: Type.STRING, description: "The LinkedIn post content" },
                newsletter: { type: Type.STRING, description: "The Email newsletter content" },
                imagePrompt: { type: Type.STRING, description: "A highly detailed, cinematic prompt for an AI image generator to create an accompanying image." }
              },
              required: ["twitter", "linkedin", "newsletter", "imagePrompt"]
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        setResults(data);
        
        // Start image generation in the background
        if (data.imagePrompt) {
          setIsGeneratingImage(true);
          try {
            const nvidiaRes = await fetch('/api/nvidia/v1/genai/stabilityai/stable-diffusion-3-medium', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_NVIDIA_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                prompt: data.imagePrompt,
                cfg_scale: 5,
                seed: 0,
                steps: 50,
                aspect_ratio: "1:1"
              })
            });
            
            const nvidiaData = await nvidiaRes.json();
            if (nvidiaData.image) {
              setGeneratedImage(`data:image/jpeg;base64,${nvidiaData.image}`);
            } else {
              console.error("NVIDIA API Error:", nvidiaData);
            }
          } catch (imgError) {
            console.error("Failed to generate image:", imgError);
          } finally {
            setIsGeneratingImage(false);
          }
        }
      } else if (activeTab === 'hook') {
        parts.unshift({ text: `You are a master copywriter and social media psychologist.
        Analyze the provided viral post, hook, or URL.
        1. Explain WHY it works (the psychology, structure, and emotional trigger).
        2. Generate 5 brand new, original hooks using this exact same psychological framework, but tailored to my brand voice and audience.
        
        TONE OF VOICE: ${tone}
        ${brandVoice ? `CUSTOM BRAND VOICE RULES: ${brandVoice}` : ''}
        ${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : 'General audience'}`});

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["analysis", "hooks"]
            }
          }
        });
        setHookResults(JSON.parse(response.text || '{}'));
      } else if (activeTab === 'bulk') {
        parts.unshift({ text: `You are a world-class Content Strategist.
        Read the provided CSV data, list of ideas, or document.
        Generate a highly engaging 10-post content calendar based on this data.
        Vary the platforms between Twitter and LinkedIn.
        
        TONE OF VOICE: ${tone}
        ${brandVoice ? `CUSTOM BRAND VOICE RULES: ${brandVoice}` : ''}
        ${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : 'General audience'}`});

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                calendar: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING, description: "e.g., Day 1, Day 2" },
                      platform: { type: Type.STRING, description: "Twitter or LinkedIn" },
                      content: { type: Type.STRING, description: "The actual post content" }
                    },
                    required: ["day", "platform", "content"]
                  }
                }
              },
              required: ["calendar"]
            }
          }
        });
        setBulkResults(JSON.parse(response.text || '{}'));
      } else if (activeTab === 'thumbnail') {
        // First, generate a concise image prompt from the user's input
        const promptResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `You are an expert AI image prompt engineer. Based on the following topic, title, or article, create a highly detailed, cinematic, and eye-catching prompt for an AI image generator to create a viral thumbnail. Keep the prompt under 500 characters. Return ONLY the prompt text, nothing else.\n\nInput: ${input}\n\n${brandVoice ? `Style guidelines: ${brandVoice}` : ''}`
        });
        
        const optimizedPrompt = promptResponse.text?.trim() || input.substring(0, 500);

        const nvidiaRes = await fetch('/api/nvidia/v1/genai/stabilityai/stable-diffusion-3-medium', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_NVIDIA_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: optimizedPrompt,
            cfg_scale: 5,
            seed: 0,
            steps: 50,
            aspect_ratio: aspectRatio
          })
        });
        
        const nvidiaData = await nvidiaRes.json();
        if (nvidiaData.image) {
          setThumbnailResult(`data:image/jpeg;base64,${nvidiaData.image}`);
        } else {
          console.error("NVIDIA API Error:", nvidiaData);
          alert("Failed to generate thumbnail image.");
        }
      } else if (activeTab === 'script') {
        parts.unshift({ text: `You are an expert short-form video scriptwriter (TikTok/Reels/Shorts). Write a highly engaging 60-second script based on this topic/URL. Format it with timestamps (0-3s Hook, 3-15s Setup, 15-45s Value, 45-60s CTA). Include visual cues in brackets [like this] and the spoken text normally.` });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: { parts }
        });
        setScriptResult(response.text || '');
      } else if (activeTab === 'voice') {
        parts.unshift({ text: `You are an expert copywriter and brand strategist. Analyze the following 3 posts/texts and extract the exact "Brand Voice DNA". Identify the vocabulary, sentence length, tone, emoji usage, and formatting style. Return a comprehensive "Brand Voice Profile" that can be used as instructions for an AI to write exactly like this person.` });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: { parts }
        });
        setClonedVoice(response.text || '');
        setBrandVoice(response.text || ''); // Auto-apply
      } else if (activeTab === 'steal') {
        parts.unshift({ text: `You are a master copywriter. Analyze the provided competitor post/URL to extract its underlying psychological framework and structure (why it went viral). Then, strip away the original topic and write a BRAND NEW post using that exact viral framework, but applied to this new topic: "${stealTopic}".` });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: { parts }
        });
        setStealResult(response.text || '');
      } else if (activeTab === 'lead') {
        parts.unshift({ text: `You are an expert marketer and course creator. Take the provided raw content/transcript/blog posts and transform it into a highly valuable Lead Magnet. Structure it as either a "5-Day Email Course" (with 5 distinct daily emails) or a "10-Page PDF Guide Outline" (with chapters and bullet points). Make it actionable and engaging.` });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: { parts }
        });
        setLeadResult(response.text || '');
      }

      setCredits(prev => prev - 1);

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] font-sans antialiased selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-7 h-7 bg-[#1d1d1f] rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            ViralAI
          </div>
          <div className="flex items-center gap-6">
            {view === 'dashboard' && (
              <div className="text-xs font-medium text-[#86868b] bg-[#f5f5f7] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
                {credits} Credits
              </div>
            )}
            <button 
              onClick={() => setView(view === 'dashboard' ? 'pricing' : 'dashboard')}
              className="text-xs font-medium text-[#1d1d1f]/70 hover:text-[#1d1d1f] transition-colors"
            >
              {view === 'dashboard' ? 'Upgrade' : 'Dashboard'}
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className="bg-[#0071e3] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#0077ed] transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          
          {/* LANDING PAGE */}
          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center pt-20 pb-32"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold tracking-wide mb-8">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" /> The #1 AI Tool for Creators
              </div>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-[#1d1d1f] mb-6 max-w-4xl leading-[1.05]">
                Turn 1 idea into a <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#409cff]">week of viral content.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#86868b] mb-12 max-w-2xl leading-relaxed font-medium">
                Stop wasting hours staring at a blank screen. Paste your rough notes, a blog post, or a YouTube transcript, and instantly generate Twitter threads, LinkedIn posts, and Newsletters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="bg-[#0071e3] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#0077ed] transition-all flex items-center justify-center gap-2"
                >
                  Start Creating for Free <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setView('pricing')}
                  className="bg-[#f5f5f7] text-[#1d1d1f] px-8 py-4 rounded-full text-lg font-medium hover:bg-[#e8e8ed] transition-all flex items-center justify-center gap-2"
                >
                  View Pricing
                </button>
              </div>

              {/* Social Proof */}
              <div className="mt-32 pt-12 border-t border-gray-200/50 w-full max-w-3xl">
                <p className="text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-8">Trusted by 10,000+ top creators</p>
                <div className="flex justify-center gap-12 opacity-40 grayscale">
                  {/* Mock logos */}
                  <div className="text-xl font-bold font-serif">The New York Times</div>
                  <div className="text-xl font-bold">Spotify</div>
                  <div className="text-xl font-bold italic">Substack</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DASHBOARD (THE CORE SAAS) */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-semibold tracking-tighter text-[#1d1d1f]">Content Multiplier</h2>
                <p className="text-[#86868b] mt-3 text-lg">Paste your source material below to generate your posts.</p>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#f5f5f7] p-1.5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
                {[
                  { id: 'repurpose', label: 'Repurpose', icon: <Sparkles className="w-4 h-4" /> },
                  { id: 'hook', label: 'Hook Analyzer', icon: <TrendingUp className="w-4 h-4" /> },
                  { id: 'bulk', label: 'Bulk Calendar', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'thumbnail', label: 'Thumbnail AI', icon: <ImageIcon className="w-4 h-4" /> },
                  { id: 'script', label: 'Viral Script', icon: <Video className="w-4 h-4" /> },
                  { id: 'voice', label: 'Brand Voice', icon: <Fingerprint className="w-4 h-4" /> },
                  { id: 'steal', label: 'Steal & Spin', icon: <Repeat className="w-4 h-4" /> },
                  { id: 'lead', label: 'Lead Magnet', icon: <BookOpen className="w-4 h-4" /> },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setInput(''); setFileBase64(null); setSelectedFile(null); }} 
                    className={`px-4 py-2.5 font-medium text-sm whitespace-nowrap flex items-center gap-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-3">Target Audience</label>
                    <input 
                      type="text" 
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Startup Founders, SaaS Marketers, Gen-Z Devs"
                      className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all text-[#1d1d1f] placeholder:text-[#86868b]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-3">Custom Brand Voice</label>
                    <input 
                      type="text" 
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      placeholder="e.g., Use short sentences. No jargon. Sound like Naval Ravikant."
                      className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all text-[#1d1d1f] placeholder:text-[#86868b]"
                    />
                  </div>
                </div>
                <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#1d1d1f]">Source Material (Text, URL, or File)</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept={activeTab === 'bulk' ? "text/csv,.csv" : "audio/*,video/*"}
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-2 rounded-full transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {selectedFile ? selectedFile.name : (activeTab === 'bulk' ? 'Upload CSV' : 'Upload Audio/Video')}
                      </label>
                      {selectedFile && (
                        <button onClick={() => { setSelectedFile(null); setFileBase64(null); setFileMimeType(null); }} className="text-[#86868b] hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => setInput(activeTab === 'hook' ? 'https://twitter.com/naval/status/1002103360646823936' : 'Artificial Intelligence is changing how we work. Instead of replacing jobs, it is acting as a co-pilot. For example, developers code 50% faster, and writers can overcome blank page syndrome instantly. The future belongs to those who learn to collaborate with AI, not fear it.')}
                      className="text-xs text-[#0071e3] font-medium hover:text-[#0077ed]"
                    >
                      Load Example
                    </button>
                  </div>
                </div>
                {activeTab === 'steal' && (
                  <div className="p-6 border-b border-gray-100 bg-white">
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-3">New Topic (What should the rewritten post be about?)</label>
                    <input 
                      type="text" 
                      value={stealTopic}
                      onChange={(e) => setStealTopic(e.target.value)}
                      placeholder="e.g., How to learn React in 30 days, Why AI won't replace designers..."
                      className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all text-[#1d1d1f] placeholder:text-[#86868b]"
                    />
                  </div>
                )}
                <div className="relative bg-white">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      activeTab === 'repurpose' ? "Paste a blog post, rough notes, a YouTube URL, or a news article here..." :
                      activeTab === 'hook' ? "Paste a competitor's viral post or URL here to reverse-engineer it..." :
                      activeTab === 'thumbnail' ? "Describe the thumbnail you want, or paste your YouTube video title here..." :
                      activeTab === 'script' ? "Paste a topic, idea, or long video URL to generate a 60s viral script..." :
                      activeTab === 'voice' ? "Paste 3 of your best-performing posts here to clone your brand voice..." :
                      activeTab === 'steal' ? "Paste the competitor's viral post or URL here..." :
                      activeTab === 'lead' ? "Paste your rough notes, blog posts, or transcript to generate a Lead Magnet..." :
                      "Paste your raw ideas or upload a CSV file..."
                    }
                    className="w-full h-56 p-6 pb-20 resize-none focus:outline-none text-[#1d1d1f] placeholder:text-[#86868b] text-lg leading-relaxed bg-transparent"
                  />
                  <div className="absolute bottom-6 right-6">
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancingPrompt || !input.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEnhancingPrompt ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-[#0071e3]" /> Enhancing...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 text-[#0071e3]" /> Enhance Prompt</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-[#fbfbfd] flex flex-col sm:flex-row justify-between items-center gap-4">
                  {activeTab === 'thumbnail' ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Settings2 className="w-4 h-4 text-[#86868b]" />
                      <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-transparent text-sm font-medium text-[#1d1d1f] focus:outline-none cursor-pointer"
                      >
                        <option value="16:9">16:9 (YouTube/Twitter)</option>
                        <option value="1:1">1:1 (Instagram/LinkedIn)</option>
                        <option value="9:16">9:16 (Shorts/Reels)</option>
                        <option value="4:3">4:3 (Standard)</option>
                        <option value="3:4">3:4 (Portrait)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Settings2 className="w-4 h-4 text-[#86868b]" />
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="bg-transparent text-sm font-medium text-[#1d1d1f] focus:outline-none cursor-pointer"
                      >
                        <option value="Professional & Value-Driven">Professional Tone</option>
                        <option value="Aggressive Tech Bro / Viral">Viral "Tech Bro" Tone</option>
                        <option value="Empathetic & Story-Driven">Empathetic Storyteller</option>
                        <option value="Data-Driven & Analytical">Data-Driven & Analytical</option>
                      </select>
                    </div>
                  )}
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || (!input.trim() && !fileBase64) || (activeTab === 'steal' && !stealTopic.trim())}
                    className="w-full sm:w-auto bg-[#0071e3] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating Magic...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> {
                        activeTab === 'repurpose' ? 'Repurpose Content' : 
                        activeTab === 'hook' ? 'Analyze Hook' : 
                        activeTab === 'thumbnail' ? 'Generate Thumbnail' : 
                        activeTab === 'script' ? 'Write Viral Script' :
                        activeTab === 'voice' ? 'Clone Brand Voice' :
                        activeTab === 'steal' ? 'Steal & Spin' :
                        activeTab === 'lead' ? 'Generate Lead Magnet' :
                        'Generate Calendar'
                      }</>
                    )}
                  </button>
                </div>
              </div>

              {/* Scheduling Modal */}
              {schedulingPost && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-gray-100">
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Schedule to {schedulingPost.platform}</h3>
                    <p className="text-sm text-[#86868b] mb-8">Connect your account to auto-publish this post.</p>
                    
                    <div className="space-y-5 mb-8">
                      <div>
                        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-2">Date</label>
                        <input type="date" className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-2">Time</label>
                        <input type="time" className="w-full bg-[#f5f5f7] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setSchedulingPost(null)} className="flex-1 px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-sm font-medium hover:bg-[#e8e8ed] transition-colors">Cancel</button>
                      <button onClick={() => { alert('OAuth & Database integration coming in the next phase!'); setSchedulingPost(null); }} className="flex-1 px-4 py-3 bg-[#0071e3] text-white rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail Results */}
              {thumbnailResult && activeTab === 'thumbnail' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#0071e3]" /> Your Generated Thumbnail
                    </h3>
                    <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-[#fbfbfd] flex items-center justify-center">
                      <img src={thumbnailResult} alt="Generated Thumbnail" className="w-full h-auto object-contain max-h-[600px]" referrerPolicy="no-referrer" />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <a 
                        href={thumbnailResult} 
                        download="thumbnail.png"
                        className="bg-[#0071e3] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download Image
                      </a>
                    </div>

                    <div className="mt-10 border-t border-gray-100 pt-8">
                      {!thumbnailMetadata ? (
                        <div className="flex flex-col items-center justify-center text-center bg-[#f5f5f7] rounded-2xl p-8 border border-gray-100">
                          <h4 className="text-[#1d1d1f] font-semibold mb-2 text-lg">Need a Title & Description?</h4>
                          <p className="text-[#86868b] text-sm mb-6 max-w-md">Let AI write a professional, SEO-optimized title and description for this video.</p>
                          <button 
                            onClick={handleGenerateMetadata}
                            disabled={isGeneratingMetadata}
                            className="bg-[#0071e3] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingMetadata ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Metadata</>}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#0071e3]" /> Professional Titles</h4>
                            <ul className="space-y-3">
                              {thumbnailMetadata.titles.map((title, i) => (
                                <li key={i} className="bg-[#fbfbfd] border border-gray-100 rounded-xl p-4 text-[#1d1d1f] font-medium flex justify-between items-center group">
                                  {title}
                                  <button onClick={() => handleCopy(title, `title-${i}`)} className="text-[#86868b] hover:text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity">
                                    {copied === `title-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-[#0071e3]" /> SEO Description</h4>
                            <div className="bg-[#fbfbfd] border border-gray-100 rounded-xl p-6 text-[#1d1d1f] text-sm whitespace-pre-wrap relative group leading-relaxed">
                              {thumbnailMetadata.description}
                              <button onClick={() => handleCopy(thumbnailMetadata.description, 'desc')} className="absolute top-4 right-4 text-[#86868b] hover:text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-full shadow-sm border border-gray-100">
                                {copied === 'desc' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results Section */}
              {results && activeTab === 'repurpose' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Generated Visual */}
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 bg-[#fbfbfd] flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-[#0071e3] font-semibold text-sm mb-3">
                        <ImageIcon className="w-4 h-4" /> AI Generated Visual
                      </div>
                      <p className="text-sm text-[#86868b] mb-6 leading-relaxed">
                        A custom, high-quality image generated specifically for your LinkedIn post to maximize engagement.
                      </p>
                      <div className="text-xs text-[#86868b] italic opacity-70">
                        Prompt: {results.imagePrompt}
                      </div>
                    </div>
                    <div className="p-8 md:w-2/3 flex items-center justify-center bg-[#f5f5f7] min-h-[300px]">
                      {isGeneratingImage ? (
                        <div className="flex flex-col items-center text-[#86868b] gap-4">
                          <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
                          <span className="text-sm font-medium">Generating custom masterpiece...</span>
                        </div>
                      ) : generatedImage ? (
                        <img src={generatedImage} alt="Generated AI Visual" className="rounded-2xl shadow-sm max-h-[400px] object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-sm text-[#86868b]">Failed to generate image.</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Twitter */}
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#fbfbfd]">
                      <div className="flex items-center gap-2 text-[#1da1f2] font-semibold text-sm">
                        <Twitter className="w-4 h-4 fill-current" /> Twitter Thread
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSchedulingPost({ content: results.twitter, platform: 'Twitter' })} className="text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] flex items-center gap-1 bg-[#f5f5f7] px-3 py-1.5 rounded-full transition-colors">
                          <Clock className="w-3 h-3" /> Schedule
                        </button>
                        <button onClick={() => handleCopy(results.twitter, 'twitter')} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                          {copied === 'twitter' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 flex-grow whitespace-pre-wrap text-sm text-[#1d1d1f] leading-relaxed">
                      {results.twitter}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#fbfbfd]">
                      <div className="flex items-center gap-2 text-[#0a66c2] font-semibold text-sm">
                        <Linkedin className="w-4 h-4 fill-current" /> LinkedIn Post
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSchedulingPost({ content: results.linkedin, platform: 'LinkedIn' })} className="text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] flex items-center gap-1 bg-[#f5f5f7] px-3 py-1.5 rounded-full transition-colors">
                          <Clock className="w-3 h-3" /> Schedule
                        </button>
                        <button onClick={() => handleCopy(results.linkedin, 'linkedin')} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                          {copied === 'linkedin' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-6 flex-grow whitespace-pre-wrap text-sm text-[#1d1d1f] leading-relaxed">
                      {results.linkedin}
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#fbfbfd]">
                      <div className="flex items-center gap-2 text-[#ff4e00] font-semibold text-sm">
                        <Mail className="w-4 h-4" /> Newsletter Intro
                      </div>
                      <button onClick={() => handleCopy(results.newsletter, 'newsletter')} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                        {copied === 'newsletter' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-6 flex-grow whitespace-pre-wrap text-sm text-[#1d1d1f] leading-relaxed">
                      {results.newsletter}
                    </div>
                  </div>
                  </div>
                </motion.div>
              )}

              {/* Script & Voiceover Results */}
              {scriptResult && activeTab === 'script' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#0071e3]" /> Viral 60s Script
                      </h3>
                      <button 
                        onClick={() => handleCopy(scriptResult, 'script')}
                        className="text-[#86868b] hover:text-[#0071e3] transition-colors"
                      >
                        {copied === 'script' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="bg-[#fbfbfd] border border-gray-100 rounded-2xl p-6 text-[#1d1d1f] whitespace-pre-wrap font-medium leading-relaxed">
                      {scriptResult}
                    </div>
                    
                    <div className="mt-10 border-t border-gray-100 pt-8">
                      <div className="flex flex-col items-center justify-center text-center bg-[#f5f5f7] rounded-2xl p-8 border border-gray-100">
                        <h4 className="text-[#1d1d1f] font-semibold mb-2 text-lg">Generate AI Voiceover</h4>
                        <p className="text-[#86868b] text-sm mb-6">Turn this script into a professional, ready-to-use audio file.</p>
                        
                        {audioResult ? (
                          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <audio controls src={audioResult} className="w-full" />
                            <div className="mt-4 flex justify-end">
                              <a 
                                href={audioResult} 
                                download="voiceover.wav"
                                className="text-sm font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" /> Download Audio
                              </a>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio}
                            className="bg-[#0071e3] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingAudio ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Audio...</> : <><Mic className="w-4 h-4" /> Generate Voiceover</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Brand Voice Cloner Results */}
              {clonedVoice && activeTab === 'voice' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-[#0071e3]" /> Your Brand Voice DNA
                      </h3>
                      <button 
                        onClick={() => handleCopy(clonedVoice, 'voice')}
                        className="text-[#86868b] hover:text-[#0071e3] transition-colors"
                      >
                        {copied === 'voice' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="bg-[#fbfbfd] border border-gray-100 rounded-2xl p-6 text-[#1d1d1f] whitespace-pre-wrap font-medium leading-relaxed">
                      {clonedVoice}
                    </div>
                    <div className="mt-6 flex items-center gap-3 text-sm text-green-700 bg-green-50 px-5 py-4 rounded-xl border border-green-100 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      This voice profile has been automatically applied to your settings for future generations!
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Steal & Spin Results */}
              {stealResult && activeTab === 'steal' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-[#0071e3]" /> Rewritten Viral Post
                      </h3>
                      <button 
                        onClick={() => handleCopy(stealResult, 'steal')}
                        className="text-[#86868b] hover:text-[#0071e3] transition-colors"
                      >
                        {copied === 'steal' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="bg-[#fbfbfd] border border-gray-100 rounded-2xl p-6 text-[#1d1d1f] whitespace-pre-wrap font-medium leading-relaxed">
                      {stealResult}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Lead Magnet Results */}
              {leadResult && activeTab === 'lead' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#0071e3]" /> Lead Magnet Generator
                      </h3>
                      <button 
                        onClick={() => handleCopy(leadResult, 'lead')}
                        className="text-[#86868b] hover:text-[#0071e3] transition-colors"
                      >
                        {copied === 'lead' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="bg-[#fbfbfd] border border-gray-100 rounded-2xl p-6 text-[#1d1d1f] whitespace-pre-wrap font-medium leading-relaxed">
                      {leadResult}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hook Results */}
              {hookResults && activeTab === 'hook' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#0071e3]" /> Psychological Analysis
                    </h3>
                    <p className="text-[#1d1d1f] leading-relaxed text-sm whitespace-pre-wrap">{hookResults.analysis}</p>
                  </div>
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#0071e3]" /> 5 Viral Hooks for Your Brand
                    </h3>
                    <div className="space-y-4">
                      {hookResults.hooks.map((hook, idx) => (
                        <div key={idx} className="p-5 bg-[#fbfbfd] border border-gray-100 rounded-2xl flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-[#1d1d1f] text-sm font-medium pt-1.5 leading-relaxed">{hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bulk Results */}
              {bulkResults && activeTab === 'bulk' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-[#1d1d1f] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#0071e3]" /> 10-Post Content Calendar
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bulkResults.calendar.map((post, idx) => (
                      <div key={idx} className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#fbfbfd]">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                            <span className="text-xs bg-[#f5f5f7] text-[#86868b] px-3 py-1 rounded-full">{post.day}</span>
                            {post.platform.toLowerCase().includes('twitter') ? <Twitter className="w-4 h-4 text-[#1da1f2] fill-current" /> : <Linkedin className="w-4 h-4 text-[#0a66c2] fill-current" />}
                            {post.platform}
                          </div>
                          <button onClick={() => setSchedulingPost({ content: post.content, platform: post.platform })} className="text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] flex items-center gap-1 bg-[#f5f5f7] px-3 py-1.5 rounded-full transition-colors">
                            <Clock className="w-3 h-3" /> Schedule
                          </button>
                        </div>
                        <div className="p-6 text-sm text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* PRICING PAGE (PAYWALL) */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center pt-16 pb-32"
            >
              <h2 className="text-5xl font-semibold tracking-tighter text-[#1d1d1f] mb-6">Simple, transparent pricing</h2>
              <p className="text-xl text-[#86868b] mb-16 max-w-2xl mx-auto font-medium">Stop paying agencies $2,000/mo. Automate your content for a fraction of the cost.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                {/* Free Tier */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Hobby</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-bold tracking-tighter text-[#1d1d1f]">$0</span>
                    <span className="text-[#86868b] font-medium">/month</span>
                  </div>
                  <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-3 text-[#1d1d1f]"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> 3 Generations per month</li>
                    <li className="flex items-center gap-3 text-[#1d1d1f]"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Standard AI Models</li>
                    <li className="flex items-center gap-3 text-[#86868b]"><Lock className="w-5 h-5 opacity-50" /> No Bulk Processing</li>
                  </ul>
                  <button 
                    onClick={() => setView('dashboard')}
                    className="w-full py-4 rounded-full font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                  >
                    Current Plan
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="bg-[#1d1d1f] border border-[#1d1d1f] rounded-[2.5rem] p-10 shadow-2xl relative">
                  <div className="absolute top-0 right-10 transform -translate-y-1/2">
                    <span className="bg-[#0071e3] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">Most Popular</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Creator Pro</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-bold tracking-tighter text-white">$29</span>
                    <span className="text-gray-400 font-medium">/month</span>
                  </div>
                  <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Unlimited Generations</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Advanced AI Models (Gemini Pro)</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Bulk CSV Uploads</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Custom Brand Voice</li>
                  </ul>
                  <button className="w-full py-4 rounded-full font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] transition-colors shadow-lg shadow-[#0071e3]/20">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
