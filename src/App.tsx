import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Sparkles, ArrowRight, 
  CheckCircle2, Lock, Copy, Loader2, Image as ImageIcon, Settings2,
  TrendingUp, Calendar, Wand2,
  Video, Fingerprint, Repeat, Send, Download, FileText, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type TabType = 'repurpose' | 'hook' | 'bulk' | 'thumbnail' | 'script' | 'voice' | 'steal' | 'lead' | 'ideas';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'pricing'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('thumbnail');
  const [credits, setCredits] = useState(3);
  const [input, setInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thumbnailResult, setThumbnailResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [schedulingPost, setSchedulingPost] = useState<{ content: string, platform: string } | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [thumbnailMetadata, setThumbnailMetadata] = useState<{ titles: string[], description: string } | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [ideaResult, setIdeaResult] = useState<{
    name: string;
    tagline: string;
    problem: string;
    solution: string;
    targetAudience: string;
    monetization: string;
    techStack: string;
    marketingStrategy: string;
  } | null>(null);
  
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

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (credits <= 0) {
      setView('pricing');
      return;
    }

    setIsGenerating(true);
    setThumbnailResult(null);
    setThumbnailMetadata(null);

    try {
      const parts: any[] = [];
      if (input.trim()) {
        parts.push({ text: `Input Text (or URL to research): "${input}"` });
      }

      if (activeTab === 'thumbnail') {
        // First, generate a concise image prompt from the user's input
        const promptResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `You are an expert AI image prompt engineer. Based on the following topic, title, or article, create a highly detailed, cinematic, and eye-catching prompt for an AI image generator (FLUX.1) to create a viral YouTube thumbnail. 

CRITICAL INSTRUCTIONS:
- FLUX.1 responds well to natural, descriptive language. Describe the scene, lighting, camera angle, and subject in detail.
- MAKE IT LOOK LIKE A REAL YOUTUBE THUMBNAIL: Explicitly include instructions for "bold, massive 3D text overlay with a catchy short phrase", "exaggerated reaction face (shocked, excited)", "glowing outlines", "bright neon arrows or circles", and "split-screen or dynamic layout".
- The prompt MUST explicitly ask for text to be rendered on the image (e.g., "Bold 3D text saying 'OMG!'").
- Explicitly specify "high quality, masterpiece, 8k resolution, vibrant colors, high contrast, YouTube thumbnail style, engaging, clickbait".
- Ensure the subject is fully in frame and well-composed.
- AVOID ANY words related to violence, weapons, guns, gore, or NSFW content. The image generator has strict safety filters. Use safe alternatives like "intense gaming action", "glowing smartphone", "excited gamer".
- Keep the prompt under 500 characters. 
- Return ONLY the prompt text, nothing else.

Input: ${input}`
        });
        
        const optimizedPrompt = promptResponse.text?.trim() || input.substring(0, 500);

        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: optimizedPrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio
            }
          }
        });
        
        let foundImage = false;
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setThumbnailResult(`data:image/jpeg;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
        
        if (!foundImage) {
          throw new Error("Failed to generate thumbnail image.");
        }
      }

      setCredits(prev => prev - 1);

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateIdea = async () => {
    if (!input.trim()) return;
    if (credits <= 0) {
      setView('pricing');
      return;
    }

    setIsGeneratingIdea(true);
    setIdeaResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert SaaS founder and product strategist. The user is a "vibe coder" (a solo developer who loves building cool, modern web/mobile apps). Based on their input: "${input}", generate a powerful, highly profitable SaaS or App idea.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Catchy name for the app/SaaS" },
              tagline: { type: Type.STRING, description: "A punchy, one-sentence tagline" },
              problem: { type: Type.STRING, description: "The core problem this solves" },
              solution: { type: Type.STRING, description: "How this app solves the problem" },
              targetAudience: { type: Type.STRING, description: "Who will buy/use this" },
              monetization: { type: Type.STRING, description: "How to make money from it" },
              techStack: { type: Type.STRING, description: "Recommended modern tech stack (e.g., Next.js, Supabase, Tailwind)" },
              marketingStrategy: { type: Type.STRING, description: "How to get the first 100 users" }
            },
            required: ["name", "tagline", "problem", "solution", "targetAudience", "monetization", "techStack", "marketingStrategy"]
          }
        }
      });

      if (response.text) {
        setIdeaResult(JSON.parse(response.text));
        setCredits(prev => prev - 1);
      }
    } catch (error) {
      console.error("Failed to generate idea:", error);
      alert("Failed to generate idea. Please try again.");
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-[#fbfbfd] text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-white/70 border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#1d1d1f]">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <span>ThumbnailAI</span>
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
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" /> The #1 AI Thumbnail Generator
              </div>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-[#1d1d1f] mb-6 max-w-4xl leading-[1.05]">
                Generate viral <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#409cff]">YouTube thumbnails.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#86868b] mb-12 max-w-2xl leading-relaxed font-medium">
                Stop wasting hours in Photoshop. Describe your video idea, and instantly generate high-converting, clickbait-style thumbnails with bold text and glowing effects.
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
                <h2 className="text-4xl font-semibold tracking-tighter text-[#1d1d1f]">
                  {activeTab === 'ideas' ? 'Vibe Coder Ideas' : 'Thumbnail Studio Pro'}
                </h2>
                <p className="text-[#86868b] mt-3 text-lg">
                  {activeTab === 'ideas' ? 'Generate highly profitable SaaS and App ideas for solo developers.' : 'Generate high-converting, clickbait-style YouTube thumbnails in seconds.'}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#f5f5f7] p-1.5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
                {[
                  { id: 'thumbnail', label: 'Thumbnail AI', icon: <ImageIcon className="w-4 h-4" />, active: true },
                  { id: 'ideas', label: 'SaaS Ideas', icon: <Lightbulb className="w-4 h-4" />, active: true },
                  { id: 'repurpose', label: 'Repurpose', icon: <Sparkles className="w-4 h-4" />, active: false },
                  { id: 'hook', label: 'Hook Analyzer', icon: <TrendingUp className="w-4 h-4" />, active: false },
                  { id: 'bulk', label: 'Bulk Calendar', icon: <Calendar className="w-4 h-4" />, active: false },
                  { id: 'script', label: 'Viral Script', icon: <Video className="w-4 h-4" />, active: false },
                  { id: 'voice', label: 'Brand Voice', icon: <Fingerprint className="w-4 h-4" />, active: false },
                  { id: 'steal', label: 'Steal & Spin', icon: <Repeat className="w-4 h-4" />, active: false },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    disabled={!tab.active}
                    onClick={() => { if(tab.active) { setActiveTab(tab.id as TabType); setInput(''); } }} 
                    className={`relative px-4 py-2.5 font-medium text-sm whitespace-nowrap flex items-center gap-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'} ${!tab.active && 'opacity-50 cursor-not-allowed'}`}
                  >
                    {tab.icon} {tab.label}
                    {!tab.active && (
                      <span className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
                <div className="relative">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeTab === 'ideas' ? "What kind of tech stack do you like? Or what industry are you interested in? (e.g., 'I love Next.js and want to build an AI tool for real estate agents')" : "Describe the thumbnail you want, or paste your YouTube video title here... (e.g., 'A shocked gamer looking at a glowing 2GB RAM phone with neon text IT WORKED!')"}
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
                  <button 
                    onClick={activeTab === 'ideas' ? handleGenerateIdea : handleGenerate}
                    disabled={(activeTab === 'ideas' ? isGeneratingIdea : isGenerating) || !input.trim()}
                    className="w-full sm:w-auto bg-[#0071e3] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(activeTab === 'ideas' ? isGeneratingIdea : isGenerating) ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {activeTab === 'ideas' ? 'Generating Idea...' : 'Generating Thumbnail...'}</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> {activeTab === 'ideas' ? 'Generate Idea' : 'Generate Thumbnail'}</>
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

              {/* Idea Results */}
              {ideaResult && activeTab === 'ideas' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <div className="mb-8 border-b pb-8 border-gray-100">
                      <h3 className="text-3xl font-bold mb-2 flex items-center gap-3 text-[#1d1d1f]">
                        <Lightbulb className="w-8 h-8 text-[#0071e3]" /> {ideaResult.name}
                      </h3>
                      <p className="text-xl font-medium text-[#0071e3]">{ideaResult.tagline}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">The Problem</h4>
                          <p className="text-sm leading-relaxed text-[#1d1d1f]">{ideaResult.problem}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">The Solution</h4>
                          <p className="text-sm leading-relaxed text-[#1d1d1f]">{ideaResult.solution}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">Target Audience</h4>
                          <p className="text-sm leading-relaxed text-[#1d1d1f]">{ideaResult.targetAudience}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-[#fbfbfd] border border-gray-100">
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">Tech Stack</h4>
                          <p className="text-sm font-mono text-[#0071e3]">{ideaResult.techStack}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#fbfbfd] border border-gray-100">
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">Monetization</h4>
                          <p className="text-sm leading-relaxed text-[#1d1d1f]">{ideaResult.monetization}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#fbfbfd] border border-gray-100">
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-[#86868b]">Marketing Strategy</h4>
                          <p className="text-sm leading-relaxed text-[#1d1d1f]">{ideaResult.marketingStrategy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Thumbnail Results */}
              {thumbnailResult && activeTab === 'thumbnail' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[#1d1d1f]">
                      <ImageIcon className="w-5 h-5 text-[#0071e3]" /> Your Generated Thumbnail
                    </h3>
                    <div className="relative rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 bg-[#fbfbfd]">
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
              <p className="text-xl text-[#86868b] mb-16 max-w-2xl mx-auto font-medium">Stop paying designers $50 per thumbnail. Generate unlimited viral thumbnails for a fraction of the cost.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                {/* Free Tier */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Hobby</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-bold tracking-tighter text-[#1d1d1f]">$0</span>
                    <span className="text-[#86868b] font-medium">/month</span>
                  </div>
                  <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-3 text-[#1d1d1f]"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> 3 Thumbnails per month</li>
                    <li className="flex items-center gap-3 text-[#1d1d1f]"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Standard Quality</li>
                    <li className="flex items-center gap-3 text-[#86868b]"><Lock className="w-5 h-5 opacity-50" /> No Title Variations</li>
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
                    <span className="text-5xl font-bold tracking-tighter text-white">$19</span>
                    <span className="text-gray-400 font-medium">/month</span>
                  </div>
                  <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Unlimited Thumbnails</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> 8K Masterpiece Quality</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> AI Title & Description Generator</li>
                    <li className="flex items-center gap-3 text-gray-200"><CheckCircle2 className="w-5 h-5 text-[#0071e3]" /> Commercial Rights</li>
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
