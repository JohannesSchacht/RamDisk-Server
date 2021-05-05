import * as su from "./stringUtilities";

describe("Path analysis:", () => {
  const td: {
    n: number;
    inPath: string;
    absolute: boolean;
    outPath: string[];
  }[] = [
    { n: 1, inPath: "/a/b/c", absolute: true, outPath: ["a", "b", "c"] },
    { n: 2, inPath: "a/b/c", absolute: false, outPath: ["a", "b", "c"] },
    { n: 3, inPath: "/a/b/c/", absolute: true, outPath: ["a", "b", "c"] },
    { n: 4, inPath: " /a/b/c/ ", absolute: true, outPath: ["a", "b", "c"] },
    { n: 5, inPath: "/", absolute: true, outPath: [] },
    { n: 6, inPath: "aa", absolute: false, outPath: ["aa"] },
    {
      n: 7,
      inPath: "aa/ b / c /",
      absolute: false,
      outPath: ["aa", " b ", " c "],
    },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    const result = su.splitPath(test.inPath);
    it(`"case: ${test.n} -> absolute flag"`, () => {
      expect(result.absolute === test.absolute).toBeTrue();
    });
    it(`"case: ${test.n} -> path"`, () => {
      expect(
        JSON.stringify(result.path) === JSON.stringify(test.outPath)
      ).toBeTrue();
    });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});
