$(document).ready(function()
{
    function logInfo(msg)
    {
        $("#logDiv").html(msg + "<br>" + $("#logDiv").html());
    }

    function createPlayerBoard(gameInfo)
    {
        let $table = $('<table/>').attr('id','playertable');

        for (let r =0; r < gameInfo.rows; r++)
        {
            let $row = $('<tr/>').attr('id', 'row'+r);
            for (let c =0; c < gameInfo.columns; c++)
            {
                let $col = $('<td>0</td>').attr('id', 'pcell'+r+c);
                $col.click(function() { playerBoardCellClicked(c,r); });
                $row.append($col);
            }
            $table.append($row);
        }
        $('#playerBoardDiv').html($table);
    }

    function playerBoardCellClicked(col, row)
    {
        logInfo("Player board cell click " + col + "," + row);
    }

    function gameCreated(data, status)
    {
        logInfo(status);
        logInfo(data);
        var gameInfo = JSON.parse(data);
        createPlayerBoard(gameInfo);
        logGameInfo(gameInfo);
    }

    function createGame()
    {
        var createGameUrl = $("#serverUrl").val() + "newgame?gameId=" + encodeURIComponent($("#gameId").val()) + "&player=" + encodeURIComponent($("#playerName").val());
        $.get(createGameUrl, gameCreated );
    }
    
    function gameJoined(data, status)
    {
        logInfo(status);
        logInfo(data);
        var gameInfo = JSON.parse(data);
        logGameInfo(gameInfo);
    }

    function joinGame()
    {
        var joinGameUrl = $("#serverUrl").val() + "games/" + encodeURIComponent($("#gameId").val()) + "/join?player=" + encodeURIComponent($("#playerName").val());
        $.get(joinGameUrl, gameJoined );
    }

    function logAvailableGames()
    {
        $.get($("#serverUrl").val() + "games", function(data, status) {logInfo(data);} );
    }

    function logGameInfo(game)
    {
        info  = "Game id: " + game.id;
        info += "<br>Player 1: " + game.player1;
        info += "<br>Player 2: " + game.player2;

        info += "<br>Boats: " + game.boats.length;
        for (i = 0; i < game.boats.length; i++)
        {
            var boat = game.boats[i];
            info += "<br>" + boat['start'] + '-->' + boat['end'] + " length " + boat['length'];
        }

        info += "<br>Board:" + game.columns + "x" + game.rows + " columns x rows";
        logInfo(info)
    }

	$("#joinBtn").on('click', joinGame);
	$("#createBtn").on('click', createGame);
    $("#clearBtn").on('click', function() {$("#logDiv").html("");});
    $("#logGamesBtn").on('click', logAvailableGames);
	// $("#inputURL").on('change', testIt);
});
