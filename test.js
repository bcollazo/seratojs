const path = require("path");
const fs = require("fs");

const seratojs = require("./index");
const { sanitizeFilename, isWindows, extractMountpoint } = require("./util");

/**
 * These tests create a folder in the repo root called "_TestSerato_"
 * and populates it with 1 crate before each test. Tests usually use this
 * instead of the default ones.
 */
const TEST_SERATO_FOLDER = path.join(".", "_TestSerato_");
const TEST_SUBCRATES_FOLDER = path.join(TEST_SERATO_FOLDER, "Subcrates");
beforeEach(() => {
  fs.mkdirSync(TEST_SERATO_FOLDER);
  fs.mkdirSync(TEST_SUBCRATES_FOLDER);
  fs.copyFileSync(
    path.join(".", "Serato Demo Tracks.crate"),
    path.join(TEST_SUBCRATES_FOLDER, "Serato Demo Tracks.crate")
  );
});
afterEach(() => {
  const files = fs.readdirSync(TEST_SUBCRATES_FOLDER);
  for (let filename of files) {
    fs.unlinkSync(path.join(TEST_SUBCRATES_FOLDER, filename));
  }
  fs.rmdirSync(TEST_SUBCRATES_FOLDER);
  fs.rmdirSync(TEST_SERATO_FOLDER);
});

function external(...paths) {
  const prefix = isWindows() ? "D:\\" : "/Volumes/EECS MIT/";
  return path.resolve(path.join(prefix, ...paths));
}

function local(...paths) {
  return path.resolve(path.join("/", ...paths));
}

// ===== Helper functions
test("testing helper functions", () => {
  const path1 = external("TestFolder", "song1.mp3");
  const path2 = local("TestFolder", "song1.mp3");
  if (isWindows()) {
    expect(path1).toBe("D:\\TestFolder\\song1.mp3");
    expect(path2).toBe("C:\\TestFolder\\song1.mp3");
  } else {
    expect(path1).toBe("/Volumes/EECS MIT/TestFolder/song1.mp3");
    expect(path2).toBe("/TestFolder/song1.mp3");
  }
});

// ===== Util module
test("extractMountpoint", () => {
  expect(extractMountpoint(external("TestFolder", "song1.mp3"))).toBe(
    external()
  );
  expect(extractMountpoint(local("TestFolder", "song1.mp3"))).toBe(local());
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

// ===== List crates
test("list crates in specific serato folder", async () => {
  const crates = await seratojs.listCrates([TEST_SERATO_FOLDER]);
  expect(crates.length).toBe(1);
});

// ===== Save locations
test("adding songs from a drive, saves it in drive", async () => {
  const crate = new seratojs.Crate("TestDriveCrate");
  crate.addSong(external("TestFolder", "song1.mp3"));
  crate.addSong(external("song2.mp3"));

  const subcrates = crate.getSubCrates();
  expect(subcrates.length).toBe(1);
  expect(subcrates[0].filepath).toBe(
    external("_Serato_", "SubCrates", "TestDriveCrate.crate")
  );
});

test("adding songs from a drive and local disk, saves it in both", () => {
  const crate = new seratojs.Crate("TestDriveCrate");
  crate.addSong(external("TestFolder", "song1.mp3"));
  crate.addSong(local("Users", "bcollazo", "Music", "song2.mp3"));

  const subcrates = crate.getSubCrates();
  expect(subcrates.length).toBe(2);
  expect(
    subcrates.some(
      (s) =>
        s.filepath === external("_Serato_", "SubCrates", "TestDriveCrate.crate")
    )
  ).toBe(true);
  expect(
    subcrates.some(
      (s) =>
        s.filepath ===
        local(
          "Users",
          "bcollazo",
          "Music",
          "_Serato_",
          "SubCrates",
          "TestDriveCrate.crate"
        )
    )
  ).toBe(true);
});

test("adding songs from local disk only, saves it Music folder _Serato_", () => {
  const crate = new seratojs.Crate("TestDriveCrate");
  crate.addSong(local("Users", "bcollazo", "Music", "folder", "song1.mp3"));
  crate.addSong(local("Users", "bcollazo", "Music", "song2.mp3"));

  const subcrates = crate.getSubCrates();
  expect(subcrates.length).toBe(1);
  expect(subcrates[0].seratoFolder).toBe(
    local("Users", "bcollazo", "Music", "_Serato_")
  );
});

test("adding external song, only add relative path", () => {
  const subcrate = new seratojs.SubCrate(
    "CreatedSplit",
    extractMountpoint("/Volumes/EECS MIT/_Serato_"),
    "/Volumes/EECS MIT/_Serato_"
  );
  subcrate.addSong("/Volumes/EECS MIT/Folder/song.mp3");
  expect(subcrate._songPaths).toEqual(["Folder/song.mp3"]);
});

// ===== Subcrates
test("SubCrate: create, add songs, list crates, list songs", async () => {
  const subcrate = new seratojs.SubCrate(
    "ProgramaticallyCreatedSubCrate",
    extractMountpoint(TEST_SERATO_FOLDER),
    TEST_SERATO_FOLDER
  );
  subcrate.addSong("~/Music/song.mp3");
  subcrate.addSong("/Users/bcollazo/Music/second_song.mp3");
  await subcrate.save();

  const crates = await seratojs.listCrates([TEST_SERATO_FOLDER]);
  expect(crates.length).toBe(2);
  const songPaths = await subcrate.getSongPaths();
  expect(songPaths.length).toBe(2);
});

// ===== Read song lists
// test("read crate info", () => {
//   const crate = seratojs.listCratesSync([TEST_SERATO_FOLDER])[0];
//   const songs = crate.getSongPathsSync();
//   expect(crate.name).toBe("Serato Demo Tracks");
//   expect(songs).toEqual([
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\01 - House Track Serato House Starter Pack.mp3",
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\02 - House Track Serato House Starter Pack.mp3",
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\03 - House Track Serato House Starter Pack.mp3",
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\04 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\05 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
//     "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3",
//   ]);
// });

// test("async read song paths", async () => {
//   const crate = (await seratojs.listCrates([TEST_SERATO_FOLDER]))[0];
//   const songs = await crate.getSongPaths();
//   expect(crate.name).toBe("Serato Demo Tracks");
//   expect(songs).toEqual([
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "01 - House Track Serato House Starter Pack.mp3"
//     ),
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "02 - House Track Serato House Starter Pack.mp3"
//     ),
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "03 - House Track Serato House Starter Pack.mp3"
//     ),
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "04 - Hip Hop Track Serato Hip Hop Starter Pack.mp3"
//     ),
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "05 - Hip Hop Track Serato Hip Hop Starter Pack.mp3"
//     ),
//     local(
//       "Users",
//       "bcollazo",
//       "Music",
//       "_Serato_",
//       "Imported",
//       "Serato Demo Tracks",
//       "06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3"
//     ),
//   ]);
// });

test("weird names dont break crate creation", async () => {
  const newCrate = new seratojs.Crate(
    "2000-2010 HipHáp / Reggaeton!?",
    TEST_SERATO_FOLDER
  );
  await newCrate.save();
});
