import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";

export default function PronunciationLessonPage() {
    return <PlannedLessonPage domain="pronunciation" title="تلفظ" basePath="/pronunciation" catalog={PRONUNCIATION_CATALOG} />;
}
