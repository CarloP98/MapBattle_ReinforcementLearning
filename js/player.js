class Player{
  constructor(id, coords, state, size,  color, controls=[]){
    this.size = size
    this.bot = (controls.length==0);
    this.playerId = id;
    this.near = true
    this.visionArea = [7,7];
    this.controls = controls;
    this.agent = new Agent((7 * 7*6)-6);
    this.direction = 0;
    this.alive = true

    this.color = color;
    this.trailColor = this.color.replace(/[^,]+(?=\))/, '0.4');
    this.conquerColor = this.color.replace(/[^,]+(?=\))/, '.7');

    this.trail = {};
    this.trailStart = null;
    this.conqueredSpace = {};
    [this.x, this.y] = coords;

    this.joinGame(state, this.x, this.y);

    if(this.controls.length == 4)
      window.addEventListener('keydown',this.changeDirection.bind(this),false);
  }

  changeDirection(e) {
    if(e.code == this.controls[0]) this.direction = 0;
    if(e.code == this.controls[1]) this.direction = 1;
    else if(e.code == this.controls[2]) this.direction = 2;
    else if(e.code == this.controls[3]) this.direction = 3;
  }

  fillConquered(state){
    var conqueredBlocks = 0
    var conqueredDict = {}

    for(let [key, value] of Object.entries(this.trail)){
      conqueredBlocks += 1
      var [Y,X] = key.split(",").map(Number);
      if(this.trail[[Y,X]] != '0'){
        var plr = this.trail[[Y,X]].replace(/(^\d+)(.+$)/i,'$1')
        if(!conqueredDict[plr])
          conqueredDict[plr]=[]
        conqueredDict[plr].push([Y,X])
      }
      else if (this.trail[[Y,X]].substr(-1) == 'c')
      {
        var plr = this.trail[[Y,X]].replace(/(^\d+)(.+$)/i,'$1')
      }
      this.conqueredSpace[[Y,X]]=this.playerId;
      state[Y][X] = this.playerId +'c';
    }

    var Row = state.length;
    var Col = state[0].length;
    var copy = state.map(arr => arr.slice());

    function floodFillUtil(x,y){
      if (x < 0 || x >= Row || y < 0 || y >= Col)
        return
      if (copy[x][y] != '-')
        return
      copy[x][y] = state[x][y];
      floodFillUtil(x + 1, y);
      floodFillUtil(x - 1, y);
      floodFillUtil(x, y + 1);
      floodFillUtil(x, y - 1);
    }

    for (let i = 0; i < Row; i++)
      for (let j = 0; j < Col; j++)
        if(this.conqueredSpace[[i,j]])
          copy[i][j] = 'O';
        else if (parseInt(copy[i][j].charAt(0)) != this.playerId)
          copy[i][j] = '-';
        else
          copy[i][j] = 'O';

    for (let i = 0; i < Row; i++)
      if (copy[i][0] == '-')
        floodFillUtil(i, 0);
    for (let i = 0; i < Row; i++)
      if (copy[i][Col - 1] == '-')
        floodFillUtil(i, Col - 1);
    for (let i = 0; i < Col; i++)
      if (copy[0][i] == '-')
        floodFillUtil(0, i);
    for (let i = 0; i < Col; i++)
      if (copy[Row - 1][i] == '-')
        floodFillUtil(Row - 1, i);

    for (let i = 0; i < Row; i++){
      for (let j = 0; j < Col; j++){
        if (copy[i][j] == '-'){
          if(state[i][j] != '0'){
            var plr = state[i][j].replace(/(^\d+)(.+$)/i,'$1')
            var type = state[i][j].substr(-1)
            if(plr != this.playerId){
              if(!conqueredDict[plr])
                conqueredDict[plr]=[]
              conqueredDict[plr].push([i,j])
            }
          }
          state[i][j] = this.playerId + "c"
          this.conqueredSpace[[i,j]]=1;
          conqueredBlocks += 1
        }
      }
    }
    return [conqueredBlocks, conqueredDict]
  }

  clear(state){
    state[this.y][this.x] = '0';
    for(let [key, value] of Object.entries(this.trail)){
      var [Y,X] = key.split(",").map(Number);
      state[Y][X] = '0';
    }
    for(let [key, value] of Object.entries(this.conqueredSpace)){
      var [Y,X] = key.split(",").map(Number);
      state[Y][X] = '0';
    }
    this.trail = {}
    this.conqueredSpace = {}
    this.alive = false
  }

  reset(state, coords){
    this.alive = true
    this.x = coords[1];
    this.y = coords[0];
    this.direction = 0;
    this.joinGame(state, this.x, this.y)
  }

  render(ctx){
    if(!this.alive)
      return

    for(let [key, value] of Object.entries(this.conqueredSpace)){
      ctx.beginPath();
      var [Y,X] = key.split(",").map(Number);
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = this.conquerColor;
      ctx.rect(X*this.size, Y*this.size, this.size, this.size);
      ctx.fill();
    }
    for(let [key, value] of Object.entries(this.trail)){
      var [Y,X] = key.split(",").map(Number);
      ctx.beginPath();
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = this.trailColor;
      ctx.rect(X*this.size, Y*this.size, this.size, this.size);
      ctx.fill();
    }
      ctx.shadowColor = 'rgb(64,64,64)';
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.rect(this.x*this.size, this.y*this.size, this.size, this.size);
      ctx.fill();

    //vision area
    //ctx.beginPath();
    //ctx.fillStyle = 'rgba(128,128,128, .1)';
    //ctx.rect(this.x*this.size-((this.visionArea[0]*this.size-this.size)/2), this.y*this.size-((this.visionArea[1]*this.size-this.size)/2), this.visionArea[0]*this.size, this.visionArea[1]*this.size);
    //ctx.fill();
  }

  update(state){
    state[this.y][this.x] = this.playerId+'p';
    var currState = this.nnInput(state)
    var reward = [0,0,0];
    var ret = null;

    //if bot, get best direction
    if(this.bot){
      var botDirection = this.agent.getBestMove(currState)
      if(botDirection == 0)
          this.direction = (this.direction-1<0)?3:this.direction-1
      else if(botDirection == 2)
          this.direction = (this.direction+1>3)?0:this.direction+1
    }

    //calculate new position
    var nextX = this.x + (this.direction==1?1:this.direction==3?-1:0)
    var nextY = this.y + (this.direction==2?1:this.direction==0?-1:0)

    //check if out of bounds
    if ((state[nextY]||[])[nextX] === undefined){
      this.alive = false
      reward[botDirection] -= .25
      this.agent.train(currState, null, reward)
      return [this.playerId, null, []]
    }

    var nb = state[nextY][nextX]
    var nbPlayerId = nb.replace(/(^\d+)(.+$)/i,'$1');
    var nbType = nb.substr(-1)

    if(nbType == 'c' && nbPlayerId!=this.playerId)
      reward[botDirection] += .1
    if(nbType == 't'){
      if(nbPlayerId==this.playerId){
        this.alive = false
        reward[botDirection] -= .25
        this.agent.train(currState, null, reward)
        return [this.playerId, null, []]
      }
      else{
        reward[botDirection] += .8
        ret = nbPlayerId
      }
    }

    if(!([nextY,nextX] in this.conqueredSpace)){
      this.trail[[nextY,nextX]] = state[nextY][nextX];
      if(Object.keys(this.trail).length==1)
        this.trailStart = [this.y,this.x]
      //else if(Object.keys(this.trail).length>6)
      //  reward[botDirection] -= (6-Object.keys(this.trail).length) * .1
    }


    //perform move
    state[this.y][this.x] = this.playerId+(([this.y,this.x] in this.conqueredSpace)?'c':'t');
    [this.x, this.y] = [nextX, nextY]
    state[this.y][this.x] = this.playerId+'p';

    //accumulate new conquered space
    if([nextY,nextX] in this.conqueredSpace){
      reward[botDirection] -= 0.05
      this.trailStart = null
      if(Object.keys(this.trail).length > 0){
        const [score, conc] = this.fillConquered(state)
        reward[botDirection] += score*.1
        //var nextState = this.nnInput(state, Object.keys(this.trail).length)
        this.agent.train(currState, null, reward)
        this.trail = {}
        return [ret, conc]
      }
    }
    else {
      //reward[botDirection] += 0.01
    }

    //train
    this.nnInput(state, true)
    if(this.bot){
      var nextState = this.nnInput(state)
      this.agent.train(currState, nextState, reward)
    }
    return [ret, null, []]
  }

  nnInput(state, show = false){
    var xShift = Math.floor(this.visionArea[0]/2)
    var yShift = Math.floor(this.visionArea[1]/2)

    var vis = state.filter((_, i) => i >= (this.y-yShift) && i < (this.y-yShift + this.visionArea[1])).map(a => a.slice(Math.max(0,this.x-xShift), Math.max(0,this.x-xShift) + this.visionArea[0]+Math.min(0,this.x-xShift)))
    if(vis[0].length<this.visionArea[0] && this.x>state[0].length/2)
      for (var i = 0; i < vis.length; i++)
        vis[i].push(...Array(this.visionArea[0]-vis[i].length).fill("W"));
    else if(vis[0].length<this.visionArea[0] && this.x<state[0].length/2)
      for (var i = 0; i < vis.length; i++)
        vis[i].unshift(...Array(this.visionArea[0]-vis[i].length).fill("W"));
    if(vis.length<this.visionArea[1] && this.y>state.length/2)
      for (var i = vis.length; i < this.visionArea[1]; i++)
        vis.push(Array(this.visionArea[1]).fill("W"))
    else if(vis.length<this.visionArea[1] && this.y<state.length/2)
      for (var i = vis.length; i < this.visionArea[1]; i++)
        vis.unshift(Array(this.visionArea[1]).fill("W"))

        if(this.direction == 3)
          vis = vis[0].map((val, index) => vis.map(row => row[index]).reverse())
          else if(this.direction == 2)
          vis.reverse().forEach(function(item) { item.reverse(); } );
          else if(this.direction == 1){
            vis = vis.map(function(row) {
              return row.reverse();
            });
            for (var i = 0; i < vis.length; i++) {
              for (var j = 0; j < i; j++) {
                var temp = vis[i][j];
                vis[i][j] = vis[j][i];
                vis[j][i] = temp;
              }
            }
          }

    //if(false){
    //playerViewCtx.clearRect(0, 0, 220, 220);
    //for(var i=0; i<vis.length; i++){
    //    for(var j=0; j<vis[0].length; j++){
    //      var player = vis[i][j].replace(/(^\d+)(.+$)/i,'$1')
    //      var type = vis[i][j].substr(-1)

    //      playerViewCtx.beginPath();
    //      playerViewCtx.shadowOffsetY = 0;

    //      var color = 'rgba(10,10,10,0)'
    //      if(type == "t") color = 'rgba(10,10,180,0.5)'
    //      else if(type == "c") color = 'rgba(10,10,180,1)'
    //      else if(type == "p") color = 'rgba(10,10,180,1)'
    //      else if(type == "W") color = 'rgba(108,122,137, .8)'

    //      playerViewCtx.fillStyle = color;
    //      playerViewCtx.rect(j*this.size, i*this.size, this.size, this.size);
    //      playerViewCtx.fill();
    //    }
    //  }
    //}


    for(var i=0; i<vis.length; i++){
        for(var j=0; j<vis[0].length; j++){
          var player = vis[i][j].replace(/(^\d+)(.+$)/i,'$1')
          var type = vis[i][j].substr(-1)

          if(type == '0')
            vis[i][j] = [0,0,0,0,0,0]
          else if(type == 'W')
            vis[i][j] = [1,0,0,0,0,0]

          else if(player == this.playerId){
            if(type == 't')
              vis[i][j] = [0,1,0,0,0,0]
            else if(type == 'c')
            {
              this.near = true
              vis[i][j] = [0,0,1,0,0,0]
            }
            else if(type == 'p')
              vis[i][j] = []
          }
          else{
            if(type == 't')
              vis[i][j] = [0,0,0,1,0,0]
            else if(type == 'c')
              vis[i][j] = [0,0,0,0,1,0]
            else if(type == 'p')
              vis[i][j] = [0,0,0,0,0,1]
          }
        }
    }
    return vis.flat().flat()//.concat([Object.keys(this.trail).length/10])
  }

  joinGame(state, x, y){
    for(var i=-1; i<2; i++)
      for(var j=-1; j<2; j++){
        this.conqueredSpace[[y+j,x+i]]=1
        state[y+j][x+i] = this.playerId + 'c';
      }
      state[y][x] = this.playerId + 'p';
  }
}
