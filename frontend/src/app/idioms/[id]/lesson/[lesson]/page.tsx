import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { IDIOMS_CATALOG } from "@/lib/idiomsCatalog";

export default function IdiomsLessonPage() {
    return <PlannedLessonPage domain="idioms" title="اصطلاحات و ضرب‌المثل‌های ادبی" basePath="/idioms" catalog={IDIOMS_CATALOG} />;
}
