import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";

export default function TeaCultureExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="فرهنگ چای"
            basePath="/tea-culture"
            catalog={TEA_CULTURE_CATALOG}
            countLabel="درس"
        />
    );
}
