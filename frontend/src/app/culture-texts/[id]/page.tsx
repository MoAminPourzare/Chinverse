import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { CULTURE_TEXTS_CATALOG } from "@/lib/cultureTextsCatalog";

export default function CultureTextsDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="culture-texts"
            title="متون کلاسیک آموزشی"
            basePath="/culture-texts"
            catalog={CULTURE_TEXTS_CATALOG}
            countLabel="درس"
            unitPlural="درس‌های"
            descriptionHeading="معرفی برنامه:"
            listHeading="درس‌های برنامه"
            eyebrow="فرهنگ و اندیشهٔ چین"
        />
    );
}
