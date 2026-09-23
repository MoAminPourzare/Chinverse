import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";

export default function HistoricalStoriesDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="historical-stories"
            title="داستان‌های کهن"
            basePath="/historical-stories"
            catalog={HISTORICAL_STORIES_CATALOG}
            countLabel="درس"
            unitPlural="درس‌های"
            descriptionHeading="معرفی برنامه:"
            listHeading="درس‌های برنامه"
            eyebrow="فرهنگ و اندیشهٔ چین"
        />
    );
}
