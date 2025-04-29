'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Maximize2, Minimize2, Bot } from 'lucide-react';

const CreatzionAI = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "👋 Hi! I'm Creatzion AI. Ask me anything about your salary, savings, or finances." },
  ]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowChatbot(true);
      } else {
        setShowChatbot(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // ✅ Scroll to bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isBotTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    setIsBotTyping(true);

    try {
      const response = await fetch('/api/creatzion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      const botReply = data.reply || data.error || "⚠️ No reply received.";
      setMessages([...newMessages, { role: 'bot', content: botReply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'bot', content: "⚠️ Something went wrong." }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  if (!showChatbot) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:scale-110 transition"
          onClick={() => setIsOpen(true)}
        >
          <Bot />
        </button>
      ) : (
        <div
          className={`bg-white ${
            isExpanded ? 'h-[80vh] w-[90vw] md:h-[95vh] md:w-[95vw]' : 'h-96 w-80'
          } rounded-2xl shadow-2xl flex flex-col transition-all duration-300`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">
            <span className="font-semibold text-sm">Creatzion AI</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:text-gray-200 transition"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-200 transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 rounded-xl text-sm max-w-[85%] break-words ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white self-end ml-auto'
                    : 'bg-white text-black border self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {/* Typing indicator */}
            {isBotTyping && (
              <div className="px-4 py-3 rounded-xl text-sm max-w-[85%] bg-white text-black border self-start animate-pulse">
                Thinking<span className="animate-bounce">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ask anything financial..."
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm rounded-md"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreatzionAI;
