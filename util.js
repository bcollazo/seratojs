const path = require("path");

const INVALID_CHARACTERS_REGEX = /[^A-Za-z0-9_ ]/gi;

const parse = function(contents) {
  // Find all 'ptrk' ocurrances
  const indices = [];
  for (let i = 0; i < contents.length; i++) {
    if (contents.slice(i, i + 4) === "ptrk") {
      indices.push(i);
    }
  }

  // Content in between these indices are the songs
  const songs = [];
  indices.forEach((value, index) => {
    const start = value + 9; // + 9 to skip the 'ptrk' itself and the bytes for size
    const isLast = index === indices.length - 1;
    const end = isLast ? contents.length : indices[index + 1] - 8; // -8 to remove 'otrk' and size bytes

    let filepath = contents.slice(start, end);
    filepath = filepath.replace(/\0/g, ""); // remove null-termination bytes
    songs.push(path.resolve("/", filepath));
  });
  return songs;
};

const toSeratoString = function(string) {
  return "\0" + string.split("").join("\0");
};

const intToHexbin = function(number) {
  const hex = number.toString(16).padStart(8, "0");
  let ret = "";
  for (let idx of [0, 2, 4, 6]) {
    let bytestr = hex.slice(idx, idx + 2);
    ret += String.fromCodePoint(parseInt(bytestr, 16));
  }
  return ret;
};

const sanitizeFilename = function(filename) {
  return filename.replace(INVALID_CHARACTERS_REGEX, "-");
};

module.exports = {
  parse,
  toSeratoString,
  intToHexbin,
  sanitizeFilename
};
