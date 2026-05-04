'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Send, User as UserIcon } from 'lucide-react';
import { chatService, ChatMessage } from '@/services/chat.service';
import { userService } from '@/services/user.service';
import { getMediaUrl } from '@/lib/media';

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.userId);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [otherUser, setOtherUser] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Get current user
            const me = await userService.getMe();
            setCurrentUserId(Number(me.id));

            // Get other user's profile
            const otherUserProfile = await userService.getPublicProfile(userId);
            setOtherUser({
                display_name: otherUserProfile.profile?.display_name || null,
                avatar_url: otherUserProfile.profile?.avatar_url || null
            });

            // Get message history
            const history = await chatService.getMessageHistory(userId);
            setMessages(history);
        } catch (error) {
            console.error('Failed to fetch chat data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const sent = await chatService.sendMessage({
                receiver_id: userId,
                content: messageContent
            });
            setMessages([...messages, sent]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setNewMessage(messageContent); // Restore message on error
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fa-IR');
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
        const msgDate = formatDate(msg.created_at);
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 font-sans flex flex-col" dir="rtl">
            <div className="w-full bg-white min-h-full flex flex-col">
                {/* Header */}
                <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {otherUser?.avatar_url ? (
                                <Image
                                    src={getMediaUrl(otherUser.avatar_url)}
                                    alt={otherUser.display_name || 'User'}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-sm">
                                {otherUser?.display_name || 'کاربر'}
                            </h1>
                            <p className="text-xs text-gray-400">آنلاین</p>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
                    {groupedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Send className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-gray-500 text-sm">
                                هنوز پیامی ندارید. اولین پیام رو بفرست!
                            </p>
                        </div>
                    ) : (
                        groupedMessages.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                {/* Date separator */}
                                <div className="flex items-center justify-center my-4">
                                    <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                                        {group.date}
                                    </span>
                                </div>

                                {/* Messages */}
                                {group.messages.map((msg) => {
                                    const isMyMessage = msg.sender_id === currentUserId;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex mb-3 ${isMyMessage ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMyMessage
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                                                    }`}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {msg.content}
                                                </p>
                                                <p className={`text-[10px] mt-1 ${isMyMessage ? 'text-blue-200' : 'text-gray-400'
                                                    }`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* Input Area */}
                <footer className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="پیام خود را بنویسید..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || isSending}
                            className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
