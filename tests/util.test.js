const {
  sanitizeFilename,
  removeDriveRoot,
  isFromExternalDrive,
} = require("../util");

test("isFromExternalDrive", () => {
  expect(isFromExternalDrive("C:\\Users\\bcollazo", "win32")).toBe(false);
  expect(isFromExternalDrive("D:\\Users\\bcollazo", "win32")).toBe(true);
  expect(isFromExternalDrive("/Users/bcollazo/song.mp3", "darwin")).toBe(false);
  expect(isFromExternalDrive("/Volumes/TestUsb/Music/song.mp3", "darwin")).toBe(
    true
  );
});

describe("removeDriveRoot", () => {
  test("local darwin path does nothing", () => {
    const fixture = "/Users/bcollazo/Music";
    const result = removeDriveRoot(fixture, "darwin");
    expect(result).toBe("/Users/bcollazo/Music");
  });

  test("external darwin path removes /Volumes/TestUsb", () => {
    const fixture = "/Volumes/TestUsb/Music/Folder/song.mp3";
    const result = removeDriveRoot(fixture, "darwin");
    expect(result).toBe("/Music/Folder/song.mp3");
  });

  test("local windows path removes C:", () => {
    const fixture = "C:\\Users\\bcollazo\\Music";
    const result = removeDriveRoot(fixture, "win32");
    expect(result).toBe("Users\\bcollazo\\Music");
  });

  test("external windows path removes D:", () => {
    const fixture = "D:\\Users\\bcollazo\\Music";
    const result = removeDriveRoot(fixture, "win32");
    expect(result).toBe("Users\\bcollazo\\Music");
  });
});

test("util filename sanitazion", () => {
  expect(sanitizeFilename("hello/world")).toBe("hello-world");
  expect(sanitizeFilename("hello/wo rl/d")).toBe("hello-wo rl-d");
  expect(sanitizeFilename("hello-world")).toBe("hello-world");
  expect(sanitizeFilename("foo bar baz")).toBe("foo bar baz");
  expect(sanitizeFilename("Foo BAR bAz")).toBe("Foo BAR bAz");
  expect(sanitizeFilename("Foo BAR.bAz")).toBe("Foo BAR-bAz");
  expect(sanitizeFilename("Foo_BAR.bAz")).toBe("Foo_BAR-bAz");
  expect(sanitizeFilename("Foo_BAR.bAz!")).toBe("Foo_BAR-bAz-");
  expect(sanitizeFilename("!Viva Latino!")).toBe("-Viva Latino-");
  expect(sanitizeFilename("2000-2010 HipHop / Reggae")).toBe(
    "2000-2010 HipHop - Reggae"
  );
  expect(sanitizeFilename("Activáera!?")).toBe("Activ-era--");
  expect(sanitizeFilename("2000-2010 HipHáp / Reggaeton!?")).toBe(
    "2000-2010 HipH-p - Reggaeton--"
  );
});
