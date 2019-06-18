var fs = require("fs");
const os = require("os");
const path = require("path");

// Singleton for Serato Folder Path (I doubt it'll change during runtime)
const SERATO_FOLDER = path.join(os.homedir(), "Music", "_Serato_");
const CRATES_FOLDER = path.join(SERATO_FOLDER, "SubCrates");

const parse = function(contents) {
  // Find all 'ptrk' ocurrances
  const indices = [];
  for (let i = 0; i < contents.length; i++) {
    if (contents.slice(i, i + 4) === "ptrk") {
      indices.push(i);
    }
  }
  console.log(contents);
  console.log(indices);

  // Content in between these indices are the songs
  const songs = [];
  indices.forEach((value, index) => {
    const start = value + 9; // + 9 to skip the 'ptrk' itself and the bytes for size
    const isLast = index === indices.length - 1;
    const end = isLast ? contents.length : indices[index + 1] - 8; // -8 to remove 'otrk' and size bytes

    let filepath = contents.slice(start, end);
    filepath = filepath.replace(/\0/g, ""); // remove null-termination bytes
    songs.push(path.resolve(filepath));
  });
  return songs;
};

class Crate {
  constructor(name) {
    // TODO: Make private
    this.filepath = path.join(CRATES_FOLDER, name + ".crate");
    this.name = name;
    this.songPaths = null;
  }
  getSongPaths() {
    if (this.songPaths === null) {
      this.songPaths = parse(fs.readFileSync(this.filepath, "ascii"));
    }
    return this.songPaths;
  }
}

const seratojs = {
  Crate: Crate,
  listCratesSync: function() {
    const crates = fs.readdirSync(CRATES_FOLDER).map(x => {
      const name = path.basename(x, ".crate");
      return new Crate(name);
    });
    return crates;
  }
};

module.exports = seratojs;
