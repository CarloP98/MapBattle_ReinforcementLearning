class Board{
  constructor(id, containerSize, playerSize) {
    this.containerSize = containerSize;
    this.blockSize = playerSize;
    this.ratio = containerSize/playerSize;
    this.gameContainer = document.querySelector("#"+id);
    this.gameContainer.width = this.containerSize;
    this.gameContainer.height = this.containerSize;
    this.ctx = this.gameContainer.getContext("2d");
    this.state = Array(this.ratio).fill().map(()=>Array(this.ratio).fill('0'));
    this.area = this.state.length * this.state[0].length
    this.progress = 0
    this.lastRender = 0
    this.slowFactor = 6

    this.players = [
      new Player(1, [20,15], this.state, this.blockSize, 'rgba(10,15,180,1)', ['ArrowUp', 'ArrowRight', 'ArrowDown','ArrowLeft']),
      //new Player(2, [9,15], this.state, this.blockSize, 'rgba(75,05,180,1)', ['KeyW', 'KeyD', 'KeyS','KeyA']),
                                                                                                        
      //new Player(1, this.getFreeSpaceCoordinates(), this.state, this.blockSize, 'rgba(10,10,180,1)', []),
      new Player(2, this.getFreeSpaceCoordinates(), this.state, this.blockSize, 'rgba(180,10,10,1)', []),
      new Player(3, this.getFreeSpaceCoordinates(), this.state, this.blockSize, 'rgba(10,180,10,1)', []),
    ]
    this.game();
  }
  game(){
    var last = performance.now();
    var self = this;

    function loop(timestamp) {
      self.progress += (timestamp - self.lastRender)
      //update
      var additionalProgress = Math.round((self.progress/self.slowFactor)/self.ratio)
      if(additionalProgress){
        for(var i = 0; i < self.players.length; i++){
          if(!self.players[i].alive){
            self.players[i].clear(self.state);
            var spot = self.getFreeSpaceCoordinates()
            if(spot == null){
              self.lastRender = timestamp
              continue
            }
            self.players[i].reset(self.state, spot);
          }

          var [stat, conc, killed] =  self.players[i].update(self.state)

          if(conc){
            for(let [key, value] of Object.entries(conc)){
              var plr = key-1
              for(let loc of value){
                if(JSON.stringify(loc) === JSON.stringify(self.players[plr].trailStart)){
                  self.players[plr].clear(self.state)
                  self.players[plr].alive = false
                }
                delete self.players[plr].conqueredSpace[loc]
              }
            }
          }

          if(stat != undefined){
            self.players[stat-1].clear(self.state);
            self.players[stat-1].alive = false

          }
        }
      }
      self.progress = (additionalProgress!=0)?0:self.progress

      //draw
      self.ctx.clearRect(0, 0, self.gameContainer.width, self.gameContainer.height);
      for(var i = 0; i < self.players.length; i++)
        self.players[i].render(self.ctx)

      self.lastRender = timestamp

      window.requestAnimationFrame(loop)
    }
    window.requestAnimationFrame(loop)
  }

  getFreeSpaceCoordinates() {
    var S = this.state.map(function(arr){return [...arr]})
    var rows = S.length;
    var cols = S[0].length;

    for(var x=0; x<rows; x++)
      S[x][0] = (S[x][0]=='0')?1:0
    for(var x=1; x<cols; x++)
      S[0][x] = (S[0][x]=='0')?1:0

    var max_of_s = S[0][0]; var max_i = 0; var max_j = 0;
    for(var i = 1; i < rows; i++)
      for(var j = 1; j < cols; j++)
        if(S[i][j] == '0'){
          S[i][j] = Math.min(S[i][j-1], S[i-1][j], S[i-1][j-1]) + 1;
          if(max_of_s < S[i][j]){
              max_of_s = S[i][j];
              max_i = i;
              max_j = j;
          }
        }
        else
          S[i][j] = 0;

    var min_i = max_i - max_of_s+4
    var min_j = max_j - max_of_s+4
    max_i = max_i-1
    max_j = max_j-1

    if( max_of_s >= 6)
      return [Math.floor(Math.random()*(max_i-min_i+1)+min_i),
      Math.floor(Math.random()*(max_j-min_j+1)+min_j)]
    return null
  }
}

var board = new Board('game1', 600, 20)
