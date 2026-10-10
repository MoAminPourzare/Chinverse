import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCUMENTS } from "@/lib/legalDocuments";

export default function PrivacyPage() {
    return <LegalDocument {...LEGAL_DOCUMENTS["privacy"]} />;
}
