function ColorDot (x, y) {
    this.x = x;
    this.y = y;
    this.l = 0.5;
    this.radius = 7;
    this.color = new chroma();
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.colorDots = [];
    this.borderSize = 20;
    this.mouseDown = false;
    this.selectedIndex = -1;
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
}

CanvasState.prototype.addColorButtons = function(element) {
    for (var i = 0; i < cs.colorDots.length; i++) {
        var radioButton = document.createElement("input");
        radioButton.type = "radio";
        radioButton.name = "color";
        radioButton.id = "radio" + i.toString();
        radioButton.onchange = radioButtonChanged;
        radioButton.value = i.toString();
        radioButton.checked = true;
        element.appendChild(radioButton);
        
        var label = document.createElement("label");
        label.setAttribute('for', "radio" + i.toString());
        
        var span = document.createElement("span");
        label.appendChild(span);
        
        element.appendChild(label);
    }
}

CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the offsets in case there's a position:fixed bar
  offsetX += 0;
  offsetY += 0;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
    var canvas = this.canvas;
    
    var width  = canvas.width;
    var height = canvas.height;
    
    var radius = Math.min(width/2, height/2);
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: (mx / this.canvas.scrollWidth * this.canvas.width) / radius - 1, y: (my / this.canvas.scrollHeight * this.canvas.height) / radius - 1 };
};

CanvasState.prototype.clearCanvas = function() {
    this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
}

CanvasState.prototype.drawCross = function(x,y) {
    var canvas = this.canvas;
    var context = canvas.getContext("2d");
    
    var width  = canvas.width;
    var height = canvas.height;
    
    var centerX = width / 2;
    var centerY = height / 2;
    
    var lineWidth = this.borderSize;
    var radius = Math.min(width/2, height/2);
    
    var crossSize = 10;
    
    var form = document.getElementById("colorButtons");
    if (document.getElementById("lightnessSlider").value / 100 > 0.5)
        context.strokeStyle = '#000000';
    else
        context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    
    context.beginPath();
    context.moveTo(-crossSize + (x + 1) * radius,-crossSize + (y + 1) * radius);
    context.lineTo(crossSize + (x + 1) * radius,crossSize + (y + 1) * radius);
    context.moveTo(crossSize + (x + 1) * radius,-crossSize + (y + 1) * radius);
    context.lineTo(-crossSize + (x + 1) * radius,crossSize + (y + 1) * radius);
    context.closePath();
    context.stroke();
}

CanvasState.prototype.drawDots = function() {
    var canvas = this.canvas;
    var context = canvas.getContext("2d");
    
    var width  = canvas.width;
    var height = canvas.height;
    
    var centerX = width / 2;
    var centerY = height / 2;
    
    var lineWidth = this.borderSize;
    var radius = Math.min(width/2, height/2);
    
    context.beginPath();
    context.arc(centerX, centerY, radius - lineWidth/2, 0, 2 * Math.PI, false);
    context.lineWidth = lineWidth;
    context.strokeStyle = '#444444';
    context.stroke();
    
    var form = document.getElementById("colorButtons");    
    this.colorDots[form.elements["color"].value].l = document.getElementById("lightnessSlider").value / 100;
    
    for (var i = 0; i < this.colorDots.length; i++) {
        var dotSize;
        if (i == form.elements["color"].value){
            context.lineWidth = 5;
            dotSize = 10;
        }
        else{
            context.lineWidth = 2;
            dotSize = 7;
        }
            
        var xCanvas = (this.colorDots[i].x + 1) * radius;
        var yCanvas = (this.colorDots[i].y + 1) * radius;
        this.colorDots[i].color = chroma.lch(
                    this.colorDots[i].l * 100,
                    getSaturation01(this.colorDots[i].x, this.colorDots[i].y) * 100,
                    getHue(this.colorDots[i].x, this.colorDots[i].y) / (2 * Math.PI) * 360);
        context.beginPath();
        context.arc((this.colorDots[i].x + 1) * radius,(this.colorDots[i].y + 1) * radius, dotSize, 0, 2 * Math.PI, false);
        context.fillStyle = this.colorDots[i].color.hex();
        context.fill();
        
        if (this.colorDots[i].l > 0.5) {
            context.strokeStyle = '#000000';
        }
        else
            context.strokeStyle = '#FFFFFF';
        context.stroke();
        
        
        // Change color of the selected radio button (could be done after the loop on only one)
        var span = document.getElementById("radio" + i).nextSibling.firstChild;
        span.style.backgroundColor = this.colorDots[i].color.hex();
    }
};

CanvasState.prototype.moveDots = function(e) {
    var x = this.getMouse(e).x;
    var y = this.getMouse(e).y;
    
    var norm = Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) + this.borderSize/270;
    if (norm > 1) {
        x = x / norm;
        y = y / norm;
    }
    
    if (this.selectedIndex != -1) {
        this.colorDots[this.selectedIndex].x = x;
        this.colorDots[this.selectedIndex].y = y;
    }
};

CanvasState.prototype.updateSelectedIndex = function(x, y, offset) {
    var index = -1;
    var minDist = 1;
    for (var i = 0; i < this.colorDots.length; i++) {
        var dotX = this.colorDots[i].x;
        var dotY = this.colorDots[i].y;
        var dist = Math.sqrt(Math.pow(x - dotX,2) + Math.pow(y - dotY,2));
        if (dist < minDist) {
            minDist = dist;
            index = i;
        }
    }
    if (minDist < offset) {
        this.selectedIndex = index;
    }
    else {
        this.selectedIndex = -1;
    }
    
    if (this.selectedIndex != -1) {
        var form = document.getElementById("colorButtons");
        form.elements[this.selectedIndex].checked = true;
    }
};

CanvasState.prototype.positionOverDots = function(x, y, offset) {
    for (var i = 0; i < this.colorDots.length; i++) {
        var dotX = this.colorDots[i].x;
        var dotY = this.colorDots[i].y;
        var dist = Math.sqrt(Math.pow(x - dotX,2) + Math.pow(y - dotY,2));
        if (dist < offset) {
            return true;
        }
    }
};

function BackgroundCanvas(canvas) {
    this.canvas = canvas;
}

function getHue(x, y) {
	var theta = Math.atan2(y,-x) + Math.PI;
	return theta;
}

function getSaturation01(x, y) {
	return (Math.sqrt(Math.pow(x,2) + Math.pow(y,2)));
}

BackgroundCanvas.prototype.updateColors = function() {
    var form = document.getElementById("colorButtons");    
    var lightness = 0.5;//this.colorDots[form.elements["color"].value].l;
    
    
    var context = this.canvas.getContext("2d");
    
    var width  = this.canvas.width;
    var height = this.canvas.height;
    
    var centerX = width / 2;
    var centerY = height / 2;
    var lineWidth = 2;
    var radius = Math.min(width/2, height/2) - lineWidth;
    
    var color;
    
    var imageData = context.createImageData(width, height);
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if ((Math.sqrt(Math.pow((x - centerX + 0.5) / radius,2) + Math.pow((y - centerY + 0.5) / radius,2))) < 1) {
                var index = 4 * (x + y * width);
                color = chroma.lch(
                    lightness * 100,
                    getSaturation01(x / radius - 1, y / radius - 1) * 100,
                    getHue(x / radius - 1, y / radius - 1) / (2 * Math.PI) * 360).rgb();
                imageData.data[index + 0] = color[0];
                imageData.data[index + 1] = color[1];
                imageData.data[index + 2] = color[2];
                imageData.data[index + 3] = 255;
            }
        }
    }
    context.putImageData(imageData, 0, 0);
}