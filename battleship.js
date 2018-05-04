/*
    * To Do - tidy ups
    * - board size doesn't use the returned game info... still hard coded to 10
    * - clear canvas when new game started or joined
    * - not responsive
    * - consider the aesthetics...
    * - disable create/join/etc... when the game starts
    * - stop the game when you've won/lost
    * - add a particle simulator for the explosion when you hit!!! Explosions!!!
    */

function onLoadInitialise()
{
    playerCanvas = document.getElementById("playerArea");
    playerCtx = playerCanvas.getContext("2d");
    opponentCanvas = document.getElementById("opponentArea");
    opponentCtx = opponentCanvas.getContext("2d");

    logDiv = document.getElementById("logDiv");
       
    joinBtn = document.getElementById("joinBtn");
    createBtn = document.getElementById("createBtn");
    beginBtn = document.getElementById("beginBtn");
    
    joinBtn.addEventListener('click', joinGame);
    createBtn.addEventListener('click', createGame);
    beginBtn.addEventListener('click', beginGame);
    document.getElementById("clearBtn").addEventListener('click', function() {logSet("");});
    document.getElementById("logGamesBtn").addEventListener('click', logAvailableGames);
    // document.getElementById("logGameInfoBtn").addEventListener('click', logGameInfo);
    document.getElementById("logInfoBtn").addEventListener('click', logSetupInfo);
    // playerCanvas.addEventListener('click', playerBoardClicked);
    opponentCanvas.addEventListener('click', opponentBoardClicked);
    
    boardWidth = opponentCanvas.width;
    boardHeight = boardWidth;
    cellSize = boardWidth / 10;
    radius = 0.4 * cellSize;
    
    wsSocket = null;
    playerName = "";
    opponentName = "";
    currentTurn = false;
    gameId = null;
    playerId = null;
    gameInfo = null;
    
    serverAddr = window.location.host;
    serverIP = window.location.hostname;

    particleMgrPlayerBoard = new ParticleSourceManager();
    particleMgrPlayerBoard.init(playerCanvas);
    particleMgrOpponentBoard = new ParticleSourceManager();
    particleMgrOpponentBoard.init(opponentCanvas);

    playerBoard = null;
    opponentBoard = null;
    lastMoveRow = null;
    lastMoveCol = null;

    window.requestAnimationFrame(animationLoop);
}
   

// support functions

function logInfo(msg) // to do - probably a better way
{
    logDiv.innerText =  msg + "\n" + logDiv.innerText;
}

function logSet(msg) // to do - probably a better way
{
    logDiv.innerText =  msg;
}

function getData(url, callback)
{
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this.responseText, this.status);
       }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

// animation loop
var last, startTime = window.performance.now();

function animationLoop()
{
    var now = window.performance.now();
    var dt = now - last;

    clearBoards();

    particleMgrPlayerBoard.update(dt);
    drawBoats(playerCtx);
    drawBoard(playerBoard, playerCtx);
    if (lastMoveCol != null && lastMoveRow != null) drawCellBoarder(playerCtx, lastMoveCol, lastMoveRow, 'Green');
    particleMgrPlayerBoard.draw();

    particleMgrOpponentBoard.update(dt);
    drawBoard(opponentBoard, opponentCtx);
    particleMgrOpponentBoard.draw();

    last = now;
    window.requestAnimationFrame(animationLoop);
}


// drawing functions

function clearBoards()
{
    playerCtx.clearRect(0,0,playerCanvas.width, playerCanvas.height);
    opponentCtx.clearRect(0,0,opponentCanvas.width, opponentCanvas.height);
}

function colToX(col)
{
    return col * cellSize + cellSize/2;
}

function rowToY(row)
{
    return row * cellSize + cellSize/2;
}

function drawCell(context, col, row, color)
{
    context.beginPath();
    context.arc(col * cellSize + cellSize/2, row * cellSize + cellSize/2, radius, 0, 2*Math.PI);
    context.fillStyle = color;
    context.fill();
}

function drawCellBoarder(context, col, row, color)
{
    context.beginPath();
    context.arc(col * cellSize + cellSize/2, row * cellSize + cellSize/2, radius, 0, 2*Math.PI);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.stroke();
}

function drawCellsBox(context, c1, r1, c2, r2, color)
{
    var x1 = c1 * cellSize + cellSize/2;
    var y1 = r1 * cellSize + cellSize/2;
    var x2 = c2 * cellSize + cellSize/2;
    var y2 = r2 * cellSize + cellSize/2;

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

//game/ui functions

function drawBoats(ctx)
{
    if (gameInfo == null) return;

    for (var i = 0; i < gameInfo.boats.length; i++)
    {
        var boat = gameInfo.boats[i];
        var c1 = boat['start'][0];
        var r1 = boat['start'][1];
        var c2 = boat['end'][0];
        var r2 = boat['end'][1];
        drawCellsBox(ctx, c1, r1, c2, r2, "LightGrey");
    }
}

function drawBoard(board, ctx)
{
    if (board == null) return;

    for (var r = 0; r < board.length; r++)
    {
        for (var c = 0; c < board[r].length; c++)
        {
            var cell = board[r][c];
            if (cell[1] == 2) // hit
            {
                drawCell(ctx, c, r, 'Red');
            }
            else if (cell[1] == 3) // sunk
            {
                drawCell(ctx, c, r, 'Orange');
            }
            else if (cell[1] == 1) // miss
            {
                drawCell(ctx, c, r, 'Black');
            }
            else if (cell[0] < 0)
            {
                drawCell(ctx, c, r, 'SkyBlue');
            }
            else // cell[0] is boat number
            {
                drawCell(ctx, c, r, 'Grey');
            }
        }
    }
}

function initialiseBoard(gameInfo, includeBoats = false)
{
    var board = [];

    for (var r = 0; r < gameInfo.rows; r++)
    {
        var row = [];
        for (var c = 0; c < gameInfo.columns; c++)
        {
            row.push([-1, 0]);
        }
        board.push(row);
    }

    if (!includeBoats) return board;

    for (var i = 0; i < gameInfo.boats.length; i++)
    {
        var boat = gameInfo.boats[i];
        var c1 = boat['start'][0];
        var r1 = boat['start'][1];
        var c2 = boat['end'][0];
        var r2 = boat['end'][1];
        if (r1 == r2) //  horizontal boat
        {
            for (var c = c1; c <= c2; c++) board[r1][c] = [i, 0];
        }
        else //  vertical boat
        {
            for (var r = r1; r <= r2; r++) board[r][c1] = [i, 0];
        }
    }

    return board;
}

function playerBoardClicked(event)
{
    playerBoardCellClicked(Math.floor(event.offsetX / cellSize), Math.floor(event.offsetY / cellSize));
}

function playerBoardCellClicked(col, row)
{
    logInfo("Player board cell click " + col + "," + row);
}

function opponentBoardClicked(event)
{
    if (!currentTurn) return;

    opponentBoardCellClicked(Math.floor(event.offsetX / cellSize), Math.floor(event.offsetY / cellSize));
}

function opponentBoardCellClicked(col, row)
{
    // logInfo("Opponent board cell click " + col + "," + row);
    var msg = {action: 'fire', row: row, col:col};
    wsSocket.send(JSON.stringify(msg));
}

function msgReceived(event)
{
    // console.log(event);
    var gameMsg = JSON.parse(event.data);
    // console.log(gameMsg);

    if (gameMsg.action == 'fired')
    {
        if (gameMsg.result == 'hit')
        {
            opponentBoard[gameMsg.row][gameMsg.col][1] = 2;
            particleMgrOpponentBoard.addParticleSource(explosionParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }
        else if (gameMsg.result == 'sunk')
        {
            opponentBoard[gameMsg.row][gameMsg.col][1] = 3;
            particleMgrOpponentBoard.addParticleSource(fireParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }
        else // 'missed'
        {
            opponentBoard[gameMsg.row][gameMsg.col][1] = 1;
            particleMgrOpponentBoard.addParticleSource(splashParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }

        if (gameMsg.turn == 'won')
        {
            logInfo('Yay... you won')
            currentTurn = false;
        } else if (gameMsg.turn == 'opponent')
        {
            currentTurn = false;
        }
    }
    else if (gameMsg.action == 'targeted')
    {
        lastMoveCol = gameMsg.col;
        lastMoveRow = gameMsg.row;

        if (gameMsg.result == 'hit')
        {
            playerBoard[gameMsg.row][gameMsg.col][1] = 2;
            particleMgrPlayerBoard.addParticleSource(explosionParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }
        else if (gameMsg.result == 'sunk')
        {
            playerBoard[gameMsg.row][gameMsg.col][1] = 3;
            particleMgrPlayerBoard.addParticleSource(fireParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }
        else // 'missed'
        {
            playerBoard[gameMsg.row][gameMsg.col][1] = 1;
            particleMgrPlayerBoard.addParticleSource(splashParticleSource(colToX(gameMsg.col), rowToY(gameMsg.row)));
        }

        if (gameMsg.turn == 'lost')
        {
            logInfo('Sorry... you lost')
            currentTurn = false;
        } else if (gameMsg.turn == 'player')
        {
            currentTurn = true;
        }
    }
    else if (gameMsg.action == 'start')
    {
        logInfo('Start the game');
        if (gameMsg.turn == 'player')
        {
            currentTurn = true;
            logInfo('You have first move');
        } else // if (gameMsg.turn == 'opponent')
        {
            logInfo('Other player moves first');
        }
    }
    else if (gameMsg.action == 'wait')
    {
        logInfo('Wait for other player');
    }
    else if (gameMsg.action == 'finished')
    {
        logInfo('Finished');
        // To Do - close up all the connections?
    }

}

function gameCreated(data, status)
{
    // logInfo(status);
    // logInfo(data);
    gameInfo = JSON.parse(data);
    // console.log(gameInfo);

    playerBoard = initialiseBoard(gameInfo, true);
    opponentBoard = initialiseBoard(gameInfo);

    // connect to socket
    if (wsSocket) wsSocket.close();
    
    // console.log(gameInfo.wsAddr);
    wsSocket = new WebSocket(gameInfo.wsAddr);
    wsSocket.onopen = function(event) { wsSocket.send(JSON.stringify({gameId:gameInfo.gameId, playerId:gameInfo.playerId, action:'connect'})); };
    // wsSocket.onclose = function (event) { console.log("WS on close"); console.log(event); };
    wsSocket.onmessage = msgReceived;

    beginBtn.disabled = false;
}

function createGame()
{
    logSet("");

    // to do - use encodeURIComponent on the values?
    playerName = document.getElementById("playerName").value;
    var gId = document.getElementById("gameName").value;
    var createGameUrl = "http://" + serverAddr + "/newgame?gameName=" + gId + "&player=" + playerName;
    // logInfo("Create game url " + createGameUrl);

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
    logSet("");
    // to do - use encodeURIComponent on the values?
    playerName = document.getElementById("playerName").value;
    var gId = document.getElementById("gameName").value;
    var joinGameUrl = "http://" + serverAddr + "/games/" + gId + "/join?player=" + playerName;
    // logInfo("Join game url " + joinGameUrl);

    getData(joinGameUrl, gameJoined);
}

function beginGame()
{
    currentTurn = false;

    var msg = {action: 'ready'};
    wsSocket.send(JSON.stringify(msg));
}

function logAvailableGames()
{
    var url = document.getElementById("serverUrl").value + "games";
    getData(url, function(data, status) {logInfo(data);} );
}

function logGameInfo(game)
{
    var info = "Game id: " + game.id;
    info += "<br>Player 1: " + game.player1;
    info += "<br>Player 2: " + game.player2;

    info += "<br>Boats: " + game.boats.length;
    for (i = 0; i < game.boats.length; i++)
    {
        boat = game.boats[i];
        info += "<br>" + boat['start'] + '-->' + boat['end'] + " length " + boat['length'];
    }

    info += "<br>Board:" + game.columns + "x" + game.rows + " columns x rows";
    logInfo(info)
}

function logSetupInfo()
{
    logInfo("Server address is "+ serverAddr);
    logInfo("Server IP is "+ serverIP);
}

