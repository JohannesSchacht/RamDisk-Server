import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

export function splitPath(name: string): { absolute: boolean; path: string[] } {
  const s = name.trim();
  const abs = s[0] === "/";
  const p = s.split("/");
  if (abs) p.shift();
  if (p[p.length - 1] === "") p.pop();
  return { absolute: abs, path: p };
}

export type Token = {
  tokenType: "text" | "input" | "output" | "outputAppend" | "none";
  value: string;
};

export function tokenize(line: string): Token[] {
  const result: Token[] = [];

  let index = 0;
  while (index < line.length) {
    const curr: Token = { tokenType: "none", value: "" };

    index = skipWhitespace(line, index);
    if (index === line.length) {
      if (curr.tokenType !== "none") result.push(curr);
      break;
    }
    curr.tokenType = "text";
    let skip = 0;
    if (line.substring(index).indexOf("<") === 0) {
      curr.tokenType = "input";
      skip = 1;
    }
    if (line.substring(index).indexOf(">") === 0) {
      curr.tokenType = "output";
      skip = 1;
    }
    if (line.substring(index).indexOf(">>") === 0) {
      curr.tokenType = "outputAppend";
      skip = 2;
    }
    index += skip;
    index = skipWhitespace(line, index);
    const tmp = readToken(line, index);
    curr.value = tmp.result;
    index = tmp.index;
    result.push(curr);
  }

  return result;
}

function readToken(
  line: string,
  index: number
): { result: string; index: number } {
  let result: string = "";
  while (!isTokenEnd(line[index]) && index < line.length) {
    if (line[index] === '"') {
      index++;
      while (line[index] !== '"' && index < line.length)
        result += line[index++];
      index++;
    } else result += line[index++];
  }
  if (result === "") throw new Error("Unexpected end of line");
  return { result, index };
}

function isTokenEnd(c: string): boolean {
  return isWhitespace(c) || "<>".indexOf(c) > -1;
}

function skipWhitespace(line: string, index: number): number {
  while (isWhitespace(line[index]) && index < line.length) index++;
  return index;
}

function isWhitespace(c: string): boolean {
  return " \t\n\r\v".indexOf(c) > -1;
}

export function createSomeFileSystem(root: Folder) {
  root.CreateFile("File-1");
  const folderA = root.CreateFolder("Folder-A");
  folderA.CreateFile("File-A1");
  folderA.CreateFile("File-A2");
  return root;
  /*
    root
      |___ File-1
      |___Folder-A
           |___File-A1
           |___File-A2
  */
}
