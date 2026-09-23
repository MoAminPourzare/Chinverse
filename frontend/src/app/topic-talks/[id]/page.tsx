import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { TOPIC_TALKS_CATALOG } from "@/lib/topicTalksCatalog";

export default function TopicTalksDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="topic-talks"
            title="گفتارهای موضوعی"
            basePath="/topic-talks"
            catalog={TOPIC_TALKS_CATALOG}
            countLabel="گفتار"
            unitPlural="گفتارهای"
            descriptionHeading="معرفی پادکست:"
            listHeading="گفتارهای مجموعه"
            eyebrow="سرگرمی و رسانه"
        />
    );
}
