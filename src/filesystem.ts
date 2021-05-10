import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

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
    let curr: FilesystemObject | null = this.GetRoot();

    for (let i = 0; i < pathArray.length; i++) {
      if (i != pathArray.length - 1)
        curr = (curr as Folder).LookupFolder(pathArray[i]);
      // casting ok
      else curr = (curr as Folder).Lookup(pathArray[i]); // casting ok
      if (curr == null) return null;
    }
    return curr;
  }

  // If folder exists -> return the folder, otherwise create with all intermediate folders
  // If a file with same name exists (along the path) -> throw error
  CreateFolder(path: string): Folder {
    const pathArray = this.GetAbsolutePath(path).split("/");
    pathArray.shift();
    let curr: Folder = this.GetRoot();

    for (let i = 0; i < pathArray.length; i++) {
      let nextCurr = (curr as Folder).Lookup(pathArray[i]); // casting ok
      if (nextCurr !== null)
        if (nextCurr instanceof Folder) {
          curr = nextCurr as Folder;
          continue;
        } else throw new Error(`${pathArray[i]} is a file already`);

      nextCurr = curr.CreateFolder(pathArray[i]);
      curr = nextCurr as Folder;
    }
    return curr as Folder;
  }

  GetRoot(): Folder {
    return this.root;
  }

  // If file exist -> return file, otherwise create and all intermediate folders
  // If a file & folder conflict, also along the path, throw error
  CreateFile(path: string): PlainFile {
    const tmp = this.FindPath(path);
    if (tmp != null)
      if (tmp instanceof PlainFile) return tmp;
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
    if (pathArray.length == 1 && pathArray[0] === "") return "/";
    return pathArray.join("/");
  }

  private isRootName(path: string): boolean {
    return path === "/";
    const pathArray = path.split("/");
    return pathArray.length === 2 && pathArray[0] === "" && pathArray[1] === "";
  }
}
