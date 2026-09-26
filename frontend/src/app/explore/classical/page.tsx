import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { CLASSICAL_CATALOG } from "@/lib/classicalCatalog";

export default function ClassicalExplorePage() {
    return <PlannedCourseExplorePage title="زبان چینی کلاسیک" basePath="/classical" catalog={CLASSICAL_CATALOG} />;
}
