"use client";

import { Dialog } from "@headlessui/react";
import { BackButton } from "@/components/ui/IconButton";
import { useSearchParams } from "next/navigation";
import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import { LEGAL_DOCUMENTS, type LegalDocumentKind } from "@/lib/legalDocuments";

export function openSignupLegalDocument(kind: LegalDocumentKind) {
    const url = new URL(window.location.href);
    const alreadyOpen = url.searchParams.has("legal");
    url.searchParams.set("legal", kind);
    const state = { signupLegalReview: alreadyOpen ? Boolean(window.history.state?.signupLegalReview) : true };
    if (alreadyOpen) {
        window.history.replaceState(state, "", url);
    } else {
        window.history.pushState(state, "", url);
    }
}

export default function SignupLegalDialog() {
    const searchParams = useSearchParams();
    const kind = searchParams.get("legal");
    if (!kind || !Object.hasOwn(LEGAL_DOCUMENTS, kind)) return null;
    const document = LEGAL_DOCUMENTS[kind as LegalDocumentKind];

    const close = () => {
        if (window.history.state?.signupLegalReview) {
            window.history.back();
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("legal");
        window.history.replaceState(null, "", url);
    };

    return (
        <Dialog open onClose={close} className="fixed inset-0 z-[180]" dir="rtl">
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="flex min-h-0 max-h-full w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] bg-white text-right shadow-2xl">
                    <div className="relative flex min-h-[72px] shrink-0 items-center justify-center border-b border-slate-100 px-5 py-3">
                        <BackButton onClick={close} label="بازگشت به ثبت‌نام" className="absolute left-5 top-1/2 -translate-y-1/2" />
                        <Dialog.Title className="px-14 text-center text-base font-black text-slate-950">{document.title}</Dialog.Title>
                    </div>
                    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-6">
                        <nav aria-label="اسناد حقوقی ثبت‌نام" className="mt-4 flex flex-wrap gap-2">
                            {(Object.keys(LEGAL_DOCUMENTS) as LegalDocumentKind[]).map((key) => (
                                <button key={key} type="button" onClick={() => openSignupLegalDocument(key)} aria-pressed={key === kind} className="rounded-xl px-3 text-xs font-bold text-[#155aa6] hover:bg-blue-50 aria-pressed:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#155aa6]">
                                    {LEGAL_DOCUMENTS[key].title}
                                </button>
                            ))}
                        </nav>
                        <LegalDocumentBody intro={document.intro} sections={document.sections} version={document.version} />
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
