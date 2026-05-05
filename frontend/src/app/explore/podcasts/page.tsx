import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function PodcastsExplorePage() {
    return (
        <CourseExplorePage
            title="پادکست"
            subcategorySlug="podcasts"
            detailPath="/podcasts"
            layout="square"
            countKeys={["episodes_count"]}
            countLabel="اپیزود"
        />
    );
}
