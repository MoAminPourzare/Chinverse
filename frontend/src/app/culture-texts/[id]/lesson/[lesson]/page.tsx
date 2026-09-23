import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CULTURE_TEXTS_CATALOG } from "@/lib/cultureTextsCatalog";

export default function CultureTextsLessonPage() {
    return (
        <PlannedLessonPage
            domain="culture-texts"
            title="متون کلاسیک آموزشی"
            basePath="/culture-texts"
            catalog={CULTURE_TEXTS_CATALOG}
            unitLabel="درس"
            unitPlural="درس‌ها"
        />
    );
}
