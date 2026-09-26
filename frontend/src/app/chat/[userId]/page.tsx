'use client';

import Image from '@/components/ui/PublicMediaImage';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, RefreshCw, Send, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getMediaUrl } from '@/lib/media';
import { getDirectionalTextProps, getTextAlign } from '@/lib/textDirection';
import { chatService, ChatMessage } from '@/services/chat.service';
import SafeBackButton from "@/components/ui/SafeBackButton";
import UserTrustActions from '@/components/trust/UserTrustActions';
import { userService } from '@/services/user.service';
import { validateTextLength, validationMessage } from '@/validation';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';
import { computeBackoffDelayMs } from '@/lib/requestPolicy';
import { startChatHeartbeat } from '@/lib/chatHeartbeat';
import type { ChatHeartbeat } from '@/lib/chatHeartbeat';

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.userId);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [historyReady, setHistoryReady] = useState(false);
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

        lastMessageIdRef.current = incomingMessages.reduce(
            (maxId, message) => Math.max(maxId, message.id),
            lastMessageIdRef.current,
        );

        setMessages((previousMessages) => {
            const existingIds = new Set(previousMessages.map((message) => message.id));
            const uniqueMessages = incomingMessages.filter((message) => !existingIds.has(message.id));
            if (uniqueMessages.length === 0) return previousMessages;

            return [...previousMessages, ...uniqueMessages].sort(
                (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
            );
        });
    }, []);

    const markIncomingRead = useCallback(async (incomingMessages: ChatMessage[]) => {
        if (!incomingMessages.some((message) => message.sender_id === userId && !message.is_read)) return;

        const result = await chatService.markConversationRead(userId);
        const readIds = new Set(result.message_ids);
        setMessages((current) => current.map((message) => (
            (readIds.has(message.id) || message.sender_id === userId)
                ? { ...message, is_read: true }
                : message
        )));
    }, [userId]);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true);
        setLoadError('');
        setHistoryReady(false);
        try {
            const [me, otherUserProfile, history] = await Promise.all([
                userService.getMe(signal),
                userService.getPublicProfile(userId, signal),
                chatService.getMessageHistory(userId, 0, 50, signal),
            ]);
            if (signal?.aborted) return;
            setCurrentUserId(Number(me.id));
            setOtherUser({
                display_name: otherUserProfile.profile?.display_name || null,
                avatar_url: otherUserProfile.profile?.avatar_url || null,
            });
            appendMessages(history);
            setHistoryReady(true);
            void markIncomingRead(history).catch((error) => {
                console.error('Failed to mark chat history as read', error);
            });
        } catch (error) {
            if (signal?.aborted) return;
            console.error('Failed to fetch chat data:', error);
            setLoadError('گفت‌وگو بارگذاری نشد. اتصال را بررسی کن و دوباره تلاش کن.');
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    }, [appendMessages, markIncomingRead, userId]);

    useEffect(() => {
        lastMessageIdRef.current = 0;
        setMessages([]);
        setHistoryReady(false);
        const controller = new AbortController();
        void fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, userId]);

    useEffect(() => {
        let reconnectTimer: number | undefined;
        let handshakeTimer: number | undefined;
        let heartbeat: ChatHeartbeat | undefined;
        let heartbeatSocket: WebSocket | undefined;
        let reconnectAttempt = 0;
        let isActive = true;

        const clearHandshakeTimer = () => {
            if (handshakeTimer) {
                window.clearTimeout(handshakeTimer);
                handshakeTimer = undefined;
            }
        };

        const clearHeartbeatTimer = (expectedSocket?: WebSocket) => {
            if (expectedSocket && heartbeatSocket !== expectedSocket) return;
            heartbeat?.stop();
            heartbeat = undefined;
            heartbeatSocket = undefined;
        };

        const canConnect = () => (
            isActive
            && navigator.onLine !== false
            && document.visibilityState !== 'hidden'
        );

        const scheduleReconnect = (connect: () => void, immediate = false) => {
            if (!canConnect()) return;
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            const delay = immediate
                ? 0
                : computeBackoffDelayMs({
                    attempt: reconnectAttempt++,
                    baseDelayMs: 1_000,
                    maxDelayMs: 30_000,
                    jitterRatio: 0.25,
                });
            reconnectTimer = window.setTimeout(connect, delay);
        };

        const connect = () => {
            const socketUrl = chatService.getWebSocketUrl();
            if (!socketUrl || !canConnect()) {
                setConnectionState('polling');
                return;
            }

            if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
                return;
            }

            setConnectionState('connecting');
            let socket: WebSocket;
            try {
                socket = new WebSocket(socketUrl);
            } catch (error) {
                console.error('Failed to open chat websocket', error);
                setConnectionState('polling');
                scheduleReconnect(connect);
                return;
            }
            socketRef.current = socket;
            clearHandshakeTimer();
            handshakeTimer = window.setTimeout(() => {
                if (!isActive || socketRef.current !== socket) return;
                setConnectionState('polling');
                socket.close();
            }, 10_000);

            socket.onopen = () => {
                const token = chatService.getWebSocketAuthToken();
                if (!token) {
                    socket.close();
                    return;
                }
                socket.send(JSON.stringify({ type: 'auth', token }));
            };

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);

                    if (payload.type === 'connection:ready') {
                        clearHandshakeTimer();
                        reconnectAttempt = 0;
                        setConnectionState('live');
                        clearHeartbeatTimer();
                        heartbeatSocket = socket;
                        heartbeat = startChatHeartbeat(socket, {
                            isCurrent: () => isActive && socketRef.current === socket,
                            onTimeout: () => setConnectionState('polling'),
                        });
                        return;
                    }

                    if (payload.type === 'pong') {
                        if (heartbeatSocket === socket) heartbeat?.acknowledgePong();
                        return;
                    }

                    if (payload.type === 'messages:read' && payload.reader_id === userId) {
                        const readIds = new Set<number>(payload.message_ids || []);
                        setMessages((current) => current.map((message) => (
                            readIds.has(message.id) ? { ...message, is_read: true } : message
                        )));
                        return;
                    }

                    if (payload.type !== 'message:new') return;

                    const message = payload.message as ChatMessage;
                    if (message.sender_id === userId || message.receiver_id === userId) {
                        appendMessages([message]);
                        if (message.sender_id === userId) {
                            void markIncomingRead([message]).catch((error) => {
                                console.error('Failed to mark live chat message as read', error);
                            });
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse chat websocket event', error);
                }
            };

            socket.onerror = () => {
                clearHandshakeTimer();
                setConnectionState('polling');
                socket.close();
            };

            socket.onclose = () => {
                clearHandshakeTimer();
                clearHeartbeatTimer(socket);
                if (socketRef.current === socket) socketRef.current = null;
                if (!isActive) return;
                setConnectionState('polling');
                scheduleReconnect(connect);
            };
        };

        const syncAvailability = () => {
            if (!canConnect()) {
                setConnectionState('polling');
                socketRef.current?.close();
                return;
            }
            scheduleReconnect(connect, true);
        };

        connect();
        window.addEventListener('online', syncAvailability);
        window.addEventListener('offline', syncAvailability);
        document.addEventListener('visibilitychange', syncAvailability);

        return () => {
            isActive = false;
            clearHandshakeTimer();
            clearHeartbeatTimer();
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            window.removeEventListener('online', syncAvailability);
            window.removeEventListener('offline', syncAvailability);
            document.removeEventListener('visibilitychange', syncAvailability);
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [appendMessages, markIncomingRead, userId]);

    useAdaptivePolling({
        task: async (signal) => {
            const afterId = lastMessageIdRef.current;
            const latest = await chatService.getNewMessages(userId, afterId, signal);
            appendMessages(latest);
            if (latest.some((message) => message.sender_id === userId && !message.is_read)) {
                void markIncomingRead(latest).catch((error) => {
                    console.error('Failed to mark polled chat messages as read', error);
                });
            }
            return latest.length > 0;
        },
        enabled: historyReady && Number.isFinite(userId) && userId > 0,
        // The initial history request has already completed and seeded the
        // cursor, so this immediate incremental poll cannot duplicate the
        // full-history read and keeps failover responsive.
        runImmediately: true,
        baseIntervalMs: connectionState === 'live' ? 30_000 : 4_000,
        maxIntervalMs: connectionState === 'live' ? 90_000 : 30_000,
        onError: (error) => console.error('Failed to poll chat messages', error),
    });

    const handleSend = async () => {
        const messageContent = newMessage.trim();
        const validationError = validationMessage(validateTextLength(messageContent, 'پیام', { required: true, max: 2000 }));
        setSendError(validationError);
        if (validationError || isSending) return;

        setIsSending(true);
        setNewMessage('');

        try {
            const sent = await chatService.sendMessage({
                receiver_id: userId,
                content: messageContent,
            });
            appendMessages([sent]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setSendError('ارسال پیام انجام نشد. لطفا دوباره تلاش کن.');
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

    const statusLabel =
        isLoading ? 'در حال بارگذاری…' : connectionState === 'live' ? 'آنلاین' : connectionState === 'connecting' ? 'در حال اتصال' : 'همگام‌سازی خودکار';

    return (
        <div className="flex h-full min-h-full flex-col bg-[#f7f8fa]" dir="rtl">
            <header className="shrink-0 border-b border-[#dfe3ea] bg-[#f0f2f5] px-5 pb-3 pt-5">
                <div className="grid grid-cols-[42px_1fr_42px] items-center gap-3">
                    <SafeBackButton fallback="/chat" className="justify-self-end" />

                    <div className="flex min-w-0 items-center justify-center gap-3">
                        <Avatar src={otherUser?.avatar_url} name={otherUser?.display_name} />
                        <div className="min-w-0 text-right">
                            <h1 className={cn("truncate text-base font-black text-slate-900", getTextAlign(otherUser?.display_name))} {...getDirectionalTextProps(otherUser?.display_name)}>{otherUser?.display_name || 'گفت‌وگو'}</h1>
                            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-slate-500">
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        connectionState === 'live' ? 'bg-emerald-500' : connectionState === 'connecting' ? 'bg-amber-400' : 'bg-slate-400',
                                    )}
                                />
                                {statusLabel}
                            </p>
                        </div>
                    </div>

                    <UserTrustActions userId={userId} onBlocked={() => router.replace('/community')} />
                </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    </div>
                ) : loadError ? (
                    <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6]">
                            <RefreshCw className="h-9 w-9" />
                        </div>
                        <h2 className="mt-6 text-lg font-black text-slate-900">گفت‌وگو باز نشد</h2>
                        <p className="mt-2 max-w-[290px] text-sm leading-7 text-slate-500">{loadError}</p>
                        <button
                            type="button"
                            onClick={() => void fetchData()}
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#155aa6] px-5 text-sm font-black text-white"
                        >
                            <RefreshCw className="h-4 w-4" />
                            تلاش دوباره
                        </button>
                    </div>
                ) : groupedMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                        <Image
                            src="/assets/chinverse/icons/chat-message-hover-pinch.svg"
                            alt=""
                            width={150}
                            height={150}
                            className="h-[150px] w-[150px] object-contain"
                        />
                        <h2 className="mt-6 text-lg font-black text-slate-900">هنوز گفت‌وگویی شروع نشده</h2>
                        <p className="mt-2 max-w-[260px] text-sm leading-7 text-slate-500">
                            اولین پیام را بنویس تا مکالمه‌ات با این کاربر آغاز شود.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {groupedMessages.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                <div className="mb-4 flex justify-center">
                                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400 shadow-sm ring-1 ring-slate-100">
                                        {group.date}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {group.messages.map((message) => {
                                        const isMyMessage = message.sender_id === currentUserId;

                                        return (
                                            <div key={message.id} className={cn('flex', isMyMessage ? 'justify-start' : 'justify-end')}>
                                                <div
                                                    className={cn(
                                                        'max-w-[78%] rounded-[22px] px-4 py-3 text-sm leading-7 shadow-sm',
                                                        isMyMessage
                                                            ? 'rounded-tr-[7px] bg-[#155aa6] text-white'
                                                            : 'rounded-tl-[7px] border border-slate-100 bg-white text-slate-800',
                                                    )}
                                                >
                                                    <p className={cn("whitespace-pre-wrap", getTextAlign(message.content))} {...getDirectionalTextProps(message.content)}>{message.content}</p>
                                                    <div
                                                        className={cn(
                                                            'mt-1 flex items-center gap-1 text-[10px]',
                                                            isMyMessage ? 'justify-start text-white/70' : 'justify-end text-slate-400',
                                                        )}
                                                    >
                                                        <span>{formatTime(message.created_at)}</span>
                                                        {isMyMessage && <CheckCheck size={13} className={message.is_read ? 'text-white' : 'text-white/50'} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            <footer className="shrink-0 border-t border-[#e3e7ee] bg-[#f7f8fa] px-4 pb-5 pt-3">
                <div className="flex items-center gap-2 rounded-[24px] border border-[#d9dee7] bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)] focus-within:border-[#155aa6] focus-within:ring-4 focus-within:ring-[#155aa6]/10">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        dir="auto"
                        onChange={(event) => {
                            setNewMessage(event.target.value);
                            if (sendError) setSendError('');
                        }}
                        onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && handleSend()}
                        placeholder="پیام خود را بنویس"
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#155aa6] text-white shadow-[0_8px_14px_rgba(21,90,166,0.24)] transition hover:bg-[#0f4f96] focus:outline-none focus:ring-4 focus:ring-[#155aa6]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="ارسال پیام"
                    >
                        {isSending ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
                {sendError && <p className="mt-2 px-2 text-xs font-bold text-rose-600">{sendError}</p>}
            </footer>
        </div>
    );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#155aa6] bg-white shadow-sm">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || 'کاربر'}
                    fill
                    className="object-cover"
                    sizes="44px"
                    unoptimized
                />
            ) : (
                <UserIcon size={20} className="text-slate-400" />
            )}
        </div>
    );
}
