from flask import Flask, send_from_directory, request
from json import dumps
import asyncio
import websockets
from threading import Thread

from battleship import battle_ship_board_game, battle_ship_board_specs

active_games = dict()
specs = battle_ship_board_specs()

connected_users = set()
wsAddr = "ws://"

app = Flask(__name__, static_folder='')


@app.route('/<path:path>')
def main_pages(path):
    # return app.send_static_file('battleship.html')
    return send_from_directory('', path)

@app.route('/specs')
def game_specs():
    return dumps(specs.json_str())

def generate_game_name():
    return f"Game{active_games.__len__()+1}"

@app.route('/newgame')
def new_game():
    if [x for x in request.args if x == 'gameId']: # Is there a better way to check for args?
        gameId = request.args['gameId']
    else:
        gameId = generate_game_name()

    game = battle_ship_board_game(specs, gameId, wsAddr)
    active_games[game.name.lower()] = game

    if [x for x in request.args if x == 'player']: # Is there a better way to check for args?
        game.player1 = request.args['player']

    print(f'Created game {gameId}')

    return game.json_str_player1()

@app.route('/availablegames')
def available_games():
    games = [v.status_info() for k,v in active_games.items() if v.player1 == '' or v.player2 == '']
    return dumps(games)

@app.route('/games')
def all_games():
    games = [v.status_info() for k,v in active_games.items()]
    return dumps(games)

@app.route('/games/<gameid>')
def access_game(gameid):
    return dumps(active_games[gameid].status_info())

@app.route('/games/<gameid>/join')
def join_game(gameid):
    # print(f'Joining game {gameid}')

    game = active_games[gameid.lower()]

    player = request.args['player']
    if player:
        print(f'Player {player} joining game {gameid}')
        if not game.player2:
            game.player2 = player
        else:
            print('Error - no free player spot')
            return 'No free player spot'
    else:
        print('Could not find player name')
        return 'No player arg'

    return game.json_str_player2()

async def wsBroadcast(msg, exlcudeSource = None):
    # print(f'Broadcast {msg}. ExcludeSource {exlcudeSource}')
    for ws in connected_users:
        if not exlcudeSource or ws != exlcudeSource:
            await ws.send(msg)

def wsMsgConsumer(msg):
    print(f"Received msg: {msg}")
    # To Do - check results of hit and respond
    return msg

async def wsMsgHandler(websocket, path):
    try:
        connected_users.add(websocket)
        
        async for msg in websocket:
            responseMsg = wsMsgConsumer(msg)
            if (responseMsg):
                await wsBroadcast(responseMsg, websocket)
    finally:
        connected_users.remove(websocket)


class runApi(Thread):
    def run(self):
        print("Start flask")
        app.run()

def runWebSocket():
    print("Start websocket")
    start_server = websockets.serve(wsMsgHandler, 'localhost')
    asyncio.get_event_loop().run_until_complete(start_server)

    # To do - is this really the best way to get the ws address?
    socks = [x.getsockname() for x in start_server.ws_server.sockets if x.getsockname()[0] != "::1"]
    print(socks)
    global wsAddr
    wsAddr = f"ws://{socks[0][0]}:{socks[0][1]}"
    print(f"Websocket addr is: {wsAddr}")
    asyncio.get_event_loop().run_forever()


if __name__ == '__main__':

    apiThread = runApi()
    apiThread.start()

    runWebSocket()

    apiThread.join()
