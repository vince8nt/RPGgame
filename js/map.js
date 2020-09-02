
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
		var index = 0;
		if (0 <= x && x < this.mapWidth && 0 <= y && y < this.mapHeight)
			index = this.map[y][x];
		return [this.chunkBottoms[index], this.chunkTops[index]];
	}
	isLoaded() {
		return this.numChunks == this.length && this.mapWidth != -1;
	}
}

class ChunkDisplay {
	constructor(tileset, map, x, y) {
		this.cX = 512; // use these later
		this.cY = 256;

		this.tileset = tileset;
		this.map = map;

		// manually load the four chunks
		this.mapX = Math.round(x / 32) - 1;
		this.mapY = Math.round(y / 32) - 1;
		this.dispChunks = [[], []];
		this.dispChunks[0].push(new Chunk(tileset, map.getChunkData(this.mapX, this.mapY)));
		this.dispChunks[0].push(new Chunk(tileset, map.getChunkData(this.mapX + 1, this.mapY)));
		this.dispChunks[1].push(new Chunk(tileset, map.getChunkData(this.mapX, this.mapY + 1)));
		this.dispChunks[1].push(new Chunk(tileset, map.getChunkData(this.mapX + 1, this.mapY + 1)));
	}
	setMapCoords(x, y) {
		var newMapX = Math.round(x / 32) - 1;
		var newMapY = Math.round(y / 32) - 1;
		if (this.mapX != newMapX || this.mapY != newMapY) { // does nothing if no chunks need to be loaded
			if (this.mapX + 1 == newMapX && this.mapY == newMapY) { // scroll 1 chunk to the right
				console.log("ChunkDisplay: scrolling dispChunks right");
				this.dispChunks[0][0] = this.dispChunks[0][1];
				this.dispChunks[1][0] = this.dispChunks[1][1];
				this.dispChunks[0][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY));
				this.dispChunks[1][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY + 1));
			}
			else if (this.mapX - 1 == newMapX && this.mapY == newMapY) { // scroll 1 chunk to the left
				console.log("ChunkDisplay: scrolling dispChunks left");
				this.dispChunks[0][1] = this.dispChunks[0][0];
				this.dispChunks[1][1] = this.dispChunks[1][0];
				this.dispChunks[0][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY));
				this.dispChunks[1][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY + 1));
			}
			else if (this.mapX == newMapX && this.mapY + 1 == newMapY) { // scroll 1 chunk down
				console.log("ChunkDisplay: scrolling dispChunks down");
				this.dispChunks[0][0] = this.dispChunks[1][0];
				this.dispChunks[0][1] = this.dispChunks[1][1];
				this.dispChunks[1][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY + 1));
				this.dispChunks[1][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY + 1));
			}
			else if (this.mapX == newMapX && this.mapY - 1 == newMapY) { // scroll 1 chunk up
				console.log("ChunkDisplay: scrolling dispChunks up");
				this.dispChunks[1][0] = this.dispChunks[0][0];
				this.dispChunks[1][1] = this.dispChunks[0][1];
				this.dispChunks[0][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY));
				this.dispChunks[0][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY));
			}
			else { // reload all chunks
				console.log("ChunkDisplay: unable to scroll, reloading all chunks");
				this.dispChunks[0][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY));
				this.dispChunks[0][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY));
				this.dispChunks[1][0] = new Chunk(this.tileset, this.map.getChunkData(newMapX, newMapY + 1));
				this.dispChunks[1][1] = new Chunk(this.tileset, this.map.getChunkData(newMapX + 1, newMapY + 1));
			}
			this.mapX = newMapX;
			this.mapY = newMapY;
		}
	}
	draw(canvas, context, x, y, size) {
		this.setMapCoords(x, y);
		var dispChunksX = 1 - Math.round((x % 32) / 32);
		var dispChunksY = 1 - Math.round((y % 32) / 32);
		var tilesX = x % 32 + 32 * dispChunksX;
		var tilesY = y % 32 + 32 * dispChunksY;
		var drawX = this.cX - tilesX * size;
		var drawY = this.cY - tilesY * size;

		context.clearRect(0, 0, canvas.width, canvas.height);
		this.dispChunks[0][0].draw(context, drawX, drawY, size);
		this.dispChunks[0][1].draw(context, drawX + 32 * size, drawY, size);
		this.dispChunks[1][0].draw(context, drawX, drawY + 32 * size, size);
		this.dispChunks[1][1].draw(context, drawX + 32 * size, drawY + 32 * size, size);
	}
}

















