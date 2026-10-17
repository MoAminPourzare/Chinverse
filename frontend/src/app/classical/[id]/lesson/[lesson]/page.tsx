import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CLASSICAL_CATALOG } from "@/lib/classicalCatalog";

export default function ClassicalLessonPage() {
    return <PlannedLessonPage domain="classical" title="زبان چینی کلاسیک" basePath="/classical" catalog={CLASSICAL_CATALOG} />;
}
