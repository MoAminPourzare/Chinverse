"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Headphones,
    Loader2,
    PenLine,
    Search,
    Send,
    Trash2,
    User as UserIcon,
    X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BackButton } from "@/components/ui/IconButton";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { validateTextLength, validationMessage } from "@/validation";
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
type ForumSubTab = "questions" | "articles";

const tabs: Array<{ id: MainTab; label: string }> = [
    { id: "messages", label: "پیام‌ها" },
    { id: "forum", label: "تالار گفتگو" },
];

const forumTabs: Array<{ id: ForumSubTab; label: string }> = [
    { id: "questions", label: "سوالات شما" },
    { id: "articles", label: "مقالات" },
];

export default function CommunityPage() {
    const currentUserId = useOptionalCurrentUserId();
    const [activeTab, setActiveTab] = useState<MainTab>("messages");
    const [questions, setQuestions] = useState<ForumQuestion[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchForumData = useCallback(async () => {
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
    }, []);

    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            setConversations(await chatService.getConversations());
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "forum") {
            void fetchForumData();
        } else {
            void fetchConversations();
        }
    }, [activeTab, fetchConversations, fetchForumData]);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const visibleConversations = useMemo(() => {
        if (!normalizedQuery) return conversations;
        return conversations.filter((conversation) =>
            [conversation.user.display_name, conversation.last_message]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );
    }, [conversations, normalizedQuery]);

    return (
        <div className="min-h-full bg-[#f9fafc] px-5 pb-8 pt-4" dir="rtl">
            <header className="relative flex h-12 items-center justify-center">
                <BackButton href="/profile" className="absolute right-0" />
            </header>

            <nav className="mt-6 grid grid-cols-2 gap-1.5 rounded-[24px] border border-white/80 bg-[#e7ebf1] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_22px_rgba(15,23,42,0.06)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "h-[48px] rounded-[18px] text-center text-[14px] font-black leading-5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#155aa6]/12",
                            activeTab === tab.id
                                ? "bg-white text-[#155aa6] shadow-[0_10px_22px_rgba(21,90,166,0.13)]"
                                : "text-[#2f3238] hover:bg-white/55 hover:text-[#155aa6]",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeTab === "messages" && (
                <div className="mt-5 flex items-center gap-3 rounded-full bg-[#e6e9ef] px-4 py-3">
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="text-[#2f3238]"
                            aria-label="پاک کردن جستجو"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    ) : (
                        <Search className="h-5 w-5 text-[#2f3238]" />
                    )}
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        dir="rtl"
                        placeholder="جستجو بین پیام‌ها"
                        className="min-w-0 flex-1 bg-transparent text-right text-sm text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400"
                    />
                </div>
            )}

            <main className="mt-7">
                {activeTab === "messages" ? (
                    <MessagesTab conversations={visibleConversations} isLoading={isLoading} />
                ) : (
                    <ForumTab
                        questions={questions}
                        articles={articles}
                        isLoading={isLoading}
                        currentUserId={currentUserId}
                        setQuestions={setQuestions}
                        setArticles={setArticles}
                    />
                )}
            </main>

            <SupportFloatingButton />
        </div>
    );
}

function SupportFloatingButton() {
    return (
        <Link
            href="/support"
            className="fixed bottom-24 right-4 z-30 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:bg-[#0f4e92] min-[430px]:right-[calc(50%_-_199px)]"
            aria-label="پشتیبانی"
        >
            <Headphones className="h-6 w-6" />
        </Link>
    );
}

function ForumTab({
    questions,
    articles,
    isLoading,
    currentUserId,
    setQuestions,
    setArticles,
}: {
    questions: ForumQuestion[];
    articles: Article[];
    isLoading: boolean;
    currentUserId: number | null;
    setQuestions: React.Dispatch<React.SetStateAction<ForumQuestion[]>>;
    setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
}) {
    const [activeForumTab, setActiveForumTab] = useState<ForumSubTab>("questions");

    return (
        <div className="space-y-6">
            <nav className="grid grid-cols-2 gap-1.5 rounded-[24px] border border-white/80 bg-[#e7ebf1] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_22px_rgba(15,23,42,0.06)]">
                {forumTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveForumTab(tab.id)}
                        className={cn(
                            "h-[46px] rounded-[18px] text-center text-[14px] font-black leading-5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#155aa6]/12",
                            activeForumTab === tab.id
                                ? "bg-white text-[#155aa6] shadow-[0_10px_22px_rgba(21,90,166,0.13)]"
                                : "text-[#2f3238] hover:bg-white/55 hover:text-[#155aa6]",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeForumTab === "questions" ? (
                <QuestionsSection questions={questions} isLoading={isLoading} currentUserId={currentUserId} setQuestions={setQuestions} />
            ) : (
                <ArticlesSection articles={articles} isLoading={isLoading} setArticles={setArticles} />
            )}
        </div>
    );
}

function QuestionsSection({
    questions,
    isLoading,
    currentUserId,
    setQuestions,
}: {
    questions: ForumQuestion[];
    isLoading: boolean;
    currentUserId: number | null;
    setQuestions: React.Dispatch<React.SetStateAction<ForumQuestion[]>>;
}) {
    const [draft, setDraft] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [editError, setEditError] = useState("");
    const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
    const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
    const [details, setDetails] = useState<Record<number, ForumQuestionDetail>>({});
    const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
    const [draftError, setDraftError] = useState("");
    const [answerErrors, setAnswerErrors] = useState<Record<number, string>>({});
    const [submittingAnswerId, setSubmittingAnswerId] = useState<number | null>(null);

    const submitQuestion = async () => {
        const content = draft.trim();
        const validationError = validationMessage(validateTextLength(content, "متن سوال", { required: true, min: 8, max: 8000 }));
        setDraftError(validationError);
        if (validationError || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const title = content.length > 55 ? content.slice(0, 55).trim() : content;
            const created = await communityService.createForumQuestion({ title, content });
            setQuestions((current) => [created, ...current]);
            setDraft("");
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

    const startEditQuestion = (question: ForumQuestion) => {
        setEditingQuestionId(question.id);
        setEditDraft(question.content);
        setEditError("");
        setOpenQuestionId(question.id);
    };

    const cancelEditQuestion = () => {
        setEditingQuestionId(null);
        setEditDraft("");
        setEditError("");
    };

    const submitQuestionEdit = async (questionId: number) => {
        const content = editDraft.trim();
        const validationError = validationMessage(validateTextLength(content, "متن سوال", { required: true, min: 8, max: 8000 }));
        setEditError(validationError);
        if (validationError || savingQuestionId) return;

        setSavingQuestionId(questionId);
        try {
            const title = content.length > 55 ? content.slice(0, 55).trim() : content;
            const updated = await communityService.updateForumQuestion(questionId, { title, content });
            setQuestions((current) => current.map((question) => (question.id === questionId ? updated : question)));
            setDetails((current) => {
                const detail = current[questionId];
                if (!detail) return current;
                return {
                    ...current,
                    [questionId]: {
                        ...detail,
                        ...updated,
                        answers: detail.answers,
                    },
                };
            });
            cancelEditQuestion();
        } catch (error) {
            console.error("Failed to update question:", error);
            setEditError("ویرایش سوال انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSavingQuestionId(null);
        }
    };

    const deleteQuestion = async (questionId: number) => {
        if (!window.confirm("این سوال و پاسخ‌های آن حذف شود؟")) return;

        setDeletingQuestionId(questionId);
        try {
            await communityService.deleteForumQuestion(questionId);
            setQuestions((current) => current.filter((question) => question.id !== questionId));
            setDetails((current) => {
                const nextDetails = { ...current };
                delete nextDetails[questionId];
                return nextDetails;
            });
            if (openQuestionId === questionId) setOpenQuestionId(null);
            if (editingQuestionId === questionId) cancelEditQuestion();
        } catch (error) {
            console.error("Failed to delete question:", error);
            alert("حذف سوال انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setDeletingQuestionId(null);
        }
    };

    const submitAnswer = async (questionId: number) => {
        const content = answerInputs[questionId]?.trim();
        const validationError = validationMessage(validateTextLength(content || "", "پاسخ", { required: true, max: 8000 }));
        setAnswerErrors((current) => ({ ...current, [questionId]: validationError }));
        if (validationError || submittingAnswerId) return;

        setSubmittingAnswerId(questionId);
        try {
            const created = await communityService.createForumAnswer(questionId, { content });
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
            setAnswerErrors((current) => ({ ...current, [questionId]: "" }));
        } catch (error) {
            console.error("Failed to submit answer:", error);
            alert("ارسال پاسخ انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmittingAnswerId(null);
        }
    };

    return (
        <section>
            <SectionHeader
                title="سوالات شما"
                description="اگه درباره هر درس یا مبحثی سوال داری، اینجا مطرحش کن. سایر کاربران یا تیم پشتیبانی چینورس بهت پاسخ میدن."
            />

            <div className="mt-4 flex items-stretch gap-2">
                <textarea
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        if (draftError) setDraftError("");
                    }}
                    rows={2}
                    dir={draft.trim() ? "auto" : "rtl"}
                    placeholder="سوالت رو اینجا بنویس"
                    className="min-h-[56px] flex-1 resize-none rounded-[10px] border border-[#ef7f66] bg-white px-4 py-3 text-right text-sm leading-7 text-slate-900 outline-none transition placeholder:text-right placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                />
                <button
                    type="button"
                    onClick={submitQuestion}
                    disabled={!draft.trim() || isSubmitting}
                    className="flex w-[58px] shrink-0 items-center justify-center rounded-[14px] bg-[#155aa6] text-white shadow-[0_10px_20px_rgba(21,90,166,0.25)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-300"
                    aria-label="ارسال سوال"
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-6 w-6" />}
                </button>
            </div>
            {draftError && <p className="mt-2 text-xs font-bold leading-5 text-rose-600">{draftError}</p>}

            <div className="motion-list mt-4 space-y-3">
                {isLoading ? (
                    <LoadingList count={3} />
                ) : questions.length > 0 ? (
                    questions.map((question) => (
                        <QuestionCard
                            key={question.id}
                            question={question}
                            detail={details[question.id]}
                            isOpen={openQuestionId === question.id}
                            answerText={answerInputs[question.id] || ""}
                            answerError={answerErrors[question.id] || ""}
                            isSubmittingAnswer={submittingAnswerId === question.id}
                            isOwner={currentUserId === question.author_user_id}
                            isEditing={editingQuestionId === question.id}
                            editText={editingQuestionId === question.id ? editDraft : ""}
                            editError={editingQuestionId === question.id ? editError : ""}
                            isSavingEdit={savingQuestionId === question.id}
                            isDeleting={deletingQuestionId === question.id}
                            onToggle={() => toggleQuestion(question.id)}
                            onEdit={() => startEditQuestion(question)}
                            onDelete={() => void deleteQuestion(question.id)}
                            onCancelEdit={cancelEditQuestion}
                            onEditChange={(value) => {
                                setEditDraft(value);
                                if (editError) setEditError("");
                            }}
                            onSubmitEdit={() => void submitQuestionEdit(question.id)}
                            onAnswerChange={(value) => {
                                setAnswerInputs((current) => ({ ...current, [question.id]: value }));
                                setAnswerErrors((current) => ({ ...current, [question.id]: "" }));
                            }}
                            onSubmitAnswer={() => submitAnswer(question.id)}
                        />
                    ))
                ) : (
                    <SmallEmpty text="هنوز سوالی ثبت نشده. اولین سوال را تو بپرس." />
                )}
            </div>
        </section>
    );
}

function ArticlesSection({
    articles,
    isLoading,
    setArticles,
}: {
    articles: Article[];
    isLoading: boolean;
    setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
}) {
    const [openArticleId, setOpenArticleId] = useState<number | null>(null);
    const [details, setDetails] = useState<Record<number, ArticleDetail>>({});
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [commentErrors, setCommentErrors] = useState<Record<number, string>>({});
    const [submittingCommentId, setSubmittingCommentId] = useState<number | null>(null);

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
        const validationError = validationMessage(validateTextLength(content || "", "کامنت", { required: true, max: 8000 }));
        setCommentErrors((current) => ({ ...current, [articleId]: validationError }));
        if (validationError || submittingCommentId) return;

        setSubmittingCommentId(articleId);
        try {
            const created = await communityService.createArticleComment(articleId, { content });
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
            setCommentErrors((current) => ({ ...current, [articleId]: "" }));
        } catch (error) {
            console.error("Failed to submit comment:", error);
            alert("ارسال کامنت انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmittingCommentId(null);
        }
    };

    return (
        <section>
            <SectionHeader
                title="مقالات"
                description="در این بخش، سوالات پر تکرار یا موضوعات جالب توسط تیم ما تبدیل به مقاله میشه. میتونی مقاله ها رو بخونی، زیرش نظر بدی یا سوال جدید مطرح کنی."
            />

            <div className="motion-list mt-4 space-y-3">
                {isLoading ? (
                    <LoadingList count={2} />
                ) : articles.length > 0 ? (
                    articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            detail={details[article.id]}
                            isOpen={openArticleId === article.id}
                            commentText={commentInputs[article.id] || ""}
                            commentError={commentErrors[article.id] || ""}
                            isSubmittingComment={submittingCommentId === article.id}
                            onToggle={() => toggleArticle(article.id)}
                            onCommentChange={(value) => {
                                setCommentInputs((current) => ({ ...current, [article.id]: value }));
                                setCommentErrors((current) => ({ ...current, [article.id]: "" }));
                            }}
                            onSubmitComment={() => submitComment(article.id)}
                        />
                    ))
                ) : (
                    <SmallEmpty text="هنوز مقاله‌ای منتشر نشده." />
                )}
            </div>
        </section>
    );
}

function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="text-right">
            <div className="flex items-center justify-between gap-3 text-right">
                <h2 className="text-right text-[18px] font-black text-[#2f3238]">{title}</h2>
                {action}
            </div>
            {description && (
                <p className="mt-2 text-sm font-medium leading-7 text-slate-500">
                    {description}
                </p>
            )}
        </div>
    );
}

function QuestionCard({
    question,
    detail,
    isOpen,
    answerText,
    answerError,
    isSubmittingAnswer,
    isOwner,
    isEditing,
    editText,
    editError,
    isSavingEdit,
    isDeleting,
    onToggle,
    onEdit,
    onDelete,
    onCancelEdit,
    onEditChange,
    onSubmitEdit,
    onAnswerChange,
    onSubmitAnswer,
}: {
    question: ForumQuestion;
    detail?: ForumQuestionDetail;
    isOpen: boolean;
    answerText: string;
    answerError: string;
    isSubmittingAnswer: boolean;
    isOwner: boolean;
    isEditing: boolean;
    editText: string;
    editError: string;
    isSavingEdit: boolean;
    isDeleting: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    onEditChange: (value: string) => void;
    onSubmitEdit: () => void;
    onAnswerChange: (value: string) => void;
    onSubmitAnswer: () => void;
}) {
    return (
        <article className="overflow-hidden rounded-[22px] border border-[#d6e1ee] bg-white text-right shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="p-4">
                <div className="flex items-start gap-3 text-right">
                    <button type="button" onClick={onToggle} className="shrink-0">
                        <Avatar src={question.author?.avatar_url} name={question.author?.display_name} />
                    </button>
                    <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-right">
                        <div className="flex items-center justify-between gap-3">
                            <p className={cn("text-xs font-black text-[#155aa6]", getTextAlign(question.author?.display_name))} {...getDirectionalTextProps(question.author?.display_name)}>{question.author?.display_name || "کاربر چین‌ورس"}</p>
                            <span className="text-[11px] text-slate-400">{formatDate(question.created_at)}</span>
                        </div>
                        <h3 className={cn("mt-2 line-clamp-2 text-sm font-black leading-7 text-slate-900", getTextAlign(question.title))} {...getDirectionalTextProps(question.title)}>{question.title}</h3>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">
                                {question.answers_count} پاسخ
                            </span>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-[#155aa6]" /> : <ChevronDown className="h-4 w-4 text-[#155aa6]" />}
                        </div>
                    </button>
                    {isOwner && (
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={onEdit}
                                disabled={isDeleting}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dcecff] disabled:opacity-50"
                                aria-label="ویرایش سوال"
                            >
                                <PenLine className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                                aria-label="حذف سوال"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-[#e8edf4] bg-[#f8fafc] p-4">
                    {isEditing && (
                        <div className="mb-4 rounded-[18px] border border-[#d6e1ee] bg-white p-3 shadow-sm">
                            <textarea
                                value={editText}
                                onChange={(event) => onEditChange(event.target.value)}
                                rows={4}
                                dir={editText.trim() ? "auto" : "rtl"}
                                className="min-h-[108px] w-full resize-none rounded-2xl bg-slate-50 px-3 py-3 text-right text-sm leading-7 text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400 focus:ring-4 focus:ring-[#155aa6]/10"
                                placeholder="متن سوال را ویرایش کن"
                            />
                            {editError && <p className="mt-2 text-xs font-bold leading-5 text-rose-600">{editError}</p>}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    disabled={isSavingEdit}
                                    className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-200 disabled:opacity-60"
                                >
                                    لغو
                                </button>
                                <button
                                    type="button"
                                    onClick={onSubmitEdit}
                                    disabled={!editText.trim() || isSavingEdit}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                                    ذخیره
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 space-y-3">
                        {detail ? (
                            detail.answers.length > 0 ? (
                                detail.answers.map((answer) => <ThreadBubble key={answer.id} item={answer} />)
                            ) : null
                        ) : (
                            <LoadingInline text="در حال بارگذاری گفتگو" />
                        )}
                    </div>
                    <ReplyComposer
                        value={answerText}
                        error={answerError}
                        placeholder="پاسخت را بنویس"
                        disabled={isSubmittingAnswer}
                        onChange={onAnswerChange}
                        onSubmit={onSubmitAnswer}
                    />
                </div>
            )}
        </article>
    );
}

function ArticleCard({
    article,
    detail,
    isOpen,
    commentText,
    commentError,
    isSubmittingComment,
    onToggle,
    onCommentChange,
    onSubmitComment,
}: {
    article: Article;
    detail?: ArticleDetail;
    isOpen: boolean;
    commentText: string;
    commentError: string;
    isSubmittingComment: boolean;
    onToggle: () => void;
    onCommentChange: (value: string) => void;
    onSubmitComment: () => void;
}) {
    return (
        <article className="overflow-hidden rounded-[22px] border border-[#d6e1ee] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <button type="button" onClick={onToggle} className="w-full p-4 text-right">
                <div className="flex gap-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] bg-[#eef6ff] text-[#155aa6]">
                        {article.cover_image ? (
                            <Image src={getMediaUrl(article.cover_image)} alt={article.title} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                        <p className={cn("text-right text-[11px] font-bold text-slate-400", getTextAlign(article.author?.display_name))} {...getDirectionalTextProps(article.author?.display_name)}>{article.author?.display_name || "نویسنده چین‌ورس"} · {formatDate(article.created_at)}</p>
                        <h3 className={cn("mt-1 line-clamp-2 text-sm font-black leading-7 text-slate-900", getTextAlign(article.title))} {...getDirectionalTextProps(article.title)}>{article.title}</h3>
                        {article.summary && <p className={cn("mt-1 line-clamp-2 text-xs leading-6 text-slate-500", getTextAlign(article.summary))} {...getDirectionalTextProps(article.summary)}>{article.summary}</p>}
                        <div className="mt-2 flex items-center justify-between">
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">
                                {article.comments_count} کامنت
                            </span>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-[#155aa6]" /> : <ChevronDown className="h-4 w-4 text-[#155aa6]" />}
                        </div>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-[#e8edf4] bg-[#f8fafc] p-4">
                    <div className="rounded-2xl bg-white p-4">
                        <p className={cn("whitespace-pre-wrap text-sm leading-8 text-slate-700", getTextAlign(detail?.content || article.content))} {...getDirectionalTextProps(detail?.content || article.content)}>{detail?.content || article.content}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                        {detail ? (
                            detail.comments.length > 0 ? (
                                detail.comments.map((comment) => <ThreadBubble key={comment.id} item={comment} />)
                            ) : (
                                <SmallEmpty text="هنوز کامنتی ثبت نشده. اولین نظر را بنویس." />
                            )
                        ) : (
                            <LoadingInline text="در حال بارگذاری مقاله" />
                        )}
                    </div>
                    <ReplyComposer
                        value={commentText}
                        error={commentError}
                        placeholder="کامنتت را بنویس"
                        disabled={isSubmittingComment}
                        onChange={onCommentChange}
                        onSubmit={onSubmitComment}
                    />
                </div>
            )}
        </article>
    );
}

function ThreadBubble({ item }: { item: ForumAnswer | ArticleComment }) {
    return (
        <div className="rounded-[18px] bg-white p-3 text-right shadow-sm">
            <div className="flex items-start gap-3">
                <Avatar src={item.author?.avatar_url} name={item.author?.display_name} size="sm" />
                <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-xs font-black text-slate-900", getTextAlign(item.author?.display_name))} {...getDirectionalTextProps(item.author?.display_name)}>{item.author?.display_name || "کاربر چین‌ورس"}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{formatDate(item.created_at)}</span>
                    </div>
                    <p className={cn("mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600", getTextAlign(item.content))} {...getDirectionalTextProps(item.content)}>{item.content}</p>
                </div>
            </div>
        </div>
    );
}

function ReplyComposer({
    value,
    error,
    placeholder,
    disabled,
    onChange,
    onSubmit,
}: {
    value: string;
    error?: string;
    placeholder: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <>
            <div className="mt-4 flex items-end gap-2 rounded-[18px] bg-white p-2 shadow-sm">
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    dir={value.trim() ? "auto" : "rtl"}
                    className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-right text-sm leading-7 text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400"
                />
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!value.trim() || disabled}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#155aa6] text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
            {error && <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
        </>
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
        return <LoadingList count={4} />;
    }

    if (conversations.length === 0) {
        return (
            <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center">
                <div className="relative mb-8 h-[150px] w-[150px]">
                    <Image src="/assets/chinverse/icons/chat-message-hover-pinch.svg" alt="" fill sizes="150px" className="object-contain" />
                </div>
                <h2 className="text-[17px] font-black text-[#25272d]">هنوز پیامی دریافت نکردی!</h2>
                <p className="mt-3 max-w-[310px] text-sm leading-7 text-slate-500">
                    در این بخش میتونی با افراد شبکه ات در تماس باشی، با زبان آموز های دیگه گفت و گو کنی، از پشتیبانی کمک بگیری یا حتی پیام های شغلی از کارفرما ها دریافت کنی.
                </p>
            </div>
        );
    }

    return (
        <div className="motion-list space-y-3">
            {conversations.map((conversation) => (
                <Link
                    key={conversation.user.id}
                    href={`/chat/${conversation.user.id}`}
                    className="block rounded-[22px] border border-[#d6e1ee] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
                >
                    <div className="flex items-center gap-3">
                        <Avatar src={conversation.user.avatar_url} name={conversation.user.display_name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="truncate text-sm font-black text-slate-950">
                                    <span className="block" {...getDirectionalTextProps(conversation.user.display_name)}>{conversation.user.display_name || "کاربر چین‌ورس"}</span>
                                </h3>
                                <span className="shrink-0 text-xs text-slate-400">{formatDate(conversation.last_message_time)}</span>
                            </div>
                            <p className={cn("mt-1 truncate text-sm text-slate-500", getTextAlign(conversation.last_message))} {...getDirectionalTextProps(conversation.last_message)}>{conversation.last_message}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#155aa6] px-2 text-xs font-bold text-white">
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
        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef6ff] text-[#155aa6]", size === "sm" ? "h-9 w-9" : "h-12 w-12")}>
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
                <UserIcon size={size === "sm" ? 17 : 21} />
            )}
        </div>
    );
}

function LoadingList({ count }: { count: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[22px] bg-[#edf1f6]" />
            ))}
        </div>
    );
}

function LoadingInline({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-5 text-sm text-slate-400">
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            {text}
        </div>
    );
}

function SmallEmpty({ text }: { text: string }) {
    return (
        <p className="rounded-[18px] border border-dashed border-[#d6e1ee] bg-white px-4 py-5 text-center text-sm text-slate-400">
            {text}
        </p>
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
