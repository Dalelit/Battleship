$(document).ready(function()
{
    /*
     * To Do - tidy ups
     * - board size doesn't use the returned game info... still hard coded to 10
     * - not responsive
     * - consider the aesthetics...
     */

    boardWidth = 200;
    boardHeight = boardWidth;
    cellSize = boardWidth / 10;
    radius = 0.4 * cellSize;
    playerCanvas = document.getElementById("playerBoard");
    opponentCanvas = document.getElementById("opponentBoard");

    function logInfo(msg) // to do - probably a better way
    {
        $("#logDiv").html(msg + "<br>" + $("#logDiv").html());
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
        // playerBoardCellClicked(Math.floor(event.offsetX / cellSize), Math.floor(event.offsetY / cellSize));
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
    }

    function gameCreated(data, status)
    {
        logInfo(status);
        logInfo(data);
        var gameInfo = JSON.parse(data);
        createPlayerBoard(gameInfo);
        createOpponentBoard(gameInfo);
        logGameInfo(gameInfo);
    }

    function createGame()
    {
        let createGameUrl = $("#serverUrl").val() + "newgame?gameId=" + encodeURIComponent($("#gameId").val()) + "&player=" + encodeURIComponent($("#playerName").val());
        $.get(createGameUrl, gameCreated );
    }
    
    function gameJoined(data, status)
    {
        logInfo(status);
        logInfo(data);
        let gameInfo = JSON.parse(data);
        logGameInfo(gameInfo);
    }

    function joinGame()
    {
        let joinGameUrl = $("#serverUrl").val() + "games/" + encodeURIComponent($("#gameId").val()) + "/join?player=" + encodeURIComponent($("#playerName").val());
        $.get(joinGameUrl, gameJoined );
    }

    function logAvailableGames()
    {
        $.get($("#serverUrl").val() + "games", function(data, status) {logInfo(data);} );
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

	$("#joinBtn").on('click', joinGame);
	$("#createBtn").on('click', createGame);
    $("#clearBtn").on('click', function() {$("#logDiv").html("");});
    $("#logGamesBtn").on('click', logAvailableGames);
    $("#playerBoard").on('click', playerBoardClicked);
    $("#opponentBoard").on('click', opponentBoardClicked);
});
