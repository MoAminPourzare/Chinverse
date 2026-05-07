import CourseExplorePage from "@/components/course/CourseExplorePage";

export default function EnergyHealthExplorePage() {
    return (
        <CourseExplorePage
            title="تمرینات انرژی و سلامت"
            subcategorySlug="energy-health"
            detailPath="/energy-health"
            layout="list"
            countLabel="درس"
            accentClass="bg-emerald-600"
        />
    );
}
