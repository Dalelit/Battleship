/*
    * To Do - tidy ups
    * - board size doesn't use the returned game info... still hard coded to 10
    * - not responsive
    * - consider the aesthetics...
    * - disable create/join/etc... when the game starts
    */

playerCanvas = document.getElementById("playerBoard");
opponentCanvas = document.getElementById("opponentBoard");
logDiv = document.getElementById("logDiv");
   
document.getElementById("joinBtn").addEventListener('click', joinGame);
document.getElementById("clearBtn").addEventListener('click', function() {logDiv.innerText = "";});
document.getElementById("createBtn").addEventListener('click', createGame);
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

function logInfo(msg) // to do - probably a better way
{
    logDiv.innerText =  msg + "\n" + logDiv.innerText;
}

function drawCell(context, row, col, color)
{
    context.beginPath();
    context.arc(col * cellSize + cellSize/2, row * cellSize + cellSize/2, radius, 0, 2*Math.PI);
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
    let fillColor = "Grey";

    if (r1 == r2) //  horizontal boat
    {
        for (let i = c1; i <= c2; i++) drawCell(ctx, r1, i, fillColor);
    }
    else //  vertical boat
    {
        for (let i = r1; i <= r2; i++) drawCell(ctx, i, c1, fillColor);
    }
}

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
    // console.log(event);
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

    createPlayerBoard(gameInfo);
    createOpponentBoard(gameInfo);

    // connect to socket
    wsSocket = new WebSocket(gameInfo.wsAddr);
    // wsSocket.onopen = function(event) { wsSocket.send("hello"); };
    // wsSocket.onclose = function (event) { console.log("WS on close"); console.log(event); };
    wsSocket.onmessage = msgReceived;
    // logInfo("wsSocket open readyState " + wsSocket.readyState);
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
    // logInfo(status);
    // logInfo(data);
    if (data == "No free player spot")
    {
        logInfo("No free player spot");
        return;
    }

    let gameInfo = JSON.parse(data);
    // logGameInfo(gameInfo);

    createPlayerBoard(gameInfo);
    createOpponentBoard(gameInfo);

    wsSocket = new WebSocket(gameInfo.wsAddr);
    wsSocket.onmessage = msgReceived;
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
