import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { CLASSICAL_CATALOG } from "@/lib/classicalCatalog";

export default function ClassicalDetailPage() {
    return <PlannedCourseDetailPage domain="classical" title="زبان چینی کلاسیک" basePath="/classical" catalog={CLASSICAL_CATALOG} />;
}
