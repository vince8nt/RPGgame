var c = document.getElementById("gameContainer");
var ctx = c.getContext("2d");
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

class Tileset {
	constructor(imageSrc, width, height, tileSize) {
		this.loaded = false;
		this.tileset = new Image();
		var ts = this;
		this.tileset.onload = function(){
			console.log("Tileset: " + imageSrc + " loaded");
		    ts.loaded = true;
		};
		this.tileset.src = imageSrc;
		this.width = width;
		this.height = height;
		this.maxTileNum = width * height - 1;
		this.tileSize = tileSize;
	}
	drawTile(context, tileNum, x, y, size) {
		if(0 <= tileNum && tileNum <= this.maxTileNum) {
			var tileX = tileNum % this.width;
			var tileY = Math.floor(tileNum / this.width);
			var tileSize = this.tileSize;
			var imgX = tileX * tileSize;
			var imgY = tileY * tileSize;
			context.drawImage(this.tileset, imgX, imgY, tileSize, tileSize, x, y, size, size);
		}
	}
	isLoaded() {
		return this.loaded;
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
		context.clearRect(0, 0, c.width, c.height);
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
				tempRow.push(parseInt(stringArr[2 + 32 * y + x]));
			}
			this.map.push(tempRow);
		}
	}
	loadChunk(fileSrc) { // currently chunks need to be loaded in order
		var cm = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    cm.parseChunk(this.responseText);
		    console.log("ChunkMap: chunk " + cm.chunkTops.length + " loaded: " + fileSrc);
		};
		req.open('GET', fileSrc);
		req.send();
		this.length++;
	}
	parseChunk(chunkString) {
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
		this.chunkBottoms.push(tempChunkBottom);
		this.chunkTops.push(tempChunkTop);
	}
	getChunkData(index) {
		return [this.chunkBottoms[index], this.chunkTops[index]];
	}
	isLoaded() {
		return this.chunkTops.length == this.length && this.mapWidth != -1;
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

myChunkMap = new ChunkMap("https://raw.githubusercontent.com/vince8nt/RPGgame/master/chunks/chunkMap");
myChunkMap.loadChunk("https://raw.githubusercontent.com/vince8nt/RPGgame/master/chunks/test");
myTileset = new Tileset("images/tileset.png", 16, 16, 16);
var testChunk;
setTimeout(waitForLoad, 100, 0, 0);

function waitForLoad() {
	if (myTileset.isLoaded() && myChunkMap.isLoaded()) {
		console.log("all files loaded: starting game")
		testChunk = new Chunk(myTileset, myChunkMap.getChunkData(0));
		testChunk.draw(ctx, 0, 0, 16);
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
		testChunk.draw(ctx, xEnd, y, 16);
		setTimeout(moveLoop, 0, xEnd, y);
	}
	else { // move part way
		var x = xBegin + (xEnd - xBegin) * moveProgress;
		testChunk.draw(ctx, x, y, 16);
		setTimeout(moveX, 0, y, xBegin, xEnd, beginTime, moveTime);
	}
}

function moveY(x, yBegin, yEnd, beginTime, moveTime) {
	var d = new Date();
	moveProgress = (d.getTime() - beginTime) / moveTime;
	if (moveProgress >= 1) { // finish move
		testChunk.draw(ctx, x, yEnd, 16);
		setTimeout(moveLoop, 0, x, yEnd);
	}
	else { // move part way
		var y = yBegin + (yEnd - yBegin) * moveProgress;
		testChunk.draw(ctx, x, y, 16);
		setTimeout(moveY, 0, x, yBegin, yEnd, beginTime, moveTime);
	}
}


















