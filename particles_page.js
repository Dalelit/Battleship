////////////////////////////////
// Test function for a canvas

// To Do - a singleton? or something within the test function?

var mgrExp = new ParticleSourceManager(); 
var mgrSplash = new ParticleSourceManager();
var mgrFire = new ParticleSourceManager();

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

    last = now;
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
