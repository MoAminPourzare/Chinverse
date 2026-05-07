import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function ClassicalExplorePage() {
    return (
        <CourseExplorePage
            title="زبان چینی کلاسیک"
            subcategorySlug="classical"
            detailPath="/classical"
            layout="list"
            countLabel="درس"
            accentClass="bg-slate-700"
        />
    );
}
