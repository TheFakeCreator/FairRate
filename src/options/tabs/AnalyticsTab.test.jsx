import { describe, it, expect } from "vitest";

export const processHeatmapData = (ratings) => {
  const activityMap = {};
  ratings.forEach((rating) => {
    if (!rating.updatedAt) return;
    const dateStr = rating.updatedAt.split("T")[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { date: dateStr, count: 0, movies: [] };
    }
    activityMap[dateStr].count += 1;
    activityMap[dateStr].movies.push(rating.title || "Unknown");
  });
  return Object.values(activityMap).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
};

describe("Analytics Heatmap Data Processing", () => {
  it("groups multiple ratings on the same day correctly", () => {
    const mockRatings = [
      { movieId: "1", title: "Movie A", updatedAt: "2026-06-25T10:00:00Z" },
      { movieId: "2", title: "Movie B", updatedAt: "2026-06-25T12:00:00Z" },
      { movieId: "3", title: "Movie C", updatedAt: "2026-06-26T10:00:00Z" },
    ];

    const result = processHeatmapData(mockRatings);

    expect(result.length).toBe(2);
    expect(result[0].date).toBe("2026-06-25");
    expect(result[0].count).toBe(2);
    expect(result[0].movies).toEqual(["Movie A", "Movie B"]);

    expect(result[1].date).toBe("2026-06-26");
    expect(result[1].count).toBe(1);
  });
});
