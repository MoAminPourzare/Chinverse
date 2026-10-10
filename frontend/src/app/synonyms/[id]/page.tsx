import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { SYNONYMS_CATALOG } from "@/lib/synonymsCatalog";

export default function SynonymsDetailPage() {
    return <PlannedCourseDetailPage domain="synonyms" title="واژگان هم‌معنی" basePath="/synonyms" catalog={SYNONYMS_CATALOG} />;
}
