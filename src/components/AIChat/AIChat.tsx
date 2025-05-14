import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { streamChatMessage, DifyMessage, DifyStreamChunk } from 'services/difyService';

interface Message extends DifyMessage {
  id: string;
  isLoading?: boolean;  // Flag to display loading indicator while streaming assistant messages
}

interface AIChatProps {
  selectedCrypto?: 'BTC' | 'ETH' | 'SOL'; // Selected cryptocurrency type
}

const AIChat: React.FC<AIChatProps> = ({ selectedCrypto = 'BTC' }) => {
  // Initialize message based on selected crypto
  const initialMessage = {
    BTC: 'Hello! Looking for advice on Bitcoin (BTC) options trading? Ask me about pricing, strategies, risk management, or any other questions you might have.',
    ETH: 'Interested in Ethereum (ETH) options trading? What would you like to know about ETH options markets or strategies?',
    SOL: 'Need help with Solana (SOL) options trading? Feel free to ask about liquidity, strategies, or risk management approaches.'
  }[selectedCrypto] || 'Hello! Need advice on options trading? What kind of trades are you interested in?';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: String(Date.now()),
      role: 'assistant',
      content: initialMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset conversation when selected crypto changes
  useEffect(() => {
    const newInitialMessage = {
      BTC: 'Hello! Looking for advice on Bitcoin (BTC) options trading? Ask me about pricing, strategies, risk management, or any other questions you might have.',
      ETH: 'Interested in Ethereum (ETH) options trading? What would you like to know about ETH options markets or strategies?',
      SOL: 'Need help with Solana (SOL) options trading? Feel free to ask about liquidity, strategies, or risk management approaches.'
    }[selectedCrypto] || 'Hello! Need advice on options trading? What kind of trades are you interested in?';
    
    // Reset conversation with new initial message
    setConversationId(undefined);
    setMessages([
      {
        id: String(Date.now()),
        role: 'assistant',
        content: newInitialMessage,
      },
    ]);
  }, [selectedCrypto]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userInput: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userInput]);
    setInput('');
    setIsLoading(true);

    // Prepare for streaming assistant message
    const assistantMessageId = String(Date.now() + 1);
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '', // Start with empty content
        isLoading: true,
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      let currentContent = '';
      const stream = streamChatMessage(
        userInput.content,
        conversationId,
        abortControllerRef.current
      );

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Stream aborted by client');
          break;
        }

        if (chunk.event === 'agent_message' || chunk.event === 'message') {
          currentContent += chunk.answer || '';
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: currentContent, isLoading: true }
                : msg
            )
          );
        } else if (chunk.event === 'agent_message_end' || chunk.event === 'message_end') {
          setConversationId(chunk.conversation_id);
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: currentContent, isLoading: false, id: chunk.id || assistantMessageId } // Update ID if available from Dify
                : msg
            )
          );
          break; // End of stream for this message
        } else if (chunk.event === 'error') {
          console.error('Streaming Error:', chunk.data);
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: `Error: ${chunk.data?.message || 'Unknown error'}`, isLoading: false }
                : msg
            )
          );
          break;
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${error.message || 'Failed to get response'}`, isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isLoading: false } : msg
        )
      );
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  // Get display text based on selected crypto
  const getCryptoContext = () => {
    return {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana'
    }[selectedCrypto] || 'Bitcoin';
  };

  // Use site's primary purple color scheme
  const accentColor = 'from-funoption-primary-from to-funoption-primary-to';

  return (
    <div className="w-full h-full flex flex-col bg-funoption-card-bg rounded-2xl shadow-xl overflow-hidden">
      {/* Chat header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${accentColor} text-white`}>
        <h2 className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.5 2.25m0 0v5.8a2.25 2.25 0 01-1.5 2.25m0 0a4.5 4.5 0 01-4.5 0m3-8.25v-5.8a2.25 2.25 0 00-1.5-2.25m0 0a4.5 4.5 0 00-4.5 0" />
          </svg>
          {getCryptoContext()} Trading Assistant
        </h2>
      </div>

      {/* Message container */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
          >
            <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              {/* Avatar icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 
                ${message.role === 'user' ? 'bg-funoption-primary-from text-white' : `bg-gradient-to-r ${accentColor} text-white`}`}
              >
                {message.role === 'assistant' ? 'AI' : 'You'}
              </div>
              
              {/* Message content */}
              <div className={`p-3 rounded-2xl 
                ${message.role === 'user' 
                  ? 'bg-funoption-primary-from/20 text-white' 
                  : 'bg-funoption-card-bg-hover text-white'}`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isLoading && message.role === 'assistant' && (
                    <span className="inline-flex ml-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse animation-delay-200">.</span>
                      <span className="animate-pulse animation-delay-400">.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSend} className="p-4 border-t border-funoption-border bg-funoption-card-bg-hover flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${getCryptoContext()} options trading...`}
          rows={2}
          disabled={isLoading}
          className="flex-grow rounded-xl px-4 py-3 bg-funoption-card-bg text-white border border-funoption-border focus:outline-none focus:ring-2 focus:ring-funoption-primary-from/50 resize-none"
        />
        <div className="flex flex-col gap-2">
          <button 
            type="submit" 
            disabled={input.trim() === '' || isLoading}
            className={`px-4 py-2 rounded-xl bg-gradient-to-r ${accentColor} text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Send
          </button>
          {isLoading && (
            <button 
              type="button" 
              onClick={handleStopStreaming} 
              className="px-4 py-2 rounded-xl bg-funoption-danger/20 hover:bg-funoption-danger/30 text-funoption-danger font-semibold transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </form>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-black/30 text-gray-400 text-xs text-center">
        AI responses are for informational purposes only. Always do your own research.
      </div>
    </div>
  );
};

export default AIChat;
