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

  Add(object: FilesystemObject): FilesystemObject {
    const o = this.Lookup(object.Name);
    if (o !== null) {
      this.Remove(o);
    }
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
    return result === undefined ? null : (result as Folder);
  }

  GetEntries(): FilesystemObject[] {
    const f = new Folder("..", this.Parent) as FilesystemObject;
    return [f].concat(new Array(...this.entries));
  }

  GetRoot(): Folder {
    if (this.IsRoot()) return this;
    return (this.Parent as Folder).GetRoot();
  }

  CurrentDirectoryPath(): string {
    if (this.IsRoot()) return "/";
    const cwd = this.Parent?.CurrentDirectoryPath();
    return (cwd === "/" ? "" : cwd) + "/" + this.Name;
  }
}
