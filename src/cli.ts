/* tslint:disable:max-classes-per-file */

import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

import * as su from "./stringUtilities";

export class Cli {
  Prompt: string;
  Fsys: Filesystem;

  constructor() {
    this.Fsys = new Filesystem();
    this.Prompt = this.Fsys.CurrentWorkingDirectory.Name;
  }

  Execute(line: string): { exit: boolean; output: string } {
    this.Prompt = this.Fsys.CurrentWorkingDirectory.Name;

    let tokens: su.Token[];
    let output: string = "";
    const exit: boolean = false;

    try {
      tokens = su.tokenize(line);
    } catch (e) {
      output = `Syntax error: ${e.message}`;
      return { exit, output };
    }

    let cmd: Command;
    try {
      cmd = analyseCommand(tokens);
    } catch (e) {
      output = `Illegal command: ${e.message}`;
      return { exit, output };
    }

    switch (cmd.command) {
      case "exit":
        return { exit: true, output: "" };
      case null:
        return { exit: false, output: "" };
      default:
        return { exit, output: `Unkown command: ${cmd.command}` };
    }
  }
}

class Filesystem {
  CurrentWorkingDirectory: Folder;
  private root: Folder;

  constructor() {
    this.root = CreateRootFolder();
    this.CurrentWorkingDirectory = this.root;
  }
}

export type Command = {
  command: string | null;
  arguments: string[];
  input: string | null;
  output: string | null;
  outputAppend: string | null;
};

export function analyseCommand(tokens: su.Token[]): Command {
  const cmd: Command = {
    command: null,
    arguments: [],
    input: null,
    output: null,
    outputAppend: null,
  };

  // Find command, if any
  const cmdToken: su.Token | undefined = tokens.find(
    (o) => o.tokenType === "text"
  );
  if (cmdToken === undefined) {
    return cmd;
  }
  cmd.command = cmdToken.value;

  // Find arguments; filter command token!
  cmd.arguments = tokens
    .filter((o) => o.tokenType === "text")
    .map((o) => o.value);
  const index: number = cmd.arguments.findIndex((o) => o === cmd.command);
  cmd.arguments.splice(index, 1);

  let selectedTokens: su.Token[] = tokens.filter(
    (o) => o.tokenType === "input"
  );
  if (selectedTokens.length > 1)
    throw new Error("More than one input redirection");
  if (selectedTokens.length === 1) cmd.input = selectedTokens[0].value;

  selectedTokens = tokens.filter((o) => o.tokenType === "output");
  if (selectedTokens.length > 1)
    throw new Error("More than one output redirection");
  if (selectedTokens.length === 1) cmd.output = selectedTokens[0].value;

  selectedTokens = tokens.filter((o) => o.tokenType === "outputAppend");
  if (selectedTokens.length > 1)
    throw new Error("More than one output redirection");
  if (selectedTokens.length === 1) cmd.outputAppend = selectedTokens[0].value;

  if (cmd.output != null && cmd.outputAppend != null)
    throw new Error("More than one output redirection ");

  return cmd;
}
