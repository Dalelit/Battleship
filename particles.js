///////////////////////////////
// To Do
// - move the arrays to fixed size and swap dead particles around
// - particle sources initialised with 0 get removed before the emmiter can kick in
// - try adding it to the game now



/////////////////
// helper functions

// note... 0 inclusive to max exclusive
function randomInt(max)
{
    return Math.floor(Math.random() * max);
}

// note... inclusive to exclusive
function randomRangeInt(min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}

function randomRangeFloat(min, max)
{
    return (Math.random() * (max - min)) + min;
}

function randomRGB()
{
    return [randomInt(255), randomInt(255), randomInt(255), 255];
}

function RGBAtoString(rgba)
{
    return 'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
    // return 'rgba(' + Math.floor(rgba[0]) + ',' + Math.floor(rgba[1]) + ',' + Math.floor(rgba[2]) + ',' + rgba[3] + ')';
}

function SetSpeedAndDirection(p, minSpeed, maxSpeed, minAngle, maxAngle)
{
    var speed = randomRangeFloat(minSpeed,maxSpeed) * 60 / 1000;
    var dir = randomRangeFloat(minAngle * Math.PI / 180.0, maxAngle * Math.PI / 180.0);
    p.dx = Math.cos(dir) * speed;
    p.dy = -Math.sin(dir) * speed;
}

////////////////////////////////////
// classes

class Particle
{
    constructor(x, y, radius = 4.0)
    {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.dx = 0;
        this.dy = 0;
        this.age = 1000;
        this.color = [255,255,255,1.0];
    }

    draw(ctx)
    {
        ctx.fillStyle = RGBAtoString(this.color);
        // ctx.globalAlpha= this.color[3];
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        // ctx.closePath();
        ctx.fill();
    }
}

function DefaultParticleInitialiser(p)
{
    p.color = randomRGB();
    SetSpeedAndDirection(p, 5, 10, 0, 360);
}

function DefaultParticleUpdater(p, dt)
{
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.age -= dt;
}

function SplashParticleInitialiser(p)
{
    p.color = [0, 0, 255, 255];
    SetSpeedAndDirection(p, 10, 15, 60, 120);
    p.ddy = 7 / 1000;
}

function SplashParticleUpdater(p, dt)
{
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.dy += p.ddy * dt;
    p.age -= dt;
}

function FireParticleInitialiser(p)
{
    // wiggle location
    p.x += randomRangeFloat(-3.0, 3.0);
    p.y += randomRangeFloat(-3.0, 3.0);

    // pick a colour
    var chance = Math.random();

    if (chance < 0.1) p.color = [255, 0, 0, 1.0];
    else if (chance < 0.3) p.color = [255, 150, 50, 1.0];
    else if (chance < 0.6) p.color = [255, 255, 0, 1.0];
    else p.color = [0, 0, 0, 0.5];
    
    SetSpeedAndDirection(p, 0.1, 1, 60, 120);
    p.ddy = -0.1 / 1000;

    p.dalpha = -p.color[3] / p.age;
}

function FireParticleUpdater(p, dt)
{
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.dy += p.ddy * dt;
    p.age -= dt;

    p.color[3] += p.dalpha * dt;
}

class ParticleSource
{
    constructor(x,y)
    {
        this.x = x;
        this.y = y;

        this.particleInitialiser = DefaultParticleInitialiser;
        this.particleUpdater = DefaultParticleUpdater;

        this.particles = [];
    }

    initialise(startParticlesNumber, emmitRatePerSec = 0)
    {
        for (var i = 0; i < startParticlesNumber; i++)
        {
            this.addParticle();
        }

        if (emmitRatePerSec > 0)
        {
            this.interval = setInterval((ps) => {ps.addParticle();}, 1000 / emmitRatePerSec, this);
        }
    }

    addParticle()
    {
        var p = new Particle(this.x,this.y);
        this.particleInitialiser(p);
        this.particles.push(p);
        return p;
    }

    draw(ctx)
    {
        this.particles.map( (p) => {p.draw(ctx);} );
    }

    update(dt)
    {
        for (var i = 0; i < this.particles.length; i++)
        {
            this.particleUpdater(this.particles[i], dt);

            if (this.particles[i].age <= 0)
            {
                this.particles.splice(i,1);
                i--; // as the array is 1 shorter!
            }
        }
    }
}

function explosionParticleSource(x, y)
{
    var ps = new ParticleSource(x, y);
    ps.initialise(30);

    return ps;
}

function splashParticleSource(x, y)
{
    var ps = new ParticleSource(x, y);
    ps.particleInitialiser = SplashParticleInitialiser;
    ps.particleUpdater = SplashParticleUpdater;
    ps.initialise(20);

    return ps;
}

function fireParticleSource(x, y)
{
    var ps = new ParticleSource(x, y);
    ps.particleInitialiser = FireParticleInitialiser;
    ps.particleUpdater = FireParticleUpdater;
    ps.initialise(1,20);

    return ps;
}

// used to manage all the sources on 1 canvas
class ParticleSourceManager
{
    constructor()
    {
        this.particlesSources = [];
        this.drawingCanvas = null;
    }

    init(canvas)
    {
        this.drawingCanvas = canvas;
        this.drawingCtx = this.drawingCanvas.getContext("2d");
    }

    addParticleSource(src)
    {
        this.particlesSources.push(src);
    }

    update(dt)
    {
        for (var i = 0; i < this.particlesSources.length; i++)
        {
            this.particlesSources[i].update(dt);
    
            if (this.particlesSources[i].particles.length == 0)
            {
                // console.log('particle source is now empty');
                this.particlesSources.splice(i,1);
                i--;
            }
        }
    }
    
    draw()
    {
        if (this.drawingCanvas == null) return;

        for (var i = 0; i < this.particlesSources.length; i++)
        {
            this.particlesSources[i].draw(this.drawingCtx);
        }
    }

    clearCanvas()
    {
        if (this.drawingCanvas == null) return;
        this.drawingCtx.clearRect(0,0,this.drawingCanvas.width, this.drawingCanvas.height);
    }

}

