import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function HistoricalStoriesExplorePage() {
    return (
        <CourseExplorePage
            title="داستان‌های تاریخی"
            subcategorySlug="historical-stories"
            detailPath="/historical-stories"
            layout="list"
            countLabel="درس"
            accentClass="bg-stone-600"
        />
    );
}
