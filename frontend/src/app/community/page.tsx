"use client";

import Image from "next/image";
import Link from "next/link";
import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileText,
    Headphones,
    Loader2,
    MessageCircle,
    MessageSquareReply,
    PenLine,
    Search,
    Send,
    Sparkles,
    User as UserIcon,
    X,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { chatService, ConversationPreview } from "@/services/chat.service";
import {
    Article,
    ArticleComment,
    ArticleDetail,
    communityService,
    ForumAnswer,
    ForumQuestion,
    ForumQuestionDetail,
} from "@/services/community.service";

type MainTab = "forum" | "messages";
type ForumSection = "questions" | "articles";

const tabs: Array<{ id: MainTab; label: string }> = [
    { id: "forum", label: "تالار گفتگو" },
    { id: "messages", label: "پیام‌ها" },
];

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<MainTab>("forum");
    const [forumSection, setForumSection] = useState<ForumSection>("questions");
    const [questions, setQuestions] = useState<ForumQuestion[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (activeTab === "forum") {
            void fetchForumData();
        } else {
            void fetchConversations();
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
            console.error("Failed to fetch forum data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            setConversations(await chatService.getConversations());
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoading(false);
        }
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
            [article.title, article.summary, article.content, article.author?.display_name]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );
    }, [articles, normalizedQuery]);

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-5">
                <CommunityHero activeTab={activeTab} setActiveTab={setActiveTab} />

                <Surface className="p-3">
                    <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <Search className="h-5 w-5 text-slate-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={activeTab === "messages" ? "جست‌وجو بین پیام‌ها..." : "جست‌وجو بین سوالات و مقاله‌ها..."}
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="پاک کردن جست‌وجو"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </Surface>

                {activeTab === "messages" ? (
                    <MessagesTab conversations={visibleConversations} isLoading={isLoading} />
                ) : (
                    <ForumTab
                        questions={visibleQuestions}
                        articles={visibleArticles}
                        isLoading={isLoading}
                        forumSection={forumSection}
                        setForumSection={setForumSection}
                        setQuestions={setQuestions}
                        setArticles={setArticles}
                    />
                )}
            </main>
        </div>
    );
}

function CommunityHero({
    activeTab,
    setActiveTab,
}: {
    activeTab: MainTab;
    setActiveTab: (tab: MainTab) => void;
}) {
    return (
        <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] p-0 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <div className="relative p-5">
                <div className="absolute -left-14 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                <div className="absolute -bottom-20 right-16 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
                <div className="relative">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <Link
                            href="/profile"
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 transition hover:bg-white/15 hover:text-white"
                            aria-label="بازگشت"
                        >
                            <ArrowRight size={19} />
                        </Link>
                        <PrimaryButton href="/support" variant="light" className="px-3 py-2 text-xs" leadingIcon={<Headphones size={15} />}>
                            پشتیبانی
                        </PrimaryButton>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                        <Sparkles size={15} />
                        ChinVerse Community
                    </div>
                    <h1 className="mt-4 text-2xl font-black leading-9 tracking-tight">
                        سوال بپرس، مقاله منتشر کن، گفتگو بساز.
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                        تالار گفتگو برای پرسش و پاسخ و مقاله‌ها برای نوشته‌های کامل‌تر آموزشی و تجربه‌های کاربران است.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2 rounded-[24px] border border-white/10 bg-white/8 p-1.5 backdrop-blur">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "rounded-[18px] px-4 py-3 text-sm font-black transition",
                                    activeTab === tab.id
                                        ? "bg-white text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.22)]"
                                        : "text-white/70 hover:bg-white/10 hover:text-white",
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Surface>
    );
}

function ForumTab({
    questions,
    articles,
    isLoading,
    forumSection,
    setForumSection,
    setQuestions,
    setArticles,
}: {
    questions: ForumQuestion[];
    articles: Article[];
    isLoading: boolean;
    forumSection: ForumSection;
    setForumSection: (section: ForumSection) => void;
    setQuestions: Dispatch<SetStateAction<ForumQuestion[]>>;
    setArticles: Dispatch<SetStateAction<Article[]>>;
}) {
    return (
        <div className="space-y-4">
            <Surface className="grid grid-cols-2 gap-2 p-2">
                <ForumSectionButton
                    active={forumSection === "questions"}
                    title="سوالات شما"
                    subtitle="پرسش، پاسخ و ادامه گفتگو"
                    icon={<MessageCircle size={18} />}
                    onClick={() => setForumSection("questions")}
                />
                <ForumSectionButton
                    active={forumSection === "articles"}
                    title="مقالات"
                    subtitle="نوشته‌های آموزشی کامل‌تر"
                    icon={<FileText size={18} />}
                    onClick={() => setForumSection("articles")}
                />
            </Surface>

            {forumSection === "questions" ? (
                <QuestionsPanel questions={questions} isLoading={isLoading} setQuestions={setQuestions} />
            ) : (
                <ArticlesPanel articles={articles} isLoading={isLoading} setArticles={setArticles} />
            )}
        </div>
    );
}

function ForumSectionButton({
    active,
    title,
    subtitle,
    icon,
    onClick,
}: {
    active: boolean;
    title: string;
    subtitle: string;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex min-h-[86px] flex-col items-start justify-between rounded-[24px] p-4 text-right transition",
                active
                    ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_16px_34px_rgba(244,63,94,0.22)]"
                    : "bg-slate-50 text-slate-600 hover:bg-white",
            )}
        >
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-2xl", active ? "bg-white/18" : "bg-white text-rose-500 shadow-sm")}>
                {icon}
            </span>
            <span>
                <span className="block text-sm font-black">{title}</span>
                <span className={cn("mt-1 block text-[11px] leading-5", active ? "text-white/75" : "text-slate-400")}>{subtitle}</span>
            </span>
        </button>
    );
}

function QuestionsPanel({
    questions,
    isLoading,
    setQuestions,
}: {
    questions: ForumQuestion[];
    isLoading: boolean;
    setQuestions: Dispatch<SetStateAction<ForumQuestion[]>>;
}) {
    const [draft, setDraft] = useState({ title: "", content: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);
    const [details, setDetails] = useState<Record<number, ForumQuestionDetail>>({});
    const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
    const [replyTarget, setReplyTarget] = useState<Record<number, ForumAnswer | null>>({});
    const [submittingAnswerId, setSubmittingAnswerId] = useState<number | null>(null);

    const submitQuestion = async () => {
        const title = draft.title.trim();
        const content = draft.content.trim();
        if (!title || !content || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const created = await communityService.createForumQuestion({ title, content });
            setQuestions((current) => [created, ...current]);
            setDraft({ title: "", content: "" });
            setOpenQuestionId(created.id);
            setDetails((current) => ({ ...current, [created.id]: { ...created, answers: [] } }));
        } catch (error) {
            console.error("Failed to create question:", error);
            alert("ثبت سوال انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleQuestion = async (questionId: number) => {
        const shouldOpen = openQuestionId !== questionId;
        setOpenQuestionId(shouldOpen ? questionId : null);
        if (!shouldOpen || details[questionId]) return;

        try {
            const detail = await communityService.getForumQuestion(questionId);
            setDetails((current) => ({ ...current, [questionId]: detail }));
        } catch (error) {
            console.error("Failed to fetch question detail:", error);
        }
    };

    const submitAnswer = async (questionId: number) => {
        const content = answerInputs[questionId]?.trim();
        if (!content || submittingAnswerId) return;

        setSubmittingAnswerId(questionId);
        try {
            const created = await communityService.createForumAnswer(questionId, {
                content,
                parent_id: replyTarget[questionId]?.id ?? null,
            });
            setDetails((current) => {
                const detail = current[questionId];
                if (!detail) return current;
                return {
                    ...current,
                    [questionId]: {
                        ...detail,
                        answers: [...detail.answers, created],
                        answers_count: detail.answers_count + 1,
                    },
                };
            });
            setQuestions((current) =>
                current.map((question) =>
                    question.id === questionId ? { ...question, answers_count: question.answers_count + 1 } : question,
                ),
            );
            setAnswerInputs((current) => ({ ...current, [questionId]: "" }));
            setReplyTarget((current) => ({ ...current, [questionId]: null }));
        } catch (error) {
            console.error("Failed to submit answer:", error);
            alert("ارسال پاسخ انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmittingAnswerId(null);
        }
    };

    return (
        <div className="space-y-4">
            <Surface className="p-4">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600">
                        <PenLine size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-950">سوال تازه بپرس</h2>
                        <p className="mt-1 text-xs leading-6 text-slate-500">
                            عنوان کوتاه و توضیح کامل بنویس تا بقیه بتوانند دقیق‌تر جواب بدهند.
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <input
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="عنوان سوال، مثلا: تفاوت 了 و 过 چیست؟"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    />
                    <textarea
                        value={draft.content}
                        onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                        placeholder="توضیح سوالت را اینجا بنویس..."
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    />
                    <PrimaryButton
                        type="button"
                        onClick={submitQuestion}
                        disabled={!draft.title.trim() || !draft.content.trim() || isSubmitting}
                        className="w-full"
                        leadingIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
                    >
                        ثبت سوال
                    </PrimaryButton>
                </div>
            </Surface>

            {isLoading ? (
                <LoadingGrid count={3} />
            ) : questions.length > 0 ? (
                <div className="grid gap-3">
                    {questions.map((question) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            detail={details[question.id]}
                            isOpen={openQuestionId === question.id}
                            answerText={answerInputs[question.id] || ""}
                            replyTarget={replyTarget[question.id] || null}
                            isSubmittingAnswer={submittingAnswerId === question.id}
                            onToggle={() => void toggleQuestion(question.id)}
                            onAnswerChange={(value) => setAnswerInputs((current) => ({ ...current, [question.id]: value }))}
                            onReply={(answer) => setReplyTarget((current) => ({ ...current, [question.id]: answer }))}
                            onCancelReply={() => setReplyTarget((current) => ({ ...current, [question.id]: null }))}
                            onSubmitAnswer={() => void submitAnswer(question.id)}
                        />
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
    );
}

function ArticlesPanel({
    articles,
    isLoading,
    setArticles,
}: {
    articles: Article[];
    isLoading: boolean;
    setArticles: Dispatch<SetStateAction<Article[]>>;
}) {
    const [draft, setDraft] = useState({ title: "", summary: "", content: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openArticleId, setOpenArticleId] = useState<number | null>(null);
    const [details, setDetails] = useState<Record<number, ArticleDetail>>({});
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [replyTarget, setReplyTarget] = useState<Record<number, ArticleComment | null>>({});
    const [submittingCommentId, setSubmittingCommentId] = useState<number | null>(null);

    const submitArticle = async () => {
        const title = draft.title.trim();
        const content = draft.content.trim();
        const summary = draft.summary.trim();
        if (!title || !content || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const created = await communityService.createArticle({
                title,
                content,
                summary: summary || null,
            });
            setArticles((current) => [created, ...current]);
            setDraft({ title: "", summary: "", content: "" });
            setOpenArticleId(created.id);
            setDetails((current) => ({ ...current, [created.id]: { ...created, comments: [] } }));
        } catch (error) {
            console.error("Failed to create article:", error);
            alert("انتشار مقاله انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleArticle = async (articleId: number) => {
        const shouldOpen = openArticleId !== articleId;
        setOpenArticleId(shouldOpen ? articleId : null);
        if (!shouldOpen || details[articleId]) return;

        try {
            const detail = await communityService.getArticle(articleId);
            setDetails((current) => ({ ...current, [articleId]: detail }));
        } catch (error) {
            console.error("Failed to fetch article detail:", error);
        }
    };

    const submitComment = async (articleId: number) => {
        const content = commentInputs[articleId]?.trim();
        if (!content || submittingCommentId) return;

        setSubmittingCommentId(articleId);
        try {
            const created = await communityService.createArticleComment(articleId, {
                content,
                parent_id: replyTarget[articleId]?.id ?? null,
            });
            setDetails((current) => {
                const detail = current[articleId];
                if (!detail) return current;
                return {
                    ...current,
                    [articleId]: {
                        ...detail,
                        comments: [...detail.comments, created],
                        comments_count: detail.comments_count + 1,
                    },
                };
            });
            setArticles((current) =>
                current.map((article) =>
                    article.id === articleId ? { ...article, comments_count: article.comments_count + 1 } : article,
                ),
            );
            setCommentInputs((current) => ({ ...current, [articleId]: "" }));
            setReplyTarget((current) => ({ ...current, [articleId]: null }));
        } catch (error) {
            console.error("Failed to submit comment:", error);
            alert("ارسال کامنت انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmittingCommentId(null);
        }
    };

    return (
        <div className="space-y-4">
            <Surface className="overflow-hidden p-0">
                <div className="border-b border-slate-100 bg-gradient-to-l from-amber-50 to-white p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-white text-amber-600 shadow-sm">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-950">مقاله منتشر کن</h2>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                مقاله با عنوان، خلاصه و متن کامل منتشر می‌شود و از سوال کوتاه جداست.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3 p-4">
                    <input
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="عنوان مقاله"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    />
                    <input
                        value={draft.summary}
                        onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                        placeholder="خلاصه کوتاه مقاله، اختیاری"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    />
                    <textarea
                        value={draft.content}
                        onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                        placeholder="متن کامل مقاله را اینجا بنویس..."
                        rows={5}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    />
                    <PrimaryButton
                        type="button"
                        onClick={submitArticle}
                        disabled={!draft.title.trim() || !draft.content.trim() || isSubmitting}
                        className="w-full"
                        leadingIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={17} />}
                    >
                        انتشار مقاله
                    </PrimaryButton>
                </div>
            </Surface>

            {isLoading ? (
                <LoadingGrid count={3} />
            ) : articles.length > 0 ? (
                <div className="grid gap-3">
                    {articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            detail={details[article.id]}
                            isOpen={openArticleId === article.id}
                            commentText={commentInputs[article.id] || ""}
                            replyTarget={replyTarget[article.id] || null}
                            isSubmittingComment={submittingCommentId === article.id}
                            onToggle={() => void toggleArticle(article.id)}
                            onCommentChange={(value) => setCommentInputs((current) => ({ ...current, [article.id]: value }))}
                            onReply={(comment) => setReplyTarget((current) => ({ ...current, [article.id]: comment }))}
                            onCancelReply={() => setReplyTarget((current) => ({ ...current, [article.id]: null }))}
                            onSubmitComment={() => void submitComment(article.id)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<BookOpen size={30} />}
                    title="هنوز مقاله‌ای منتشر نشده"
                    description="اولین مقاله آموزشی یا تجربه خودت را منتشر کن."
                />
            )}
        </div>
    );
}

function QuestionCard({
    question,
    detail,
    isOpen,
    answerText,
    replyTarget,
    isSubmittingAnswer,
    onToggle,
    onAnswerChange,
    onReply,
    onCancelReply,
    onSubmitAnswer,
}: {
    question: ForumQuestion;
    detail?: ForumQuestionDetail;
    isOpen: boolean;
    answerText: string;
    replyTarget: ForumAnswer | null;
    isSubmittingAnswer: boolean;
    onToggle: () => void;
    onAnswerChange: (value: string) => void;
    onReply: (answer: ForumAnswer) => void;
    onCancelReply: () => void;
    onSubmitAnswer: () => void;
}) {
    const answers = detail?.answers || [];

    return (
        <Surface as="article" className="overflow-hidden p-0">
            <button type="button" onClick={onToggle} className="block w-full p-4 text-right">
                <div className="flex items-start gap-3">
                    <Avatar src={question.author?.avatar_url} name={question.author?.display_name} />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-slate-950">{question.author?.display_name || "کاربر چین‌ورس"}</p>
                            <span className="text-xs text-slate-400">{formatDate(question.created_at)}</span>
                        </div>
                        <h3 className="mt-2 text-base font-black leading-7 text-slate-900">{question.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-7 text-slate-500">{question.content}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                {question.answers_count} پاسخ
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600">
                                {isOpen ? "بستن گفتگو" : "مشاهده گفتگو"}
                                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    <p className="whitespace-pre-wrap rounded-[22px] bg-white p-4 text-sm leading-8 text-slate-700 shadow-sm">
                        {detail?.content || question.content}
                    </p>

                    <div className="mt-4 space-y-3">
                        {detail ? (
                            answers.length > 0 ? (
                                <AnswerThread answers={answers} onReply={onReply} />
                            ) : (
                                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-400">
                                    هنوز پاسخی ثبت نشده. اولین پاسخ را بنویس.
                                </p>
                            )
                        ) : (
                            <div className="flex items-center justify-center py-6 text-sm text-slate-400">
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                در حال بارگذاری گفتگو...
                            </div>
                        )}
                    </div>

                    <ReplyComposer
                        value={answerText}
                        placeholder="پاسخت را بنویس..."
                        replyLabel={replyTarget ? `در پاسخ به ${replyTarget.author?.display_name || "یک پاسخ"}` : undefined}
                        disabled={isSubmittingAnswer}
                        onChange={onAnswerChange}
                        onCancelReply={onCancelReply}
                        onSubmit={onSubmitAnswer}
                    />
                </div>
            )}
        </Surface>
    );
}

function ArticleCard({
    article,
    detail,
    isOpen,
    commentText,
    replyTarget,
    isSubmittingComment,
    onToggle,
    onCommentChange,
    onReply,
    onCancelReply,
    onSubmitComment,
}: {
    article: Article;
    detail?: ArticleDetail;
    isOpen: boolean;
    commentText: string;
    replyTarget: ArticleComment | null;
    isSubmittingComment: boolean;
    onToggle: () => void;
    onCommentChange: (value: string) => void;
    onReply: (comment: ArticleComment) => void;
    onCancelReply: () => void;
    onSubmitComment: () => void;
}) {
    const comments = detail?.comments || [];
    const readingMinutes = Math.max(1, Math.ceil(article.content.length / 900));

    return (
        <Surface as="article" className="overflow-hidden p-0">
            <button type="button" onClick={onToggle} className="block w-full text-right">
                <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr]">
                    <div className="relative min-h-32 overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-800 to-rose-900 text-white">
                        {article.cover_image ? (
                            <Image
                                src={getMediaUrl(article.cover_image)}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="132px"
                                unoptimized
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,191,36,0.26),transparent_36%),radial-gradient(circle_at_85%_20%,rgba(244,63,94,0.32),transparent_34%)]" />
                        )}
                        <div className="absolute inset-0 flex flex-col justify-between p-3">
                            <span className="w-fit rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/85">
                                مقاله
                            </span>
                            <BookOpen size={28} className="text-white/78" />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                            <span>{article.author?.display_name || "نویسنده چین‌ورس"}</span>
                            <span>•</span>
                            <span>{formatDate(article.created_at)}</span>
                            <span>•</span>
                            <span>{readingMinutes} دقیقه مطالعه</span>
                        </div>
                        <h3 className="text-lg font-black leading-8 text-slate-950">{article.title}</h3>
                        {article.summary && <p className="mt-1 line-clamp-2 text-sm leading-7 text-slate-500">{article.summary}</p>}
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                {article.comments_count} کامنت
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600">
                                {isOpen ? "بستن مقاله" : "خواندن مقاله"}
                                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                        <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">{detail?.content || article.content}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                        {detail ? (
                            comments.length > 0 ? (
                                <CommentThread comments={comments} onReply={onReply} />
                            ) : (
                                <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-400">
                                    هنوز کامنتی ثبت نشده. اولین نظر را بنویس.
                                </p>
                            )
                        ) : (
                            <div className="flex items-center justify-center py-6 text-sm text-slate-400">
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                در حال بارگذاری مقاله...
                            </div>
                        )}
                    </div>

                    <ReplyComposer
                        value={commentText}
                        placeholder="کامنتت را بنویس..."
                        replyLabel={replyTarget ? `در پاسخ به ${replyTarget.author?.display_name || "یک کامنت"}` : undefined}
                        disabled={isSubmittingComment}
                        onChange={onCommentChange}
                        onCancelReply={onCancelReply}
                        onSubmit={onSubmitComment}
                    />
                </div>
            )}
        </Surface>
    );
}

function AnswerThread({ answers, onReply }: { answers: ForumAnswer[]; onReply: (answer: ForumAnswer) => void }) {
    const roots = answers.filter((answer) => !answer.parent_id);
    const childrenByParent = answers.reduce<Record<number, ForumAnswer[]>>((acc, answer) => {
        if (answer.parent_id) {
            acc[answer.parent_id] = [...(acc[answer.parent_id] || []), answer];
        }
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            {roots.map((answer) => (
                <ThreadBubble key={answer.id} item={answer} replies={childrenByParent[answer.id] || []} onReply={() => onReply(answer)} />
            ))}
        </div>
    );
}

function CommentThread({ comments, onReply }: { comments: ArticleComment[]; onReply: (comment: ArticleComment) => void }) {
    const roots = comments.filter((comment) => !comment.parent_id);
    const childrenByParent = comments.reduce<Record<number, ArticleComment[]>>((acc, comment) => {
        if (comment.parent_id) {
            acc[comment.parent_id] = [...(acc[comment.parent_id] || []), comment];
        }
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            {roots.map((comment) => (
                <ThreadBubble key={comment.id} item={comment} replies={childrenByParent[comment.id] || []} onReply={() => onReply(comment)} />
            ))}
        </div>
    );
}

function ThreadBubble({
    item,
    replies,
    onReply,
}: {
    item: ForumAnswer | ArticleComment;
    replies: Array<ForumAnswer | ArticleComment>;
    onReply: () => void;
}) {
    return (
        <div className="rounded-[22px] border border-slate-100 bg-white p-3">
            <div className="flex items-start gap-3">
                <Avatar src={item.author?.avatar_url} name={item.author?.display_name} size="sm" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-black text-slate-900">{item.author?.display_name || "کاربر چین‌ورس"}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.content}</p>
                    <button
                        type="button"
                        onClick={onReply}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                        <MessageSquareReply size={13} />
                        پاسخ
                    </button>
                </div>
            </div>
            {replies.length > 0 && (
                <div className="mr-8 mt-3 space-y-2 border-r border-slate-100 pr-3">
                    {replies.map((reply) => (
                        <div key={reply.id} className="rounded-[18px] bg-slate-50 p-3">
                            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-black text-slate-700">{reply.author?.display_name || "کاربر چین‌ورس"}</span>
                                <span className="text-slate-400">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{reply.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReplyComposer({
    value,
    placeholder,
    replyLabel,
    disabled,
    onChange,
    onCancelReply,
    onSubmit,
}: {
    value: string;
    placeholder: string;
    replyLabel?: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onCancelReply: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
            {replyLabel && (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                    <span>{replyLabel}</span>
                    <button type="button" onClick={onCancelReply} className="text-rose-400 transition hover:text-rose-700">
                        <X size={14} />
                    </button>
                </div>
            )}
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full resize-none bg-transparent text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400"
            />
            <div className="mt-2 flex justify-end">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!value.trim() || disabled}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={15} />}
                    ارسال
                </button>
            </div>
        </div>
    );
}

function MessagesTab({
    conversations,
    isLoading,
}: {
    conversations: ConversationPreview[];
    isLoading: boolean;
}) {
    if (isLoading) {
        return <LoadingGrid count={4} />;
    }

    if (conversations.length === 0) {
        return (
            <EmptyState
                icon={<MessageCircle size={30} />}
                title="هنوز پیامی نداری"
                description="بعد از شروع گفتگو با کاربران یا ارائه‌دهنده‌های خدمات، پیام‌ها اینجا دیده می‌شوند."
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
                                <h3 className="truncate text-sm font-black text-slate-950">
                                    {conversation.user.display_name || "کاربر چین‌ورس"}
                                </h3>
                                <span className="shrink-0 text-xs text-slate-400">{formatDate(conversation.last_message_time)}</span>
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

function Avatar({ src, name, size = "md" }: { src?: string | null; name?: string | null; size?: "sm" | "md" }) {
    return (
        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100", size === "sm" ? "h-9 w-9" : "h-12 w-12")}>
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes={size === "sm" ? "36px" : "48px"}
                    unoptimized
                />
            ) : (
                <UserIcon size={size === "sm" ? 17 : 21} className="text-slate-400" />
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

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) {
        return "دیروز";
    }
    if (diffDays < 7) {
        return date.toLocaleDateString("fa-IR", { weekday: "short" });
    }
    return date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}
