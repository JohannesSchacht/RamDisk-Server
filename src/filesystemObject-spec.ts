import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
  IsFolder,
} from "./filesystemObject";

import * as su from "./utilities";

const someText = "Hello";
const someMoreText = " WOrld!";

describe("File system root:", () => {
  let root: Folder;

  beforeEach(() => {
    root = CreateRootFolder();
  });

  it("should be defined", () => {
    expect(root).toBeDefined();
  });
  it("should be a folder", () => {
    expect(root).toBeInstanceOf(Folder);
  });
  it("its name should be /", () => {
    expect(root.Name).toMatch("/");
  });
  it("its parent should point to itself", () => {
    expect(root.Parent).toBe(root);
  });
});

describe("Plain file:", () => {
  let file: PlainFile;
  beforeEach(() => {
    const root = CreateRootFolder();
    file = root.CreateFile("test");
  });
  it("should initially have an empty string as content", () => {
    expect(file.Contents).toMatch("");
  });
  it("should corectly handle write, append and clear", () => {
    file.Write(someText);
    expect(file.Contents).toMatch(someText);
    file.Append(someMoreText);
    expect(file.Contents).toMatch(someText + someMoreText);
    file.Clear();
    expect(file.Contents).toMatch("");
  });
});

describe("Folder: ", () => {
  let root: Folder;
  beforeEach(() => {
    root = CreateRootFolder();
    su.createSomeFileSystem(root);
  });

  it("Lookop should find a file", () => {
    let f1 = root.Lookup("File-1");
    expect(f1).not.toBeNull();
    expect((f1 as PlainFile).Name).toMatch("File-1"); // casting ok
    f1 = root.Lookup("not there");
    expect(f1).toBeNull();
  });
  it("adding a file with same name", () => {
    let f1 = root.LookupFile("File-1") as PlainFile; // casting ok
    f1.Write(someText);
    root.CreateFile("File-1");
    f1 = root.LookupFile("File-1") as PlainFile; // casting ok
    expect(f1.Contents).toMatch("");
  });
  it("verify entries with artificial parent", () => {
    const rootEntries = root.GetEntries();
    expect(rootEntries.length).toBe(3);
    expect(rootEntries[0].Name).toMatch("..");
    expect(rootEntries[0].Parent).toBe(root);
  });
  it("verify removal works", () => {
    const folderA = root.LookupFolder("Folder-A");
    if (!IsFolder(folderA))
      throw new Error(`internal test error: Folder-A ist not a folder`);
    expect(folderA.GetEntries().length).toBe(3);
    folderA.Remove(folderA.Lookup("File-A1") as FilesystemObject);
    expect(folderA.GetEntries().length).toBe(2);
    folderA.Remove(folderA.Lookup("File-A2") as FilesystemObject);
    expect(folderA.GetEntries().length).toBe(1);
    root.Remove(folderA);
    expect(root.GetEntries().length).toBe(2);
  });
  it("cannot remove non-childs", () => {
    const someFile = root.LookupFile("File-1A") as PlainFile; // casting ok
    expect(() => {
      root.Remove(someFile);
    }).toThrow();
  });
  it("isRoot recognizes root", () => {
    expect(root.IsRoot()).toBeTrue();
    const folderA = root.LookupFolder("Folder-A") as Folder; // casting ok
    expect(folderA.IsRoot()).toBeFalse();
  });
  it("gets the right root", () => {
    expect(getRoot(root)).toBe(root);
    const folderA = root.Lookup("Folder-A") as Folder; // casting ok
    expect(getRoot(folderA)).toBe(root);
  });
});

function getRoot(folder: Folder): Folder {
  while (!folder.IsRoot()) folder = folder.Parent;
  return folder;
}
