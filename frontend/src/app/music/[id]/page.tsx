"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, Play, Music } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SeriesData } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";

// Extended type for music artists
interface MusicArtistData extends SeriesData {
    biography?: string;
    style?: string;
}

// ==================== MOCK DATA ====================
const mockArtists: Record<number, MusicArtistData> = {
    601: {
        id: 601,
        title: "Jay Chou / 周杰伦",
        description: "جی چو - پادشاه پاپ آسیا و یکی از تأثیرگذارترین خوانندگان تاریخ موسیقی چین.",
        biography: "ژو جیلون (جی چو) متولد ۱۹۷۹ در تایوان است. او از کودکی پیانو و چلو می‌نواخت و در سال ۲۰۰۰ با آلبوم «Jay» وارد دنیای موسیقی شد. سبک منحصربه‌فردش ترکیبی از پاپ، R&B، هیپ‌هاپ و موسیقی سنتی چینی است. آهنگ‌هایش مثل «周杰伦 - 稻香» و «青花瓷» به نمادهای فرهنگی تبدیل شده‌اند. او همچنین بازیگر، کارگردان و تاجر موفقی است.",
        synopsis: "مجموعه آهنگ‌های منتخب جی چو با ترجمه فارسی و پین‌یین برای یادگیری زبان چینی.",
        style: "پاپ، R&B، هیپ‌هاپ، راک",
        genre: "پاپ، R&B، هیپ‌هاپ، راک",
        year: 2000,
        cast: [],
        rating: 4.9,
        episodes_count: 12,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Jay_Chou_2019.jpg/220px-Jay_Chou_2019.jpg",
        level: "Intermediate",
        category: "music",
        sections: [{
            id: 1,
            title: "آهنگ‌های منتخب",
            lessons: [
                { id: 12001, title: "稻香 (Dào Xiāng) - Rice Fragrance", duration_minutes: 4, is_free: true },
                { id: 12002, title: "青花瓷 (Qīng Huā Cí) - Blue & White Porcelain", duration_minutes: 4, is_free: true },
                { id: 12003, title: "晴天 (Qíng Tiān) - Sunny Day", duration_minutes: 5, is_free: false },
                { id: 12004, title: "七里香 (Qī Lǐ Xiāng) - Common Jasmine", duration_minutes: 5, is_free: false },
            ]
        }]
    },
    602: {
        id: 602,
        title: "G.E.M. / 邓紫棋",
        description: "جی‌ئی‌ام (دنگ زیچی) - خواننده و آهنگساز مشهور هنگ‌کنگی.",
        biography: "دنگ زیچی، معروف به G.E.M. (Get Everybody Moving)، متولد ۱۹۹۱ در شانگهای و بزرگ‌شده در هنگ‌کنگ است. او در سن ۱۶ سالگی اولین آلبومش را منتشر کرد. صدای قدرتمند و محدوده وسیع صوتی‌اش او را به یکی از بهترین خوانندگان نسل جدید تبدیل کرده. شرکت در برنامه «I Am a Singer» او را به شهرت سراسر چین رساند. آهنگ‌هایش مثل «泡沫» و «光年之外» میلیاردها بار پخش شده‌اند.",
        synopsis: "مجموعه آهنگ‌های منتخب جی‌ئی‌ام با ترجمه فارسی و پین‌یین.",
        style: "پاپ، بالاد، الکترونیک",
        genre: "پاپ، بالاد، الکترونیک",
        year: 2012,
        cast: [],
        rating: 4.7,
        episodes_count: 10,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/G.E.M._at_Madame_Tussauds_Hong_Kong.jpg/220px-G.E.M._at_Madame_Tussauds_Hong_Kong.jpg",
        level: "Beginner",
        category: "music",
        sections: [{
            id: 1,
            title: "آهنگ‌های منتخب",
            lessons: [
                { id: 12005, title: "泡沫 (Pào Mò) - Bubble", duration_minutes: 5, is_free: true },
                { id: 12006, title: "光年之外 (Guāng Nián Zhī Wài) - Light Years Away", duration_minutes: 4, is_free: true },
                { id: 12007, title: "倒数 (Dào Shǔ) - Countdown", duration_minutes: 4, is_free: false },
            ]
        }]
    },
    603: {
        id: 603,
        title: "Eason Chan / 陈奕迅",
        description: "ایسون چن - خدای آهنگ‌خوانی کانتونی و یکی از محبوب‌ترین خوانندگان چینی‌زبان.",
        biography: "چن ییشون (ایسون چن) متولد ۱۹۷۴ در هنگ‌کنگ است. او در لندن تحصیل موسیقی کرد و از سال ۱۹۹۶ کریر حرفه‌ای خود را آغاز نمود. به دلیل تسلط بر هر دو زبان کانتونی و ماندارین، یکی از نادر خوانندگانی است که در هر دو بازار بزرگ موسیقی چینی موفق بوده. آهنگ‌های عاطفی و عمیقش مثل «十年» و «浮夸» شاهکارهای موسیقی پاپ چینی هستند.",
        synopsis: "مجموعه آهنگ‌های منتخب ایسون چن با ترجمه فارسی و پین‌یین.",
        style: "پاپ، راک، بالاد",
        genre: "پاپ، راک، بالاد",
        year: 1996,
        cast: [],
        rating: 4.8,
        episodes_count: 15,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Eason_Chan_2009.jpg/220px-Eason_Chan_2009.jpg",
        level: "Advanced",
        category: "music",
        sections: [{
            id: 1,
            title: "آهنگ‌های منتخب",
            lessons: [
                { id: 12008, title: "十年 (Shí Nián) - Ten Years", duration_minutes: 4, is_free: true },
                { id: 12009, title: "浮夸 (Fú Kuā) - Exaggerated", duration_minutes: 5, is_free: true },
                { id: 12010, title: "K歌之王 (K Gē Zhī Wáng) - King of Karaoke", duration_minutes: 5, is_free: false },
                { id: 12011, title: "富士山下 (Fù Shì Shān Xià) - Under Mount Fuji", duration_minutes: 4, is_free: false },
            ]
        }]
    }
};

export default function MusicDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [artist, setArtist] = useState<MusicArtistData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setArtist(response.data);
            } catch (error) {
                console.error("Failed to fetch music artist:", error);
                // Fallback to mock data
                if (courseId && mockArtists[courseId]) {
                    setArtist(mockArtists[courseId]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchArtist();
        }
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">هنرمند یافت نشد</div>
            </div>
        );
    }

    // Flatten tracks
    const allTracks = artist.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/music" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600">
                        <Bookmark size={22} />
                    </button>
                    <button className="text-gray-600">
                        <MoreVertical size={22} />
                    </button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* Artist Header */}
                <div className="flex gap-4 mb-6">
                    {/* Metadata (Left in RTL) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-teal-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Music
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {artist.title}
                        </h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{artist.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{artist.episodes_count} آهنگ</span>
                        </div>
                        {artist.style && (
                            <div className="flex flex-wrap gap-2">
                                {artist.style.split('،').map((s, i) => (
                                    <span key={i} className="text-[10px] bg-teal-50 text-teal-600 px-2 py-1 rounded-full">
                                        {s.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Photo (Right in RTL) */}
                    <div className="w-28 flex-shrink-0">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-md bg-gray-200">
                            <img
                                src={artist.cover_image_url}
                                alt={artist.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Artist Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">بیوگرافی</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {artist.biography || artist.description}
                    </p>
                </div>

                {/* Tracks List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Music size={20} className="text-teal-600" />
                        لیست آهنگ‌ها
                    </h3>
                    <div className="space-y-3">
                        {allTracks.map((track, index) => (
                            <Link
                                key={track.id}
                                href={`/watch/music/${artist.id}?lesson=${track.id}`}
                                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex items-center">
                                    {/* Track Number */}
                                    <div className="w-14 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 flex-shrink-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">{index + 1}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-900 text-sm truncate" dir="ltr">
                                                {track.title}
                                            </h4>
                                            {track.is_free && (
                                                <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex-shrink-0 mr-2">
                                                    رایگان
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                            <span>{track.duration_minutes}:00</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{artist.title.split('/')[0].trim()}</span>
                                        </div>
                                    </div>

                                    {/* Play Icon */}
                                    <div className="pr-3 pl-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                                            <Play size={14} className="text-teal-600 fill-teal-600 ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
