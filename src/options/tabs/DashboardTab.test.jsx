import { describe, it, expect, vi } from "vitest";

// Dashboard filtering and sorting pure logic for tests
// (Extracting pure logic out of the component to make it testable without massive mocks)

export const filterAndSortRatings = (ratings, filters, activePreset) => {
  let filtered = [...ratings];

  // 1. Min Score
  if (filters.minScore > 1) {
    filtered = filtered.filter((r) => Number(r.overall) >= filters.minScore);
  }

  // 2. Preset Filter
  if (filters.presetId !== "all") {
    filtered = filtered.filter((r) => r.presetId === filters.presetId);
  }

  // 3. Bias Filter
  if (filters.bias === "underrated") {
    filtered = filtered.filter(
      (r) => r.imdbRating && Number(r.overall) - r.imdbRating > 0.5,
    );
  } else if (filters.bias === "overrated") {
    filtered = filtered.filter(
      (r) => r.imdbRating && r.imdbRating - Number(r.overall) > 0.5,
    );
  }

  // 4. Sort
  if (filters.sortBy === "recent") {
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (filters.sortBy === "highest") {
    filtered.sort((a, b) => Number(b.overall) - Number(a.overall));
  } else if (filters.sortBy === "lowest") {
    filtered.sort((a, b) => Number(a.overall) - Number(b.overall));
  }

  return filtered;
};

describe("Dashboard Filtering & Sorting Logic", () => {
  const mockRatings = [
    {
      movieId: "1",
      overall: "8.0",
      presetId: "preset-1",
      imdbRating: 7.0,
      updatedAt: "2026-06-25T10:00:00Z",
    }, // Underrated
    {
      movieId: "2",
      overall: "5.0",
      presetId: "preset-2",
      imdbRating: 8.0,
      updatedAt: "2026-06-20T10:00:00Z",
    }, // Overrated
    {
      movieId: "3",
      overall: "9.0",
      presetId: "preset-1",
      imdbRating: 9.0,
      updatedAt: "2026-06-22T10:00:00Z",
    }, // Aligned
  ];

  it("filters by minimum score", () => {
    const result = filterAndSortRatings(
      mockRatings,
      { minScore: 8, presetId: "all", sortBy: "recent" },
      null,
    );
    expect(result.length).toBe(2);
    expect(result.map((r) => r.movieId)).toEqual(["1", "3"]);
  });

  it("filters by critic bias: underrated", () => {
    const result = filterAndSortRatings(
      mockRatings,
      { minScore: 1, presetId: "all", bias: "underrated", sortBy: "recent" },
      null,
    );
    expect(result.length).toBe(1);
    expect(result[0].movieId).toBe("1");
  });

  it("filters by critic bias: overrated", () => {
    const result = filterAndSortRatings(
      mockRatings,
      { minScore: 1, presetId: "all", bias: "overrated", sortBy: "recent" },
      null,
    );
    expect(result.length).toBe(1);
    expect(result[0].movieId).toBe("2");
  });

  it("sorts by highest rated", () => {
    const result = filterAndSortRatings(
      mockRatings,
      { minScore: 1, presetId: "all", sortBy: "highest" },
      null,
    );
    expect(result.map((r) => r.movieId)).toEqual(["3", "1", "2"]);
  });
});
