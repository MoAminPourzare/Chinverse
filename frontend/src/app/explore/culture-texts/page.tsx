import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { CULTURE_TEXTS_CATALOG } from "@/lib/cultureTextsCatalog";

export default function CultureTextsExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="متون کلاسیک آموزشی"
            basePath="/culture-texts"
            catalog={CULTURE_TEXTS_CATALOG}
            countLabel="درس"
        />
    );
}
