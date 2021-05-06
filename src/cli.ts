/* tslint:disable:max-classes-per-file */

import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

import * as su from "./stringUtilities";

export type Command = {
  command: string | null;
  arguments: string[];
  input: string | null;
  output: string | null;
  outputAppend: string | null;
};

export class Cli {
  Prompt: string;
  Fsys: Filesystem;

  constructor() {
    this.Fsys = new Filesystem();
    this.Prompt = this.Fsys.CurrentWorkingDirectory.Name;
  }

  Execute(line: string): { exit: boolean; output: string } {
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
        return {
          exit: false,
          output: line.trim() === "" ? "" : "No command given.",
        };
      case "pwd":
        return { exit, output: pwdCommand(cmd, this.Fsys) };
      case "mkdir":
        return { exit, output: mkdirCommand(cmd, this.Fsys) };
      case "ls":
        return { exit, output: lsCommand(cmd, this.Fsys) };
      case "cd":
        const tmp = cdCommand(cmd, this.Fsys);
        this.Prompt = this.Fsys.CurrentWorkingDirectory.GetCurrentDirectory();
        return { exit, output: tmp };
      case "touch":
        return { exit, output: touchCommand(cmd, this.Fsys) };
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

// Commands -------------------------------------------------------------
function pwdCommand(cmd: Command, fs: Filesystem): string {
  return fs.CurrentWorkingDirectory.Name;
}

function mkdirCommand(cmd: Command, fs: Filesystem): string {
  if (cmd.arguments.length === 0) return "No directory specified";
  for (const dir of cmd.arguments) fs.CurrentWorkingDirectory.CreateFolder(dir);
  return "";
}

function lsCommand(cmd: Command, fs: Filesystem): string {
  const files: { name: string; file: PlainFile }[] = [];
  const folders: { name: string; folder: Folder }[] = [];
  let longFlag = false;

  for (const param of cmd.arguments) {
    if (param === "-l") {
      longFlag = true;
      continue;
    }
    const tmp = fs.CurrentWorkingDirectory.FindPath(param);
    if (tmp == null) return `no such file or directory: ${param}`;
    if (tmp instanceof Folder) folders.push({ name: param, folder: tmp });
    else files.push({ name: param, file: tmp as PlainFile });
  }

  let result: string = "";
  if (files.length + folders.length === 0) {
    result += lsFolder(fs.CurrentWorkingDirectory, longFlag);
  } else {
    for (const fi of files) {
      if (longFlag) {
        if (result !== "") result += "\n";
        result += lsObject(fi.file, fi.name);
      } else {
        if (result !== "") result += "\t";
        result += fi.name;
      }
      for (const fo of folders) {
        if (result !== "") result += "\n\n";
        result += fo.name + ":";
        result += lsFolder(fo.folder, longFlag);
      }
    }
  }
  return result;
}

function lsFolder(folder: Folder, longFlag: boolean): string {
  const entries = folder.GetEntries();
  let result: string = "";
  for (const o of entries) {
    if (longFlag) {
      if (result !== "") result += "\n";
      result += lsObject(o);
    } else {
      if (result !== "") result += "\t";
      result += o.Name;
    }
  }
  return result;
}

function lsObject(object: FilesystemObject, extName?: string): string {
  const typeletter = object instanceof Folder ? "d" : "f";
  const size =
    object instanceof Folder
      ? object.GetEntries().length
      : (object as PlainFile).Contents.length;
  const name = extName === undefined ? object.Name : extName;
  return `${typeletter}\t${name}\t${size}`;
}

function cdCommand(cmd: Command, fs: Filesystem): string {
  if (cmd.arguments.length === 0) {
    fs.CurrentWorkingDirectory = fs.CurrentWorkingDirectory.GetRoot();
    return "";
  }
  if (cmd.arguments.length > 1) return "Too many arguments";

  const folderName = cmd.arguments[0];
  if (folderName === "..") {
    fs.CurrentWorkingDirectory = fs.CurrentWorkingDirectory.Parent as Folder;
    return "";
  }
  const tmp = fs.CurrentWorkingDirectory.FindPath(folderName);
  if (tmp == null || tmp instanceof PlainFile)
    return `cannot find directory ${folderName}`;
  fs.CurrentWorkingDirectory = tmp as Folder;
  return "";
}

function touchCommand(cmd: Command, fs: Filesystem): string {
  if (cmd.arguments.length === 0) return "Missing file operand";

  for (const f of cmd.arguments) {
    const path = f.split("/");
    const file = path.pop() as string;
    let targetFolder = fs.CurrentWorkingDirectory;
    if (path.length > 0) {
      const base = path.join("/");
      fs.CurrentWorkingDirectory.CreateFolder(base);
      targetFolder = fs.CurrentWorkingDirectory.FindPath(base) as Folder;
    }
    targetFolder.Add(new PlainFile(file));
  }
  return "";
}

function echoCommand(cmd: Command, fs: Filesystem): string {
  return "not yet implemented";
}

function catCommand(cmd: Command, fs: Filesystem): string {
  return "not yet implemented";
}

function rmCommand(cmd: Command, fs: Filesystem): string {
  return "not yet implemented";
}

// Anaylse commands ------------------------------------------------------
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
