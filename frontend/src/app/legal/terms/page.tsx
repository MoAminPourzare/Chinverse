import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCUMENTS } from "@/lib/legalDocuments";

export default function TermsPage() {
    return <LegalDocument {...LEGAL_DOCUMENTS["terms"]} />;
}
