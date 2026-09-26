import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { IDIOMS_CATALOG } from "@/lib/idiomsCatalog";

export default function IdiomsDetailPage() {
    return <PlannedCourseDetailPage domain="idioms" title="اصطلاحات و ضرب‌المثل‌های ادبی" basePath="/idioms" catalog={IDIOMS_CATALOG} />;
}
