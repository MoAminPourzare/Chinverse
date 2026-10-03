import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { CALLIGRAPHY_CATALOG } from "@/lib/calligraphyCatalog";

export default function CalligraphyExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="خطاطی"
            basePath="/calligraphy"
            catalog={CALLIGRAPHY_CATALOG}
            countLabel="درس"
        />
    );
}
