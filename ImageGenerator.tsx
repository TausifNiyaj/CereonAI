
import React, { useState } from 'react';
import { ImageIcon, Wand2, Download, RefreshCw, Layers } from 'lucide-react';
import { generateImageWithGemini } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ url: string; prompt: string }[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await generateImageWithGemini(prompt, aspectRatio);
      setResults(prev => [{ url: res.imageUrl, prompt: res.prompt }, ...prev]);
    } catch (e) {
      alert("Failed to imagine: " + (e as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1 overflow-y-auto scroll-smooth">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Image Lab</h2>
          <p className="text-gray-500">Visualize your ideas with Cereon's high-energy engine.</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Describe your vision</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic 10x developer workspace in Dhaka, soft neon lighting, cinematic..."
              className="w-full h-32 p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600 mr-2">Aspect Ratio</span>
              {['1:1', '4:3', '16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center space-x-2 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              <span>{loading ? 'Imagining...' : 'Generate Art'}</span>
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {results.map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
              <div className="aspect-square relative">
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <a href={item.url} download={`cereon-${idx}.png`} className="p-3 bg-white rounded-full hover:scale-110 transition cursor-pointer">
                    <Download className="w-5 h-5 text-gray-900" />
                  </a>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 line-clamp-2 italic font-medium">"{item.prompt}"</p>
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-300 space-y-4">
              <ImageIcon className="w-20 h-20 opacity-20" />
              <p className="font-bold">No creations yet. Dominator, start promptin'!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
