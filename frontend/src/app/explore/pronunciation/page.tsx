import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function PronunciationPage() {
    return (
        <CourseExplorePage
            title="تلفظ"
            subcategorySlug="pronunciation"
            detailPath="/pronunciation"
            layout="list"
            accentClass="bg-blue-500"
        />
    );
}
