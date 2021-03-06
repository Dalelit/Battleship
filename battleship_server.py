from flask import Flask, send_from_directory, request
from json import dumps, loads
import asyncio
import websockets
from threading import Thread
import battleship_manager as mgr


connected_users = set()
wsAddr = "ws://"

app = Flask(__name__, static_folder='')


@app.route('/<path:path>')
def main_pages(path):
    # return app.send_static_file('battleship.html')
    return send_from_directory('', path)

@app.route('/specs')
def game_specs():
    return dumps(mgr.specs_info())

def generate_game_name():
    return f"Game{mgr.active_games.__len__()+1}"

@app.route('/newgame')
def new_game():
    # if [x for x in request.args if x == 'gameName']: # Is there a better way to check for args?
    #     gameName = request.args['gameName']
    # else:
    #     gameName = generate_game_name()

    # if [x for x in request.args if x == 'player']: # Is there a better way to check for args?
    
    gameName = request.args['gameName']
    playerName = request.args['player']

    game = mgr.create_game(gameName, playerName)

    print(f'Created game {gameName}')

    game_info = game.player1_info()
    game_info['wsAddr'] = wsAddr

    return dumps(game_info)

# @app.route('/availablegames')
# def available_games():
#     games = [v.status_info() for k,v in mgr.active_games.items() if v.player1 == '' or v.player2 == '']
#     return dumps(games)

@app.route('/games')
def all_games():
    games = [v.game_info() for k,v in mgr.active_games.items()]
    return dumps(games)

# @app.route('/games/<gameid>')
# def access_game(gameid):
#     return dumps(mgr.active_games[gameid].game_info())

@app.route('/games/<gameName>/join')
def join_game(gameName):
    # To Do - no error checking

    playerName = request.args['player']

    game = mgr.find_game(gameName)
    mgr.join_game(game, playerName)

    game_info = game.player2_info()
    game_info['wsAddr'] = wsAddr

    return dumps(game_info)

# async def wsBroadcast(msg, exlcudeSource = None):
#     for ws in connected_users:
#         if not exlcudeSource or ws != exlcudeSource:
#             await ws.send(msg)

async def wsMsgConsumer(msg, game, player):
    msgDict = loads(msg)
    # print(msgDict)

    # print(f'{player.id} in {game.id} did {msgDict["action"]}')

    if msgDict['action'] == 'fire':
        result = mgr.player_fired(game, player, msgDict['row'], msgDict['col'])
        if result:
            await player.ws.send(dumps(result[0]))
            await player.opponent.ws.send(dumps(result[1]))

    elif msgDict['action'] == 'ready':
        print(f'{player.id} in {game.id} is ready.')
        player.ready = True

        if game.players_ready():
            await player.ws.send(dumps({'action':'start', 'turn':'player'}))
            await player.opponent.ws.send(dumps({'action':'start', 'turn':'opponent'}))
        else:
            await player.ws.send(dumps({'action':'wait'}))

    else:
        print('Unknown action in msg: ' + msg)

    if not game.active:
        print(f'Game {game.id} finished')
        await player.ws.send(dumps({'action':'finished'}))
        await player.opponent.ws.send(dumps({'action':'finished'}))

async def wsMsgHandler(websocket, path):
    try:
        # Track all users. Good for a broadcast message
        connected_users.add(websocket)

        # First message should be a connection, so find the game and player for subsequent messages
        firstMsgDict = loads(await websocket.recv())

        # To Do - not checking if we find things... assuming we do at the moment
        # if msgDict['action'] == 'connect': # should always be this action

        game = mgr.find_game_by_id(firstMsgDict['gameId'])
        player = mgr.find_player_by_id(game, firstMsgDict['playerId'])

        player.ws = websocket
        print(f'{player.id} in {game.id} is connected.')

        # To Do - could have the wait for the ready message here as well

        # now handle all messages        
        async for msg in websocket:
            await wsMsgConsumer(msg, game, player)

    # To Do - add a catch for when the connection is broken, e.g player leaving or starting a new game

    finally:
        connected_users.remove(websocket)


class runApi(Thread):
    def run(self):
        print("Start flask")
        app.run(host="0.0.0.0", port=5000)

def runWebSocket():
    print("Start websocket")

    # To Do - check if this is the best way to get the IP address, to then serve for the websocket?
    # start_server = websockets.serve(wsMsgHandler, 'localhost')
    from socket import gethostname, gethostbyname
    hostIP = gethostbyname(gethostname())
    # print("Host ----> " + hostIP)
    start_server = websockets.serve(wsMsgHandler, hostIP)
    asyncio.get_event_loop().run_until_complete(start_server)

    # To do - is this really the best way to get the ws address?
    # print([x.getsockname() for x in start_server.ws_server.sockets])
    socks = [x.getsockname() for x in start_server.ws_server.sockets if x.getsockname()[0] != "::1"]
    print(socks)
    global wsAddr
    wsAddr = f"ws://{hostIP}:{socks[0][1]}"
    print(f"Websocket addr is {wsAddr}")
    asyncio.get_event_loop().run_forever()


if __name__ == '__main__':

    apiThread = runApi()
    apiThread.start()

    runWebSocket()

    apiThread.join()
