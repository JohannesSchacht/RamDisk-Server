import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

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
    file = new PlainFile("test");
  });
  it("should have an undefined parent", () => {
    expect(file.Parent).not.toBeDefined();
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
    root.Add(new PlainFile("File-1"));
    const folderA: Folder = root.Add(new Folder("Folder-A")) as Folder;
    folderA.Add(new PlainFile("File-A1"));
    folderA.Add(new PlainFile("File-A2"));
  });

  it("Lookop should find a file", () => {
    let f1 = root.Lookup("File-1");
    expect(f1).not.toBeNull();
    expect((f1 as Folder).Name).toMatch("File-1");
    f1 = root.Lookup("not there");
    expect(f1).toBeNull();
  });
  it("adding a file with same name", () => {
    let f1 = root.Lookup("File-1") as PlainFile;
    f1.Write(someText);
    root.Add(new PlainFile("File-1"));
    f1 = root.Lookup("File-1") as PlainFile;
    expect(f1.Contents).toMatch("");
  });
  it("verify entries with artificial parent", () => {
    const rootEntries = root.GetEntries();
    expect(rootEntries.length).toBe(3);
    expect(rootEntries[0].Name).toMatch("..");
    expect(rootEntries[0].Parent).toBe(root);
  });
  it("verify removal works", () => {
    const folderA = root.Lookup("Folder-A") as Folder;
    expect(folderA.GetEntries().length).toBe(3);
    folderA.Remove(folderA.Lookup("File-A1") as FilesystemObject);
    expect(folderA.GetEntries().length).toBe(2);
    folderA.Remove(folderA.Lookup("File-A2") as FilesystemObject);
    expect(folderA.GetEntries().length).toBe(1);
    root.Remove(folderA);
    expect(root.GetEntries().length).toBe(2);
  });
  it("cannot remove non-childs", () => {
    const someFile = new PlainFile("someFile");
    expect(() => {
      root.Remove(someFile);
    }).toThrow();
  });
  it("isRoot recognizes root", () => {
    expect(isRoot(root)).toBeTrue();
    const folderA = root.Lookup("Folder-A") as Folder;
    expect(isRoot(folderA)).toBeFalse();
  });
  it("gets the right root", () => {
    expect(root.GetRoot()).toBe(root);
    const folderA = root.Lookup("Folder-A") as Folder;
    expect(folderA.GetRoot()).toBe(root);
  });
});

// Utility functions
function isRoot(folder: Folder): boolean {
  return (folder as any).isRoot();
}
