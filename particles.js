///////////////////////////////
// To Do
// - fix it so the manager is not global
// - play around with the dials to get it looking right
// - refactor... since it was a hack to get working
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

function randomColor()
{
    return 'rgb(' + randomInt(255) + ',' + randomInt(255) + ',' + randomInt(255) + ')';
}

////////////////////////////////////
// classes

class Particle
{
    constructor(x, y, radius = 3.0)
    {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.dx = randomRangeFloat(-0.2,0.2); // To Do - this should be based around delta time
        this.dy = randomRangeInt(-700,10) / 1000.0;
        this.age = (1 + randomInt(10)) * 1000; // in milliseconds
    }

    draw(ctx)
    {
        // console.log('draw particle at '+ this.x + ',' + this.y);
        // ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        // ctx.fillStyle = 'red';
        // ctx.fill();
    }

    update(dt, ddx = 0.0, ddy = 0.0)
    {
        this.dx += ddx * dt;
        this.dy += ddy * dt;
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.age -= dt;
    }
}


class ParticleSource
{
    constructor(mgr, x,y, numParticles = 10, ddx = 0.0, ddy = 0.0)
    {
        this.mgr = mgr;
        this.x = x;
        this.y = y;
        this.ddx = ddx;
        this.ddy = ddy;

        // To Do - is this really the only/best way?
        this.color = randomColor();

        this.particles = [];

        for (var i = 0; i < numParticles; i++)
        {
            // this.particles.push(new Particle(x,y));
            this.addParticle();
        }

        mgr.addParticleSource(this);
    }

    addParticle()
    {
        var p = new Particle(this.x,this.y);
        this.particles.push(p);
        return p;
    }

    draw(ctx)
    {
        for (var i = 0; i < this.particles.length; i++)
        {
            ctx.beginPath();
            this.particles[i].draw(ctx)
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    update(dt)
    {
        for (var i = 0; i < this.particles.length; i++)
        {
            this.particles[i].update(dt, this.ddx, this.ddy);

            if (this.particles[i].age <= 0)
            {
                this.particles.splice(i,1);
                i--; // as the array is 1 shorter!
                // console.log('killing a particle');
            }
        }
    }
}

class ParticleSourceManager
{
    constructor()
    {
        this.particlesSources = [];
        this.drawingCanvas = null;
        this.deltaTime = 1000.0 / 50.0; // To Do - work out a proper clock? or keep as fixed frame time?
        this.updateInterval = null;
    }

    addParticleSource(src)
    {
        this.particlesSources.push(src);
    }

    updateParticleSources(dt)
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
    
    update()
    {
        if (this.drawingCanvas == null) return;
    
        this.updateParticleSources(this.deltaTime);
    
        if (this.particlesSources.length > 0) this.draw();
    }
    
    draw(clearCanvas = true)
    {
        var ctx = this.drawingCanvas.getContext("2d"); // To Do - could move this too the manager or source

        if (clearCanvas) ctx.clearRect(0,0,this.drawingCanvas.width, this.drawingCanvas.height);

        for (var i = 0; i < this.particlesSources.length; i++)
        {
            this.particlesSources[i].draw(ctx);
        }

    }

    init(canvas)
    {
        this.drawingCanvas = canvas;
    }

}

///////////////////////////
// Variations
function CreateExplosion(manager, x,y)
{
    var psrc = new ParticleSource(manager, x, y, 10, 0.0, -0.0001);
    psrc.color = 'yellow';

    psrc = new ParticleSource(manager, x, y, 10, 0.0, -0.0001);
    psrc.color = 'orange';

    psrc = new ParticleSource(manager, x, y, 10, 0.0, -0.0001);
    psrc.color = 'red';
}

function CreateSplash(manager, x,y)
{
    var psrc = new ParticleSource(manager, x, y, 10, 0.0, 0.00001);
    psrc.color = 'blue';
    psrc.particles.forEach(function(particle, indx) { particle.dx *= 2.0; particle.dy = -Math.abs(particle.dy);  });

    psrc = new ParticleSource(manager, x, y, 10, 0.0, -0.00001);
    psrc.color = 'darkblue';
    psrc.particles.forEach(function(particle, indx) { particle.dx *= 2.0; particle.dy = -Math.abs(particle.dy);  });

    psrc = new ParticleSource(manager, x, y, 10, 0.0, -0.00001);
    psrc.color = 'lightblue';
    psrc.particles.forEach(function(particle, indx) { particle.dx *= 2.0; particle.dy = -Math.abs(particle.dy);  });
}

function CreateFire(manager, x,y)
{
    var psrc = new ParticleSource(manager, x, y, 0);
    psrc.color = 'grey';
    function greyParticle(source) {var p = source.addParticle(); p.dx = randomRangeFloat(-8.0/3000.0, 8.0/3000.0); p.dy = randomRangeFloat(-10.0/3000.0, -15.0/3000.0); p.age *= 2; p.radius = 4;}
    greyParticle(psrc); // add one particle.
    setInterval(greyParticle, 300, psrc);

    psrc = new ParticleSource(manager, x, y, 0);
    psrc.color = 'yellow';
    function yellowParticle(source) {var p = source.addParticle(); p.dx = randomRangeFloat(-6.0/3000.0, 6.0/3000.0); p.dy = randomRangeFloat(-7.0/3000.0, -10.0/3000.0); p.age *= 2; p.radius = 3;}
    yellowParticle(psrc); // add one particle.
    setInterval(yellowParticle, 300, psrc);

    psrc = new ParticleSource(manager, x, y, 0);
    psrc.color = 'red';
    function redParticle(source) {var p = source.addParticle(); p.dx = randomRangeFloat(-3.0/3000.0, 3.0/3000.0); p.dy = randomRangeFloat(-3.0/3000.0, -7.0/3000.0); p.age *= 1; p.radius = 2;}
    redParticle(psrc); // add one particle.
    setInterval(redParticle, 300, psrc);

}

////////////////////////////////
// Test function for a canvas

var mgrExp = new ParticleSourceManager(); // to do - a singleton? or something within the test function?
var mgrSplash = new ParticleSourceManager(); // to do - a singleton? or something within the test function?
var mgrFire = new ParticleSourceManager(); // to do - a singleton? or something within the test function?

function mainParticleLoop()
{
    mgrExp.update();
    mgrSplash.update();
    mgrFire.update();
    window.requestAnimationFrame(mainParticleLoop);
}

function placeParticleExplosion(canvas, event)
{
    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    CreateExplosion(mgrExp, x,y);

    if (mgrExp.drawingCanvas == null) mgrExp.init(canvas);
}

function placeParticleSplash(canvas, event)
{
    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    CreateSplash(mgrSplash, x,y);

    if (mgrSplash.drawingCanvas == null) mgrSplash.init(canvas);
}

function placeParticleFire(canvas, event)
{
    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    CreateFire(mgrFire, x,y);

    if (mgrFire.drawingCanvas == null) mgrFire.init(canvas);
}

// start the animcation loop
window.requestAnimationFrame(mainParticleLoop);
