'use client';

import { useEffect, useState } from 'react';

const CreatzionAI = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm Creatzion AI. Ask me anything about your salary, savings, or finances." },
  ]);
  const [input, setInput] = useState('');

  // Show chatbot after scrolling 300px
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('/api/creatzion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }), // Send messages array
      });

      const data = await response.json();
      const botReply = data.reply || data.error || "⚠️ No reply received.";
      setMessages([...newMessages, { role: 'bot', content: botReply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'bot', content: "⚠️ Something went wrong." }]);
    }
  };

  if (!showChatbot) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
          onClick={() => setIsOpen(true)}
        >
          💬
        </button>
      ) : (
        <div className="bg-white w-80 h-96 rounded-xl shadow-xl flex flex-col">
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-xl">
            <span>Creatzion AI</span>
            <button onClick={() => setIsOpen(false)}>✖️</button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`my-1 p-2 rounded-lg text-sm ${
                  msg.role === 'user' ? 'bg-gray-200 text-right' : 'bg-blue-100 text-left'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex p-2 border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 text-sm border rounded-l"
              placeholder="Ask financial questions..."
            />
            <button type="submit" className="bg-blue-600 text-white px-4 rounded-r text-sm">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreatzionAI;
