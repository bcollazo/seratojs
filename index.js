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
const DEFAULT_SERATO_FOLDER = path.join(os.homedir(), "Music", "_Serato_");

function getSubcratesFolder(seratoFolder) {
  return path.join(seratoFolder, "SubCrates");
}

/**
 * For each Serato Folder location, collect crates and returns a list
 * of all of these.
 */
function listCratesSync(seratoFolders = [DEFAULT_SERATO_FOLDER]) {
  const allCrates = [];
  seratoFolders.forEach((seratoFolder) => {
    const subcratesFolder = getSubcratesFolder(seratoFolder);
    const crates = fs.readdirSync(subcratesFolder).map((x) => {
      const name = path.basename(x, ".crate");
      return new Crate(name, seratoFolder);
    });
    allCrates.push(...crates);
  });
  return allCrates;
}

async function listCrates(seratoFolders = [DEFAULT_SERATO_FOLDER]) {
  const allCrates = [];
  for (const seratoFolder of seratoFolders) {
    const subcratesFolder = getSubcratesFolder(seratoFolder);
    const files = await util.promisify(fs.readdir)(subcratesFolder);
    const crates = files.map((x) => {
      const name = path.basename(x, ".crate");
      return new Crate(name, seratoFolder);
    });
    allCrates.push(...crates);
  }
  return allCrates;
}

class Crate {
  /**
   * Serato saves crates in all the drives from which songs
   * in the crate come from. When you create a seratojs.Crate
   * it assumes we are dealing with a Music-folder-main-drive crate.
   *
   * You can "fix" this crate to represent a particular crate in
   * one particular Serato folder; in which case saving will use
   * that location only. You are responsible for adding songs
   * compatible with that drive. This is what we call 'location-aware'
   * crates.
   */
  constructor(name, seratoFolder) {
    // TODO: Make private
    this.name = sanitizeFilename(name);
    this.filename = this.name + ".crate";
    this.songPaths = [];

    this.seratoFolder = seratoFolder;
    // At creation? At saving? At reading?
    // this.filepath = path.join(subcratesFolder, this.name + ".crate");
  }

  /**
   * Returns the Serato directories where this will be saved.
   */
  getSaveLocations() {
    if (this.seratoFolder) {
      return [this.seratoFolder]; // if specified at construction use this only.
    }

    if (this.songPaths.length === 0) {
      return [DEFAULT_SERATO_FOLDER];
    }

    const roots = new Set();
    for (const songPath of this.songPaths) {
      roots.add(path.parse(songPath).root);
    }
    return Array.from(roots).map((root) => {
      if (root === "C:\\") {
        return DEFAULT_SERATO_FOLDER;
      } else {
        return path.join(root, "_Serato_");
      }
    });
  }

  async getSongPaths() {
    const filepath = this._buildCrateFilepath(
      this.seratoFolder || DEFAULT_SERATO_FOLDER
    );
    const contents = await util.promisify(fs.readFile)(filepath, "ascii");
    return parse(contents);
  }

  getSongPathsSync() {
    const filepath = this._buildCrateFilepath(
      this.seratoFolder || DEFAULT_SERATO_FOLDER
    );
    const contents = fs.readFileSync(filepath, "ascii");
    return parse(contents);
  }

  addSong(songPath) {
    if (this.songPaths === null) {
      this.songPaths = [];
    }

    const resolved = path.resolve(songPath);
    this.songPaths.push(resolved);
  }

  _buildCrateFilepath(seratoFolder) {
    const subcrateFolder = getSubcratesFolder(seratoFolder);
    const filepath = path.join(subcrateFolder, this.filename);
    return filepath;
  }
  _buildSaveBuffer() {
    const header = "vrsn   8 1 . 0 / S e r a t o   S c r a t c h L i v e   C r a t e".replace(
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
    for (const seratoFolder of this.getSaveLocations()) {
      const filepath = this._buildCrateFilepath(seratoFolder);
      const buffer = this._buildSaveBuffer();
      return util.promisify(fs.writeFile)(filepath, buffer, {
        encoding: null,
      });
    }
  }
  saveSync() {
    for (const seratoFolder of this.getSaveLocations()) {
      const filepath = this._buildCrateFilepath(seratoFolder);
      const buffer = this._buildSaveBuffer();
      fs.writeFileSync(filepath, buffer, { encoding: null });
    }
  }
}

const seratojs = {
  Crate: Crate,
  listCratesSync: listCratesSync,
  listCrates: listCrates,
};

module.exports = seratojs;
