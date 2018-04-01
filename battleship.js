$(document).ready(function()
{

    var baseURL = "http://localhost:5000/";

    function logInfo(msg)
    {
        $("#logDiv").html(msg + "<br>" + $("#logDiv").html());
    }

    function logTestInfo()
	{
        logInfo("Player name is: " + $("#playerName").val());
    }

    function createGame()
    {
        var createGameUrl = baseURL + "newgame?gameId=" + encodeURIComponent($("#gameId").val()) + "&player=" + encodeURIComponent($("#playerName").val());
        logInfo("calling " + createGameUrl);
        $.get(createGameUrl, function(data, status) {logInfo("Got an answer");} );
        logInfo("Called it");
    }
    
    function joinGame()
    {
        var joinGameUrl = baseURL + "games/" + encodeURIComponent($("#gameId").val()) + "/join?player=" + encodeURIComponent($("#playerName").val());
        logInfo(joinGameUrl);
    }

    function logAvailableGames()
    {
        $.get(baseURL + "games", function(data, status) {logInfo(data);} );
    }

	$("#joinBtn").on('click', joinGame);
	$("#createBtn").on('click', createGame);
	$("#testBtn").on('click', logTestInfo);
    $("#clearBtn").on('click', function() {$("#logDiv").html("");});
    $("#logGamesBtn").on('click', logAvailableGames);
	// $("#inputURL").on('change', testIt);
});
