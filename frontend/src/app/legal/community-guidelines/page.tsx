import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_DOCUMENTS } from "@/lib/legalDocuments";

export default function CommunityGuidelinesPage() {
    return <LegalDocument {...LEGAL_DOCUMENTS["community-guidelines"]} />;
}
