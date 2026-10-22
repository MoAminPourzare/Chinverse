import PlannedCourseDetailPage from "@/components/course/PlannedCourseDetailPage";
import { GRAMMAR_CATALOG } from "@/lib/grammarCatalog";

export default function GrammarDetailPage() {
    return <PlannedCourseDetailPage domain="grammar" title="گرامر" basePath="/grammar" catalog={GRAMMAR_CATALOG} />;
}
