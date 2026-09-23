import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { COOKING_CATALOG } from "@/lib/cookingCatalog";

export default function CookingDetailPage() {
    return (
        <PlannedCourseDetailPage
            domain="cooking"
            title="آشپزی"
            basePath="/cooking"
            catalog={COOKING_CATALOG}
            countLabel="قسمت"
            unitPlural="قسمت‌های"
            descriptionHeading="معرفی برنامه:"
            listHeading="قسمت‌های برنامه"
            eyebrow="هنر و مهارت‌های چینی"
        />
    );
}
