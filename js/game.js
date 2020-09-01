var c = document.getElementById("gameContainer");
var ctx = c.getContext("2d");
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

class Tileset {
	constructor(context, imageSrc, width, height, tileSize) {
		this.context = context;
		this.tileset = new Image();
		this.tileset.src = imageSrc;
		this.width = width;
		this.height = height;
		this.tileSize = tileSize;
	}
	drawTile(tileNum, x, y, size) {
		var tileX = tileNum % this.width;
		var tileY = Math.floor(tileNum / this.width);
		var tileSize = this.tileSize;
		var imgX = tileX * tileSize;
		var imgY = tileY * tileSize;
		this.context.drawImage(this.tileset, imgX, imgY, tileSize, tileSize, x, y, size, size);
	}
	drawChunk(chunk, x, y, size) {
		for (var j = 0; j < 32; j++) {
			for (var i = 0; i < 32; i++) {
				this.drawTile(chunk[i][j], x + i * size, y + j * size, size);
			}
		}
	}
}

class ChunkMap {
	constructor() {
		this.chunks = [];
	}
	loadChunk(fileSrc) {
		var cm = this;
		var req = new XMLHttpRequest();
		req.onload = function(){
		    cm.parseChunk(this.responseText);
		};
		req.open('GET', fileSrc);
		req.send();
	}
	parseChunk(chunkString) {
		var stringArr = chunkString.match(/[^\s]+/g);
		var tempChunk = [];
		for (var i = 0; i < 32; i++) {
			var tempRow = [];
			for (var j = 0; j < 32; j++)
				tempRow.push(stringArr[32 * i + j]);
			tempChunk.push(tempRow);
		}
		this.chunks.push(tempChunk);
	}
	getChunk(index) {
		return this.chunks[index];
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

myTileset = new Tileset(ctx, "images/tileset.png", 16, 16, 16);
setTimeout(moveLoop, 100, 0, 0);

function testDraw(x, y) {
	ctx.clearRect(0, 0, c.width, c.height);
	myTileset.drawChunk(myChunkMap.getChunk(0), x, y, 32);
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
		testDraw(xEnd, y);
		setTimeout(moveLoop, 0, xEnd, y);
	}
	else { // move part way
		var x = xBegin + (xEnd - xBegin) * moveProgress;
		testDraw(x, y);
		setTimeout(moveX, 0, y, xBegin, xEnd, beginTime, moveTime);
	}
}

function moveY(x, yBegin, yEnd, beginTime, moveTime) {
	var d = new Date();
	moveProgress = (d.getTime() - beginTime) / moveTime;
	if (moveProgress >= 1) { // finish move
		testDraw(x, yEnd);
		setTimeout(moveLoop, 0, x, yEnd);
	}
	else { // move part way
		var y = yBegin + (yEnd - yBegin) * moveProgress;
		testDraw(x, y);
		setTimeout(moveY, 0, x, yBegin, yEnd, beginTime, moveTime);
	}
}


















