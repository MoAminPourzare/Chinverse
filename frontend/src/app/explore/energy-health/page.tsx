import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { ENERGY_HEALTH_CATALOG } from "@/lib/energyHealthCatalog";

export default function EnergyHealthExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="تمرینات انرژی و سلامت"
            headingSubtitle="(气功 چی‌گونگ)"
            basePath="/energy-health"
            catalog={ENERGY_HEALTH_CATALOG}
            countLabel="تمرین"
        />
    );
}
