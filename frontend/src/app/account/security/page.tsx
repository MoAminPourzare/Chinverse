"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, LogIn, LogOut, MonitorSmartphone, ShieldCheck, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/ui/IconButton";
import { adminService, type AdminAccess } from "@/lib/admin";
import { authService, type MfaSetupInfo, type SessionInfo } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { validatePassword, validationMessage } from "@/validation";

export default function AccountSecurityPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
    const [mfaPassword, setMfaPassword] = useState("");
    const [mfaCode, setMfaCode] = useState("");
    const [mfaSetup, setMfaSetup] = useState<MfaSetupInfo | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [deletionPassword, setDeletionPassword] = useState("");
    const [deletionConfirmed, setDeletionConfirmed] = useState(false);
    const [pending, setPending] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadSessions = useCallback(async () => {
        if (!await authService.restoreSession()) return router.replace("/login?next=/account/security");
        const [sessionItems, access] = await Promise.all([
            authService.listSessions(),
            adminService.getAdminAccess(),
        ]);
        setSessions(sessionItems);
        setAdminAccess(access);
    }, [router]);

    useEffect(() => {
        void loadSessions().catch(() => router.replace("/login?next=/account/security"));
    }, [loadSessions, router]);

    const changePassword = async (event: React.FormEvent) => {
        event.preventDefault();
        const validation = validationMessage(validatePassword(newPassword));
        if (validation) return setError(validation);
        setPending("password");
        setError("");
        try {
            await authService.changePassword(currentPassword, newPassword);
            router.replace("/login");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "تغییر رمز عبور ناموفق بود.");
        } finally {
            setPending("");
        }
    };

    const revoke = async (sessionId: string) => {
        setPending(sessionId);
        setError("");
        try {
            await authService.revokeSession(sessionId);
            setSessions((items) => items.filter((item) => item.id !== sessionId));
            setMessage("نشست انتخاب‌شده بسته شد.");
        } catch {
            setError("بستن نشست ناموفق بود.");
        } finally {
            setPending("");
        }
    };

    const logoutAll = async () => {
        setPending("all");
        await authService.logoutAll();
        router.replace("/login");
    };

    const beginMfaSetup = async (event: React.FormEvent) => {
        event.preventDefault();
        setPending("mfa-setup");
        setError("");
        try {
            setMfaSetup(await authService.setupAdminMfa(mfaPassword));
            setBackupCodes([]);
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "شروع احراز هویت دومرحله‌ای ناموفق بود.");
        } finally {
            setPending("");
        }
    };

    const confirmMfa = async (event: React.FormEvent) => {
        event.preventDefault();
        setPending("mfa-confirm");
        setError("");
        try {
            setBackupCodes(await authService.confirmAdminMfa(mfaCode));
            setMfaSetup(null);
            setMfaPassword("");
            setMfaCode("");
            setAdminAccess((value) => value ? { ...value, mfa_enabled: true, mfa_verified: false } : value);
            setMessage("احراز هویت دومرحله‌ای فعال شد. کدهای بازیابی را نگه دار و دوباره وارد شو.");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "کد احراز هویت معتبر نیست.");
        } finally {
            setPending("");
        }
    };

    const regenerateBackupCodes = async () => {
        setPending("mfa-backup");
        setError("");
        try {
            setBackupCodes(await authService.regenerateAdminBackupCodes());
            setMessage("کدهای بازیابی قبلی باطل شدند.");
        } catch {
            setError("ساخت کدهای بازیابی جدید ناموفق بود.");
        } finally {
            setPending("");
        }
    };

    const copyValue = async (value: string) => {
        await navigator.clipboard.writeText(value);
        setMessage("کپی شد.");
    };

    const deleteAccount = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!deletionConfirmed || !deletionPassword) return;
        setPending("delete-account");
        setError("");
        try {
            await userService.deleteAccount(deletionPassword);
            await authService.logout();
            router.replace("/login");
            router.refresh();
        } catch (caught: unknown) {
            const apiError = caught as { response?: { status?: number } };
            setError(
                apiError.response?.status === 401
                    ? "رمز عبور فعلی درست نیست."
                    : "حذف حساب انجام نشد. لطفاً دوباره تلاش کن.",
            );
        } finally {
            setPending("");
        }
    };

    return (
        <main className="min-h-full bg-[#f7f8fb] px-5 pb-10 pt-4" dir="rtl">
            <AppHeader title="امنیت حساب" backHref="/settings" icon={<KeyRound size={22} />} />
            <div className="mx-auto mt-7 w-full max-w-[430px] space-y-9">
                {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
                {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

                <section>
                    <h2 className="text-base font-black text-slate-900">تغییر رمز عبور</h2>
                    <form onSubmit={changePassword} className="mt-4 space-y-3">
                        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="رمز عبور فعلی" dir="ltr" autoComplete="current-password" maxLength={128} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]" />
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="رمز عبور جدید" dir="ltr" autoComplete="new-password" maxLength={128} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]" />
                        <button type="submit" disabled={pending === "password"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
                            {pending === "password" && <Loader2 size={17} className="animate-spin" />}
                            تغییر رمز عبور
                        </button>
                    </form>
                </section>

                {adminAccess?.is_admin && (
                    <section>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-[#155aa6]" />
                            <h2 className="text-base font-black text-slate-900">امنیت پنل مدیریت</h2>
                        </div>

                        {!adminAccess.mfa_enabled && !mfaSetup && (
                            <form onSubmit={beginMfaSetup} className="mt-4 space-y-3">
                                <input
                                    type="password"
                                    value={mfaPassword}
                                    onChange={(event) => setMfaPassword(event.target.value)}
                                    placeholder="رمز عبور فعلی"
                                    dir="ltr"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]"
                                />
                                <button type="submit" disabled={pending === "mfa-setup"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
                                    {pending === "mfa-setup" && <Loader2 size={17} className="animate-spin" />}
                                    فعال‌سازی ورود دومرحله‌ای
                                </button>
                            </form>
                        )}

                        {mfaSetup && (
                            <form onSubmit={confirmMfa} className="mt-4 space-y-4">
                                <div className="border-y border-slate-200 py-4">
                                    <p className="text-xs font-bold text-slate-500">کلید راه‌اندازی</p>
                                    <div className="mt-2 flex items-center gap-2" dir="ltr">
                                        <code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-800">{mfaSetup.secret}</code>
                                        <button type="button" onClick={() => void copyValue(mfaSetup.secret)} title="کپی" aria-label="کپی کلید راه‌اندازی" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#155aa6] hover:bg-blue-50">
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                    <a href={mfaSetup.provisioning_uri} className="mt-3 inline-block text-sm font-black text-[#155aa6]">افزودن به برنامه احراز هویت</a>
                                </div>
                                <input
                                    value={mfaCode}
                                    onChange={(event) => setMfaCode(event.target.value.replace(/\s/g, ""))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="کد شش‌رقمی"
                                    dir="ltr"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]"
                                />
                                <button type="submit" disabled={pending === "mfa-confirm"} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
                                    {pending === "mfa-confirm" && <Loader2 size={17} className="animate-spin" />}
                                    تایید و فعال‌سازی
                                </button>
                            </form>
                        )}

                        {adminAccess.mfa_enabled && (
                            <button type="button" onClick={regenerateBackupCodes} disabled={pending === "mfa-backup" || !adminAccess.mfa_verified} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#155aa6]/25 text-sm font-black text-[#155aa6] disabled:opacity-50">
                                {pending === "mfa-backup" && <Loader2 size={17} className="animate-spin" />}
                                ساخت کدهای بازیابی جدید
                            </button>
                        )}

                        {backupCodes.length > 0 && (
                            <div className="mt-4 border-y border-amber-200 bg-amber-50/60 py-4">
                                <p className="px-2 text-sm font-black text-amber-900">کدهای بازیابی یک‌بارمصرف</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 px-2" dir="ltr">
                                    {backupCodes.map((code) => <code key={code} className="text-center text-xs font-bold text-slate-800">{code}</code>)}
                                </div>
                                <button type="button" onClick={() => void copyValue(backupCodes.join("\n"))} className="mt-4 flex h-10 items-center gap-2 px-2 text-sm font-black text-amber-900">
                                    <Copy size={17} />
                                    کپی همه کدها
                                </button>
                                {!adminAccess.mfa_verified && (
                                    <button type="button" onClick={() => router.replace("/login")} className="mt-2 flex h-10 items-center gap-2 px-2 text-sm font-black text-[#155aa6]">
                                        <LogIn size={17} />
                                        ورود دوباره
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-2">
                        <MonitorSmartphone size={20} className="text-[#155aa6]" />
                        <h2 className="text-base font-black text-slate-900">نشست‌های فعال</h2>
                    </div>
                    <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex min-h-16 items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-800">{session.current ? "این دستگاه" : "نشست دیگر"}</p>
                                    <p className="mt-1 text-xs text-slate-500">آخرین فعالیت: {new Date(session.last_used_at).toLocaleString("fa-IR")}</p>
                                </div>
                                {!session.current && (
                                    <button type="button" onClick={() => revoke(session.id)} disabled={pending === session.id} className="flex h-10 w-10 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 disabled:opacity-50" aria-label="بستن نشست">
                                        {pending === session.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={logoutAll} disabled={pending === "all"} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                        {pending === "all" ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={18} />}
                        خروج از همه دستگاه‌ها
                    </button>
                </section>

                <section id="delete-account" className="scroll-mt-6 border-t border-rose-100 pt-8">
                    <div className="flex items-center gap-2 text-rose-700">
                        <Trash2 size={20} />
                        <h2 className="text-base font-black">حذف دائمی حساب</h2>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        رزومه، گالری، پیام‌ها و داده‌های وابسته پاک می‌شوند و این کار قابل بازگشت نیست.
                    </p>
                    <form onSubmit={deleteAccount} className="mt-4 space-y-4">
                        <input
                            type="password"
                            value={deletionPassword}
                            onChange={(event) => setDeletionPassword(event.target.value)}
                            placeholder="رمز عبور فعلی"
                            dir="ltr"
                            autoComplete="current-password"
                            maxLength={128}
                            required
                            className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-rose-500"
                        />
                        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                            <input
                                type="checkbox"
                                checked={deletionConfirmed}
                                onChange={(event) => setDeletionConfirmed(event.target.checked)}
                                className="mt-1 h-4 w-4 accent-rose-600"
                            />
                            تأیید می‌کنم که حذف حساب و داده‌های آن دائمی است.
                        </label>
                        <button
                            type="submit"
                            disabled={pending === "delete-account" || !deletionConfirmed || !deletionPassword}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                            {pending === "delete-account" ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={18} />}
                            حذف دائمی حساب
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}
