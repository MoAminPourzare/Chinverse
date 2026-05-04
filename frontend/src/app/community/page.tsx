'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Search, X, Send, BookOpen, Headphones, User as UserIcon } from 'lucide-react';
import { communityService, ForumQuestion, Article } from '@/services/community.service';
import { chatService, ConversationPreview } from '@/services/chat.service';
import { getMediaUrl } from '@/lib/media';

type Tab = 'messages' | 'forum';

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
        } else if (diffDays === 1) {
            return 'دیروز';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('fa-IR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
        }
    };

    const renderMessagesTab = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
            );
        }

        if (conversations.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    {/* Empty state illustration */}
                    <div className="relative mb-6">
                        <div className="w-32 h-32 flex items-center justify-center">
                            <svg viewBox="0 0 120 120" className="w-full h-full">
                                {/* Speech bubble illustration */}
                                <rect x="15" y="25" width="90" height="60" rx="10" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                <polygon points="35,85 45,85 40,100" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                {/* Message dots */}
                                <circle cx="40" cy="55" r="5" fill="#d97706" />
                                <circle cx="60" cy="55" r="5" fill="#d97706" />
                                <circle cx="80" cy="55" r="5" fill="#d97706" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                        هنوز پیامی دریافت نکردی!
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                        در این بخش میتونی با معلم‌ها در تماس باشی، با زبان‌آموزهای دیگه گفتگو کنی، از پشتیبانی کمک بگیری یا حتی پیام‌های شغلی از کارفرماها دریافت کنی.
                    </p>
                </div>
            );
        }

        return (
            <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                    <Link
                        key={conv.user.id}
                        href={`/chat/${conv.user.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {conv.user.avatar_url ? (
                                <Image
                                    src={getMediaUrl(conv.user.avatar_url)}
                                    alt={conv.user.display_name || 'User'}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <UserIcon className="w-6 h-6 text-gray-400" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                    {conv.user.display_name || 'کاربر'}
                                </h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 mr-2">
                                    {formatTime(conv.last_message_time)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-gray-500 text-sm truncate">
                                    {conv.last_message}
                                </p>
                                {conv.unread_count > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mr-2 flex-shrink-0">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        );
    };

    const renderForumTab = () => (
        <div className="pb-24">
            {/* Section A: Your Questions */}
            <section className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">سوالات شما</h2>
                    <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
                        نمایش همه
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>

                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    اگه درباره هر درس یا مبحثی سوال داری، اینجا مطرحش کن. سایر کاربران یا تیم پشتیبانی چین‌ورس بهت پاسخ میدن.
                </p>

                {/* Question Input */}
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="سوالت رو اینجا بنویس..."
                        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
                    />
                    <button
                        onClick={handleSubmitQuestion}
                        disabled={!newQuestion.trim() || isSubmitting}
                        className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Questions List */}
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : questions.length > 0 ? (
                    <div className="mt-6 space-y-4">
                        {questions.slice(0, 5).map((question) => (
                            <div key={question.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {question.author?.avatar_url ? (
                                            <Image
                                                src={getMediaUrl(question.author.avatar_url)}
                                                alt={question.author.display_name || 'User'}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <UserIcon className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm mb-1">
                                            {question.author?.display_name || 'کاربر'}
                                        </p>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {question.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span>{question.answers_count} پاسخ</span>
                                            <span>{new Date(question.created_at).toLocaleDateString('fa-IR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        هنوز سوالی مطرح نشده. اولین نفر باش!
                    </div>
                )}
            </section>

            {/* Section B: Articles */}
            <section className="px-4 py-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">مقالات</h2>
                    <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
                        نمایش همه
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                </div>

                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    در این بخش، سوالات پرتکرار با موضوعات جالب توسط تیم ما تبدیل به مقاله میشه. میتونی مقاله‌ها رو بخونی، زیرش نظر بدی یا سوال جدید مطرح کنی.
                </p>

                {/* Articles Horizontal Scroll */}
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : articles.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
                        {articles.map((article) => (
                            <div
                                key={article.id}
                                className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                                    {article.cover_image ? (
                                        <Image
                                            src={getMediaUrl(article.cover_image)}
                                            alt={article.title}
                                            width={256}
                                            height={128}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <BookOpen className="w-12 h-12 text-blue-300" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                                        {article.title}
                                    </h3>
                                    {article.summary && (
                                        <p className="text-gray-500 text-xs line-clamp-2">
                                            {article.summary}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                                        <span>{new Date(article.created_at).toLocaleDateString('fa-IR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        هنوز مقاله‌ای منتشر نشده.
                    </div>
                )}
            </section>
        </div>
    );

    return (
        <div className="min-h-full bg-gray-50 font-sans" dir="rtl">
            <div className="w-full bg-white min-h-full relative">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                    <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">
                        {activeTab === 'messages' ? 'پیام‌ها' : 'تالار گفت‌وگو'}
                    </h1>
                    <div className="w-9" /> {/* Spacer for centering */}
                </header>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 bg-white">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'messages'
                            ? 'text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        پیام‌ها
                        {activeTab === 'messages' && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('forum')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'forum'
                            ? 'text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        تالار گفت‌وگو
                        {activeTab === 'forum' && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3 bg-gray-50/50">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'messages' ? 'جستجو بین پیام‌ها...' : 'جستجو بین سوالات و مقالات...'}
                            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="p-1">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <main className="bg-gray-50/30">
                    {activeTab === 'messages' ? renderMessagesTab() : renderForumTab()}
                </main>

                {/* FAB - Support Button */}
                <Link
                    href="/support"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-50"
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '24px',
                        right: 'auto'
                    }}
                >
                    <Headphones className="w-6 h-6 text-white" />
                </Link>
            </div>
        </div>
    );
}
