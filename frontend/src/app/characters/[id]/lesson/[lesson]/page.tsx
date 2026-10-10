import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CHARACTER_CATALOG } from "@/lib/characterCatalog";

export default function CharactersLessonPage() {
    return <PlannedLessonPage domain="characters" title="کاراکتر" basePath="/characters" catalog={CHARACTER_CATALOG} />;
}
