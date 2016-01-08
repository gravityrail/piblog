var touchscreen = require("pitft-touch");
var fb = require("pitft")("/dev/fb1", true); // run 'npm install pitft' in the example directory

var gui = {};

for (var y=0; y<4; y++) {
    for (var x=0; x<4; x++) {
        gui["button_" + (y * 4 + x)] = {
            "type": "button",
            "pos": [x * 80 + 5, y * 60 + 5],
            "size": [70, 50],
            "background_color": [0, 0, 1],
            "pressed_color": [1, 0, 1],
            "text": {
                "caption": "" + (y * 4 + x),
                "font": ["fantasy", 24, true],
                "color": [1, 1, 0]
            },
            "pressed": false
        }
    }
}

var drawElement = function(elementName) {
    var el = gui[elementName];

    if (el.pressed) {
        fb.color(el.pressed_color[0], el.pressed_color[1], el.pressed_color[2]);
    } else {
        fb.color(el.background_color[0], el.background_color[1], el.background_color[2]);
    }
    fb.rect(el.pos[0], el.pos[1], el.size[0], el.size[1], true);
    fb.color(el.text.color[0], el.text.color[1], el.text.color[2]);
    fb.font(el.text.font[0], el.text.font[1], el.text.font[2]);
    fb.text(el.pos[0] + el.size[0] / 2, el.pos[1] + el.size[1]/2, el.text.caption, true);
}

var getElementUnderCursor = function(x, y) {
    for (var elementName in gui) {
        if (gui.hasOwnProperty(elementName)) {
            var el = gui[elementName];
            if (x >= el.pos[0] && x < (el.pos[0] + el.size[0])) {
                if (y >= el.pos[1] && y < (el.pos[1] + el.size[1])) {
                    return elementName;
                }
            }
        }
    }

    return null;
}

fb.clear();
for (var element in gui) {
    if (gui.hasOwnProperty(element)) {
        drawElement(element);
    }
}
fb.blit();

var elementUnderCursor, pressedElement;

touchscreen("/dev/input/touchscreen", function(err, data) {
    if (err) {
        throw err;
    }

    console.log(data);

    var screenX = ((270 - 50) / (693 - 3307)) * data.x + 320;
    var screenY = ((190 - 50) / (3220 - 996)) * data.y;

    if (pressedElement && data.touch == 0) {
        gui[pressedElement].pressed = false;
        drawElement(pressedElement);
    }

    elementUnderCursor = getElementUnderCursor(screenX, screenY);

    if (elementUnderCursor) {
        if (data.touch == 1) {
            pressedElement = elementUnderCursor;
            gui[pressedElement].pressed = true;
            drawElement(pressedElement);
            console.log(gui[pressedElement].text.caption);
        }
    }

    fb.blit();
});
