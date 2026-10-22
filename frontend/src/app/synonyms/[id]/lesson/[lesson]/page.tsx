import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { SYNONYMS_CATALOG } from "@/lib/synonymsCatalog";

export default function SynonymsLessonPage() {
    return <PlannedLessonPage domain="synonyms" title="واژگان هم‌معنی" basePath="/synonyms" catalog={SYNONYMS_CATALOG} />;
}
