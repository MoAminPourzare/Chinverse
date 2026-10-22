import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { CHARACTER_CATALOG } from "@/lib/characterCatalog";

export default function CharactersDetailPage() {
    return <PlannedCourseDetailPage domain="characters" title="کاراکتر" basePath="/characters" catalog={CHARACTER_CATALOG} />;
}
