import { describe, it, expect } from "vitest";

export const calculateOverall = (scores, weights) => {
  let totalScore = 0;
  let totalWeight = 0;
  for (const aspect in weights) {
    const score = scores[aspect] !== undefined ? scores[aspect] : 5;
    const weight = weights[aspect];
    totalScore += score * weight;
    totalWeight += weight;
  }
  const avg = totalWeight > 0 ? totalScore / totalWeight : 0;
  return avg.toFixed(1);
};

describe("Weighted Average Calculation", () => {
  it("should calculate standard flat weights correctly", () => {
    const scores = {
      enjoyment: 8,
      story: 7,
      characters: 9,
      technical: 6,
      emotional: 8,
    };
    const weights = {
      enjoyment: 1,
      story: 1,
      characters: 1,
      technical: 1,
      emotional: 1,
    };

    // (8+7+9+6+8) / 5 = 38 / 5 = 7.6
    expect(calculateOverall(scores, weights)).toBe("7.6");
  });

  it("should calculate custom weights correctly", () => {
    const scores = {
      enjoyment: 10,
      story: 5,
      characters: 5,
      technical: 5,
      emotional: 5,
    };
    const weights = {
      enjoyment: 2,
      story: 1,
      characters: 1,
      technical: 1,
      emotional: 1,
    };

    // (10*2 + 5*1 + 5*1 + 5*1 + 5*1) / (2+1+1+1+1) = (20 + 20) / 6 = 40 / 6 = 6.666...
    expect(calculateOverall(scores, weights)).toBe("6.7");
  });

  it("should not include hidden defaults from old rating schemes", () => {
    const scores = {
      enjoyment: 10,
      story: 5,
      characters: 5,
      technical: 5,
      emotional: 5,
      hidden_aspect: 10,
    };
    const weights = { enjoyment: 1, story: 1 }; // Only two aspects in this preset

    // Should completely ignore hidden_aspect and characters/technical/emotional
    // (10*1 + 5*1) / 2 = 15 / 2 = 7.5
    expect(calculateOverall(scores, weights)).toBe("7.5");
  });
});
