'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCheck, MessageCircle, Send, User as UserIcon, Wifi } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Surface from '@/components/ui/Surface';
import { cn } from '@/lib/cn';
import { getMediaUrl } from '@/lib/media';
import { chatService, ChatMessage } from '@/services/chat.service';
import { userService } from '@/services/user.service';

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.userId);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'polling'>('connecting');
    const [otherUser, setOtherUser] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastMessageIdRef = useRef<number>(0);
    const socketRef = useRef<WebSocket | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        lastMessageIdRef.current = messages.reduce((maxId, message) => Math.max(maxId, message.id), 0);
    }, [messages]);

    const appendMessages = useCallback((incomingMessages: ChatMessage[]) => {
        if (incomingMessages.length === 0) return;

        setMessages((previousMessages) => {
            const existingIds = new Set(previousMessages.map((message) => message.id));
            const uniqueMessages = incomingMessages.filter((message) => !existingIds.has(message.id));
            if (uniqueMessages.length === 0) return previousMessages;

            return [...previousMessages, ...uniqueMessages].sort(
                (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
            );
        });
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const me = await userService.getMe();
            setCurrentUserId(Number(me.id));

            const otherUserProfile = await userService.getPublicProfile(userId);
            setOtherUser({
                display_name: otherUserProfile.profile?.display_name || null,
                avatar_url: otherUserProfile.profile?.avatar_url || null,
            });

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

    useEffect(() => {
        const socketUrl = chatService.getWebSocketUrl();
        let reconnectTimer: number | undefined;
        let isActive = true;

        const connect = () => {
            if (!socketUrl || !isActive) {
                setConnectionState('polling');
                return;
            }

            setConnectionState('connecting');
            const socket = new WebSocket(socketUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                setConnectionState('live');
                socket.send(JSON.stringify({ type: 'ping' }));
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type !== 'message:new') return;

                    const message = payload.message as ChatMessage;
                    if (message.sender_id === userId || message.receiver_id === userId) {
                        appendMessages([message]);
                    }
                } catch (error) {
                    console.error('Failed to parse chat websocket event', error);
                }
            };

            socket.onerror = () => {
                setConnectionState('polling');
            };

            socket.onclose = () => {
                if (!isActive) return;
                setConnectionState('polling');
                reconnectTimer = window.setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            isActive = false;
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [appendMessages, userId]);

    useEffect(() => {
        let isActive = true;

        const pollNewMessages = async () => {
            try {
                const afterId = lastMessageIdRef.current;
                if (!afterId) return;
                const latest = await chatService.getNewMessages(userId, afterId);
                if (isActive) {
                    appendMessages(latest);
                }
            } catch (error) {
                console.error('Failed to poll chat messages', error);
            }
        };

        const interval = window.setInterval(pollNewMessages, connectionState === 'live' ? 15_000 : 4_000);
        return () => {
            isActive = false;
            window.clearInterval(interval);
        };
    }, [appendMessages, connectionState, userId]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const sent = await chatService.sendMessage({
                receiver_id: userId,
                content: messageContent,
            });
            appendMessages([sent]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setNewMessage(messageContent);
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

    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
        const messageDate = formatDate(message.created_at);
        if (messageDate !== currentDate) {
            currentDate = messageDate;
            groupedMessages.push({ date: messageDate, messages: [message] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(message);
        }
    });

    return (
        <div className="flex h-full min-h-full flex-col px-4 pb-4 pt-4" dir="rtl">
            <header className="relative shrink-0 overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_48%,#334155_100%)]" />
                <div className="absolute -left-12 top-0 h-28 w-28 rounded-full bg-rose-500/25 blur-3xl" />
                <div className="absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-emerald-400/16 blur-3xl" />
                <div className="relative flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                        aria-label="بازگشت"
                    >
                        <ArrowRight size={19} />
                    </button>
                    <div className="min-w-0 flex-1 text-center">
                        <h1 className="truncate text-base font-black tracking-tight">
                            {otherUser?.display_name || 'گفت‌وگو'}
                        </h1>
                        <p className="mt-0.5 inline-flex items-center justify-center gap-1 truncate text-xs text-white/60">
                            {!isLoading && <Wifi size={12} className={connectionState === 'live' ? 'text-emerald-300' : 'text-amber-300'} />}
                            {isLoading ? 'در حال بارگذاری...' : connectionState === 'live' ? 'اتصال زنده' : 'همگام سازی خودکار'}
                        </p>
                    </div>
                    <Avatar src={otherUser?.avatar_url} name={otherUser?.display_name} />
                </div>
            </header>

            <Surface className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    </div>
                ) : (
                    <>
                        <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-3 py-4 sm:px-5">
                            {groupedMessages.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <EmptyState
                                        className="max-w-md border-slate-100 bg-white shadow-none"
                                        icon={<MessageCircle size={30} />}
                                        title="هنوز پیامی رد و بدل نشده"
                                        description="اولین پیام را بنویس تا گفت‌وگو شروع شود."
                                    />
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {groupedMessages.map((group, groupIndex) => (
                                        <div key={groupIndex}>
                                            <div className="mb-4 flex items-center justify-center">
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-400 shadow-sm">
                                                    {group.date}
                                                </span>
                                            </div>

                                            {group.messages.map((message) => {
                                                const isMyMessage = message.sender_id === currentUserId;
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={cn('mb-3 flex', isMyMessage ? 'justify-start' : 'justify-end')}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'max-w-[78%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[68%]',
                                                                isMyMessage
                                                                    ? 'rounded-tr-md bg-gradient-to-r from-rose-500 to-orange-500 text-white'
                                                                    : 'rounded-tl-md border border-slate-100 bg-white text-slate-800',
                                                            )}
                                                        >
                                                            <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                                                            <p className={cn('mt-1 flex items-center gap-1 text-[10px]', isMyMessage ? 'justify-start text-white/70' : 'justify-end text-slate-400')}>
                                                                <span>{formatTime(message.created_at)}</span>
                                                                {isMyMessage && (
                                                                    <CheckCheck size={13} className={message.is_read ? 'text-emerald-100' : 'text-white/55'} />
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </main>

                        <footer className="border-t border-slate-100 bg-white p-3 sm:p-4">
                            <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(event) => setNewMessage(event.target.value)}
                                    onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && handleSend()}
                                    placeholder="پیام خود را بنویسید..."
                                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || isSending}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_12px_26px_rgba(244,63,94,0.22)] transition hover:from-rose-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </Surface>
        </div>
    );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || 'کاربر'}
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                />
            ) : (
                <UserIcon size={19} className="text-slate-400" />
            )}
        </div>
    );
}
