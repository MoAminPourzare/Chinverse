import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function TopicTalksExplorePage() {
    return (
        <CourseExplorePage
            title="گفتارهای موضوعی"
            subcategorySlug="topic-talks"
            detailPath="/topic-talks"
            layout="square"
            countKeys={["episodes_count"]}
            countLabel="گفتار"
        />
    );
}
