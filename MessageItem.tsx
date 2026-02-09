
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage } from '../types';
import { ExternalLink, Edit2, X, Check, Copy, Share2 } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onEdit?: (newText: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onEdit }) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);

  const handleSaveEdit = () => {
    if (onEdit && editText.trim() !== message.text) {
      onEdit(editText);
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedContent = useMemo(() => {
    if (isUser) return message.text;

    return (
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          pre: ({ node, ...props }) => (
            <div className="relative overflow-auto w-full my-4 bg-gray-900 text-gray-100 p-5 rounded-2xl text-xs md:text-sm font-mono shadow-2xl border border-gray-800 group/code">
              <button 
                onClick={() => {
                  const code = (node?.children?.[0] as any)?.children?.[0]?.value || "";
                  navigator.clipboard.writeText(code);
                }}
                className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg opacity-0 group-hover/code:opacity-100 transition-opacity"
              >
                <Copy className="w-3 h-3" />
              </button>
              <pre {...props} />
            </div>
          ),
          code: ({ node, inline, ...props }) => (
            inline ? 
              <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-black text-sm" {...props} /> : 
              <code {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-indigo-600 hover:underline font-black decoration-2 underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-1.5 font-semibold" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-1.5 font-semibold" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-600 pl-4 py-1 my-4 italic text-gray-600 bg-indigo-50/30 rounded-r-xl" {...props} />,
        }}
      >
        {message.text}
      </ReactMarkdown>
    );
  }, [message.text, isUser]);

  return (
    <div className={`flex w-full mb-8 group animate-in fade-in slide-in-from-bottom-4 duration-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`relative max-w-[92%] md:max-w-[85%] rounded-[2rem] px-6 py-5 shadow-sm transition-all duration-300 ${
          isUser 
            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-tr-none shadow-indigo-100' 
            : message.isError 
              ? 'bg-red-50 border border-red-100 text-red-900 rounded-tl-none'
              : 'bg-white border border-gray-50 text-gray-800 rounded-tl-none hover:shadow-md'
        }`}
      >
        {/* Profile Tag for AI */}
        {!isUser && (
          <div className="absolute -top-3 left-4 bg-indigo-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100 z-10">
            Cereon AI
          </div>
        )}

        {isUser && !isEditing && (
          <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
             <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-gray-50 bg-white/50"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 min-w-[280px]">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-white/10 text-white p-3 rounded-2xl border border-white/30 focus:outline-none focus:ring-4 focus:ring-white/20 resize-none min-h-[100px] font-bold"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-white/70 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-black shadow-lg shadow-black/10 active:scale-95 transition-all">
                Resubmit
              </button>
            </div>
          </div>
        ) : (
          <div className={`text-sm md:text-[1.05rem] font-medium leading-relaxed ${isUser ? 'font-bold' : ''}`}>
            {renderedContent}
          </div>
        )}

        {/* Sources & Grounding */}
        {message.groundingUrls && message.groundingUrls.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between mb-2">
               <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-300">Dominator Sources</p>
               <button onClick={handleCopy} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center">
                 <Copy className="w-2.5 h-2.5 mr-1" />
                 {copied ? 'Copied' : 'Copy'}
               </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingUrls.map((url, i) => (
                <a 
                  key={i} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-[10px] bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl transition-all border border-indigo-100/30 font-bold"
                >
                  <ExternalLink className="w-2.5 h-2.5 mr-1.5" />
                  {new URL(url).hostname}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
