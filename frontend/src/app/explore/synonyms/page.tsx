import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function SynonymsExplorePage() {
    return (
        <CourseExplorePage
            title="واژگان هم معنی"
            subcategorySlug="synonyms"
            detailPath="/synonyms"
            layout="list"
            countLabel="درس"
            accentClass="bg-sky-600"
        />
    );
}
