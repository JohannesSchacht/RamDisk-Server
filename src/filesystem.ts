import {
	createRootFolder,
	PlainFile,
	Folder,
	FilesystemObject,
	isFolder,
} from "./filesystemObject";
export * from "./filesystemObject";

export class Filesystem {
	curr: Folder;
	private root: Folder;

	constructor() {
		this.root = createRootFolder();
		this.curr = this.root;
	}

	findPath(path: string): FilesystemObject | null {
		if (this.isRootName(path)) return this.getRoot();

		const abs = this.getAbsolutePath(path);
		const pathArray = this.getAbsolutePath(path).split("/");
		pathArray.shift();

		let curr: Folder = this.getRoot();
		for (let i = 0; i < pathArray.length; i++) {
			const fsObj =
				i !== pathArray.length - 1
					? curr.lookupFolder(pathArray[i])
					: curr.lookup(pathArray[i]);

			if (fsObj == null) return null;
			curr = fsObj as Folder; // casting ok
		}
		return curr;
	}

	// If folder exists -> return the folder, otherwise create with all intermediate folders
	// If a file with same name exists (along the path) -> throw error
	createFolder(path: string): Folder {
		const pathArray = this.getAbsolutePath(path).split("/");
		pathArray.shift();
		let curr: Folder = this.getRoot();

		for (const p of pathArray) {
			const nextCurr = curr.lookup(p); // casting ok
			if (nextCurr === null) {
				curr = curr.createFolder(p);
				continue;
			}
			if (isFolder(nextCurr)) {
				curr = nextCurr;
				continue;
			}
			throw new Error(`${p} is a file already`);
		}
		return curr;
	}

	getRoot(): Folder {
		return this.root;
	}

	// If file exist -> return file, otherwise create and all intermediate folders
	// If a file & folder conflict, also along the path, throw error
	createFile(path: string): PlainFile {
		const fsObj = this.findPath(path);
		if (fsObj != null)
			if (fsObj instanceof PlainFile) return fsObj;
			else throw new Error(`${path} is an existing folder`);

		const pathArray = this.getAbsolutePath(path).split("/");
		const filename = pathArray.pop();

		const baseFolder =
			pathArray.length > 1
				? this.createFolder(pathArray.join("/"))
				: this.getRoot();

		return baseFolder.createFile(this.getFilename(path));
	}

	currentDirectoryPath() {
		return this.curr.currentDirectoryPath();
	}

	getAbsolutePath(path: string): string {
		const cwd = this.currentDirectoryPath();
		return path[0] === "/" ? path : (cwd === "/" ? "" : cwd) + "/" + path;
	}

	getFilename(path: string): string {
		return this.getAbsolutePath(path).split("/").pop()!;
	}

	getBaseFoldername(path: string): string {
		if (this.isRootName(path)) return path;
		const pathArray = this.getAbsolutePath(path).split("/");
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
