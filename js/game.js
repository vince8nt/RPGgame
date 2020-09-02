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
			console.log("tileset loaded");
		    ts.loaded = true;
		};
		this.tileset.src = imageSrc;
		this.width = width;
		this.height = height;
		this.tileSize = tileSize;
	}
	drawTile(context, tileNum, x, y, size) {
		var tileX = tileNum % this.width;
		var tileY = Math.floor(tileNum / this.width);
		var tileSize = this.tileSize;
		var imgX = tileX * tileSize;
		var imgY = tileY * tileSize;
		context.drawImage(this.tileset, imgX, imgY, tileSize, tileSize, x, y, size, size);
	}
	isLoaded() {
		return this.loaded;
	}
}

class Chunk {
	constructor(tileset, data) {
		this.bottomImg;
		this.topImg;
		console.log("new chunk made:");
		console.log(data);
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
		this.bottomImg = context.getImageData(0, 0, 512, 512);
	}
	renderTop(tileset, topData) {
		this.topImg = [];
		for (var y = 0; y < 32; y++) {
			const canvas = new OffscreenCanvas(512, 16);
			const context = canvas.getContext('2d');
			for (var x = 0; x < 32; x++)
				tileset.drawTile(context, topData[y][x], x * 16, 0, 16);
			this.topImg.push(context.getImageData(0, 0, 512, 16));
		}
	}
	draw(context, x, y, size) { // temporary function
		context.drawImage(this.bottomImg, x, y, size * 32, size * 32);
		for (var j = 0; j < 32; j++)
			context.drawImage(this.topImg[j], x, y + j * size, size * 32, size);
	}
}

class ChunkMap {
	constructor() {
		this.chunkBottoms = [];
		this.chunkTops = [];
		this.length = 0;
	}
	loadChunk(fileSrc) { // currently chunks need to be loaded in order
		var cm = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    cm.parseChunk(this.responseText);
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
	getChunk(index) {
		return [this.chunkBottoms[index], this.chunkTops[index]];
	}
	isLoaded() {
		return this.chunkTops.length == this.length;
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

myChunkMap = new ChunkMap();
myChunkMap.loadChunk("https://raw.githubusercontent.com/vince8nt/RPGgame/master/chunks/test");
myTileset = new Tileset("images/tileset.png", 16, 16, 16);
var testChunk;
setTimeout(waitForLoad, 100, 0, 0);

function waitForLoad() {
	if (myTileset.isLoaded() && myChunkMap.isLoaded()) {
		testChunk = new Chunk(myTileset, myChunkMap.getChunk(0));
		setTimeout(moveLoop, 0, 0, 0);
	}
	else
		setTimeout(waitForLoad, 500, 0, 0);
}

function moveLoop(x, y) {
	var d = new Date();
	if (keysDown[37] || keysDown[65]) {          // left arrow
		moveX(y, x, x + 32, d.getTime(), 100);
	}
	else if (keysDown[38] || keysDown[87]) {     // up arrow
		moveY(x, y, y + 32, d.getTime(), 100);
	}
	else if (keysDown[39] || keysDown[68]) {     // right arrow
		moveX(y, x, x - 32, d.getTime(), 100);
	}
	else if (keysDown[40] || keysDown[83]) {     // down arrow
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
		testChunk.draw(ctx, xEnd, y, 32);
		setTimeout(moveLoop, 0, xEnd, y);
	}
	else { // move part way
		var x = xBegin + (xEnd - xBegin) * moveProgress;
		testChunk.draw(ctx, x, y, 32);
		setTimeout(moveX, 0, y, xBegin, xEnd, beginTime, moveTime);
	}
}

function moveY(x, yBegin, yEnd, beginTime, moveTime) {
	var d = new Date();
	moveProgress = (d.getTime() - beginTime) / moveTime;
	if (moveProgress >= 1) { // finish move
		testChunk.draw(ctx, x, yEnd, 32);
		setTimeout(moveLoop, 0, x, yEnd);
	}
	else { // move part way
		var y = yBegin + (yEnd - yBegin) * moveProgress;
		testChunk.draw(ctx, x, y, 32);
		setTimeout(moveY, 0, x, yBegin, yEnd, beginTime, moveTime);
	}
}


















