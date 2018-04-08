from flask import Flask, send_from_directory
from flask import request
from json import dumps
import asyncio
import websockets
from threading import Thread

active_games = dict()
connected_users = set()
wsAddr = "ws://"

app = Flask(__name__, static_folder='')

class battle_ship_board_specs:
    def __init__(self):
        self.rows = 10
        self.columns = 10
        self.boats = [5,4,3,3,2]

    def json_str(self):
        return dumps(self.__dict__)

specs = battle_ship_board_specs()

class battle_ship_board_game:

    def place_boats(self, boat_specs):
        x = y = 0
        for boat in boat_specs:
            self.boats.append({'start':(x,y), 'end':(x,y+boat-1), 'length':boat})
            x+=2

    def __init__(self, specs, id):
        self.id = id
        self.boats = list()
        self.place_boats(specs.boats)
        self.player1 = ''
        self.player2 = ''
        self.rows = specs.rows
        self.columns = specs.columns
        self.wsAddr = wsAddr

        active_games[self.id.lower()] = self

    def status_info(self):
        d = dict()
        d['id'] = self.id
        d['player1'] = self.player1
        d['player2'] = self.player2
        return d

    def json_str(self):
        return dumps(self.__dict__)
    
    def check_boat_position_is_valid(self, start, end):
        pass

def gameid_check_decorator(func):
    def wrap(gameid):
        gid = gameid.lower()

        if not active_games.__contains__(gid):
            return 'No game exists'
        
        return func(gid)
    return wrap

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

    game = battle_ship_board_game(specs, gameId)

    if [x for x in request.args if x == 'player']: # Is there a better way to check for args?
        game.player1 = request.args['player']

    print(f'Created game {gameId}')
    print(game.json_str())

    return game.json_str()

@app.route('/availablegames')
def available_games():
    games = [v.status_info() for k,v in active_games.items() if v.player1 == '' or v.player2 == '']
    return dumps(games)

@app.route('/games')
def all_games():
    games = [v.status_info() for k,v in active_games.items()]
    return dumps(games)

@app.route('/games/<gameid>')
@gameid_check_decorator
def access_game(gameid):
    return dumps(active_games[gameid].status_info())

@app.route('/games/<gameid>/join')
# @gameid_check_decorator
def join_game(gameid):
    # print(f'Joining game {gameid}')

    game = active_games[gameid.lower()]

    player = request.args['player']
    if player:
        print(f'Player {player} joining game {gameid}')
        if not game.player1:
            game.player1 = player
        elif not game.player2:
            game.player2 = player
        else:
            print('Error - no free player spot')
            return 'No free player spot'
    else:
        print('Could not find player name')
        return 'No player arg'

    return game.json_str()

async def wsBroadcast(msg, exlcudeSource = None):
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
