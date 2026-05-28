import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function TeaCultureExplorePage() {
    return (
        <CourseExplorePage
            title="فرهنگ چای"
            subcategorySlug="tea-culture"
            detailPath="/tea-culture"
            layout="list"
            countLabel="درس"
            accentClass="bg-blue-700"
        />
    );
}
