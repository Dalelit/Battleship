///////////////////////////////
// To Do
// - fix it so the manager is not global
// - play around with the dials to get it looking right
// - refactor... since it was a hack to get working
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
        this.color = [255,255,255,255];
    }

    draw(ctx)
    {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fillStyle = RGBAtoString(this.color);
        ctx.fill();
    }
}

function SetSpeedAndDirection(p, minSpeed, maxSpeed, minAngle, maxAngle)
{
    var speed = randomRangeFloat(minSpeed,maxSpeed) * 60 / 1000;
    var dir = randomRangeFloat(minAngle * Math.PI / 180.0, maxAngle * Math.PI / 180.0);
    p.dx = Math.cos(dir) * speed;
    p.dy = -Math.sin(dir) * speed;
}

function DefaultParticleInitialiser(p)
{
    // console.log('DefaultParticleInitialiser');
    p.color = randomRGB();
    SetSpeedAndDirection(p, 5, 10, 0, 360);
}

function DefaultParticleUpdater(p, dt)
{
    // console.log('DefaultParticleUpdater');
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.age -= dt;
}

function SplashParticleInitialiser(p)
{
    // console.log('SplashParticleInitialiser');
    p.color = [0, 0, 255, 255];
    SetSpeedAndDirection(p, 10, 15, 60, 120);
    p.ddy = 1 * 60 / 1000;
}

function SplashParticleUpdater(p, dt)
{
    // console.log('SplashParticleUpdater');
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.dy += p.ddy;
    p.age -= dt;
}

function FireParticleInitialiser(p)
{
    // console.log('SplashParticleInitialiser');
    p.color = [255, 0, 0, 255];
    SetSpeedAndDirection(p, 0.1, 1, 60, 120);
    p.ddy = -0.1 * 60 / 1000;
    p.lifeSpan = p.age;
}

function FireParticleUpdater(p, dt)
{
    // console.log('SplashParticleUpdater');
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.dy += p.ddy;
    p.age -= dt;
    p.color[3] = 255 * p.age / p.lifeSpan;
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
            console.log("creating an emmiter");
            this.interval = setInterval(function(ps) {ps.addParticle();}, 1000 / emmitRatePerSec, this);
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
        for (var i = 0; i < this.particles.length; i++)
        {
            this.particles[i].draw(ctx)
        }
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

    loopStep(dt)
    {
        this.update(dt);
        this.clearCanvas();
        this.draw();
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

////////////////////////////////
// Test function for a canvas

// To Do - a singleton? or something within the test function?

var mgrExp = new ParticleSourceManager(); 
var mgrSplash = new ParticleSourceManager();
var mgrFire = new ParticleSourceManager();

function mainParticleLoop()
{
    var dt = 1000 / 60; // To Do: assuming fixed frame rate.

    mgrExp.loopStep(dt);
    mgrSplash.loopStep(dt);
    mgrFire.loopStep(dt);
    window.requestAnimationFrame(mainParticleLoop);
}

function placeParticleExplosion(canvas, event)
{
    if (mgrExp.drawingCanvas == null) mgrExp.init(canvas);

    var x = event.offsetX;
    var y = event.offsetY;

    var ps = new ParticleSource(x, y);
    ps.initialise(10);
    mgrExp.addParticleSource(ps);
}

function placeParticleSplash(canvas, event)
{
    if (mgrSplash.drawingCanvas == null) mgrSplash.init(canvas);

    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    var ps = new ParticleSource(x, y);
    ps.particleInitialiser = SplashParticleInitialiser;
    ps.particleUpdater = SplashParticleUpdater;
    ps.initialise(20);

    mgrSplash.addParticleSource(ps);
}

function placeParticleFire(canvas, event)
{
    if (mgrFire.drawingCanvas == null) mgrFire.init(canvas);

    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    var ps = new ParticleSource(x, y);
    ps.particleInitialiser = FireParticleInitialiser;
    ps.particleUpdater = FireParticleUpdater;
    ps.initialise(1,20);

    mgrFire.addParticleSource(ps);
}

// start the animcation loop
window.requestAnimationFrame(mainParticleLoop);
