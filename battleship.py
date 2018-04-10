from json import dumps

class battle_ship_board_specs:
    def __init__(self):
        self.rows = 10
        self.columns = 10
        self.boats = [5,4,3,3,2]

    def json_str(self):
        return dumps(self.__dict__)

class battle_ship_board_game:

    def place_boats(self, boat_specs):
        x = y = 0
        for boat in boat_specs:
            self.boats.append({'start':(x,y), 'end':(x,y+boat-1), 'length':boat})
            x+=2

    def __init__(self, specs, name, wsAddr):
        self.name = name
        self.id = name.lower()
        self.boats = list()
        self.place_boats(specs.boats)
        self.player1 = ''
        self.player2 = ''
        self.rows = specs.rows
        self.columns = specs.columns
        self.wsAddr = wsAddr

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

if __name__ == '__main__':
    print("You sunk my Battleship!")