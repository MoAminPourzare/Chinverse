import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CALLIGRAPHY_CATALOG } from "@/lib/calligraphyCatalog";

export default function CalligraphyLessonPage() {
    return (
        <PlannedLessonPage
            domain="calligraphy"
            title="خطاطی"
            basePath="/calligraphy"
            catalog={CALLIGRAPHY_CATALOG}
            unitLabel="درس"
            unitPlural="درس‌ها"
        />
    );
}
