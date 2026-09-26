import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { PRACTICAL_CATALOG } from "@/lib/practicalCatalog";

export default function PracticalExplorePage() {
    return <PlannedCourseExplorePage title="چینی کاربردی" basePath="/practical" catalog={PRACTICAL_CATALOG} />;
}
