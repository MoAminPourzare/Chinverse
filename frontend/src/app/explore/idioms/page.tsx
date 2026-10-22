import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { IDIOMS_CATALOG } from "@/lib/idiomsCatalog";

export default function IdiomsExplorePage() {
    return <PlannedCourseExplorePage title="اصطلاحات و ضرب‌المثل‌های ادبی" basePath="/idioms" catalog={IDIOMS_CATALOG} compactTitle />;
}
