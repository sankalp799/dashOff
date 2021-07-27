let canvas = document.getElementById('DashCanvas');
let ctx = canvas.getContext('2d');
let gameWrapper = document.getElementById('gameWrapper');
let clearCanvasBtn = document.getElementById('clearCanvas');
let eraserBtn = document.getElementById('eraser');
let pen = document.getElementById('paintPen');
let colorPicker = document.getElementById('colorPicker');
let lineWidthRangeParam = document.getElementById('lineWidthRange');

let cursor_type = {
    _pen: 'url(public/pen.png), default',
    _eraser: 'url(public/eraser.png), default'
};


canvas.style.cursor = cursor_type._pen;
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);


let CANVAS_DATA = {
    x: 0,
    y: 0,
    x1: 0,
    y1: 0,
    lineWidth: 12,
    strokeColor: colorPicker.value,
    bgColor: 'white',
    turn: false,
    drawing: false
};

let setPrevCoords = (evt) => {
    CANVAS_DATA.x = evt.offsetX;
    CANVAS_DATA.y = evt.offsetY;
}

let setCurrCoords = (evt) => {
    CANVAS_DATA.x1 = evt.offsetX;
    CANVAS_DATA.y1 = evt.offsetY;
}

ctx.lineWidth = CANVAS_DATA.lineWidth;
ctx.lineCap = 'round';
ctx.strokeStyle = CANVAS_DATA.strokeColor;

let sendCanvasUpdates = (type, data) => {
    // SHARE DRAWING WITH OTHER PLAYERS HERE
    if (CANVAS_DATA.turn) {
        let coords_msg = messageHandler.genMessage(type, { id: localStorage.getItem('roomId'), username: null }, data);
        sendRawToServer(coords_msg);
    }
}

let drawStroke = () => {
    ctx.lineWidth = CANVAS_DATA.lineWidth;
    ctx.strokeStyle = CANVAS_DATA.strokeColor;
    ctx.beginPath();
    ctx.moveTo(CANVAS_DATA.x, CANVAS_DATA.y);
    ctx.lineTo(CANVAS_DATA.x1, CANVAS_DATA.y1);
    ctx.stroke();


    sendCanvasUpdates(typeMessage.CANVAS._DRAW, CANVAS_DATA);
}

let startDrawing = (evt) => {
    if (CANVAS_DATA.turn) {
        setPrevCoords(evt);
        CANVAS_DATA.drawing = true;
    }
};

let keepDrawing = (evt) => {
    if (CANVAS_DATA.turn && CANVAS_DATA.drawing) {
        setCurrCoords(evt);
        drawStroke(evt);
        setPrevCoords(evt);
    }
};

let stopDrawing = (evt) => {
    if (CANVAS_DATA.turn && CANVAS_DATA.drawing) {
        setCurrCoords(evt);
        drawStroke(evt);
        setPrevCoords(evt);
        CANVAS_DATA.drawing = false;
    }
}

// erase or clear canvas
let clearCanvas = (state) => {
    console.log('clear-loop');
    ctx.lineWidth = CANVAS_DATA.lineWidth;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state) {
        sendCanvasUpdates(typeMessage.CANVAS._CLEAR, CANVAS_DATA);
    }
};

let erase = (evt) => {
    console.log('eraser-loop');
    canvas.style.cursor = cursor_type._eraser;
    ctx.lineWidth = CANVAS_DATA.lineWidth;
    CANVAS_DATA.strokeColor = CANVAS_DATA.bgColor;

    sendCanvasUpdates(typeMessage.CANVAS._ERASE, CANVAS_DATA);
}

let usePaintPen = () => {
    canvas.style.cursor = cursor_type._pen;
    CANVAS_DATA.strokeColor = colorPicker.value;
};

let setLineWidth = () => {
    CANVAS_DATA.lineWidth = lineWidthRangeParam.value;
};



// canvas event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', keepDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
eraserBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    erase();
});
clearCanvasBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    clearCanvas(true);
});
pen.addEventListener('click', (evt) => {
    evt.preventDefault();
    usePaintPen();
});
colorPicker.addEventListener('change', () => {
    CANVAS_DATA.strokeColor = colorPicker.value;
    canvas.style.cursor = cursor_type._pen;
});
lineWidthRangeParam.addEventListener('input', setLineWidth);