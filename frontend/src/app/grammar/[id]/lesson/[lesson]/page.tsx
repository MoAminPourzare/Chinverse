import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { GRAMMAR_CATALOG } from "@/lib/grammarCatalog";

export default function GrammarLessonPage() {
    return <PlannedLessonPage domain="grammar" title="گرامر" basePath="/grammar" catalog={GRAMMAR_CATALOG} />;
}
