import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function ArtsCookingExplorePage() {
    return (
        <CourseExplorePage
            title="آشپزی"
            subcategorySlug="arts-cooking"
            detailPath="/arts-cooking"
            layout="list"
            countLabel="درس"
            accentClass="bg-blue-700"
        />
    );
}
