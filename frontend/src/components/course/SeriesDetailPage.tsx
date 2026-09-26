import ScreenMediaDetailPage from "@/components/course/ScreenMediaDetailPage";
import { SERIES_CATALOG } from "@/lib/seriesCatalog";

export default function SeriesDetailPage() {
    return <ScreenMediaDetailPage domain="series" title="سریال‌ها" itemNoun="سریال" catalog={SERIES_CATALOG} showEpisodes showSeriesCards />;
}
