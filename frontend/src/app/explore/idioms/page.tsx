import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function IdiomsExplorePage() {
    return (
        <CourseExplorePage
            title="اصطلاحات"
            subcategorySlug="idioms"
            detailPath="/idioms"
            layout="list"
            accentClass="bg-blue-700"
        />
    );
}
