const fs = require("fs");
const util = require("util");
const os = require("os");
const path = require("path");

const {
  parse,
  toSeratoString,
  intToHexbin,
  sanitizeFilename,
} = require("./util");

// Singleton for Serato Folder Path (I doubt it'll change during runtime)
const SERATO_FOLDER = path.join(os.homedir(), "Music", "_Serato_");
const CRATES_FOLDER = path.join(SERATO_FOLDER, "SubCrates");

function listCratesSync(subcratesFolder = CRATES_FOLDER) {
  const crates = fs.readdirSync(subcratesFolder).map((x) => {
    const name = path.basename(x, ".crate");
    return new Crate(name, subcratesFolder);
  });
  return crates;
}

async function listCrates(subcratesFolder) {
  const files = await util.promisify(fs.readdir)(subcratesFolder);
  const crates = files.map((x) => {
    const name = path.basename(x, ".crate");
    return new Crate(name, subcratesFolder);
  });
  return crates;
}

class Crate {
  constructor(name, subcratesFolder = CRATES_FOLDER) {
    // TODO: Make private
    this.name = sanitizeFilename(name);
    this.filepath = path.join(subcratesFolder, this.name + ".crate");
    this.songPaths = null; // singleton to be lazy-populated
  }
  async getSongPaths() {
    if (this.songPaths === null) {
      const contents = await util.promisify(fs.readFile)(
        this.filepath,
        "ascii"
      );
      this.songPaths = parse(contents);
    }
    return Promise.resolve(this.songPaths);
  }
  getSongPathsSync() {
    if (this.songPaths === null) {
      this.songPaths = parse(fs.readFileSync(this.filepath, "ascii"));
    }
    return this.songPaths;
  }
  addSong(songPath) {
    if (this.songPaths === null) {
      this.songPaths = [];
    }

    const resolved = path.resolve(songPath);
    this.songPaths.push(resolved);
  }
  _buildSaveBuffer() {
    const header =
      "vrsn   8 1 . 0 / S e r a t o   S c r a t c h L i v e   C r a t e".replace(
        / /g,
        "\0"
      );

    let playlistSection = "";
    if (this.songPaths) {
      this.songPaths.forEach((value) => {
        const data = toSeratoString(path.relative("/", value));
        let ptrkSize = intToHexbin(data.length);
        let otrkSize = intToHexbin(data.length + 8); // fixing the +8 (4 for 'ptrk', 4 for ptrkSize)
        playlistSection += "otrk" + otrkSize + "ptrk" + ptrkSize + data;
      });
    }

    const contents = header + playlistSection;
    return Buffer.from(contents, "ascii");
  }
  async save() {
    // TODO: ENSURE FOLDER EXISTS
    await util.promisify(fs.mkdir)(path.dirname(this.filepath), {
      recursive: true,
    });

    const buffer = this._buildSaveBuffer();
    return util.promisify(fs.writeFile)(this.filepath, buffer, {
      encoding: null,
    });
  }
  saveSync() {
    fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
    const buffer = this._buildSaveBuffer();
    fs.writeFileSync(this.filepath, buffer, { encoding: null });
  }
}

const seratojs = {
  Crate: Crate,
  listCratesSync: listCratesSync,
  listCrates: listCrates,
};

module.exports = seratojs;
