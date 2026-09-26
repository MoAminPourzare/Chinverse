import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { SYNONYMS_CATALOG } from "@/lib/synonymsCatalog";

export default function SynonymsExplorePage() {
    return <PlannedCourseExplorePage title="واژگان هم‌معنی" basePath="/synonyms" catalog={SYNONYMS_CATALOG} />;
}
