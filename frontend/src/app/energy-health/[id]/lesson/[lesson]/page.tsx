import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { ENERGY_HEALTH_CATALOG } from "@/lib/energyHealthCatalog";

export default function EnergyHealthLessonPage() {
    return (
        <PlannedLessonPage
            domain="energy-health"
            title="تمرینات انرژی و سلامت"
            basePath="/energy-health"
            catalog={ENERGY_HEALTH_CATALOG}
            unitLabel="تمرین"
            unitPlural="تمرین‌ها"
            requirePublishedMedia
        />
    );
}
