import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function CharactersPage() {
    return (
        <CourseExplorePage
            title="کاراکتر"
            subcategorySlug="characters"
            detailPath="/characters"
            layout="list"
            accentClass="bg-purple-500"
        />
    );
}
