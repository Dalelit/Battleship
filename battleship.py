# To Do
#
# - fix up the player1/2 code... probably to a list.
# - don't close down games when players finish/leave.

from random import randint

game_count = 0 # to do - is there a better way to track the number of games? Also... not using it at the moment

class battle_ship_board_specs:
    def __init__(self):
        self.rows = 10
        self.columns = 10
        self.boats = [5,4,3,3,2]

    def info(self):
        return self.__dict__

class battle_ship_player:

    def __init__(self, name):
        self.name = name
        self.id = name.lower()
        self.board = None
        self.boats = None
        self.opponent = None
        self.ready = False

class battle_ship_board_game:

    def __init__(self, specs, name):
        global game_count
        game_count += 1

        self.name = name
        self.id = f"{name.lower()}{game_count}"
        self.rows = specs.rows
        self.columns = specs.columns

        self.player1 = None
        self.player2 = None
        self.p1_boats = list()
        self.p2_boats = list()
        self.p1_boats_hitcount = specs.boats.copy()
        self.p2_boats_hitcount = specs.boats.copy()
        self.p1_board = [[(-1,False) for y in range(0, self.columns)] for x in range(0, self.rows)]
        self.p2_board = [[(-1,False) for y in range(0, self.columns)] for x in range(0, self.rows)]
        self.randomly_place_boats(self.p1_board, self.p1_boats, specs.boats)
        self.randomly_place_boats(self.p2_board, self.p2_boats, specs.boats)

    def game_info(self):
        d = dict()
        d['name'] = self.name
        d['gameId'] = self.id
        d['player1'] = self.player1.name
        d['rows'] = self.rows
        d['columns'] = self.columns

        if self.player2:
            d['player2'] = self.player2.name
        else:
            d['player2'] = None

        return d

    def player1_info(self):
        d = self.game_info()
        d['boats'] = self.p1_boats
        d['playerId'] = self.player1.id
        return d
    
    def player2_info(self):
        d = self.game_info()
        d['boats'] = self.p2_boats
        d['playerId'] = self.player2.id
        return d
    
    def randomly_place_boats(self, board, boats, boat_specs):
        for num, length in enumerate(boat_specs):
            # print(f'Boat num {num} and len {length}')

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
                
                placed = self.place_boat(board, num, start_col, start_row, end_col, end_row)

            if placed:
                boats.append({'start':(start_col,start_row), 'end':(end_col,end_row), 'length':length, 'id':num})
            else:
                print('Did not place a boat')

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
                if board[row][col][0] >= 0:
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
    print(spec.info())
    print()

    game = battle_ship_board_game(spec, 'testgm1')
    print(game.game_info())
    print()

    print('Player 1')
    game.print_board(game.p1_board)
    print('Player 2')
    game.print_board(game.p2_board)
    print()
