import CourseDetailPage from "@/components/course/CourseDetailPage";

export default function EnergyHealthDetailPage() {
    return (
        <CourseDetailPage
            domain="energy-health"
            explorePath="/explore/energy-health"
            eyebrow="تمرینات انرژی و سلامت"
            countKeys={["lesson_count"]}
            countLabel="درس"
            accentClass="bg-emerald-600"
        />
    );
}
