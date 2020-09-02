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





