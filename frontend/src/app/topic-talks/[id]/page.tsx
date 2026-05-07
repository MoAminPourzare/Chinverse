import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function TopicTalksDetailPage() {
    return (
        <CourseDetailPage
            domain="topic-talks"
            explorePath="/explore/topic-talks"
            eyebrow="گفتارهای موضوعی"
            countKeys={["episodes_count"]}
            countLabel="گفتار"
            accentClass="bg-fuchsia-600"
        />
    );
}
