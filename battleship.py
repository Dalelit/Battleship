# To Do
#
# - fix up the player1/2 code... probably to a list.
# - don't close down games when players finish/leave.

from json import dumps
from random import randint

game_count = 0 # to do - is there a better way to track the number of games? Also... not using it at the moment

class battle_ship_board_specs:
    def __init__(self):
        self.rows = 10
        self.columns = 10
        self.boats = [5,4,3,3,2]

    def json_str(self):
        return dumps(self.__dict__)

class battle_ship_board_game:

    def __init__(self, specs, name, wsAddr):
        global game_count
        game_count += 1

        self.name = name
        self.id = f"{name.lower()}{game_count}"
        self.player1 = ''
        self.player2 = ''
        self.rows = specs.rows
        self.columns = specs.columns
        self.wsAddr = wsAddr

        self.p1_boats = list()
        self.p2_boats = list()
        self.p1_board = [[(0,False) for y in range(0, self.columns)] for x in range(0, self.rows)]
        self.p2_board = [[(0,False) for y in range(0, self.columns)] for x in range(0, self.rows)]
        self.randomly_place_boats(self.p1_board, specs.boats)
        self.randomly_place_boats(self.p2_board, specs.boats)

    def status_info(self):
        d = dict()
        d['name'] = self.name
        d['id'] = self.id
        d['player1'] = self.player1
        d['player2'] = self.player2
        d['rows'] = self.rows
        d['columns'] = self.columns
        return d

    def game_info(self):
        d = self.status_info()
        d['wsAddr'] = self.wsAddr
        return d

    def json_str(self):
        # to do - check if there is a better way to turn obj into json
        return dumps({k: v for k,v in self.__dict__.items() if k != "board"})
        # return dumps(self.__dict__)
    
    def json_str_player1(self):
        d = self.game_info()
        d['boats'] = self.p1_boats
        return dumps(d)
    
    def json_str_player2(self):
        d = self.game_info()
        d['boats'] = self.p2_boats
        return dumps(d)
    
    def randomly_place_boats(self, board, boats):
        for num, length in enumerate(boats):
            # print(f'Boat num {num} and len{length}')

            attemptCount = 100
            placed = False

            while not placed and attemptCount > 0:
                attemptCount -= 1

                # randomly pick position, and place boat... try again if it fails
                if randint(0,1) == 0:
                    # horizontal
                    start_row = randint(0, self.rows - 1)
                    end_row = start_row
                    start_col = randint(0, self.columns - length - 1)
                    end_col = start_col + length - 1
                else:
                    # vertical
                    start_row = randint(0, self.rows - length - 1)
                    end_row = start_row + length - 1
                    start_col = randint(0, self.columns - 1)
                    end_col = start_col
                
                placed = self.place_boat(board, num + 1,start_col, start_row, end_col, end_row)

            if placed:
                # To do - it's a hack... come up with something better for telling the client, and telling which player we're populating
                if board == self.p1_board:
                    self.p1_boats.append({'start':(start_col,start_row), 'end':(end_col,end_row), 'length':length, 'id':num+1})
                else:
                    self.p2_boats.append({'start':(start_col,start_row), 'end':(end_col,end_row), 'length':length, 'id':num+1})

    def print_board_full(self, board):
        for r in board:
            print(r)

    def print_board(self, board):
        for r in board:
            print([c[0] for c in r])

    def place_boat(self, board, boat_number, start_col, start_row, end_col, end_row):

        # check all spots are free
        for row in range(start_row, end_row+1):
            for col in range(start_col, end_col+1):
                if board[row][col][0] != 0:
                    # print(f'Failed placing boat {boat_number} at {start_col},{start_row} to {end_col},{end_row}')
                    return False

        for row in range(start_row, end_row+1):
            for col in range(start_col, end_col+1):
                board[row][col] = (boat_number, False)

        # print(f'Placed boat {boat_number} at {start_col},{start_row} to {end_col},{end_row}')
        return True


if __name__ == '__main__':
    print("You sunk my Battleship!")

    spec = battle_ship_board_specs()
    print(spec.json_str())
    print()

    game = battle_ship_board_game(spec, 'test1', 'ws://test1')
    print(game.json_str())
    print()
    print(game.status_info())
    print()

    print('Player 1')
    game.print_board(game.p1_board)
    print('Player 2')
    game.print_board(game.p2_board)
    print()

    print(game.json_str_player1())
    print()
    print(game.json_str_player2())
    print()