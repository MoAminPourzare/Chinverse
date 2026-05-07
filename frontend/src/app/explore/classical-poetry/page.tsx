import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function ClassicalPoetryExplorePage() {
    return (
        <CourseExplorePage
            title="شعر و ادبیات کلاسیک"
            subcategorySlug="classical-poetry"
            detailPath="/classical-poetry"
            layout="list"
            countLabel="درس"
            accentClass="bg-violet-600"
        />
    );
}
