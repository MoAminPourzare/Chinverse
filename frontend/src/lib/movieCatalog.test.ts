import { describe, expect, it } from "vitest";
import { getMovie, getPublishedMovieLesson, MOVIE_CATALOG } from "@/lib/movieCatalog";

describe("movie catalog", () => {
    it("matches the eight owner-reference cards in display order", () => {
        expect(MOVIE_CATALOG.map((movie) => [movie.slug, movie.title, movie.year])).toEqual([
            ["dying-to-survive", "我不是药神", 2018],
            ["the-wandering-earth", "流浪地球1", 2019],
            ["the-wandering-earth-2", "流浪地球2", 2023],
            ["one-second", "一秒钟", 2020],
            ["hi-mom", "你好，李焕英", 2021],
            ["hello-mr-billionaire", "西虹市首富", 2018],
            ["operation-red-sea", "红海行动", 2018],
            ["our-times", "我的少女时代", 2015],
        ]);
    });

    it("keeps detail metadata complete without inventing ratings or duration", () => {
        for (const movie of MOVIE_CATALOG) {
            expect(movie.pinyin).toBeTruthy();
            expect(movie.synopsis.length).toBeGreaterThan(0);
            expect(movie.genres.length).toBeGreaterThan(0);
            expect(movie.directors.length).toBeGreaterThan(0);
            expect(movie.cast.length).toBeGreaterThan(0);
            expect(movie).not.toHaveProperty("rating");
            expect(movie).not.toHaveProperty("duration");
        }
        expect(getMovie("one-second")?.title).toBe("一秒钟");
        expect(getMovie("missing")).toBeUndefined();
    });

    it("uses only a lesson with registered media for planned playback", () => {
        const course = {
            id: 10,
            title: "movie",
            description: "",
            level: "movie",
            sections: [
                { id: 2, order_index: 2, lessons: [{ id: 22, media_id: 8 }] },
                { id: 1, order_index: 1, lessons: [{ id: 11, media_id: null }] },
            ],
        };
        expect(getPublishedMovieLesson(course)?.id).toBe(22);
        expect(getPublishedMovieLesson({ ...course, sections: [{ id: 1, lessons: [{ id: 11, media_id: null }] }] })).toBeUndefined();
    });
});
