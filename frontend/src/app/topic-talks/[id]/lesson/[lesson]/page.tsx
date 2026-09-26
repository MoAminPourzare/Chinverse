import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { TOPIC_TALKS_CATALOG } from "@/lib/topicTalksCatalog";

export default function TopicTalkLessonPage() {
    return (
        <PlannedLessonPage
            domain="topic-talks"
            title="گفتارهای موضوعی"
            basePath="/topic-talks"
            catalog={TOPIC_TALKS_CATALOG}
            unitLabel="گفتار"
            unitPlural="گفتارها"
            requirePublishedMedia
        />
    );
}
