const path = require("path");

function externalPath(posixPath) {
  if (process.platform === "win32") {
    return path.resolve("D:\\", posixPath);
  } else if (process.platform === "darwin") {
    return path.resolve("/Volumes/SampleExternalHardDrive", posixPath);
  } else {
    throw new Error("Not Implemented");
  }
}

function localPath(posixPath) {
  if (process.platform === "win32") {
    return path.resolve("C:\\", posixPath);
  } else if (process.platform === "darwin") {
    return path.resolve("/", posixPath);
  } else {
    throw new Error("Not Implemented");
  }
}

module.exports = {
  externalPath,
  localPath,
};
