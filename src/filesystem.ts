import {
	CreateRootFolder,
	PlainFile,
	Folder,
	FilesystemObject,
	IsFolder,
} from "./filesystemObject";
export * from "./filesystemObject";

export class Filesystem {
	Curr: Folder;
	private root: Folder;

	constructor() {
		this.root = CreateRootFolder();
		this.Curr = this.root;
	}

	FindPath(path: string): FilesystemObject | null {
		if (this.isRootName(path)) return this.GetRoot();

		const abs = this.GetAbsolutePath(path);
		const pathArray = this.GetAbsolutePath(path).split("/");
		pathArray.shift();

		let curr: Folder = this.GetRoot();
		for (let i = 0; i < pathArray.length; i++) {
			const fsObj =
				i !== pathArray.length - 1
					? curr.LookupFolder(pathArray[i])
					: curr.Lookup(pathArray[i]);

			if (fsObj == null) return null;
			curr = fsObj as Folder; // casting ok
		}
		return curr;
	}

	// If folder exists -> return the folder, otherwise create with all intermediate folders
	// If a file with same name exists (along the path) -> throw error
	CreateFolder(path: string): Folder {
		const pathArray = this.GetAbsolutePath(path).split("/");
		pathArray.shift();
		let curr: Folder = this.GetRoot();

		for (const p of pathArray) {
			const nextCurr = curr.Lookup(p); // casting ok
			if (nextCurr === null) {
				curr = curr.CreateFolder(p);
				continue;
			}
			if (IsFolder(nextCurr)) {
				curr = nextCurr;
				continue;
			}
			throw new Error(`${p} is a file already`);
		}
		return curr;
	}

	GetRoot(): Folder {
		return this.root;
	}

	// If file exist -> return file, otherwise create and all intermediate folders
	// If a file & folder conflict, also along the path, throw error
	CreateFile(path: string): PlainFile {
		const fsObj = this.FindPath(path);
		if (fsObj != null)
			if (fsObj instanceof PlainFile) return fsObj;
			else throw new Error(`${path} is an existing folder`);

		const pathArray = this.GetAbsolutePath(path).split("/");
		const filename = pathArray.pop();

		const baseFolder =
			pathArray.length > 1
				? this.CreateFolder(pathArray.join("/"))
				: this.GetRoot();

		return baseFolder.CreateFile(this.GetFilename(path));
	}

	CurrentDirectoryPath() {
		return this.Curr.CurrentDirectoryPath();
	}

	GetAbsolutePath(path: string): string {
		const cwd = this.CurrentDirectoryPath();
		return path[0] === "/" ? path : (cwd === "/" ? "" : cwd) + "/" + path;
	}

	GetFilename(path: string): string {
		return this.GetAbsolutePath(path).split("/").pop()!;
	}

	GetBaseFoldername(path: string): string {
		if (this.isRootName(path)) return path;
		const pathArray = this.GetAbsolutePath(path).split("/");
		pathArray.pop();
		if (pathArray.length === 1 && pathArray[0] === "") return "/";
		return pathArray.join("/");
	}

	private isRootName(path: string): boolean {
		return path === "/";
		const pathArray = path.split("/");
		return (
			pathArray.length === 2 && pathArray[0] === "" && pathArray[1] === ""
		);
	}
}
