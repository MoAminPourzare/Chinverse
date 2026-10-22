import ScreenMediaExplorePage from "@/components/course/ScreenMediaExplorePage";
import { SERIES_CATALOG } from "@/lib/seriesCatalog";

export default function SeriesExplorePage() {
    return <ScreenMediaExplorePage title="سریال" basePath="/series" itemNoun="سریال" catalog={SERIES_CATALOG} showEpisodeCount />;
}
