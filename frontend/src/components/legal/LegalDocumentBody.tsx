import { LEGAL_EFFECTIVE_DATE_FA } from "@/lib/legal";
import type { LegalDocumentData } from "@/lib/legalDocuments";

export function LegalDocumentBody({ intro, sections, version }: Omit<LegalDocumentData, "title">) {
    return (
        <>
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
        </>
    );
}
