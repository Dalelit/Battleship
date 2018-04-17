from battleship import battle_ship_board_game, battle_ship_board_specs, battle_ship_player

active_games = dict()
specs = battle_ship_board_specs()

def create_game(gameName, playerName):
    game = battle_ship_board_game(specs, gameName)
    active_games[gameName.lower()] = game
    
    player = battle_ship_player(playerName)
    player.board = game.p1_board
    player.boats = game.p1_boats
    player.boats_hitcount = game.p1_boats_hitcount

    game.player1 = player

    return game

def find_game(gameName):
    return active_games[gameName.lower()]

def find_game_by_id(gameId):
    games = [v for v in active_games.values() if v.id == gameId]
    if len(games) == 1:
        return games[0]
    
    # throw an exception?

    if len(games) > 1:
        print(f'Found more than 1 game with the id {gameId}')
    else:
        print(f'Did not find game {gameId}')

    return None

def find_player_by_id(game, playerId):
    if game.player1.id == playerId:
        return game.player1

    if game.player2.id == playerId:
        return game.player2

    print(f'Did not find player {playerId}')
    return None


def join_game(game, playerName):
    # To Do - check for if there are no vacant play slots

    player = battle_ship_player(playerName)
    player.board = game.p2_board
    player.boats = game.p2_boats
    player.boats_hitcount = game.p2_boats_hitcount

    game.player2 = player

    game.player2.opponent = game.player1
    game.player1.opponent = game.player2

def player_fired(game, player, row, col):

    tgt_loc = player.opponent.board[row][col]

    if (tgt_loc[1]):
        # print('Targeted a location already used')
        return None

    results = [dict(), dict()] # player, opponent results

    results[0]['row'] = results[1]['row'] = row
    results[0]['col'] = results[1]['col'] = col

    results[0]['action'] = 'fired'
    results[1]['action'] = 'targeted'


    boat_num = tgt_loc[0]
    if (boat_num >= 0):
        player.boats_hitcount[boat_num] -= 1
        if player.boats_hitcount[boat_num] > 0:
            results[0]['result'] = results[1]['result'] = 'hit'
        else:
            results[0]['result'] = results[1]['result'] = 'sunk'

        if sum(player.boats_hitcount) == 0:
            results[0]['turn'] = 'won'
            results[1]['turn'] = 'lost'
        else:
            results[0]['turn'] = 'player'
            results[1]['turn'] = 'opponent'
            
    else:
        results[0]['result'] = results[1]['result'] = 'miss'
        results[0]['turn'] = 'opponent'
        results[1]['turn'] = 'player'
    

    player.opponent.board[row][col] = (boat_num, True)

    return results

def player_ready(game, player):
    player.ready = True

    if player.opponent and player.opponent.ready:
        # To Do - randomly pick a player to start
        return [{'action':'start'}, {'action':'wait'}]
    else:
        return [{'action':'wait'}]

def specs_info():
    return specs.__dict__
