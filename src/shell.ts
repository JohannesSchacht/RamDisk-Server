/* tslint:disable:max-classes-per-file */

import {
	Filesystem,
	IsPlainFile,
	IsFolder,
	PlainFile,
	Folder,
	FilesystemObject,
} from "./filesystem";

import * as su from "./utilities";

export class Command {
	command: string | null = null;
	arguments: string[] = [];
	input: string | null = null;
	output: string | null = null;
	outputAppend: string | null = null;
}

export class Shell {
	Prompt: string;
	Fsys: Filesystem;

	constructor() {
		this.Fsys = new Filesystem();
		this.Prompt = this.Fsys.Curr.Name;
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
				return { exit, output: exec(mkdirCommand, cmd, this.Fsys) };
			case "ls":
				return { exit, output: exec(lsCommand, cmd, this.Fsys) };
			case "cd":
				const returnText = exec(cdCommand, cmd, this.Fsys);
				this.Prompt = this.Fsys.CurrentDirectoryPath();
				return { exit, output: returnText };
			case "touch":
				return { exit, output: exec(touchCommand, cmd, this.Fsys) };
			case "echo":
				return { exit, output: exec(echoCommand, cmd, this.Fsys) };
			case "cat":
				return { exit, output: exec(catCommand, cmd, this.Fsys) };
			case "rm":
				return { exit, output: exec(rmCommand, cmd, this.Fsys) };
			default:
				return { exit, output: `Unkown command: ${cmd.command}` };
		}
	}
}

function exec(
	f: (cmd: Command, fs: Filesystem) => string,
	cmd: Command,
	fs: Filesystem
): string {
	let result: string;
	try {
		result = f(cmd, fs);
	} catch (e) {
		return e.message;
	}

	if (cmd.output === null && cmd.outputAppend === null) return result;

	if (cmd.output != null) {
		const out: PlainFile = fs.CreateFile(cmd.output);
		out.Write(result);
	}
	if (cmd.outputAppend != null) {
		const out: PlainFile = fs.CreateFile(cmd.outputAppend);
		out.Append(result);
	}
	return "";
}

// Commands -------------------------------------------------------------
function pwdCommand(cmd: Command, fs: Filesystem): string {
	return fs.Curr.Name;
}

function mkdirCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) throw new Error("No directory specified");
	for (const dir of cmd.arguments) fs.CreateFolder(dir);
	return "";
}

function cdCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) {
		fs.Curr = fs.GetRoot();
		return "";
	}
	if (cmd.arguments.length > 1) throw new Error("Too many arguments");

	const folderName = cmd.arguments[0];
	if (folderName === "..") {
		fs.Curr = fs.Curr.Parent;
		return "";
	}
	const fsObj = fs.FindPath(folderName);
	if (IsFolder(fsObj)) fs.Curr = fsObj;
	else throw new Error(`cannot find directory ${folderName}`);
	return "";
}

function touchCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) throw new Error("Missing file operand");

	for (const f of cmd.arguments) {
		const fsObj = fs.FindPath(f);
		if (IsPlainFile(fsObj)) continue;
		fs.CreateFile(f);
	}
	return "";
}

function echoCommand(cmd: Command, fs: Filesystem): string {
	let result: string = cmd.arguments.join(" ");
	if (cmd.input != null) {
		if (result !== "") result += "\n";
		result += getContent(cmd.input, fs);
	}
	return result;
}

function getContent(path: string, fs: Filesystem): string {
	const file = fs.FindPath(path);
	if (file === null) throw new Error(`cannot find file ${path}`);
	if (file instanceof PlainFile) return file.Contents;

	// Get folder content as "ls -l"
	const cmd = new Command();
	cmd.command = "ls";
	cmd.arguments = ["-l", path];
	return lsCommand(cmd, fs);
}

function catCommand(cmd: Command, fs: Filesystem): string {
	let result: string = "";
	for (const f of cmd.arguments) {
		try {
			result += getContent(f, fs);
			// tslint:disable-next-line: no-empty
		} catch (e) {}
	}
	if (cmd.input != null) {
		if (result !== "") result += "\n";
		result += getContent(cmd.input, fs);
	}
	return result;
}

function rmCommand(cmd: Command, fs: Filesystem): string {
	for (const f of cmd.arguments) {
		const obj = fs.FindPath(f);
		if (obj == null) throw new Error(`File not found: ${f}`);
		if (obj.IsRoot()) throw new Error(`Cannot remove root directory`);
		obj.Parent?.Remove(obj);
	}
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
		if (param === "..") {
			folders.push({
				name: "../",
				folder: fs.Curr.Parent,
			});
			continue;
		}
		const fsObj = fs.FindPath(param);
		if (IsFolder(fsObj)) folders.push({ name: param, folder: fsObj });
		else if (IsPlainFile(fsObj)) files.push({ name: param, file: fsObj });
		else throw new Error(`no such file or directory: ${param}`);
	}

	let result: string = "";
	if (files.length + folders.length === 0) {
		result += lsFolder(fs.Curr, longFlag);
	} else {
		for (const fi of files) {
			if (longFlag) {
				if (result !== "") result += "\n";
				result += lsObject(fi.file, fi.name);
			} else {
				if (result !== "") result += "\t";
				result += fi.name;
			}
		}
		for (const fo of folders) {
			if (result !== "") result += "\n\n";
			result += fo.name + ":\n";
			result += lsFolder(fo.folder, longFlag);
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

function lsObject(fsObj: FilesystemObject, extName?: string): string {
	const typeletter = fsObj instanceof Folder ? "d" : "f";
	const size =
		fsObj instanceof Folder
			? fsObj.GetEntries().length
			: (fsObj as PlainFile).Contents.length; // casting ok
	const name = extName === undefined ? fsObj.Name : extName;
	return `${typeletter}\t${name}\t${size}`;
}

// Anaylse commands ------------------------------------------------------
export function analyseCommand(tokens: su.Token[]): Command {
	const cmd = new Command();

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