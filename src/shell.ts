/* tslint:disable:max-classes-per-file */

import {
	Filesystem,
	isPlainFile,
	isFolder,
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
	prompt: string;
	exit: boolean = false;
	fsys: Filesystem;

	constructor() {
		this.fsys = new Filesystem();
		this.prompt = this.fsys.curr.Name;
	}

	execute(cmd: Command): string {
		switch (cmd.command) {
			case "exit":
				this.exit = true;
			case null:
				return "";
			case "pwd":
				return pwdCommand(cmd, this.fsys);
			case "mkdir":
				return exec(mkdirCommand, cmd, this.fsys);
			case "ls":
				return exec(lsCommand, cmd, this.fsys);
			case "cd":
				const returnText = exec(cdCommand, cmd, this.fsys);
				this.prompt = this.fsys.currentDirectoryPath();
				return returnText;
			case "touch":
				return exec(touchCommand, cmd, this.fsys);
			case "echo":
				return exec(echoCommand, cmd, this.fsys);
			case "cat":
				return exec(catCommand, cmd, this.fsys);
			case "rm":
				return exec(rmCommand, cmd, this.fsys);
			default:
				return `Unkown command: ${cmd.command}`;
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
		const out: PlainFile = fs.createFile(cmd.output);
		out.Write(result);
	}
	if (cmd.outputAppend != null) {
		const out: PlainFile = fs.createFile(cmd.outputAppend);
		out.Append(result);
	}
	return "";
}

// Commands -------------------------------------------------------------
function pwdCommand(cmd: Command, fs: Filesystem): string {
	return fs.curr.Name;
}

function mkdirCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) throw new Error("No directory specified");
	for (const dir of cmd.arguments) fs.createFolder(dir);
	return "";
}

function cdCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) {
		fs.curr = fs.getRoot();
		return "";
	}
	if (cmd.arguments.length > 1) throw new Error("Too many arguments");

	const folderName = cmd.arguments[0];
	if (folderName === "..") {
		fs.curr = fs.curr.Parent;
		return "";
	}
	const fsObj = fs.findPath(folderName);
	if (isFolder(fsObj)) fs.curr = fsObj;
	else throw new Error(`cannot find directory ${folderName}`);
	return "";
}

function touchCommand(cmd: Command, fs: Filesystem): string {
	if (cmd.arguments.length === 0) throw new Error("Missing file operand");

	for (const f of cmd.arguments) {
		const fsObj = fs.findPath(f);
		if (isPlainFile(fsObj)) continue;
		fs.createFile(f);
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
	const file = fs.findPath(path);
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
		const obj = fs.findPath(f);
		if (obj == null) throw new Error(`File not found: ${f}`);
		if (obj.IsRoot()) throw new Error(`Cannot remove root directory`);
		obj.Parent?.remove(obj);
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
				folder: fs.curr.Parent,
			});
			continue;
		}
		const fsObj = fs.findPath(param);
		if (isFolder(fsObj)) folders.push({ name: param, folder: fsObj });
		else if (isPlainFile(fsObj)) files.push({ name: param, file: fsObj });
		else throw new Error(`no such file or directory: ${param}`);
	}

	let result: string = "";
	if (files.length + folders.length === 0) {
		result += lsFolder(fs.curr, longFlag);
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
	const entries = folder.getEntries();
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
			? fsObj.getEntries().length
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
