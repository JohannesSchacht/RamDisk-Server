import {
	createRootFolder,
	PlainFile,
	Folder,
	FilesystemObject,
	isFolder,
} from "./filesystemObject";

import * as su from "./utilities";

const someText = "Hello";
const someMoreText = " WOrld!";

describe("File system root:", () => {
	let root: Folder;

	beforeEach(() => {
		root = createRootFolder();
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
		const root = createRootFolder();
		file = root.createFile("test");
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
		root = createRootFolder();
		su.createSomeFileSystem(root);
	});

	it("Lookop should find a file", () => {
		let f1 = root.lookup("File-1");
		expect(f1).not.toBeNull();
		expect((f1 as PlainFile).Name).toMatch("File-1"); // casting ok
		f1 = root.lookup("not there");
		expect(f1).toBeNull();
	});
	it("adding a file with same name", () => {
		let f1 = root.lookupFile("File-1")!;
		f1.Write(someText);
		root.createFile("File-1");
		f1 = root.lookupFile("File-1")!;
		expect(f1.Contents).toMatch("");
	});
	it("verify entries with artificial parent", () => {
		const rootEntries = root.getEntries();
		expect(rootEntries.length).toBe(3);
		expect(rootEntries[0].Name).toMatch("..");
		expect(rootEntries[0].Parent).toBe(root);
	});
	it("verify removal works", () => {
		const folderA = root.lookupFolder("Folder-A");
		if (!isFolder(folderA))
			throw new Error(`internal test error: Folder-A ist not a folder`);
		expect(folderA.getEntries().length).toBe(3);
		folderA.remove(folderA.lookup("File-A1") as FilesystemObject);
		expect(folderA.getEntries().length).toBe(2);
		folderA.remove(folderA.lookup("File-A2") as FilesystemObject);
		expect(folderA.getEntries().length).toBe(1);
		root.remove(folderA);
		expect(root.getEntries().length).toBe(2);
	});
	it("cannot remove non-childs", () => {
		const someFile = root.lookupFile("File-1A")!;
		expect(() => {
			root.remove(someFile);
		}).toThrow();
	});
	it("isRoot recognizes root", () => {
		expect(root.IsRoot()).toBeTrue();
		const folderA = root.lookupFolder("Folder-A")!;
		expect(folderA.IsRoot()).toBeFalse();
	});
	it("gets the right root", () => {
		expect(getRoot(root)).toBe(root);
		const folderA = root.lookupFolder("Folder-A")!;
		expect(getRoot(folderA)).toBe(root);
	});
});

function getRoot(folder: Folder): Folder {
	while (!folder.IsRoot()) folder = folder.Parent;
	return folder;
}
