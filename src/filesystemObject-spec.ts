import { PlainFile, Folder } from "./filesystemObject";

describe("Create file system", () => {
  let filesystem: Folder;
  // For every test case we need UserService instance so before running each test case the UserService instance will be created
  beforeEach(() => {
    filesystem = new Folder("/", "/");
  });

  it("true", () => expect(true).toBe(true, "really"));
  // Test case to ensure correct root folder
  it("Should be defined", () => {
    expect(filesystem.Name).toMatch("x", "root name should be /");
  });
});
