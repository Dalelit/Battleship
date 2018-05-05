///////////////////////////////////////
// Perlin noise stuff

class Perlin_Noise
{
    constructor(width, height)
    {
        this.scaleX = this.scaleY = this.min_scale = 20.0;
        this.offsetX = this.offsetY = 0.0;
    
        this.width = Math.floor(width / this.scaleX) + 2;
        this.height = Math.floor(height / this.scaleY) + 2;
        this.gradient = [this.height * this.width];

        this.initialise_gradient();
    }

    initialise_gradient()
    {
        var len = this.width * this.height;
        for (var i = 0; i < len; i++)
        {
            this.gradient[i] = Math.random();
        }
    }
    
    get_value(x,y)
    {
        function lerp(a, b, w) { return (a * w) + (b * (1 - w)); }
        
        x += this.offsetX;
        y += this.offsetY;

        var px0 = Math.floor(x / this.scaleX);
        var py0 = Math.floor(y / this.scaleY);
        var px1 = px0 + 1;
        var py1 = py0 + 1;
    
        var wx = (x / this.scaleX) - px0;
        var wy = (y / this.scaleY) - py0;
    
        var p00 = this.gradient[py0 * this.width + px0];
        var p01 = this.gradient[py1 * this.width + px0];
        var p11 = this.gradient[py1 * this.width + px1];
        var p10 = this.gradient[py0 * this.width + px1];
    
        var xl0 = lerp(p10, p00, wx);
        var xl1 = lerp(p11, p01, wx);
        var yl  = lerp(xl1, xl0, wy);
    
        return yl;
    }

    shift_offset(x,y)
    {
        this.offsetX += x;
        this.offsetY += y;

        var xMove = Math.floor(this.offsetX / this.scaleX);
        var yMove = Math.floor(this.offsetY / this.scaleY);

        if (Math.abs(xMove) > 0)
        {
            this.shift_gradient_x(xMove);
            this.offsetX -= xMove * this.scaleX;
        }

        if (Math.abs(yMove) > 0)
        {
            this.shift_gradient_y(yMove);
            this.offsetY -= yMove * this.scaleY;
        }
    }

    shift_gradient_x(dx)
    {
        if (dx > 0)
        {
            // copy columns
            for (var ix = 0; ix < this.width - dx; ix++)
                for (var iy = 0; iy < this.height; iy++)
                    this.gradient[iy * this.width + ix] = this.gradient[iy * this.width + ix + dx];
            // generate new    // to do - wrapping instead
            for (ix; ix < this.width; ix++)
                for (var iy = 0; iy < this.height; iy++)
                    this.gradient[iy * this.width + ix] = Math.random();

        }
        else if (dx < 0)
        {
            dx = -dx;
            // copy columns
            for (var ix = this.width-1; ix >= dx; ix--)
                for (var iy = 0; iy < this.height; iy++)
                    this.gradient[iy * this.width + ix] = this.gradient[iy * this.width + ix - dx];
            // generate new    // to do - wrapping instead
            for (ix; ix >= 0; ix--)
                for (var iy = 0; iy < this.height; iy++)
                    this.gradient[iy * this.width + ix] = Math.random();

        }
    }

    shift_gradient_y(dy)
    {
        if (dy > 0)
        {
            // copy rows
            for (var iy = 0; iy < this.height - dy; iy++)
                for (var ix = 0; ix < this.width; ix++)
                    this.gradient[iy * this.width + ix] = this.gradient[(iy + dy) * this.width + ix];
            // generate new    // to do - wrapping instead
            for (iy; iy < this.height; iy++)
                for (var ix = 0; ix < this.width; ix++)
                    this.gradient[iy * this.width + ix] = Math.random();

        }
        else if (dy < 0)
        {
            dy = -dy;
            // copy rows
            for (var iy = this.height-1; iy >= dy; iy--)
                for (var ix = 0; ix < this.width; ix++)
                    this.gradient[iy * this.width + ix] = this.gradient[(iy-dy) * this.width + ix];
            // generate new    // to do - wrapping instead
            for (iy; iy >= 0; iy--)
                for (var ix = 0; ix < this.width; ix++)
                    this.gradient[iy * this.width + ix] = Math.random();

        }
    }
    
    add_to_scale(amt)
    {
        this.scaleX += amt;
        this.scaleY += amt;
    }
}

/////////////////////////////////////////////////
// Drawing functions

pn_ctx = null;

function drawBackBuffer()
{
    var r = 255;
    var g = 255;
    var b = 255;
    var indx = 0;
    for (y = 0; y < pn_back_buffer.height; y++) for (x = 0; x < pn_back_buffer.width; x++)
    {
        var c = pn.get_value(x,y);
        pn_back_buffer.data[indx] = c*c * r;
        indx++;
        pn_back_buffer.data[indx] = c*c * g;
        indx++;
        pn_back_buffer.data[indx] = c*b;
        indx++;
        pn_back_buffer.data[indx] = 255;
        indx++;
    }
}

function displayBackBuffer()
{
    pn_ctx.putImageData(pn_back_buffer, 0, 0);
}

running = false;

function mainPerlinLoop()
{
    pn.shift_offset(15 / 1000 * 60, -10 / 1000 * 60);
    drawBackBuffer();
    displayBackBuffer();

    if (running) window.requestAnimationFrame(mainPerlinLoop);
}

function placePerlinNoise(canvas, event)
{
    if (pn_ctx == null)
    {
        pn_ctx = canvas.getContext("2d");
        pn = new Perlin_Noise(canvas.width, canvas.height);

        // create back buffer
        pn_back_buffer = pn_ctx.createImageData(canvas.width, canvas.height);

    }
    else
    {
        // pn.initialise_gradient();
    }

    if (!running)
    {
        running = true;
        // start animation loop
        window.requestAnimationFrame(mainPerlinLoop);
    }
    else running = false;


}

function noiseScroll(canvas, event)
{
    if (event.deltaY > 0)
    {
        pn.add_to_scale(1);
        drawBackBuffer();
        displayBackBuffer();
    }
    else if (event.deltaY < 0)
    {
        if (pn.scaleX > pn.min_scale && pn.scaleY > pn.min_scale) pn.add_to_scale(-1);
        drawBackBuffer();
        displayBackBuffer();
    }
}
