const fs = require("fs");
const util = require("util");
const os = require("os");
const path = require("path");

const drivelist = require("drivelist");

const {
  parse,
  toSeratoString,
  intToHexbin,
  sanitizeFilename,
  isWindows,
  extractMountpoint,
} = require("./util");

// Singleton for Serato Folder Path
const DEFAULT_SERATO_FOLDER = path.join(os.homedir(), "Music", "_Serato_");

function getSeratoFolder(driveMountpoint) {
  if (
    (isWindows() && driveMountpoint === "C:\\") ||
    (!isWindows() && driveMountpoint === "/")
  ) {
    return DEFAULT_SERATO_FOLDER;
  } else {
    return path.join(driveMountpoint, "_Serato_");
  }
}

function getSubcratesFolder(seratoFolder) {
  return path.join(seratoFolder, "SubCrates");
}

/**
 * For each Serato Folder location, collect crates and returns a list
 * of all of these.
 */
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

class SubCrate {
  constructor(name, drive, opt_seratoFolder) {
    this.name = sanitizeFilename(name);
    this.filename = this.name + ".crate";

    this.drive = drive;
    this.seratoFolder = opt_seratoFolder || getSeratoFolder(this.drive);
    this.subcrateFolder = getSubcratesFolder(this.seratoFolder);
    this.filepath = path.join(this.subcrateFolder, this.filename);

    this._songPaths = []; // will contain relative paths w.r.t device root
    console.log("Creating subcrate:", name, drive, this);
  }

  // TODO: static?
  async load() {
    const contents = await util.promisify(fs.readFile)(this.filepath, "ascii");
    return parse(contents);
  }

  addSong(absolutePath) {
    const relativeToRoot = path.relative(this.drive, absolutePath);
    // const songPathWithoutDrive = isWindows()
    //   ? absoluteSongPath.substring(3) // remove the C:\ or D:\ or ...
    //   : absoluteSongPath;
    this._songPaths.push(relativeToRoot);
  }

  // TODO: Absolute?
  async getSongPaths() {
    return this._songPaths;
  }

  _buildSaveBuffer() {
    const header = "vrsn   8 1 . 0 / S e r a t o   S c r a t c h L i v e   C r a t e".replace(
      / /g,
      "\0"
    );

    let playlistSection = "";
    if (this._songPaths) {
      this._songPaths.forEach((songPath) => {
        const data = toSeratoString(songPath);
        let ptrkSize = intToHexbin(data.length);
        let otrkSize = intToHexbin(data.length + 8); // fixing the +8 (4 for 'ptrk', 4 for ptrkSize)
        playlistSection += "otrk" + otrkSize + "ptrk" + ptrkSize + data;
      });
    }

    const contents = header + playlistSection;
    return Buffer.from(contents, "ascii");
  }

  async save() {
    const buffer = this._buildSaveBuffer();
    return util.promisify(fs.writeFile)(this.filepath, buffer, {
      encoding: null,
    });
  }
}

class Crate {
  /**
   * Creates a crate. Internally these are composed of "SubCrates",
   * one for each device participating in crate.
   */
  constructor(name) {
    // TODO: Use Typescript and make private
    this.name = sanitizeFilename(name);
    this._subcrates = new Map();
  }

  /**
   * Adds song to corresponding SubCrate. If not exists, creates one.
   * @param {*} songPath
   */
  addSong(songPath) {
    const absolutePath = path.resolve(songPath);

    // Find drive corresponding to this song.
    const mountpoint = extractMountpoint(absolutePath);
    if (!this._subcrates.has(mountpoint)) {
      this._subcrates.set(mountpoint, new SubCrate(this.name, mountpoint));
    }

    const subcrate = this._subcrates.get(mountpoint);
    subcrate.addSong(absolutePath);
  }

  /**
   * The union of all the subcrates' songs.
   */
  async getSongPaths() {
    const songs = [];
    for (const subcrate of this.getSubCrates()) {
      songs.push(...subcrate.getSongPaths());
    }
    return songs;
  }

  getSubCrates() {
    return Array.from(this._subcrates.values());
  }

  async save() {
    for (const subcrate of this.getSubCrates()) {
      await subcrate.save();
    }
  }
}

const seratojs = {
  Crate: Crate,
  SubCrate: SubCrate,
  listCrates: listCrates,
};

module.exports = seratojs;
