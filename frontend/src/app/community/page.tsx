"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Loader2, MessageCircle, MessagesSquare, PenLine, Send, Trash2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { BackButton } from "@/components/ui/IconButton";
import { ArticleLibrary } from "@/components/articles/ArticleLibrary";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { validateTextLength, validationMessage } from "@/validation";
import { Article, ArticleComment, communityService, ForumAnswer, ForumQuestion, ForumQuestionDetail } from "@/services/community.service";

export default function CommunityPage() {
    return <Suspense fallback={<LoadingList count={2} />}><CommunityHub /></Suspense>;
}

function CommunityHub() {
    const currentUserId = useOptionalCurrentUserId();
    const searchParams = useSearchParams();
    const activeSection = searchParams.get("section") === "articles" ? "articles" : "questions";
    const [questions, setQuestions] = useState<ForumQuestion[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const requestId = useRef(0);
    const load = useCallback(async () => {
        const request = ++requestId.current;
        setIsLoading(true);
        setLoadError("");
        try {
            if (activeSection === "articles") {
                const result = await communityService.getArticles();
                if (request === requestId.current) setArticles(result);
            } else {
                const result = await communityService.getForumQuestions();
                if (request === requestId.current) setQuestions(result);
            }
        } catch {
            if (request === requestId.current) setLoadError("این بخش باز نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.");
        } finally {
            if (request === requestId.current) setIsLoading(false);
        }
    }, [activeSection]);
    const invalidate = useCallback(() => { requestId.current++; }, []);
    useEffect(() => {
        void load();
        return invalidate;
    }, [load, invalidate]);

    return <div className="min-h-full bg-[#f9fafc] px-5 pb-8 pt-4" dir="rtl">
        <header className="relative mb-6 flex h-12 items-center justify-center">
            <BackButton href="/profile" className="absolute left-0" />
            <h1 className="text-lg font-black text-slate-900">گفتگو</h1>
        </header>
        <Link href="/chat" className="flex min-h-24 items-center gap-3 rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#155aa6]">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#155aa6]"><MessagesSquare aria-hidden className="size-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">پیام‌های من</span><span className="mt-1 block text-xs leading-6 text-slate-500">گفتگوهای خصوصی و پشتیبانی</span></span>
            <ArrowLeft aria-hidden className="size-4 shrink-0 text-[#155aa6]" />
        </Link>
        <section className="mt-8" aria-labelledby="forum-title">
            <h2 id="forum-title" className="text-base font-black text-slate-900">تالار گفتگو</h2>
            <nav aria-label="بخش‌های تالار گفتگو" className="mb-6 mt-4 flex gap-5 border-b border-slate-200">
                {[{ id: "questions", label: "سوالات شما", Icon: MessageCircle }, { id: "articles", label: "مقالات", Icon: BookOpen }].map(({ id, label, Icon }) => <Link key={id} href={`/community?section=${id}`} scroll={false} aria-current={activeSection === id ? "page" : undefined} className={cn("flex min-h-12 items-center gap-2 border-b-2 px-1 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-[#155aa6]", activeSection === id ? "border-[#155aa6] text-[#155aa6]" : "border-transparent text-slate-500 hover:text-[#155aa6]")}><Icon aria-hidden className="size-4" />{label}</Link>)}
            </nav>
            {loadError ? <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600"><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-3 min-h-11 rounded-xl bg-[#155aa6] px-4 font-bold text-white">تلاش دوباره</button></div> : isLoading ? <LoadingList /> : activeSection === "articles" ? <ArticleLibrary articles={articles} /> : <QuestionsSection questions={questions} isLoading={false} currentUserId={currentUserId} setQuestions={setQuestions} />}
        </section>
    </div>;
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
    const [submittedMessage, setSubmittedMessage] = useState("");
    const [answerErrors, setAnswerErrors] = useState<Record<number, string>>({});
    const [submittingAnswerId, setSubmittingAnswerId] = useState<number | null>(null);

    const submitQuestion = async () => {
        const content = draft.trim();
        const validationError = validationMessage(validateTextLength(content, "متن سوال", { required: true, min: 3, max: 8000 }));
        setDraftError(validationError);
        setSubmittedMessage("");
        if (validationError || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const title = content.length > 55 ? content.slice(0, 55).trim() : content;
            const created = await communityService.createForumQuestion({ title, content });
            setQuestions((current) => [created, ...current]);
            setDraft("");
            setOpenQuestionId(created.id);
            setDetails((current) => ({ ...current, [created.id]: { ...created, answers: [] } }));
            setSubmittedMessage("سوالت ثبت شد.");
        } catch (error) {
            console.error("Failed to create question:", error);
            setDraftError(getCommunityErrorMessage(error, "ثبت سوال انجام نشد. لطفا دوباره تلاش کن.", "create"));
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
        const validationError = validationMessage(validateTextLength(content, "متن سوال", { required: true, min: 3, max: 8000 }));
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
            setEditError(getCommunityErrorMessage(error, "ویرایش سوال انجام نشد. لطفا دوباره تلاش کن."));
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
            alert(getCommunityErrorMessage(error, "حذف سوال انجام نشد. لطفا دوباره تلاش کن."));
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
            setAnswerErrors((current) => ({ ...current, [questionId]: getCommunityErrorMessage(error, "ارسال پاسخ انجام نشد. لطفا دوباره تلاش کن.", "create") }));
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
                    id="question-draft"
                    aria-label="متن سوال"
                    aria-invalid={Boolean(draftError)}
                    aria-describedby={draftError ? "question-draft-error" : undefined}
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        if (draftError) setDraftError("");
                        setSubmittedMessage("");
                    }}
                    rows={2}
                    dir={draft.trim() ? "auto" : "rtl"}
                    placeholder="سوالت رو اینجا بنویس"
                    disabled={isSubmitting}
                    maxLength={8000}
                    className={cn("min-h-[56px] min-w-0 flex-1 resize-none rounded-[10px] border bg-white px-4 py-3 text-right text-sm leading-7 text-slate-900 outline-none transition placeholder:text-right placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10 disabled:opacity-70", draftError ? "border-rose-500" : "border-[#d6e1ee]")}
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
            {draftError && <p id="question-draft-error" role="alert" className="mt-2 text-xs font-bold leading-5 text-rose-600">{draftError}</p>}
            {submittedMessage && <p role="status" className="mt-2 text-xs font-bold leading-5 text-emerald-700">{submittedMessage}</p>}

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

function getCommunityErrorMessage(error: unknown, fallback: string, action: "create" | "manage" = "manage") {
    const axiosError = error as {
        response?: { status?: number; data?: { detail?: unknown; error?: { message?: string } } };
    };

    if (!axiosError.response) {
        return "ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کن.";
    }
    if (axiosError.response.status === 401) {
        return "برای انجام این کار باید وارد حساب شوی.";
    }
    if (axiosError.response.status === 403) {
        if (action === "create") return "برای ثبت سوال یا پاسخ، تأیید حساب کاربری‌ات را کامل کن.";
        return "فقط نویسنده سوال می‌تواند آن را ویرایش یا حذف کند.";
    }
    if (axiosError.response.status === 429) {
        return "درخواست‌ها زیاد شده؛ کمی صبر کن و دوباره امتحان کن.";
    }

    if (axiosError.response.status === 422) return "متن سوال یا پاسخ معتبر نیست. متن را بررسی کن و دوباره بفرست.";
    if ((axiosError.response.status || 0) >= 500) return fallback;
    const detail = axiosError.response.data?.detail;
    return typeof detail === "string" && /[\u0600-\u06FF]/.test(detail) ? detail : fallback;
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
    const hasAdditionalContent = question.content.trim() !== question.title.trim();

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
                        <h3 className={cn("mt-2 text-sm font-black leading-7 text-slate-900", !isOpen && "line-clamp-2", getTextAlign(question.title))} {...getDirectionalTextProps(question.title)}>{question.title}</h3>
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
                    {hasAdditionalContent && <p className={cn("whitespace-pre-wrap break-words text-sm leading-7 text-slate-700", getTextAlign(question.content))} {...getDirectionalTextProps(question.content)}>{question.content}</p>}
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
                    <div className={cn("space-y-3", (hasAdditionalContent || isEditing) && "mt-4")}>
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

function ThreadBubble({ item }: { item: ForumAnswer | ArticleComment }) {
    return (
        <div className="rounded-[18px] bg-white p-3 text-right shadow-sm">
            <div className="flex items-start gap-3">
                <Avatar src={item.author?.avatar_url} name={item.author?.display_name} size="sm" />
                <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-xs font-black text-slate-900", getTextAlign(item.author?.display_name))} {...getDirectionalTextProps(item.author?.display_name)}>{item.author?.display_name || "کاربر چین‌ورس"}</p>
                        <div className="flex shrink-0 items-center gap-1">
                            <span className="text-[11px] text-slate-400">{formatDate(item.created_at)}</span>
                        </div>
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
                    disabled={disabled}
                    dir={value.trim() ? "auto" : "rtl"}
                    className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-right text-sm leading-7 text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400"
                />
                <button
                    type="button"
                    onClick={onSubmit}
                    aria-label="ارسال پاسخ"
                    disabled={!value.trim() || disabled}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#155aa6] text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
            {error && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
        </>
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

function LoadingList({ count = 2 }: { count?: number }) {
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
