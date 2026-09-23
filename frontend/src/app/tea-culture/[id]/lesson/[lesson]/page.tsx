import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";

export default function TeaCultureLessonPage() {
    return (
        <PlannedLessonPage
            domain="tea-culture"
            title="فرهنگ چای"
            basePath="/tea-culture"
            catalog={TEA_CULTURE_CATALOG}
            unitLabel="درس"
            unitPlural="درس‌ها"
        />
    );
}
