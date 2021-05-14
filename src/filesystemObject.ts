/* tslint:disable:max-classes-per-file */

export function createRootFolder(): Folder {
	const tmp = { Name: "temorary name" };
	Object.assign(tmp, { Parent: undefined });
	const root = new Folder("/", tmp as Folder); // casting ok
	root.Parent = root;
	return root;
}

export function isFolder(
	fsObject: FilesystemObject | null
): fsObject is Folder {
	return fsObject instanceof Folder;
}

export function isPlainFile(
	fsObject: FilesystemObject | null
): fsObject is PlainFile {
	return fsObject instanceof PlainFile;
}

export class FilesystemObject {
	constructor(public Name: string, public Parent: Folder) {}

	public IsRoot(): boolean {
		return this instanceof Folder && this.Parent === this;
	}
}

export class PlainFile extends FilesystemObject {
	Contents: string = "";

	Write(contents: string) {
		this.Contents = contents;
	}
	Append(contents: string) {
		this.Contents += contents;
	}
	Clear() {
		this.Contents = "";
	}
}

export class Folder extends FilesystemObject {
	private entries: FilesystemObject[] = [];

	createFolder(name: string): Folder {
		const newFolder = new Folder(name, this);
		this.add(newFolder);
		return newFolder;
	}

	createFile(name: string): PlainFile {
		const newfile = new PlainFile(name, this);
		this.add(newfile);
		return newfile;
	}

	add(object: FilesystemObject): FilesystemObject {
		const o = this.lookup(object.Name);
		if (o !== null) this.remove(o);

		object.Parent = this;
		this.entries.push(object);
		return object;
	}

	remove(object: FilesystemObject) {
		const idx = this.entries.indexOf(object);
		if (idx === -1) throw new Error(`"Not found ${object.Name}"`);
		this.entries.splice(idx, 1);
	}

	lookup(name: string): FilesystemObject | null {
		const result = this.entries.filter((o) => o.Name === name).pop();
		return result === undefined ? null : result;
	}

	lookupFolder(name: string): Folder | null {
		const result = this.entries
			.filter((o) => o.Name === name && o instanceof Folder)
			.pop();
		return result === undefined ? null : (result as Folder); // casting ok
	}

	lookupFile(name: string): PlainFile | null {
		const result = this.entries
			.filter((o) => o.Name === name && o instanceof PlainFile)
			.pop();
		return result === undefined ? null : (result as PlainFile); // casting ok
	}

	getEntries(): FilesystemObject[] {
		const f = new Folder("..", this.Parent) as FilesystemObject;
		return [f].concat(new Array(...this.entries));
	}

	currentDirectoryPath(): string {
		if (this.IsRoot()) return "/";
		const cwd = this.Parent?.currentDirectoryPath();
		return (cwd === "/" ? "" : cwd) + "/" + this.Name;
	}
}
