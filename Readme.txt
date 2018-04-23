Creating a battle ship game to learn...
- Python
- Javascript
- Html
- Restful apis, using Flask
- Web sockets

To use it, run the battleship.bat (in Windows).

On browsers go to the url that Flask says /battleship.html

Backlog:
- Refactor it... it's a mess of hacks just to get it working
- UI backlog in js file
- add an index.html to do something
- Get a web server. Currently using Flask... which also lets you browse the code base (nice feature!)
- Work out if/how to have Flask APIs and the webSockets working off the same config, but in different programs
    - maybe use?... https://flask-socketio.readthedocs.io/en/latest/
    - or get the asyinc loop on another thread?
- Should add some graceful exiting
- When you change the html/js you need to force a refresh from the brower
- Comment the code and re-org it
- Use POST rather than GET everywhere
- Allow user defined game specs (board size and boats)
- Add variations on 'missiles'... multi-hit shots
- Create a bot to play against... use AI (because it's all the rage)... maybe a genetic algorithim (because that sounds impressive)... something to beat AlphaZero maybe?


Thinking through the process...
1. Player 1 requests a game, gets back the created game and Web socket address (/game)
2. Player 1 configures the boats, clicks ready (msg to server for position and wait for second player)
3. Player 2 requests to join a game (/games to list them), gets back the created game and Web socket address (id/join)
4. Player 2 configures the boats, clicks ready (msg to server for position and wait for second player)
5. Once both players have joined, msg from server to start, and pick a player to begin
6. Loop... Player X picks move, server determines result (miss, hit, hit+sunk, hit+sunk+finished), broadcasts results and next players turn
7. End the game once a player has won (i.e. all the boats sunk)

