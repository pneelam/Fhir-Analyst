
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

interface ChatbotProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

/**
 * A component that provides a chat interface for users to ask questions
 * about the processed FHIR data.
 */
const Chatbot: React.FC<ChatbotProps> = ({ history, onSendMessage, isLoading }) => {
  // State to manage the user's current input in the text field.
  const [input, setInput] = useState('');
  // Ref to the end of the message list, used for auto-scrolling.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls the message list to the bottom to ensure the latest message is visible.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // This effect runs whenever the chat history changes, ensuring the view scrolls down.
  useEffect(scrollToBottom, [history]);

  /**
   * Handles the submission of the message input form.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput(''); // Clear the input field after sending.
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message display area */}
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {/* Bot message styling */}
            {msg.sender === 'bot' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
                <BotIcon />
              </div>
            )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none' // User messages on the right
                  : 'bg-slate-700 text-slate-200 rounded-bl-none' // Bot messages on the left
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
             {/* User message styling */}
             {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
        {/* Loading indicator for when the bot is "typing" */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="max-w-md p-3 rounded-lg bg-slate-700 rounded-bl-none">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        {/* Empty div at the end of the list for the auto-scroll ref */}
        <div ref={messagesEndRef} />
      </div>
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the data..."
          className="flex-grow bg-slate-700 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-sky-600 rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
