const path = require("path");
const seratojs = require("./index");

// console.log(seratojs);

// const crate = new seratojs.Crate("Both2");
// // const crate = new seratojs.Crate("Both2", "/Volumes/EECS MIT/_Serato_");
// const songs = crate.getSongPathsSync();
// console.log(songs);

// const newCrateLocal = new seratojs.Crate("CreatedSplit");
// newCrateLocal.addSong(
//   "/Users/bcollazo/Desktop/MyMusic/Kaskade ft Dani Poppitt - Love Like That (Clean Extended).mp3"
// );
// newCrateLocal.addSong(
//   "/Users/bcollazo/Desktop/MyMusic/Hayden James & Icona Pop - Right Time (Clean).mp3"
// );
// console.log(newCrateLocal.getSaveLocations());
// // newCrateLocal.saveSync();

// const newCrateExternal = new seratojs.Crate(
//   "CreatedSplit",
//   "/Volumes/EECS MIT/_Serato_"
// );
// newCrateExternal.addSong(
//   "/Croatia Squad-The D Machine (Original Mix) www.myfreemp3.space .mp3"
// );
// console.log(newCrateExternal.getSaveLocations());
// // newCrateExternal.saveSync();

// const drivelist = require("drivelist");
// (async function () {
//   const drives = await drivelist.list();
//   console.log(JSON.stringify(drives, null, 2));
// })();

console.log(path.parse("/Volumes/EECS MIT/_Serato_/song.mp3"));
