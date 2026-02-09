
import React, { useState, useRef } from 'react';
import { 
  ImageIcon, 
  Wand2, 
  Download, 
  RefreshCw, 
  Layers, 
  Search, 
  Video, 
  Edit3, 
  Upload, 
  X,
  Play,
  Key,
  FileText
} from 'lucide-react';
import { 
  generateImageWithGemini, 
  editImageWithGemini, 
  analyzeMediaWithGemini, 
  generateVideoWithVeo 
} from '../services/geminiService';

type LabTab = 'imagine' | 'edit' | 'analyze' | 'video';

interface LabResult {
  url?: string;
  text?: string;
  prompt: string;
  type: 'image' | 'video' | 'analysis';
  timestamp: number;
}

interface UploadedFile {
  base64: string;
  mimeType: string;
  preview: string;
}

const CreativeLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabTab>('imagine');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LabResult[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Explicitly type the files array as File[] to avoid 'unknown' type errors when accessing file properties
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    // Strict limit of 4 images for multi-editing
    const remainingSlots = 4 - uploadedFiles.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedFiles(prev => [...prev, {
          base64,
          mimeType: file.type,
          preview: URL.createObjectURL(file)
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAction = async () => {
    if (!prompt.trim() && activeTab !== 'analyze') return;
    setLoading(true);

    try {
      const timestamp = Date.now();
      if (activeTab === 'imagine') {
        const res = await generateImageWithGemini(prompt, aspectRatio);
        setResults(prev => [{ url: res.imageUrl, prompt: res.prompt, type: 'image', timestamp }, ...prev]);
      } else if (activeTab === 'edit') {
        if (uploadedFiles.length === 0) throw new Error("Upload at least one image, Dominator!");
        const editedUrl = await editImageWithGemini(uploadedFiles, prompt);
        setResults(prev => [{ url: editedUrl, prompt: `Edited Mission: ${prompt}`, type: 'image', timestamp }, ...prev]);
      } else if (activeTab === 'analyze') {
        if (uploadedFiles.length === 0) throw new Error("Upload media to analyze!");
        const analysis = await analyzeMediaWithGemini(uploadedFiles, prompt || "Give me a raw, high-detail description of this media.");
        // Raw analysis: store only text, no generated image
        setResults(prev => [{ text: analysis, prompt: `Analyzed: ${prompt || 'General View'}`, type: 'analysis', timestamp }, ...prev]);
      } else if (activeTab === 'video') {
        // Fix: Implement mandatory API key selection check and handle 'Requested entity not found' errors by prompting key selection again
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
        
        try {
          const videoUrl = await generateVideoWithVeo(prompt, aspectRatio === '9:16' ? '9:16' : '16:9');
          setResults(prev => [{ url: videoUrl, prompt, type: 'video', timestamp }, ...prev]);
        } catch (videoError: any) {
          if (videoError.message?.includes("Requested entity was not found")) {
            await (window as any).aistudio.openSelectKey();
          }
          throw videoError;
        }
      }
      setPrompt('');
      // Optionally clear uploads after success for some tabs
      if (activeTab === 'imagine' || activeTab === 'video') setUploadedFiles([]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'imagine', label: 'Imagine', icon: Wand2 },
    { id: 'edit', label: 'Multi-Edit', icon: Edit3 },
    { id: 'analyze', label: 'Analyze', icon: Search },
    { id: 'video', label: 'Video Gen', icon: Video },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 flex-1 overflow-y-auto scroll-smooth">
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as LabTab);
                setUploadedFiles([]);
              }}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(activeTab === 'edit' || activeTab === 'analyze') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Upload Assets {activeTab === 'edit' && `(${uploadedFiles.length}/4)`}
                </label>
                {uploadedFiles.length > 0 && (
                  <button onClick={() => setUploadedFiles([])} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Clear All</button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-50 bg-gray-50">
                    <img src={file.preview} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur shadow-sm rounded-lg hover:bg-white text-gray-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {uploadedFiles.length < 4 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-gray-100 hover:border-indigo-200 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-gray-50 transition-all"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">Add Asset</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
              {activeTab === 'analyze' ? 'Raw Analysis Focus' : 'Dominator Direction'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'imagine' ? "Describe your vision in 10x detail..." :
                activeTab === 'edit' ? "Merge these images, change the sky, or add objects..." :
                activeTab === 'analyze' ? "Tell me exactly what is in this media. Be raw and descriptive." :
                "A cinematic 1080p video of a futuristic Dhaka..."
              }
              className="w-full h-24 p-5 rounded-3xl bg-gray-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all text-gray-800 font-bold placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">Aspect Ratio</span>
              {['1:1', '4:3', '16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleAction}
              disabled={loading || (!prompt.trim() && activeTab !== 'analyze')}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black flex items-center space-x-3 transition-all shadow-2xl shadow-indigo-100 active:scale-95 disabled:opacity-30"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : activeTab === 'analyze' ? (
                <Search className="w-5 h-5" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              <span>
                {loading ? 'Dominating...' : 
                 activeTab === 'analyze' ? 'Analyze Raw Data' : 'Initialize Build'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Results Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {results.map((item, idx) => (
            <div key={item.timestamp} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 group hover:shadow-2xl transition-all duration-500 animate-in zoom-in-95">
              {item.type === 'analysis' ? (
                <div className="p-8 space-y-6 flex flex-col h-full bg-indigo-50/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Raw Analysis</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-60 scrollbar-hide">
                    <p className="text-sm text-gray-700 font-bold leading-relaxed whitespace-pre-wrap italic">
                      {item.text}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-indigo-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase truncate">Source: {item.prompt}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="aspect-square relative bg-gray-900">
                    {item.type === 'video' ? (
                      <video src={item.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} alt="Result" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                      {item.url && (
                        <a href={item.url} download={`cereon-lab-${idx}`} className="p-4 bg-white rounded-full hover:scale-110 transition cursor-pointer shadow-xl">
                          <Download className="w-6 h-6 text-gray-900" />
                        </a>
                      )}
                      {item.type === 'video' && <div className="p-4 bg-indigo-600 rounded-full shadow-xl"><Play className="w-6 h-6 text-white" /></div>}
                    </div>
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${item.type === 'image' ? 'bg-indigo-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 font-semibold leading-relaxed">
                      {item.prompt}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {!loading && results.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-gray-300 space-y-6">
              <div className="p-8 bg-white rounded-[3rem] shadow-sm">
                 <ImageIcon className="w-16 h-16 opacity-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-xl text-gray-400">Empty Laboratory</p>
                <p className="text-sm font-bold opacity-60">Dominator, your next build awaits initialization.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeLab;
