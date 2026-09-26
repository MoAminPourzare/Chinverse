import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";

export default function PronunciationDetailPage() {
    return <PlannedCourseDetailPage domain="pronunciation" title="تلفظ" basePath="/pronunciation" catalog={PRONUNCIATION_CATALOG} />;
}
