import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { PRACTICAL_CATALOG } from "@/lib/practicalCatalog";

export default function PracticalDetailPage() {
    return <PlannedCourseDetailPage domain="practical" title="چینی کاربردی" basePath="/practical" catalog={PRACTICAL_CATALOG} />;
}
