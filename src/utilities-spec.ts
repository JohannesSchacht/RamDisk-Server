import * as su from "./utilities";

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

describe("Tokenizer:", () => {
	const td: {
		n: number;
		exception: boolean;
		input: string;
		output: su.Token[];
	}[] = [
		{
			n: 1,
			exception: false,
			input: "echo abc",
			output: [
				{ tokenType: "text", value: "echo" },
				{ tokenType: "text", value: "abc" },
			],
		},
		{
			n: 2,
			exception: false,
			input: "  echo < abc >  def  >> ghi 123  ",
			output: [
				{ tokenType: "text", value: "echo" },
				{ tokenType: "input", value: "abc" },
				{ tokenType: "output", value: "def" },
				{ tokenType: "outputAppend", value: "ghi" },
				{ tokenType: "text", value: "123" },
			],
		},
		{
			n: 3,
			exception: false,
			input: "echo<abc>def>>ghi 123",
			output: [
				{ tokenType: "text", value: "echo" },
				{ tokenType: "input", value: "abc" },
				{ tokenType: "output", value: "def" },
				{ tokenType: "outputAppend", value: "ghi" },
				{ tokenType: "text", value: "123" },
			],
		},
		{
			n: 4,
			exception: false,
			input: "echo",
			output: [{ tokenType: "text", value: "echo" }],
		},
		{
			n: 5,
			exception: false,
			input: " ",
			output: [],
		},
		{
			n: 6,
			exception: false,
			input: "",
			output: [],
		},
		{
			n: 7,
			exception: false,
			input: 'echo "abc def"',
			output: [
				{ tokenType: "text", value: "echo" },
				{ tokenType: "text", value: "abc def" },
			],
		},
		{
			n: 8,
			exception: false,
			input: 'echo "abc def',
			output: [
				{ tokenType: "text", value: "echo" },
				{ tokenType: "text", value: "abc def" },
			],
		},
		{
			n: 9,
			exception: true,
			input: "echo >",
			output: [],
		},
		{
			n: 10,
			exception: true,
			input: "echo < ",
			output: [],
		},
		{
			n: 11,
			exception: false,
			input: "xx  > a < b d e",
			output: [
				{ tokenType: "text", value: "xx" },
				{ tokenType: "output", value: "a" },
				{ tokenType: "input", value: "b" },
				{ tokenType: "text", value: "d" },
				{ tokenType: "text", value: "e" },
			],
		},
	];

	const doOnly: number = -1;
	for (const test of td) {
		if (doOnly !== -1 && test.n !== doOnly) continue;

		let result: su.Token[] = [];
		let error = "";
		try {
			result = su.tokenize(test.input);
		} catch (e) {
			error = e.message;
		}

		it(`"case: ${test.n} -> ${test.input}"`, () => {
			expect(error !== "").toBe(test.exception);
			if (error === "")
				expect(
					JSON.stringify(result) === JSON.stringify(test.output)
				).toBeTrue();
		});
	}
	it("all tests done?", () => {
		expect(doOnly).toBe(-1);
	});
});
