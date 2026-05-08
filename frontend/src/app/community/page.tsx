'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    Headphones,
    MessageCircle,
    Search,
    Send,
    Sparkles,
    User as UserIcon,
    X,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionHeader from '@/components/ui/SectionHeader';
import Surface from '@/components/ui/Surface';
import { cn } from '@/lib/cn';
import { getMediaUrl } from '@/lib/media';
import { chatService, ConversationPreview } from '@/services/chat.service';
import { Article, communityService, ForumQuestion } from '@/services/community.service';

type Tab = 'messages' | 'forum';

const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'forum', label: 'تالار گفتگو' },
    { id: 'messages', label: 'پیام‌ها' },
];

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<Tab>('forum');
    const [questions, setQuestions] = useState<ForumQuestion[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeTab === 'forum') {
            fetchForumData();
        } else if (activeTab === 'messages') {
            fetchConversations();
        }
    }, [activeTab]);

    const fetchForumData = async () => {
        setIsLoading(true);
        try {
            const [questionsData, articlesData] = await Promise.all([
                communityService.getForumQuestions(),
                communityService.getArticles(),
            ]);
            setQuestions(questionsData);
            setArticles(articlesData);
        } catch (error) {
            console.error('Failed to fetch forum data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitQuestion = async () => {
        if (!newQuestion.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const created = await communityService.createForumQuestion({
                title: newQuestion.slice(0, 100),
                content: newQuestion,
            });
            setQuestions([created, ...questions]);
            setNewQuestion('');
        } catch (error) {
            console.error('Failed to create question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        }
        if (diffDays === 1) {
            return 'دیروز';
        }
        if (diffDays < 7) {
            return date.toLocaleDateString('fa-IR', { weekday: 'short' });
        }
        return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const visibleConversations = useMemo(() => {
        if (!normalizedQuery) return conversations;
        return conversations.filter((conversation) =>
            [conversation.user.display_name, conversation.last_message]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );
    }, [conversations, normalizedQuery]);

    const visibleQuestions = useMemo(() => {
        if (!normalizedQuery) return questions;
        return questions.filter((question) =>
            [question.title, question.content, question.author?.display_name]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );
    }, [normalizedQuery, questions]);

    const visibleArticles = useMemo(() => {
        if (!normalizedQuery) return articles;
        return articles.filter((article) =>
            [article.title, article.summary, article.content]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );
    }, [articles, normalizedQuery]);

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title={activeTab === 'messages' ? 'پیام‌ها' : 'تالار گفتگو'} subtitle="پرسش، پاسخ و ارتباط در جامعه چین‌ورس" backHref="/profile" />

            <main className="mx-auto mt-5 flex w-full max-w-5xl flex-col gap-5">
                <Surface className="overflow-hidden bg-slate-950 text-white">
                    <div className="relative p-5 sm:p-7">
                        <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-20 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
                        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75">
                                    <Sparkles size={15} />
                                    ChinVerse Community
                                </div>
                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                                    سوال بپرس، جواب بگیر، ارتباط بساز.
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                                    تالار گفتگو و پیام‌ها کنار هم قرار گرفته‌اند تا یادگیری تنها و پراکنده نباشد.
                                </p>
                            </div>
                            <PrimaryButton href="/support" variant="light" leadingIcon={<Headphones size={18} />}>
                                پشتیبانی
                            </PrimaryButton>
                        </div>
                    </div>
                </Surface>

                <Surface className="p-3">
                    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
                        <div className="grid grid-cols-2 gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "rounded-[20px] px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
                                        activeTab === tab.id
                                            ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_14px_30px_rgba(244,63,94,0.22)]"
                                            : "bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800",
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <Search className="h-5 w-5 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={activeTab === 'messages' ? 'جست‌وجو بین پیام‌ها...' : 'جست‌وجو بین سوالات و مقاله‌ها...'}
                                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </Surface>

                {activeTab === 'messages' ? (
                    <MessagesTab conversations={visibleConversations} isLoading={isLoading} formatTime={formatTime} />
                ) : (
                    <ForumTab
                        questions={visibleQuestions}
                        articles={visibleArticles}
                        isLoading={isLoading}
                        newQuestion={newQuestion}
                        setNewQuestion={setNewQuestion}
                        isSubmitting={isSubmitting}
                        onSubmitQuestion={handleSubmitQuestion}
                    />
                )}
            </main>
        </div>
    );
}

function MessagesTab({
    conversations,
    isLoading,
    formatTime,
}: {
    conversations: ConversationPreview[];
    isLoading: boolean;
    formatTime: (dateStr: string) => string;
}) {
    if (isLoading) {
        return <LoadingGrid count={4} />;
    }

    if (conversations.length === 0) {
        return (
            <EmptyState
                icon={<MessageCircle size={30} />}
                title="هنوز پیامی نداری"
                description="بعد از شروع گفت‌وگو با کاربران یا ارائه‌دهنده‌های خدمات، پیام‌ها اینجا دیده می‌شوند."
                action={<PrimaryButton href="/showcase">رفتن به ویترین</PrimaryButton>}
            />
        );
    }

    return (
        <div className="grid gap-3">
            {conversations.map((conversation) => (
                <Link
                    key={conversation.user.id}
                    href={`/chat/${conversation.user.id}`}
                    className="rounded-[26px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                    <div className="flex items-center gap-3">
                        <Avatar src={conversation.user.avatar_url} name={conversation.user.display_name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="truncate text-sm font-bold text-slate-950">
                                    {conversation.user.display_name || 'کاربر چین‌ورس'}
                                </h3>
                                <span className="shrink-0 text-xs text-slate-400">{formatTime(conversation.last_message_time)}</span>
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-500">{conversation.last_message}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-bold text-white">
                                {conversation.unread_count}
                            </span>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}

function ForumTab({
    questions,
    articles,
    isLoading,
    newQuestion,
    setNewQuestion,
    isSubmitting,
    onSubmitQuestion,
}: {
    questions: ForumQuestion[];
    articles: Article[];
    isLoading: boolean;
    newQuestion: string;
    setNewQuestion: (value: string) => void;
    isSubmitting: boolean;
    onSubmitQuestion: () => void;
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-5">
                <Surface className="p-4 sm:p-5">
                    <SectionHeader
                        title="سوالات شما"
                        subtitle="سوال کوتاه بنویس و از جامعه چین‌ورس کمک بگیر."
                    />
                    <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <input
                            type="text"
                            value={newQuestion}
                            onChange={(event) => setNewQuestion(event.target.value)}
                            placeholder="سوالت را اینجا بنویس..."
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            onKeyDown={(event) => event.key === 'Enter' && onSubmitQuestion()}
                        />
                        <button
                            type="button"
                            onClick={onSubmitQuestion}
                            disabled={!newQuestion.trim() || isSubmitting}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_12px_26px_rgba(244,63,94,0.22)] transition hover:from-rose-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </Surface>

                {isLoading ? (
                    <LoadingGrid count={3} />
                ) : questions.length > 0 ? (
                    <div className="grid gap-3">
                        {questions.slice(0, 8).map((question) => (
                            <QuestionCard key={question.id} question={question} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<MessageCircle size={30} />}
                        title="هنوز سوالی ثبت نشده"
                        description="اولین سوال را بپرس تا تالار گفتگو فعال‌تر شود."
                    />
                )}
            </div>

            <Surface className="h-fit p-4 sm:p-5">
                <SectionHeader title="مقاله‌ها" subtitle="پاسخ‌های کامل‌تر و محتوای آموزشی جامعه." />
                {isLoading ? (
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-28 animate-pulse rounded-[22px] bg-slate-100" />
                        ))}
                    </div>
                ) : articles.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        className="mt-4 border-slate-100 bg-slate-50 shadow-none"
                        icon={<BookOpen size={28} />}
                        title="مقاله‌ای منتشر نشده"
                        description="وقتی مقاله‌ای ثبت شود، اینجا نمایش داده می‌شود."
                    />
                )}
            </Surface>
        </div>
    );
}

function QuestionCard({ question }: { question: ForumQuestion }) {
    return (
        <Surface as="article" className="p-4">
            <div className="flex items-start gap-3">
                <Avatar src={question.author?.avatar_url} name={question.author?.display_name} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-950">{question.author?.display_name || 'کاربر چین‌ورس'}</p>
                        <span className="text-xs text-slate-400">{new Date(question.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold leading-6 text-slate-800">{question.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{question.content}</p>
                    <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {question.answers_count} پاسخ
                    </div>
                </div>
            </div>
        </Surface>
    );
}

function ArticleCard({ article }: { article: Article }) {
    return (
        <article className="grid grid-cols-[88px_1fr] gap-3 rounded-[22px] border border-slate-100 bg-white p-3">
            <div className="relative h-24 overflow-hidden rounded-[18px] bg-gradient-to-br from-rose-50 to-amber-50">
                {article.cover_image ? (
                    <Image
                        src={getMediaUrl(article.cover_image)}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="88px"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-rose-300">
                        <BookOpen size={28} />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-bold leading-6 text-slate-950">{article.title}</h3>
                {article.summary && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{article.summary}</p>
                )}
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                    {new Date(article.created_at).toLocaleDateString('fa-IR')}
                </p>
            </div>
        </article>
    );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || 'کاربر'}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                />
            ) : (
                <UserIcon size={21} className="text-slate-400" />
            )}
        </div>
    );
}

function LoadingGrid({ count }: { count: number }) {
    return (
        <div className="grid gap-3">
            {Array.from({ length: count }).map((_, index) => (
                <Surface key={index} className="h-28 animate-pulse p-4">
                    <div className="h-full rounded-[22px] bg-slate-100" />
                </Surface>
            ))}
        </div>
    );
}
