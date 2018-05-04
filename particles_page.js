////////////////////////////////
// Test function for a canvas

// To Do - a singleton? or something within the test function?
var mgrExp = new ParticleSourceManager(); 
var mgrSplash = new ParticleSourceManager();
var mgrFire = new ParticleSourceManager();
var mgrAll = new ParticleSourceManager();

var last, startTime = window.performance.now();

function mainParticleLoop()
{
    var now = window.performance.now();
    var dt = now - last;

    function loopStep(mgr, dt)
    {
        mgr.update(dt);
        mgr.clearCanvas();
        mgr.draw();
    }

    loopStep(mgrExp, dt);
    loopStep(mgrSplash, dt);
    loopStep(mgrFire, dt);
    loopStep(mgrAll, dt);

    last = now;
    window.requestAnimationFrame(mainParticleLoop);
}

function placeParticleExplosion(canvas, event)
{
    if (mgrExp.drawingCanvas == null) mgrExp.init(canvas);

    var x = event.offsetX;
    var y = event.offsetY;

    var ps = explosionParticleSource(x,y);
    mgrExp.addParticleSource(ps);
}

function placeParticleSplash(canvas, event)
{
    if (mgrSplash.drawingCanvas == null) mgrSplash.init(canvas);

    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    var ps = splashParticleSource(x,y);
    mgrSplash.addParticleSource(ps);
}

function placeParticleFire(canvas, event)
{
    if (mgrFire.drawingCanvas == null) mgrFire.init(canvas);

    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    var ps = fireParticleSource(x,y);
    mgrFire.addParticleSource(ps);
}

function placeAll(canvas, event)
{
    if (mgrAll.drawingCanvas == null) mgrAll.init(canvas);

    var x = 0.0 + event.offsetX;
    var y = 0.0 + event.offsetY;

    mgrAll.addParticleSource(fireParticleSource(x,y));
    mgrAll.addParticleSource(explosionParticleSource(x,y));
    mgrAll.addParticleSource(splashParticleSource(x,y));
}

// start the animcation loop
window.requestAnimationFrame(mainParticleLoop);
