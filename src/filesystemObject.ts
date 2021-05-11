/* tslint:disable:max-classes-per-file */

export function CreateRootFolder(): Folder {
	const tmp = { Name: "temorary name" };
	Object.assign(tmp, { Parent: undefined });
	const root = new Folder("/", tmp as Folder); // casting ok
	root.Parent = root;
	return root;
}

export function IsFolder(
	fsObject: FilesystemObject | null
): fsObject is Folder {
	return fsObject instanceof Folder;
}

export function IsPlainFile(
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

	CreateFolder(name: string): Folder {
		const newFolder = new Folder(name, this);
		this.Add(newFolder);
		return newFolder;
	}

	CreateFile(name: string): PlainFile {
		const newfile = new PlainFile(name, this);
		this.Add(newfile);
		return newfile;
	}

	Add(object: FilesystemObject): FilesystemObject {
		const o = this.Lookup(object.Name);
		if (o !== null) this.Remove(o);

		object.Parent = this;
		this.entries.push(object);
		return object;
	}

	Remove(object: FilesystemObject) {
		const idx = this.entries.indexOf(object);
		if (idx === -1) throw new Error(`"Not found ${object.Name}"`);
		this.entries.splice(idx, 1);
	}

	Lookup(name: string): FilesystemObject | null {
		const result = this.entries.filter((o) => o.Name === name).pop();
		return result === undefined ? null : result;
	}

	LookupFolder(name: string): Folder | null {
		const result = this.entries
			.filter((o) => o.Name === name && o instanceof Folder)
			.pop();
		return result === undefined ? null : (result as Folder); // casting ok
	}

	LookupFile(name: string): PlainFile | null {
		const result = this.entries
			.filter((o) => o.Name === name && o instanceof PlainFile)
			.pop();
		return result === undefined ? null : (result as PlainFile); // casting ok
	}

	GetEntries(): FilesystemObject[] {
		const f = new Folder("..", this.Parent) as FilesystemObject;
		return [f].concat(new Array(...this.entries));
	}

	CurrentDirectoryPath(): string {
		if (this.IsRoot()) return "/";
		const cwd = this.Parent?.CurrentDirectoryPath();
		return (cwd === "/" ? "" : cwd) + "/" + this.Name;
	}
}
