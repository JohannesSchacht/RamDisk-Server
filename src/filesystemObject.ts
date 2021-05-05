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
  FindPath(name: string): FilesystemObject | null {
    name.split("/");
    return null;
  }
}
