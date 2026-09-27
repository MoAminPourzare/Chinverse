import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import type { LegalDocumentData } from "@/lib/legalDocuments";

export function LegalDocument({
    title,
    intro,
    sections,
    version,
}: LegalDocumentData) {
    return (
        <main className="min-h-full bg-[#f7f8fb] px-5 pb-12 pt-5 text-right text-slate-800" dir="rtl">
            <div className="mx-auto w-full max-w-[680px]">
                <Link
                    href="/settings/about"
                    className="inline-flex h-10 items-center gap-2 text-sm font-bold text-[#155aa6] transition hover:text-[#0f4e92]"
                >
                    <ArrowRight size={18} />
                    بازگشت
                </Link>
                <h1 className="mt-6 text-2xl font-black text-slate-950">{title}</h1>
                <LegalDocumentBody intro={intro} sections={sections} version={version} />

                <nav aria-label="اسناد حقوقی" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-5 text-xs font-bold text-[#155aa6]">
                    <Link href="/legal/terms">شرایط استفاده</Link>
                    <Link href="/legal/privacy">حریم خصوصی</Link>
                    <Link href="/legal/community-guidelines">قوانین جامعه</Link>
                    <Link href="/support">پشتیبانی و درخواست بازبینی</Link>
                </nav>
            </div>
        </main>
    );
}
