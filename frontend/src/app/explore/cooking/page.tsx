import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function CookingExplorePage() {
    return (
        <CourseExplorePage
            title="آشپزی"
            subcategorySlug="cooking"
            detailPath="/cooking"
            layout="square"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
        />
    );
}
