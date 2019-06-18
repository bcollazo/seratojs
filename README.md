# seratojs

Manage Serato Crates Programatically in NodeJS.

## Installing

```
npm install seratojs
```

## Usage

```javascript
const seratojs = require("seratojs");

// List all crates defined by user.
const crates = seratojs.listCratesSync();
console.log(crates);

// List all song filepaths in a given crate.
const crate = crates[0];
const songs = crate.getSongPaths();
console.log(songs);

// Create a crate
const newCrate = new seratojs.Crate("ProgramaticallyCreatedCrate");
newCrate.addSong("Users/bcollazo/Music/song.mp3");
newCrate.addSong("C:\\Users\\bcollazo\\Music\\second_song.mp3");
newCrate.save();
```

## Notes

This package is still under development. Has only been tested in Windows. Still TODO:

- Async version of all methods.
- Tests without modifying user's environment.
