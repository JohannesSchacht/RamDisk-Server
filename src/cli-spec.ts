import { analyseCommand, Command } from "./cli";
import * as su from "./stringUtilities";

describe("analyseCommand:", () => {
  const td: {
    n: number;
    input: string;
    exception: boolean;
    output: Command;
  }[] = [
    {
      n: 1,
      input: "pwd",
      exception: false,
      output: {
        command: "pwd",
        arguments: [],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
    {
      n: 2,
      input: "echo a echo c",
      exception: false,
      output: {
        command: "echo",
        arguments: ["a", "echo", "c"],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
    {
      n: 3,
      input: "xx  > a < b d e",
      exception: false,
      output: {
        command: "xx",
        arguments: ["d", "e"],
        input: "b",
        output: "a",
        outputAppend: null,
      },
    },
    {
      n: 4,
      input: "xx  >> a < b ",
      exception: false,
      output: {
        command: "xx",
        arguments: [],
        input: "b",
        output: null,
        outputAppend: "a",
      },
    },
    {
      n: 5,
      input: ">> a < b xx a xx",
      exception: false,
      output: {
        command: "xx",
        arguments: ["a", "xx"],
        input: "b",
        output: null,
        outputAppend: "a",
      },
    },
    {
      n: 6,
      input: ">> a < b",
      exception: false,
      output: {
        command: null,
        arguments: [],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
    {
      n: 7,
      input: "someCommand >> a  > b < c",
      exception: true,
      output: {
        command: null,
        arguments: [],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
    {
      n: 8,
      input: "someCommand > a  > b < c",
      exception: true,
      output: {
        command: null,
        arguments: [],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
    {
      n: 9,
      input: "someCommand > a  < b < c",
      exception: true,
      output: {
        command: null,
        arguments: [],
        input: null,
        output: null,
        outputAppend: null,
      },
    },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    let exception: boolean = false;
    let tokens: su.Token[];
    let cmd: Command;
    try {
      tokens = su.tokenize(test.input);
      cmd = analyseCommand(tokens);
    } catch (e) {
      exception = true;
    }

    it(`"case: ${test.n} -> exception (error)"`, () => {
      expect(exception === test.exception).toBeTrue();
    });
    if (!exception)
      it(`"case: ${test.n} -> command"`, () => {
        expect(JSON.stringify(cmd) === JSON.stringify(test.output)).toBeTrue();
      });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});
