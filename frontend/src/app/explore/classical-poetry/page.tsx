import PlannedCourseExplorePage from "@/components/course/PlannedCourseExplorePage";
import { CLASSICAL_POETRY_CATALOG } from "@/lib/classicalPoetryCatalog";

export default function ClassicalPoetryExplorePage() {
    return (
        <PlannedCourseExplorePage
            title="شعر و ادبیات کلاسیک"
            basePath="/classical-poetry"
            catalog={CLASSICAL_POETRY_CATALOG}
            countLabel="قسمت"
        />
    );
}
