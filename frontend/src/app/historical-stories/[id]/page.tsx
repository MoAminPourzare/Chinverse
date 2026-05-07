import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function HistoricalStoriesDetailPage() {
    return (
        <CourseDetailPage
            domain="historical-stories"
            explorePath="/explore/historical-stories"
            eyebrow="داستان‌های تاریخی"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-stone-600"
        />
    );
}
