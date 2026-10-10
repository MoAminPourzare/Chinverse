import { ArticleReader } from "@/components/articles/ArticleReader";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ArticleReader identifier={id} />;
}
