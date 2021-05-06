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
    root = createSomeFileSystem();
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

describe("FindPath", () => {
  let root: Folder;
  beforeEach(() => {
    root = createSomeFileSystem();
  });

  const td: {
    n: number;
    cwd: string;
    path: string;
    output: string | null;
  }[] = [
    { n: 1, cwd: "/", path: "/", output: "/" },
    { n: 2, cwd: "/", path: "/File-1", output: "File-1" },
    { n: 3, cwd: "/", path: "File-1", output: "File-1" },
    { n: 4, cwd: "/", path: "xxxx", output: null },
    { n: 5, cwd: "/", path: "/Folder-A/File-A1", output: "File-A1" },
    { n: 10, cwd: "/Folder-A", path: "/File-1", output: "File-1" },
    { n: 11, cwd: "/Folder-A", path: "/Folder-A", output: "Folder-A" },
    { n: 12, cwd: "/Folder-A", path: "File-A2", output: "File-A2" },
    { n: 14, cwd: "/Folder-A", path: "/xxxx/File-A1", output: null },
    { n: 15, cwd: "/Folder-A", path: "/", output: "/" },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    it(`Case ${test.n}`, () => {
      const cwd: Folder = root.FindPath(test.cwd) as Folder;
      const tmp = cwd.FindPath(test.path);
      if (test.output === null) expect(tmp).toBeNull();
      else expect((tmp as FilesystemObject).Name).toMatch(test.output);
    });
  }
});

describe("CreateFolder", () => {
  let root: Folder;
  beforeEach(() => {
    root = createSomeFileSystem();
  });

  const td: {
    n: number;
    cwd: string;
    path: string;
    exception: boolean;
  }[] = [
    { n: 1, cwd: "/", path: "a", exception: false },
    { n: 2, cwd: "/", path: "a/b/c", exception: false },
    { n: 3, cwd: "/", path: "/a/b/c", exception: false },
    { n: 4, cwd: "/Folder-A", path: "a", exception: false },
    { n: 5, cwd: "/Folder-A", path: "a/b/c", exception: false },
    { n: 6, cwd: "/Folder-A", path: "/a/b/c", exception: false },
    { n: 7, cwd: "/Folder-A", path: "/Folder-A/a/b/c", exception: false },
    { n: 8, cwd: "/Folder-A", path: "/File-1/a/b/c", exception: true },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    it(`Case ${test.n}`, () => {
      const cwd: Folder = root.FindPath(test.cwd) as Folder;

      let exception = false;
      try {
        cwd.CreateFolder(test.path);
      } catch (e) {
        exception = true;
      }

      expect(exception).toBe(test.exception);
      if (!test.exception) {
        let tmp = cwd.FindPath(test.path) as Folder;
        expect(tmp).not.toBeNull();

        const absPath =
          test.path[0] === "/"
            ? test.path
            : cwd.GetCurrentDirectory() + "/" + test.path;
        tmp = cwd.FindPath(absPath) as Folder;
        expect(tmp).not.toBeNull();
      }
    });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});

// Utility functions
function isRoot(folder: Folder): boolean {
  return (folder as any).isRoot();
}

function createSomeFileSystem(): Folder {
  const root = CreateRootFolder();
  root.Add(new PlainFile("File-1"));
  const folderA: Folder = root.Add(new Folder("Folder-A")) as Folder;
  folderA.Add(new PlainFile("File-A1"));
  folderA.Add(new PlainFile("File-A2"));
  return root;
  /*
    root
      |___ File-1
      |___Folder-A
           |___File-A1
           |___File-A2
  */
}
