import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function CultureTextsExplorePage() {
    return (
        <CourseExplorePage
            title="متون کلاسیک آموزشی"
            subcategorySlug="culture-texts"
            detailPath="/culture-texts"
            layout="list"
            countLabel="درس"
            accentClass="bg-slate-700"
        />
    );
}
