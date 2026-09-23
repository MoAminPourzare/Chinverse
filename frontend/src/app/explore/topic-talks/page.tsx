import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { TOPIC_TALKS_CATALOG } from "@/lib/topicTalksCatalog";

export default function TopicTalksExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="گفتارهای موضوعی"
            basePath="/topic-talks"
            catalog={TOPIC_TALKS_CATALOG}
            countLabel="گفتار"
        />
    );
}
