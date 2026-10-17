import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { CHARACTER_CATALOG } from "@/lib/characterCatalog";

export default function CharactersPage() {
    return <PlannedCourseExplorePage title="کاراکتر" basePath="/characters" catalog={CHARACTER_CATALOG} />;
}
