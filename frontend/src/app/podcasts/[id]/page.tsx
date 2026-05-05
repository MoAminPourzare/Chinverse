import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function PodcastDetailPage() {
    return (
        <CourseDetailPage
            domain="podcasts"
            explorePath="/explore/podcasts"
            eyebrow="پادکست"
            countKeys={["episodes_count"]}
            countLabel="اپیزود"
            accentClass="bg-indigo-600"
        />
    );
}
