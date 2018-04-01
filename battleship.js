$(document).ready(function()
{

    function logInfo(msg)
    {
        $("#logDiv").html(msg + "<br>" + $("#logDiv").html());
    }

    function createGame()
    {
        var createGameUrl = $("#serverUrl").val() + "newgame?gameId=" + encodeURIComponent($("#gameId").val()) + "&player=" + encodeURIComponent($("#playerName").val());
        $.get(createGameUrl, function(data, status) {logInfo(data);} );
    }
    
    function joinGame()
    {
        var joinGameUrl = $("#serverUrl").val() + "games/" + encodeURIComponent($("#gameId").val()) + "/join?player=" + encodeURIComponent($("#playerName").val());
        $.get(joinGameUrl, function(data, status) {logInfo(data);} );
    }

    function logAvailableGames()
    {
        $.get($("#serverUrl").val() + "games", function(data, status) {logInfo(data);} );
    }

	$("#joinBtn").on('click', joinGame);
	$("#createBtn").on('click', createGame);
    $("#clearBtn").on('click', function() {$("#logDiv").html("");});
    $("#logGamesBtn").on('click', logAvailableGames);
	// $("#inputURL").on('change', testIt);
});
