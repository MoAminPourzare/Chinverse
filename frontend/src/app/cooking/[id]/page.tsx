import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function CookingDetailPage() {
    return (
        <CourseDetailPage
            domain="cooking"
            explorePath="/explore/cooking"
            eyebrow="آشپزی"
            countKeys={["episodes_count"]}
            countLabel="قسمت"
            accentClass="bg-[#155aa6]"
        />
    );
}
