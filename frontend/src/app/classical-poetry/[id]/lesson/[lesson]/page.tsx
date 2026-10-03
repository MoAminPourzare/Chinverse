import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CLASSICAL_POETRY_CATALOG } from "@/lib/classicalPoetryCatalog";

export default function ClassicalPoetryLessonPage() {
    return (
        <PlannedLessonPage
            domain="classical-poetry"
            title="شعر و ادبیات کلاسیک"
            basePath="/classical-poetry"
            catalog={CLASSICAL_POETRY_CATALOG}
            unitLabel="قسمت"
            unitPlural="قسمت‌ها"
            requirePublishedMedia
        />
    );
}
