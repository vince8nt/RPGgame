var c = document.getElementById("gameContainer");
var ctx = c.getContext("2d");
// pixelate canvas
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// keep track of which keys are pressed
var keysDown = [];
for (var i = 0; i < 256; i++)
	keysDown[i] = false;
document.addEventListener("keydown", function(event) {
	keysDown[event.keyCode] = true;
});
document.addEventListener("keyup", function(event) {
	keysDown[event.keyCode] = false;
});

// load files
myTileset = new Tileset(
	"images/tileset.png", "https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/tileData");

myChunkMap = new ChunkMap("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunkMap");

myChunkMap.loadChunkData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunks/empty");
myChunkMap.loadChunkData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunks/test");

myChunkMap.loadNpcData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunkNPCs/empty");
myChunkMap.loadNpcData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunkNPCs/test");


var myChunkDisplay;
var drawSize;
ctx.fillStyle = "#FF0000";
setTimeout(waitForLoad, 100, 0, 0);

// wait for all files to be loaded and then start the game
function waitForLoad() {
	if (myTileset.isLoaded() && myChunkMap.isLoaded()) {
		console.log("all files loaded: starting game");
		setTimeout(startGame, 0);
	}
	else {
		console.log("not all files loaded: trying again in 1 second...");
		setTimeout(waitForLoad, 1000, 0, 0);
	}
}