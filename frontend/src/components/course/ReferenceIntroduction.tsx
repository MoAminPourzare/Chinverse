interface ReferenceIntroductionProps {
    heading: string;
    paragraphs: string[];
    audience?: string[];
}

export default function ReferenceIntroduction({ heading, paragraphs, audience }: ReferenceIntroductionProps) {
    return (
        <div className="mt-6 text-[#40464f] dark:text-slate-300" dir="rtl">
            <section aria-label={heading}>
                <h2 className="text-[12px] font-bold text-[#343941] dark:text-white">{heading}</h2>
                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="mt-1 text-justify text-[12px] leading-6">{paragraph}</p>
                ))}
            </section>
            {audience && audience.length > 0 && (
                <section className="mt-6" aria-label="سطح">
                    <h2 className="text-[12px] font-bold text-[#343941] dark:text-white">سطح:</h2>
                    <ul className="mt-1 list-disc space-y-0.5 pr-4 text-[12px] leading-6">
                        {audience.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </section>
            )}
        </div>
    );
}
