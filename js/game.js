class Game{
  constructor(id, containerSize, playerSize) {
    //canvas
    this.gameContainer = document.querySelector("#"+id);
    this.ctx = this.gameContainer.getContext("2d");
    [this.gameContainer.width, this.gameContainer.height] = [containerSize, containerSize];
    //map
    this.ratio = containerSize/playerSize;
    this.ps = playerSize;
    this.board = new Board(this.ratio);
    //players
    this.players = [
      //human
      //new Player(0, [20,15], 'rgba(10,15,180,1)', ['ArrowUp', 'ArrowRight', 'ArrowDown','ArrowLeft']),
      //new Player(1, [9,15], 'rgba(75,05,180,1)', ['KeyW', 'KeyD', 'KeyS','KeyA']),
      //bots
      new Player(0, this.board.getFreeSpaceCoordinates(), 'rgba(10,10,180,1)', []),
      new Player(1, this.board.getFreeSpaceCoordinates(), 'rgba(180,10,10,1)', []),
      new Player(2, this.board.getFreeSpaceCoordinates(), 'rgba(10,180,10,1)', []),
    ];
    this.players.forEach((p) => p.joinGame(this.board.state));
    //game loop
    this.progress=0, this.lastRender=0, this.slowMo=7;
    this.game();
  }
  game(){
    var last = performance.now();
    var self = this;

    function loop(timestamp) {
      self.progress += (timestamp - self.lastRender);
      //update
      var additionalProgress = Math.round(self.progress/self.slowMo/self.ratio);
      if(additionalProgress){
        self.players.forEach((plr) => {
          if(plr.alive){
            var killed =  plr.update(self.board.state);
            killed.forEach((plr) =>{self.players[plr].removePlayer(self.board.state);});
          }
        });
        self.players.forEach((plr) => {if(!plr.alive){self.revive(plr)}});
      }
      //draw
      self.render();
      //update game loop
      self.lastRender = timestamp;
      self.progress = (additionalProgress!=0)?0:self.progress;
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  }

  revive(plr){
    let loc = this.board.getFreeSpaceCoordinates();
    if(loc)
      plr.joinGame(this.board.state,...loc);
  }

  render(){
    this.ctx.clearRect(0, 0, this.gameContainer.width, this.gameContainer.height);
    this.board.state.forEach((r,i) => {
      r.forEach((c,j) => {
        if(c.under === Under.conquered){
          this.ctx.beginPath();
          this.ctx.shadowOffsetY = 0;
          this.ctx.fillStyle = this.players[c.uid].conquerColor;
          this.ctx.rect(j*this.ps, i*this.ps, this.ps, this.ps);
          this.ctx.fill();
        }
        if(c.over === Over.trail){
          this.ctx.beginPath();
          this.ctx.shadowOffsetY = 0;
          this.ctx.fillStyle = this.players[c.oid].trailColor;
          this.ctx.rect(j*this.ps, i*this.ps, this.ps, this.ps);
          this.ctx.fill();
        }
        else if(c.over === Over.player){
          this.ctx.shadowColor = 'rgb(64,64,64)';
          this.ctx.shadowOffsetY = 2;
          this.ctx.beginPath();
          this.ctx.fillStyle = this.players[c.oid].color;
          this.ctx.rect(j*this.ps, i*this.ps, this.ps, this.ps);
          this.ctx.fill();
        }
      });
    });
  }
}

var board = new Game('game1', 600, 20)
