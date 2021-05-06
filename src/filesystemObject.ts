/* tslint:disable:max-classes-per-file */

export function CreateRootFolder(): Folder {
  const root = new Folder("/");
  root.Parent = root;
  return root;
}

export class FilesystemObject {
  Parent: Folder | undefined = undefined;
  constructor(public Name: string, parent?: Folder) {
    this.Parent = parent;
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

  Add(object: FilesystemObject): FilesystemObject {
    const o = this.Lookup(object.Name);
    if (o !== null) {
      this.Remove(o);
    }
    object.Parent = this;
    this.entries.push(object);
    return object;
  }

  /*   RemoveByName(name: string) {
    const o = this.Lookup(name);
    if (o === null) {
      throw new Error(`"Index ${name}" not found`);
    }
    this.Remove(o);
  } */

  Remove(object: FilesystemObject) {
    const idx = this.entries.indexOf(object);
    if (idx === -1) {
      throw new Error(`"Index ${object.Name}"`);
    }
    this.entries.splice(idx, 1);
  }

  Lookup(name: string): FilesystemObject | null {
    const idx = this.entries.findIndex(
      (o: FilesystemObject) => o.Name === name
    );
    return idx === -1 ? null : this.entries[idx];
  }

  LookupFolder(name: string): Folder | null {
    const folder = this.entries.find(
      (o) => o.Name === name && o instanceof Folder
    );
    return folder === undefined ? null : (folder as Folder);
  }

  LookupFile(name: string): PlainFile | null {
    const folder = this.entries.find(
      (o) => o.Name === name && o instanceof PlainFile
    );
    return folder === undefined ? null : (folder as PlainFile);
  }

  GetEntries(): FilesystemObject[] {
    const f = new Folder("..", this.Parent) as FilesystemObject;
    return [f].concat(new Array(...this.entries));
  }

  GetRoot(): Folder {
    if (this.isRoot()) return this;
    return (this.Parent as Folder).GetRoot();
  }

  private isRoot(): boolean {
    return this.Parent === this;
  }

  FindPath(path: string): FilesystemObject | null {
    const pathArray = path.split("/");

    if (pathArray.length === 2 && pathArray[0] === "" && pathArray[1] === "")
      return this.GetRoot();

    if (pathArray.length === 1) return this.Lookup(pathArray[0]);

    let newFolder: Folder | null;
    if (this.isAbsolutePath(path)) {
      newFolder = this.GetRoot();
    } else {
      newFolder = this.LookupFolder(pathArray[0]);
      if (newFolder == null) return null;
    }
    pathArray.shift();
    const newPath: string = pathArray.join("/");
    return newFolder.FindPath(newPath);
  }

  CreateFolder(path: string) {
    const pathArray = path.split("/");

    if (pathArray.length === 2 && pathArray[0] === "" && pathArray[1] === "")
      return;
    if (pathArray.length === 1 && pathArray[0] === "") return;

    let startFolder: Folder;
    if (pathArray[0] === "") {
      startFolder = this.GetRoot();
      pathArray.shift();
    } else {
      startFolder = this;
    }
    startFolder.createFolder(pathArray);
  }

  private createFolder(path: string[]) {
    let tmp = this.Lookup(path[0]);
    if (tmp instanceof PlainFile)
      throw new Error(`File exists: ${this.GetCurrentDirectory() + path[0]}`);

    if (tmp == null) {
      tmp = new Folder(path[0]);
      this.Add(tmp);
    }
    if (path.length > 1) {
      path.shift();
      (tmp as Folder).createFolder(path);
    }
  }

  GetCurrentDirectory(): string {
    if (this.isRoot()) return "/";
    return this.Parent?.GetCurrentDirectory() + "/" + this.Name;
  }

  private isAbsolutePath(path: string): boolean {
    return path[0] === "/";
  }
}
