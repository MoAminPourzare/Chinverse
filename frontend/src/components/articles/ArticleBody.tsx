import Image from "@/components/ui/PublicMediaImage";
import { articleMediaUrl, type ArticleDocument, type ArticleSpan } from "@/lib/articles";
import { getDirectionalTextProps } from "@/lib/textDirection";

function Spans({ spans }: { spans: ArticleSpan[] }) {
    return spans.map((span, index) => span.bold
        ? <strong key={index} className="font-bold text-slate-900">{span.text}</strong>
        : <span key={index}>{span.text}</span>);
}

export function ArticleBody({ document, content }: { document?: ArticleDocument | null; content: string }) {
    if (!document) return <div {...getDirectionalTextProps(content)} className="whitespace-pre-wrap break-words text-[15px] leading-9 text-slate-700">{content}</div>;
    return <div className="space-y-6 break-words text-[15px] leading-9 text-slate-700">
        {document.blocks.map((block, index) => {
            switch (block.type) {
                case "paragraph": return <p key={index} {...getDirectionalTextProps(block.spans.map(span => span.text).join(""))} className="whitespace-pre-line"><Spans spans={block.spans} /></p>;
                case "quote": return <blockquote key={index} className="rounded-2xl border-r-4 border-[#155aa6] bg-blue-50/70 px-5 py-4 text-[14px] leading-8"><Spans spans={block.spans} /></blockquote>;
                case "heading": {
                    const Heading = block.level === 3 ? "h3" : "h2";
                    return <Heading key={index} id={`section-${index}`} {...getDirectionalTextProps(block.text)} className="scroll-mt-8 pt-5 text-[19px] font-black leading-9 text-slate-900">{block.text}</Heading>;
                }
                case "list": {
                    const List = block.ordered ? "ol" : "ul";
                    return <List key={index} className={`space-y-2 ps-6 ${block.ordered ? "list-decimal" : "list-disc"}`}>{block.items.map((item, itemIndex) => <li key={itemIndex} {...getDirectionalTextProps(item)}>{item}</li>)}</List>;
                }
                case "image": return <figure key={index} className="space-y-2">
                    <Image src={articleMediaUrl(block.src)} alt={block.alt} width={1000} height={667} className="h-auto w-full rounded-2xl" />
                    {block.caption && <figcaption className="text-center text-xs leading-6 text-slate-500">{block.caption}</figcaption>}
                </figure>;
            }
        })}
    </div>;
}
