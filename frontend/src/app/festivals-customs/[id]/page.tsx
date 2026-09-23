import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { FESTIVALS_CUSTOMS_CATALOG } from "@/lib/festivalsCustomsCatalog";

export default function FestivalsCustomsDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="festivals-customs"
            title="آیین‌ها و جشن‌ها"
            basePath="/festivals-customs"
            catalog={FESTIVALS_CUSTOMS_CATALOG}
            countLabel="درس"
            unitPlural="درس‌های"
            descriptionHeading="معرفی برنامه:"
            listHeading="درس‌های برنامه"
            eyebrow="فرهنگ و اندیشهٔ چین"
        />
    );
}
