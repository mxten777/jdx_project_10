import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { useChat } from '../hooks/useChat';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function ChatRoom() {
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const {
    messages,
    loading,
    sending,
    typingUsers,
    onlineUsers,
    sendMessage,
    updateTypingIndicator,
    clearTypingIndicator,
    addReaction,
    markAsRead
  } = useChat();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      clearTypingIndicator();
    }, 2000);
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const result = await sendMessage(message, 'text', replyTo || undefined);
    
    if (result.success) {
      setMessage('');
      setReplyTo(null);
      scrollToBottom();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Message reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  // Mark messages as read when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              markAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, markAsRead]);

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  if (loading) {
    return (
      <Card variant="glass" className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-500">채팅을 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!auth.currentUser) {
    return (
      <Card variant="glass" className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-4">채팅에 참여하려면 로그인이 필요합니다.</p>
            <Button variant="primary">로그인</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Header */}
      <Card variant="glass" className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              JDX Alumni 채팅방
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {onlineUsers.length + 1}명 온라인
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Container */}
      <Card variant="glass" className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  data-message-id={msg.id}
                  className={`flex ${msg.authorId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.authorId === auth.currentUser?.uid ? 'order-2' : 'order-1'}`}>
                    {/* Reply indicator */}
                    {msg.replyTo && (
                      <div className="text-xs text-gray-500 mb-1 ml-12">
                        <div className="bg-gray-100 rounded p-2 border-l-2 border-primary-300">
                          {getReplyMessage(msg.replyTo)?.content.substring(0, 50)}...
                        </div>
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${msg.authorId === auth.currentUser?.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {msg.authorPhotoURL ? (
                          <img
                            src={msg.authorPhotoURL}
                            alt={msg.authorName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                            {msg.authorName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message bubble */}
                      <div className="relative group">
                        <div
                          className={`rounded-2xl px-4 py-2 max-w-sm break-words ${
                            msg.authorId === auth.currentUser?.uid
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                              : 'bg-white shadow-sm border rounded-bl-md'
                          }`}
                        >
                          {/* Author name (for others' messages) */}
                          {msg.authorId !== auth.currentUser?.uid && (
                            <p className="text-xs font-semibold text-primary-600 mb-1">
                              {msg.authorName}
                            </p>
                          )}

                          {/* Message content */}
                          <p className="text-sm leading-relaxed">{msg.content}</p>

                          {/* Reactions */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                <button
                                  key={emoji}
                                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                    userIds.includes(auth.currentUser?.uid || '')
                                      ? 'bg-primary-100 border-primary-300'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                >
                                  {emoji} {userIds.length}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message actions */}
                        <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1">
                            {/* Emoji picker trigger */}
                            <button
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                              onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                            >
                              😊
                            </button>

                            {/* Reply button */}
                            <button
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              onClick={() => setReplyTo(msg.id)}
                            >
                              ↩️
                            </button>
                          </div>

                          {/* Emoji picker */}
                          {showEmojiPicker === msg.id && (
                            <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border p-2 flex gap-1 z-10">
                              {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center"
                                  onClick={() => handleReaction(msg.id, emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className={`text-xs text-gray-400 mt-1 ${msg.authorId === auth.currentUser?.uid ? 'text-right' : 'text-left'}`}>
                          {formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: ko })}
                          {msg.isEdited && <span className="ml-1">(편집됨)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-gray-600">
                    {typingUsers.map(u => u.displayName).join(', ')}님이 입력 중...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply indicator */}
          {replyTo && (
            <div className="bg-gray-50 border-l-4 border-primary-500 p-3 mb-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">답장 중:</p>
                  <p className="text-sm font-medium truncate">
                    {getReplyMessage(replyTo)?.content}
                  </p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setReplyTo(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                variant="ghost"
                placeholder="메시지를 입력하세요..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="resize-none"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              isLoading={sending}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
