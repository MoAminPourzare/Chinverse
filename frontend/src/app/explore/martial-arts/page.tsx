import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function MartialArtsExplorePage() {
    return (
        <CourseExplorePage
            title="هنرهای رزمی"
            subcategorySlug="martial-arts"
            detailPath="/martial-arts"
            layout="list"
            countLabel="درس"
            accentClass="bg-red-600"
        />
    );
}
