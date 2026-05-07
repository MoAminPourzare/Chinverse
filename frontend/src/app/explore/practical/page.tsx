import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function PracticalExplorePage() {
    return (
        <CourseExplorePage
            title="چینی کاربردی"
            subcategorySlug="practical"
            detailPath="/practical"
            layout="list"
            countLabel="درس"
            accentClass="bg-cyan-600"
        />
    );
}
