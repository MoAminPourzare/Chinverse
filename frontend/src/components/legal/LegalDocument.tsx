import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LEGAL_EFFECTIVE_DATE_FA } from "@/lib/legal";

type LegalSection = {
    title: string;
    paragraphs: string[];
    items?: string[];
};

export function LegalDocument({
    title,
    intro,
    sections,
    version,
}: {
    title: string;
    intro: string;
    sections: LegalSection[];
    version: string;
}) {
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
                <p className="mt-4 text-sm leading-8 text-slate-600">{intro}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                    لازم‌الاجرا از {LEGAL_EFFECTIVE_DATE_FA} | نسخه <span dir="ltr">{version}</span>
                </p>

                <div className="mt-9 space-y-8">
                    {sections.map((section) => (
                        <section key={section.title}>
                            <h2 className="text-base font-black text-slate-900">{section.title}</h2>
                            <div className="mt-3 space-y-3 text-sm leading-8 text-slate-600">
                                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                                {section.items && (
                                    <ul className="list-disc space-y-1 pr-5 marker:text-[#155aa6]">
                                        {section.items.map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                )}
                            </div>
                        </section>
                    ))}
                </div>

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
