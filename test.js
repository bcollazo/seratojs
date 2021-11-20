const path = require("path");
const fs = require("fs");

const seratojs = require("./index");
const { sanitizeFilename } = require("./util");

const TEST_SUBCRATES_FOLDER = path.join(".", "TestSubcrates");
const NON_EXISTENT_SUBCRATES_FOLDER = path.join(".", "NonExistentTestFolder");

function safelyDeleteFolder(folder) {
  const files = fs.readdirSync(folder);
  for (let filename of files) {
    fs.unlinkSync(path.join(folder, filename));
  }
  fs.rmdirSync(folder);
}

beforeEach(() => {
  // Create TestSubcrateFolder
  fs.mkdirSync(TEST_SUBCRATES_FOLDER);
  fs.copyFileSync(
    path.join(".", "Serato Demo Tracks.crate"),
    path.join(TEST_SUBCRATES_FOLDER, "Serato Demo Tracks.crate")
  );
});

afterEach(() => {
  safelyDeleteFolder(TEST_SUBCRATES_FOLDER);
});

test("list crates in sync and read crate info", () => {
  const crates = seratojs.listCratesSync(TEST_SUBCRATES_FOLDER);
  expect(crates.length).toBe(1);

  const crate = crates[0];
  const songs = crate.getSongPathsSync();
  expect(crate.name).toBe("Serato Demo Tracks");
  expect(songs).toEqual([
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\01 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\02 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\03 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\04 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\05 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
  ]);
});

test("create new crate and list", () => {
  const newCrate = new seratojs.Crate(
    "ProgramaticallyCreatedCrate",
    TEST_SUBCRATES_FOLDER
  );
  newCrate.addSong("Users/bcollazo/Music/song.mp3");
  newCrate.addSong("C:\\Users\\bcollazo\\Music\\second_song.mp3");
  newCrate.saveSync();

  const crates = seratojs.listCratesSync(TEST_SUBCRATES_FOLDER);
  expect(crates.length).toBe(2);

  // Cleanup
  fs.unlinkSync(
    path.join(TEST_SUBCRATES_FOLDER, "ProgramaticallyCreatedCrate.crate")
  );
});

test("async list files", async () => {
  const crates = await seratojs.listCrates(TEST_SUBCRATES_FOLDER);
  expect(crates.length).toBe(1);

  const crate = crates[0];
  const songs = await crate.getSongPaths();
  expect(crate.name).toBe("Serato Demo Tracks");
  expect(songs).toEqual([
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\01 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\02 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\03 - House Track Serato House Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\04 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\05 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
  ]);
});

test("async create new crate and list", async () => {
  const newCrate = new seratojs.Crate(
    "ProgramaticallyCreatedCrate",
    TEST_SUBCRATES_FOLDER
  );
  newCrate.addSong("Users/bcollazo/Music/song.mp3");
  newCrate.addSong("C:\\Users\\bcollazo\\Music\\second_song.mp3");
  await newCrate.save();

  const crates = await seratojs.listCrates(TEST_SUBCRATES_FOLDER);
  expect(crates.length).toBe(2);

  // Cleanup
  fs.unlinkSync(
    path.join(TEST_SUBCRATES_FOLDER, "ProgramaticallyCreatedCrate.crate")
  );
});

test("weird names dont break crate creation", async () => {
  const newCrate = new seratojs.Crate(
    "2000-2010 HipHáp / Reggaeton!?",
    TEST_SUBCRATES_FOLDER
  );
  await newCrate.save();
});

test("async create when Serato folder doesnt exist", async () => {
  const newCrate = new seratojs.Crate(
    "TestCrateSeratoFolderNonExistent",
    NON_EXISTENT_SUBCRATES_FOLDER
  );
  await newCrate.save();
  safelyDeleteFolder(NON_EXISTENT_SUBCRATES_FOLDER);
});

test("create when Serato folder doesnt exist", async () => {
  const newCrate = new seratojs.Crate(
    "TestCrateSeratoFolderNonExistent",
    NON_EXISTENT_SUBCRATES_FOLDER
  );
  newCrate.saveSync();
  safelyDeleteFolder(NON_EXISTENT_SUBCRATES_FOLDER);
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
