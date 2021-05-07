import { Filesystem } from "./filesystem";
import * as su from "./utilities";
import {
  CreateRootFolder,
  PlainFile,
  Folder,
  FilesystemObject,
} from "./filesystemObject";

describe("Filesystem: GetFilename, GetBaseFoldername, GetAbsolutePath", () => {
  let filesystem: Filesystem;
  beforeEach(() => {
    filesystem = new Filesystem();
    su.createSomeFileSystem(filesystem.GetRoot());
  });

  const td: {
    n: number;
    cwd: string;
    path: string;
    file: string;
    base: string;
    absPath: string;
  }[] = [
    { n: 1, cwd: "/", path: "/", file: "", base: "/", absPath: "/" },
    { n: 2, cwd: "/", path: "/a", file: "a", base: "/", absPath: "/a" },
    {
      n: 3,
      cwd: "/",
      path: "/a/b/c",
      file: "c",
      base: "/a/b",
      absPath: "/a/b/c",
    },
    {
      n: 4,
      cwd: "/",
      path: "a",
      file: "a",
      base: "/",
      absPath: "/a",
    },
    {
      n: 5,
      cwd: "/",
      path: "a/b/c",
      file: "c",
      base: "/a/b",
      absPath: "/a/b/c",
    },
    {
      n: 6,
      cwd: "/",
      path: "File-1",
      file: "File-1",
      base: "/",
      absPath: "/File-1",
    },

    { n: 11, cwd: "/Folder-A", path: "/", file: "", base: "/", absPath: "/" },
    {
      n: 12,
      cwd: "/Folder-A",
      path: "/a",
      file: "a",
      base: "/",
      absPath: "/a",
    },
    {
      n: 13,
      cwd: "/Folder-A",
      path: "/a/b/c",
      file: "c",
      base: "/a/b",
      absPath: "/a/b/c",
    },
    {
      n: 14,
      cwd: "/Folder-A",
      path: "a",
      file: "a",
      base: "/Folder-A",
      absPath: "/Folder-A/a",
    },
    {
      n: 15,
      cwd: "/Folder-A",
      path: "a/b/c",
      file: "c",
      base: "/Folder-A/a/b",
      absPath: "/Folder-A/a/b/c",
    },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    it(`Case ${test.n}: path = ${test.path} file = ${test.file}:`, () => {
      filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
      expect(filesystem.GetFilename(test.path)).toBe(test.file);
    });
    it(`Case ${test.n}: path = ${test.path} base = ${test.base}:`, () => {
      filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
      expect(filesystem.GetBaseFoldername(test.path)).toBe(test.base);
    });
    it(`Case ${test.n}: path = ${test.path} absPath = ${test.absPath}:`, () => {
      filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
      expect(filesystem.GetAbsolutePath(test.path)).toBe(test.absPath);
    });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});

describe("FindPath", () => {
  let filesystem: Filesystem;
  beforeEach(() => {
    filesystem = new Filesystem();
    su.createSomeFileSystem(filesystem.GetRoot());
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

  const doOnly: number = 3;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    it(`Case ${test.n}`, () => {
      filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
      const tmp = filesystem.FindPath(test.path);
      if (test.output === null) expect(tmp).toBeNull();
      else expect((tmp as FilesystemObject).Name).toMatch(test.output);
    });
  }
});

describe("CreateFolder", () => {
  let filesystem: Filesystem;
  beforeEach(() => {
    filesystem = new Filesystem();
    su.createSomeFileSystem(filesystem.GetRoot());
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
      let exception = false;
      try {
        filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
        filesystem.CreateFolder(test.path);
      } catch (e) {
        exception = true;
      }

      expect(exception).toBe(test.exception);
      if (!test.exception) {
        let tmp = filesystem.FindPath(test.path) as Folder;
        expect(tmp).not.toBeNull();

        const absPath = filesystem.GetAbsolutePath(test.path);
        tmp = filesystem.FindPath(absPath) as Folder;
        expect(tmp).not.toBeNull();
      }
    });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});

describe("CreateFile", () => {
  let filesystem: Filesystem;
  beforeEach(() => {
    filesystem = new Filesystem();
    su.createSomeFileSystem(filesystem.GetRoot());
  });

  const td: {
    n: number;
    cwd: string;
    path: string;
    final: string;
    exception: boolean;
  }[] = [
    { n: 1, cwd: "/", path: "a", final: "/a", exception: false },
    { n: 2, cwd: "/", path: "a", final: "/a", exception: false },
    { n: 3, cwd: "/", path: "/", final: "/", exception: true },
    { n: 4, cwd: "/", path: "/a", final: "/a", exception: false },
    { n: 5, cwd: "/", path: "/x/y/z", final: "/x/y/z", exception: false },
    {
      n: 6,
      cwd: "/",
      path: "/Folder-A/a",
      final: "/Folder-A/a",
      exception: false,
    },
    { n: 7, cwd: "/", path: "Folder-A", final: "", exception: true },
    { n: 10, cwd: "/Folder-A", path: "/Folder-A", final: "", exception: true },
    {
      n: 11,
      cwd: "/Folder-A",
      path: "a/b",
      final: "/Folder-A/a/b",
      exception: false,
    },
  ];

  const doOnly: number = -1;
  for (const test of td) {
    if (doOnly !== -1 && test.n !== doOnly) continue;

    it(`Case ${test.n}`, () => {
      let exception = false;
      try {
        filesystem.Curr = filesystem.FindPath(test.cwd) as Folder;
        filesystem.CreateFile(test.path);
      } catch (e) {
        exception = true;
      }

      expect(exception).toBe(test.exception);
      if (!test.exception) {
        const tmp = filesystem.FindPath(test.final) as Folder;
        expect(tmp).not.toBeNull();
        if (tmp != null) expect(tmp instanceof PlainFile).toBeTrue();
      }
    });
  }
  it("all tests done?", () => {
    expect(doOnly).toBe(-1);
  });
});
