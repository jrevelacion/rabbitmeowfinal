"use client";

import { useState, useRef, useEffect } from 'react';
import { getMovieRecommendation } from '@/lib/chatbot';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const premadeQuestions = [
    "What's a good action movie?",
    "Suggest a romantic comedy",
    "What are the latest trending shows?",
    "Recommend a sci-fi thriller",
    "Any good horror movies lately?"
  ];

  const handlePremadeQuestion = async (question: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'user', text: question }]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const reply = await getMovieRecommendation(question);
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Oops! Something went wrong.' }]);
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setInput('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const reply = await getMovieRecommendation(input);
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Oops! Something went wrong.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        /* Fallback subtle scrollbar for cases where needed */
        .custom-scrollbar.fallback::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar.fallback::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 12px;
        }
        .custom-scrollbar.fallback::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.3);
          border-radius: 12px;
        }
        .custom-scrollbar.fallback::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl shadow-2xl w-[90vw] sm:w-[400px] md:w-[450px] max-w-[500px] min-h-[300px] max-h-[80vh] border border-gray-700/50"
            role="dialog"
            aria-labelledby="chatbot-title"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 id="chatbot-title" className="text-white text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-blue-400">RabbitMeow</span> Bot
              </h2>
              <button
                className="p-2 rounded-full hover:bg-gray-800/50 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-[40vh] sm:h-[350px] md:h-[400px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-gray-400 text-sm italic mb-4 px-2">
                  Get started with these suggestions:
                  <div className="mt-3 flex flex-wrap gap-2">
                    {premadeQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 bg-gray-800/60 text-white text-xs sm:text-sm rounded-full hover:bg-blue-500/80 transition-all duration-200 shadow-sm disabled:opacity-50"
                        onClick={() => handlePremadeQuestion(question)}
                        disabled={loading}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3 px-2`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl shadow-md transition-all duration-200 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                      } text-sm sm:text-base`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef}></div>

              {/* Typing Indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-2 px-2"
                >
                  <div className="bg-gray-800/80 p-2 rounded-xl flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full p-2.5 sm:p-3 rounded-lg bg-gray-800/60 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
                placeholder="Ask about movies or shows..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                aria-label="Chat input"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white p-2.5 sm:p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors duration-200 flex items-center justify-center shadow-md"
                onClick={handleChat}
                disabled={loading}
                aria-label="Send message"
              >
                {loading ? (
                  <span className="text-sm">...</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
                    <path d="M6 12h16" />
                  </svg>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 sm:p-4 bg-blue-600/90 backdrop-blur-md rounded-full shadow-xl hover:bg-blue-700/90 transition-all duration-200 animate-pulse-slow"
            onClick={() => setIsOpen(true)}
            aria-label="Open chatbot"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6V2H8"/>
              <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/>
              <path d="M2 12h2"/>
              <path d="M9 11v2"/>
              <path d="M15 11v2"/>
              <path d="M20 12h2"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}