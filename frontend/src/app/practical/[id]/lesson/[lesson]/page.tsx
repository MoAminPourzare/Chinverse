import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { PRACTICAL_CATALOG } from "@/lib/practicalCatalog";

export default function PracticalLessonPage() {
    return <PlannedLessonPage domain="practical" title="چینی کاربردی" basePath="/practical" catalog={PRACTICAL_CATALOG} />;
}
