const path = require("path");
const fs = require("fs");

const seratojs = require("./index");

const TEST_SUBCRATES_FOLDER = path.join(".", "TestSubcrates");

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
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3"
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
    "C:\\Users\\bcollazo\\Music\\_Serato_\\Imported\\Serato Demo Tracks\\06 - Hip Hop Track Serato Hip Hop Starter Pack.mp3"
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
