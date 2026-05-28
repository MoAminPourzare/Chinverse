import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function GrammarExplorePage() {
    return (
        <CourseExplorePage
            title="گرامر"
            subcategorySlug="grammar"
            detailPath="/grammar"
            layout="list"
            accentClass="bg-blue-700"
        />
    );
}
