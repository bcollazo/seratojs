# seratojs

Manage Serato Crates Programatically in NodeJS.

## Installing

```
npm install seratojs
```

## Usage

```javascript
const seratojs = require("seratojs");

(async function () {
  // List all crates visible in Serato
  const crates = await seratojs.listCrates();
  console.log(crates);

  // List all song filepaths in a given crate.
  const crate = crates[0];
  const songs = await crate.getSongPaths();
  console.log(songs);

  // Create a crate
  const newCrate = new seratojs.Crate("ProgramaticallyCreatedCrate");
  await newCrate.addSong("/Users/bcollazo/Music/song.mp3");
  await newCrate.save();
})();
```

Adding songs from different drives will replicate Serato's behavior
of saving the crate in all drives participating in the crate.

```javascript
const crate = new seratojs.Crate("MyCrate");
crate.addSong("D:\\Music\\song1.mp3");
crate.addSong("C:\\Users\\bcollazo\\Music\\song2.mp3");
crate.saveSync(); // will save in D:\\_Serato_ and C:\\Users\\bcollazo\\Music\\_Serato_
```

## Notes

SeratoJS tries to sanitize crate name before creation. This is to allow crates named 'Some / Name' to be created without giving trouble. It will be created as 'Some - Name' instead.

### Migrating from 1.x to 2.x

- Change `crate.getSongPaths()` to `crate.getSongPathsSync()` or `await crate.getSongPaths()`.
- Change `newCrate.save()` to `newCrate.saveSync()` or `await newCrate.save()`.
