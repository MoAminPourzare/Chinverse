import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";

export default function HistoricalStoriesExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="داستان‌های کهن"
            basePath="/historical-stories"
            catalog={HISTORICAL_STORIES_CATALOG}
            countLabel="درس"
        />
    );
}
