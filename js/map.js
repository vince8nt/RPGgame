var c = document.getElementById("gameContainer");
var ctx = c.getContext("2d");
// pixelate canvas
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

class Tileset {
	constructor(imageSrc, fileSrc) {
		this.imageLoaded = false;
		this.tileImage;
		this.tileData = [];
		this.width = -1;
		this.height = -1;
		this.maxTileNum = -1;
		this.tileSize = -1;
		this.loadImage(imageSrc);
		this.loadData(fileSrc);
	}
	loadImage(imageSrc) {
		this.tileImage = new Image();
		var ts = this;
		this.tileImage.onload = function(){
		    ts.imageLoaded = true;
		    console.log("Tileset: tileImage loaded: " + imageSrc);
		};
		this.tileImage.src = imageSrc;
	}
	loadData(fileSrc) {
		var ts = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    ts.parseData(this.responseText);
		    console.log("Tileset: tileData loaded: " + fileSrc);
		};
		req.open('GET', fileSrc);
		req.send();
	}
	parseData(dataString) {
		var stringArr = dataString.match(/[^\s]+/g);
		this.width = parseInt(stringArr[0]);
		this.height = parseInt(stringArr[1]);
		this.maxTileNum = this.width * this.height - 1;
		this.tileSize = parseInt(stringArr[2]);
		this.tileData = [];
		for (var y = 0; y < this.height; y++) {
			var tempRow = [];
			for (var x = 0; x < this.width; x++) {
				tempRow.push(parseInt(stringArr[3 + 32 * y + x]));
			}
			this.tileData.push(tempRow);
		}
	}
	drawTile(context, tileNum, x, y, size) {
		if(0 <= tileNum && tileNum <= this.maxTileNum) {
			var tileX = tileNum % this.width;
			var tileY = Math.floor(tileNum / this.width);
			var tileSize = this.tileSize;
			var imgX = tileX * tileSize;
			var imgY = tileY * tileSize;
			context.drawImage(this.tileImage, imgX, imgY, tileSize, tileSize, x, y, size, size);
		}
	}
	isLoaded() {
		return this.imageLoaded && this.maxTileNum != -1;
	}
}

class Chunk {
	constructor(tileset, data) {
		this.bottomImg = new Image();
		this.topImg = new Image();
		this.renderBottom(tileset, data[0]);
		this.renderTop(tileset, data[1]);
	}
	renderBottom(tileset, bottomData) {
		const canvas = new OffscreenCanvas(512, 512);
		const context = canvas.getContext('2d');
		for (var y = 0; y < 32; y++) {
			for (var x = 0; x < 32; x++)
				tileset.drawTile(context, bottomData[y][x], x * 16, y * 16, 16);
		}
		// would like to make it push an image instead, but causes security probem
		this.bottomImg = canvas;
	}
	renderTop(tileset, topData) {
		this.topImg = [];
		for (var y = 0; y < 32; y++) {
			const canvas = new OffscreenCanvas(512, 16);
			const context = canvas.getContext('2d');
			for (var x = 0; x < 32; x++)
				tileset.drawTile(context, topData[y][x], x * 16, 0, 16);
			// would like to make it push an image instead, but causes security probem
			this.topImg.push(canvas);
		}
	}
	draw(context, x, y, size) { // temporary function
		context.drawImage(this.bottomImg, x, y, size * 32, size * 32);
		for (var j = 0; j < 32; j++)
			context.drawImage(this.topImg[j], x, y + j * size, size * 32, size);
	}
}

class ChunkMap {
	constructor(fileSrc) {
		this.mapWidth = -1;
		this.mapHeight = -1;
		this.map = [];
		this.chunkBottoms = [];
		this.chunkTops = [];
		this.length = 0;
		this.numChunks = 0;
		this.loadMap(fileSrc);
	}
	loadMap(fileSrc) {
		var cm = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    cm.parseMap(this.responseText);
		    console.log("ChunkMap: map loaded: " + fileSrc);
		};
		req.open('GET', fileSrc);
		req.send();
	}
	parseMap(mapString) {
		var stringArr = mapString.match(/[^\s]+/g);
		this.mapWidth = parseInt(stringArr[0]);
		this.mapHeight = parseInt(stringArr[1]);
		this.map = [];
		for (var y = 0; y < this.mapHeight; y++) {
			var tempRow = [];
			for (var x = 0; x < this.mapWidth; x++) {
				tempRow.push(parseInt(stringArr[2 + this.mapWidth * y + x]));
			}
			this.map.push(tempRow);
		}
		console.log("ChunkMap: map is: " + this.map.length + "x" + this.map[0].length);
	}
	loadChunkData(fileSrc) {
		var index = this.length++;
		var cm = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    cm.parseChunkData(this.responseText, index);
		    console.log("ChunkMap: chunk " + index + " data loaded: " + fileSrc);
		};
		req.open('GET', fileSrc);
		req.send();
	}
	parseChunkData(chunkString, index) {
		var stringArr = chunkString.match(/[^\s]+/g);
		var tempChunkBottom = [];
		var tempChunkTop = [];
		for (var y = 0; y < 32; y++) {
			var tempRowBottom = [];
			var tempRowTop = [];
			for (var x = 0; x < 32; x++) {
				tempRowBottom.push(parseInt(stringArr[32 * y + x]));
				tempRowTop.push(parseInt(stringArr[32 * y + x + 1024]));
			}
			tempChunkBottom.push(tempRowBottom);
			tempChunkTop.push(tempRowTop);
		}
		this.chunkBottoms[index] = tempChunkBottom;
		this.chunkTops[index] = tempChunkTop;
		this.numChunks++;
	}
	getChunkData(x, y) {
		const index = this.map[y][x];
		return [this.chunkBottoms[index], this.chunkTops[index]];
	}
	isLoaded() {
		return this.numChunks == this.length && this.mapWidth != -1;
	}
}

class ChunkDisplay { // change this for later
	constructor(context, map, size, tileset) {
		this.chunkTopLeft = new Chunk(tileset, map.getChunkData(0, 0));
		this.chunkTopRight = new Chunk(tileset, map.getChunkData(1, 0));
		this.chunkBottomLeft = new Chunk(tileset, map.getChunkData(0, 1));
		this.chunkBottomRight = new Chunk(tileset, map.getChunkData(1, 1));
		this.map = map;
		this.size = size;
		this.tileset = tileset;
		this.context = context;
	}
	draw(x, y) {
		this.context.clearRect(0, 0, c.width, c.height);
		this.chunkTopLeft.draw(this.context, x, y, this.size);
		this.chunkTopRight.draw(this.context, x + 32 * this.size, y, this.size);
		this.chunkBottomLeft.draw(this.context, x, y + 32 * this.size, this.size);
		this.chunkBottomRight.draw(this.context, x + 32 * this.size, y + 32 * this.size, this.size);
	}
}

var keysDown = [];
for (var i = 0; i < 256; i++)
	keysDown[i] = false;
document.addEventListener("keydown", function(event) {
	keysDown[event.keyCode] = true;
});
document.addEventListener("keyup", function(event) {
	keysDown[event.keyCode] = false;
});


// -------------------------------------------------------------------------------------------

// load files
myChunkMap = new ChunkMap("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunkMap");

myChunkMap.loadChunkData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunks/empty");
myChunkMap.loadChunkData("https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/chunks/test");


myTileset = new Tileset(
	"images/tileset.png", "https://raw.githubusercontent.com/vince8nt/RPGgame/master/gameData/tileData");

var myChunkDisplay;
setTimeout(waitForLoad, 100, 0, 0);

function waitForLoad() {
	if (myTileset.isLoaded() && myChunkMap.isLoaded()) {
		console.log("all files loaded: starting game")
		myChunkDisplay = new ChunkDisplay(ctx, myChunkMap, 32, myTileset);
		myChunkDisplay.draw(0, 0);
		setTimeout(moveLoop, 0, 0, 0);
	}
	else {
		console.log("not all files loaded: trying again in 1 second...")
		setTimeout(waitForLoad, 1000, 0, 0);
	}
}

function moveLoop(x, y) {
	var d = new Date();
	if (keysDown[37] || keysDown[65]) {          // 'leftArrow' or 'a'
		moveX(y, x, x + 32, d.getTime(), 100);
	}
	else if (keysDown[38] || keysDown[87]) {     // 'upArrow' or 'w'
		moveY(x, y, y + 32, d.getTime(), 100);
	}
	else if (keysDown[39] || keysDown[68]) {     // 'rightArrow' or 'd'
		moveX(y, x, x - 32, d.getTime(), 100);
	}
	else if (keysDown[40] || keysDown[83]) {     // 'downArrow' or 's'
		moveY(x, y, y - 32, d.getTime(), 100);
	}
	else {
		setTimeout(moveLoop, 0, x, y);
	}
}

function moveX(y, xBegin, xEnd, beginTime, moveTime) {
	var d = new Date();
	moveProgress = (d.getTime() - beginTime) / moveTime;
	if (moveProgress >= 1) { // finish move
		myChunkDisplay.draw(xEnd, y);
		setTimeout(moveLoop, 0, xEnd, y);
	}
	else { // move part way
		var x = xBegin + (xEnd - xBegin) * moveProgress;
		myChunkDisplay.draw(x, y);
		setTimeout(moveX, 0, y, xBegin, xEnd, beginTime, moveTime);
	}
}

function moveY(x, yBegin, yEnd, beginTime, moveTime) {
	var d = new Date();
	moveProgress = (d.getTime() - beginTime) / moveTime;
	if (moveProgress >= 1) { // finish move
		myChunkDisplay.draw(x, yEnd);
		setTimeout(moveLoop, 0, x, yEnd);
	}
	else { // move part way
		var y = yBegin + (yEnd - yBegin) * moveProgress;
		myChunkDisplay.draw(x, y);
		setTimeout(moveY, 0, x, yBegin, yEnd, beginTime, moveTime);
	}
}


















