import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { ENERGY_HEALTH_CATALOG } from "@/lib/energyHealthCatalog";

export default function EnergyHealthDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="energy-health"
            title="تمرینات انرژی و سلامت"
            basePath="/energy-health"
            catalog={ENERGY_HEALTH_CATALOG}
            countLabel="تمرین"
            unitPlural="تمرین‌های"
            descriptionHeading="معرفی دوره:"
            listHeading="تمرین‌های دوره"
            eyebrow="هنر و مهارت‌های چینی"
        />
    );
}
