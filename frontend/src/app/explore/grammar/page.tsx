import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { GRAMMAR_CATALOG } from "@/lib/grammarCatalog";

export default function GrammarExplorePage() {
    return <PlannedCourseExplorePage title="گرامر" basePath="/grammar" catalog={GRAMMAR_CATALOG} />;
}
