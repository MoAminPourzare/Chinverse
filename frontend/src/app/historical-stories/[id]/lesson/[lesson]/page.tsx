import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";

export default function HistoricalStoriesLessonPage() {
    return (
        <PlannedLessonPage
            domain="historical-stories"
            title="داستان‌های کهن"
            basePath="/historical-stories"
            catalog={HISTORICAL_STORIES_CATALOG}
            unitLabel="درس"
            unitPlural="درس‌ها"
        />
    );
}
