import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { COOKING_CATALOG } from "@/lib/cookingCatalog";

export default function CookingLessonPage() {
    return (
        <PlannedLessonPage
            domain="cooking"
            title="آشپزی"
            basePath="/cooking"
            catalog={COOKING_CATALOG}
            unitLabel="قسمت"
            unitPlural="قسمت‌ها"
            requirePublishedMedia
        />
    );
}
