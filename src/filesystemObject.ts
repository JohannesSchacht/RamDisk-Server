/* tslint:disable:max-classes-per-file */

export class FilesystemObject {
  constructor(public Name: string, public Parent: string) {}
}

export class PlainFile extends FilesystemObject {
  Content: string = "";
}

export class Folder extends FilesystemObject {
  Entries: FilesystemObject[] = [];

  Add(object: FilesystemObject) {
    const o = this.Lookup(object.Name);
    this.Entries.push(object);
  }
  RemoveByName(name: string) {
    const o = this.Lookup(name);
    if (o === -1) {
      throw new Error(`"Index ${name}"`);
    }
    this.Remove(o);
  }
  Remove(object: FilesystemObject) {
    const idx = this.Entries.indexOf(object);
    if (idx === -1) {
      throw new Error(`"Index ${object.Name}"`);
    }
    this.Entries.splice(idx, 1);
  }
  Lookup(name: string): FilesystemObject | -1 {
    const idx = this.Entries.findIndex(
      (o: FilesystemObject) => o.Name === name
    );
    return idx === -1 ? -1 : this.Entries[idx];
  }
}
