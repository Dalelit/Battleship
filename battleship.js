/*
    * To Do - tidy ups
    * - board size doesn't use the returned game info... still hard coded to 10
    * - clear canvas when new game started or joined
    * - not responsive
    * - consider the aesthetics...
    * - disable create/join/etc... when the game starts
    */

playerCanvas = document.getElementById("playerBoard");
opponentCanvas = document.getElementById("opponentBoard");
logDiv = document.getElementById("logDiv");
   
joinBtn = document.getElementById("joinBtn");
createBtn = document.getElementById("createBtn");
beginBtn = document.getElementById("beginBtn");

joinBtn.addEventListener('click', joinGame);
createBtn.addEventListener('click', createGame);
beginBtn.addEventListener('click', beginGame);
document.getElementById("clearBtn").addEventListener('click', function() {logDiv.innerText = "";});
document.getElementById("logGamesBtn").addEventListener('click', logAvailableGames);
document.getElementById("playerBoard").addEventListener('click', playerBoardClicked);
document.getElementById("opponentBoard").addEventListener('click', opponentBoardClicked);

boardWidth = 200;
boardHeight = boardWidth;
cellSize = boardWidth / 10;
radius = 0.4 * cellSize;
wsSocket = null;
testVar = "init";

playerName = "";
opponentName = "";

// support functions

function logInfo(msg) // to do - probably a better way
{
    logDiv.innerText =  msg + "\n" + logDiv.innerText;
}

function getData(url, callback)
{
    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this.responseText, this.status);
       }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

// drawing functions

function clearBoards()
{
    let ctx = playerCanvas.getContext("2d");
    ctx.clearRect(0,0,playerCanvas.width, playerCanvas.height);

    ctx = opponentCanvas.getContext("2d");
    ctx.clearRect(0,0,opponentCanvas.width, opponentCanvas.height);
}

function drawCell(context, row, col, color)
{
    context.beginPath();
    context.arc(col * cellSize + cellSize/2, row * cellSize + cellSize/2, radius, 0, 2*Math.PI);
    context.fillStyle = color;
    context.fill();
}

function drawCellsBox(context, c1, r1, c2, r2, color)
{
    let x1 = c1 * cellSize + cellSize/2;
    let y1 = r1 * cellSize + cellSize/2;
    let x2 = c2 * cellSize + cellSize/2;
    let y2 = r2 * cellSize + cellSize/2;

    context.beginPath();
    if (r1 == r2) //  horizontal
    {
        context.rect(x1, y1-radius, x2-x1, 2*radius);
    }
    else //  vertical
    {
        context.rect(x1-radius, y1, 2*radius, y2-y1);
    }
    context.fillStyle = color;
    context.fill();
}

function drawBoard(canvas, columns, rows, color)
{
    let ctx = canvas.getContext("2d");

    for (let r = 0; r < rows; r++)
    {
        for (let c = 0; c < columns; c++) drawCell(ctx, r, c, color);
    }
}

function drawBoat(canvas, c1, r1, c2, r2)
{
    let ctx = canvas.getContext("2d");

    drawCellsBox(ctx, c1, r1, c2, r2, "LightGrey");
    if (r1 == r2) //  horizontal boat
    {
        for (let i = c1; i <= c2; i++) drawCell(ctx, r1, i, "Grey");
    }
    else //  vertical boat
    {
        for (let i = r1; i <= r2; i++) drawCell(ctx, i, c1, "Grey");
    }
}

//game/ui functions

function createPlayerBoard(gameInfo)
{
    drawBoard(playerCanvas, gameInfo.columns, gameInfo.rows, "SkyBlue");

    for (let i = 0; i < gameInfo.boats.length; i++)
    {
        let boat = gameInfo.boats[i];
        drawBoat(playerCanvas, boat['start'][0], boat['start'][1], boat['end'][0], boat['end'][1]);
    }
}

function playerBoardClicked(event)
{
    playerBoardCellClicked(Math.floor(event.offsetX / cellSize), Math.floor(event.offsetY / cellSize));
}

function playerBoardCellClicked(col, row)
{
    logInfo("Player board cell click " + col + "," + row);
}

function createOpponentBoard(gameInfo)
{
    drawBoard(opponentCanvas, gameInfo.columns, gameInfo.rows, "LightSkyBlue");
}

function opponentBoardClicked(event)
{
    opponentBoardCellClicked(Math.floor(event.offsetX / cellSize), Math.floor(event.offsetY / cellSize));
}

function opponentBoardCellClicked(col, row)
{
    // logInfo("Opponent board cell click " + col + "," + row);
    drawCell(opponentCanvas.getContext("2d"), row, col, "Green");
    let msg = {row: row, col:col, src: playerName};
    // logInfo("wsSocket readyState " + wsSocket.readyState);
    wsSocket.send(JSON.stringify(msg));
}

function msgReceived(event)
{
    console.log(event);
    let gameMsg = JSON.parse(event.data);
    // console.log(gameMsg);
    
    if (gameMsg.src == playerName)
    {
        logInfo("Got a message from our selves?!");
        return;
    }

    drawCell(playerCanvas.getContext("2d"), gameMsg.row, gameMsg.col, "Red");
}

function gameCreated(data, status)
{
    // logInfo(status);
    // logInfo(data);
    var gameInfo = JSON.parse(data);
    // logGameInfo(gameInfo);

    clearBoards();
    createPlayerBoard(gameInfo);
    createOpponentBoard(gameInfo);

    // connect to socket
    if (wsSocket) wsSocket.close();
    wsSocket = new WebSocket(gameInfo.wsAddr);
    // wsSocket.onopen = function(event) { wsSocket.send("hello"); };
    // wsSocket.onclose = function (event) { console.log("WS on close"); console.log(event); };
    wsSocket.onmessage = msgReceived;
    // logInfo("wsSocket open readyState " + wsSocket.readyState);

    beginBtn.disabled = false;
}

function createGame()
{
    // to do - use encodeURIComponent on the values?
    playerName = document.getElementById("playerName").value;
    let url = document.getElementById("serverUrl").value;
    let gId = document.getElementById("gameId").value;
    let createGameUrl = url + "newgame?gameId=" + gId + "&player=" + playerName;

    getData(createGameUrl, gameCreated);
}

function gameJoined(data, status)
{
    if (data == "No free player spot")
    {
        logInfo("No free player spot");
        return;
    }

    gameCreated(data, status)
}

function joinGame()
{
    // to do - use encodeURIComponent on the values?
    playerName = document.getElementById("playerName").value;
    let url = document.getElementById("serverUrl").value;
    let gId = document.getElementById("gameId").value;
    let joinGameUrl = url + "games/" + gId + "/join?player=" + playerName;

    getData(joinGameUrl, gameJoined);
}

function beginGame()
{
}

function logAvailableGames()
{
    let url = document.getElementById("serverUrl").value + "games";
    getData(url, function(data, status) {logInfo(data);} );
}

function logGameInfo(game)
{
    let info = "Game id: " + game.id;
    info += "<br>Player 1: " + game.player1;
    info += "<br>Player 2: " + game.player2;

    info += "<br>Boats: " + game.boats.length;
    for (let i = 0; i < game.boats.length; i++)
    {
        let boat = game.boats[i];
        info += "<br>" + boat['start'] + '-->' + boat['end'] + " length " + boat['length'];
    }

    info += "<br>Board:" + game.columns + "x" + game.rows + " columns x rows";
    logInfo(info)
}
