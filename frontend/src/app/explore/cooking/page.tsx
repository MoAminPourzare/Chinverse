import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { COOKING_CATALOG } from "@/lib/cookingCatalog";

export default function CookingExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="آشپزی"
            basePath="/cooking"
            catalog={COOKING_CATALOG}
            countLabel="قسمت"
        />
    );
}
