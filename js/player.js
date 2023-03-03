class Player{
  constructor(id, coords, color, controls=[]){
    //player logistics
    this.trail = {};
    this.alive = false;
    this.direction = 0;
    this.playerId = id;
    this.controls = controls;
    [this.y, this.x] = coords;
    //agent
    this.agent = new Agent();
    this.bot = (controls.length!==4);
    //colors
    this.color = color;
    this.trailColor = this.color.replace(/[^,]+(?=\))/, '0.4');
    this.conquerColor = this.color.replace(/[^,]+(?=\))/, '.7');
    //Key events
    if(this.controls.length == 4)
      window.addEventListener('keydown',this.changeDirection.bind(this),false);
  }

  nextPos(state){
    let nextY = this.y + (this.direction==2?1:this.direction==0?-1:0)
    let nextX = this.x + (this.direction==1?1:this.direction==3?-1:0)
    //check out of bounds
    if(!(state[nextY]||[])[nextX])
      return null
    return {y:nextY, x:nextX, new:state[nextY][nextX], old:state[this.y][this.x]}
  }

  changeDirection(e) {
    if(e.code == this.controls[0]) this.direction = 0;
    if(e.code == this.controls[1]) this.direction = 1;
    else if(e.code == this.controls[2]) this.direction = 2;
    else if(e.code == this.controls[3]) this.direction = 3;
  }

  removePlayer(state){
    this.alive = false;
    state.forEach((r,i) => {r.forEach((c,j) => {c.remPlayer(this.playerId);})})
  }

  update(state){
    let killed = [];
    let [botdir, currState, reward, train] = [1, null, [0,0,0],true];

    if(this.bot){
      currState = this.playerView(state)[0];
      botdir = this.agent.getBestMove(currState)
      if(botdir == 0)
          this.direction = (this.direction-1<0)?3:this.direction-1
      else if(botdir == 2)
          this.direction = (this.direction+1>3)?0:this.direction+1
    }

    //get next position
    let pos = this.nextPos(state)
    //if out of bounds
    if(!pos){
      reward[botdir] -= 1;
      this.agent.train(currState, null, reward);
      return [this.playerId];
    }
    //if on own trail
    else if(pos.new.oid===this.playerId && pos.new.over === Over.trail){
      reward[botdir] -= 1;
      this.agent.train(currState, null, reward);
      return [this.playerId];
    }
    //if on another player
    else if(pos.new.oid!==this.playerId && pos.new.over === Over.player){
      reward[botdir] -= 1;
      this.agent.train(currState, null, reward);
      return [this.playerId];
    }
    //if on opponent trail
    else if(pos.new.oid !== this.playerId && pos.new.over === Over.trail){
      reward[botdir] += 5;
      killed.push(pos.new.oid);
    }
    //update trail
    if(pos.new.uid !== this.playerId){
      if(Object.keys(this.trail).length===0){reward[botdir] += 1; this.agent.train(currState, null, reward); train=false;}
      this.trail[[pos.y,pos.x]] = 1;
    }
    //update position
    pos.new.setOver(this.playerId,Over.player);
    pos.old.setOver();
    if(pos.old.uid !== this.playerId)
      pos.old.setOver(this.playerId,Over.trail);
    [this.y, this.x] = [pos.y,pos.x];
    //if new conquered
    if(pos.new.uid === this.playerId && Object.keys(this.trail).length > 0){
      let [score, kills] = this.fillConquered(state);
      reward[botdir] += Math.min(10,score);
      killed.push(...kills);
      this.agent.train(currState, null, reward);
      return killed;
    }
    //train continuous actions
    if(this.bot && train){
      var [nextState, tf] = this.playerView(state);
      reward[botdir] -= tf;
      this.agent.train(currState, nextState, reward);
    }
    return killed;
  }

  joinGame(state, y=this.y, x=this.x){
    this.alive = true;
    [this.y, this.x] = [y,x];
    this.trail = {};
    this.direction = 0;
    for(var i=-1; i<2; i++)
      for(var j=-1; j<2; j++)
        state[y+j][x+i].setCellInfo(this.playerId, Under.conquered);
    state[y][x].setOver(this.playerId, Over.player);
  }

  fillConquered(state){
    var [conqueredBlocks, killed] = [0,[]]

    for(let [key, value] of Object.entries(this.trail)){
      var [Y,X] = key.split(",").map(Number);
      conqueredBlocks += 1
      state[Y][X].setCellInfo(this.playerId, Under.conquered);
    }
    this.trail = {};
    var [Row,Col,copy] = [state.length, state[0].length, state.map(arr => arr.slice())];

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
          copy[i][j] = (copy[i][j].uid != this.playerId)?'-':'O';

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
          if(state[i][j].under !== Under.empty)
            if(state[i][j].uid != this.playerId)
              killed.push(state[i][j].uid);
          state[i][j].setCellInfo(this.playerId, Under.conquered);
          conqueredBlocks += 1;
        }
      }
    }
    return [conqueredBlocks, killed]
  }

  playerView(state, playerCtx=null){
    let [x,y] = [this.agent.visionArea[0], this.agent.visionArea[1]]
    let [xShift,yShift] = [Math.floor(x/2),Math.floor(y/2)]
    var vis = state.filter((_, i) => i >= (this.y-yShift) && i < (this.y-yShift + y)).map(a => a.slice(Math.max(0,this.x-xShift), Math.max(0,this.x-xShift) + x+Math.min(0,this.x-xShift)))

    if(vis[0].length<x && this.x>state[0].length/2)
      for (var i = 0; i < vis.length; i++)
        vis[i].push(...Array(x-vis[i].length).fill(new Cell(null,Under.wall)));
    else if(vis[0].length<x && this.x<state[0].length/2)
      for (var i = 0; i < vis.length; i++)
        vis[i].unshift(...Array(x-vis[i].length).fill(new Cell(null,Under.wall)));
    if(vis.length<y && this.y>state.length/2)
      for (var i = vis.length; i < y; i++)
        vis.push(Array(y).fill(new Cell(null,Under.wall)))
    else if(vis.length<y && this.y<state.length/2)
      for (var i = vis.length; i < y; i++)
        vis.unshift(Array(y).fill(new Cell(null,Under.wall)))
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

    if(playerCtx){
      playerCtx.clearRect(0, 0, 220, 220);
      for(var i=0; i<vis.length; i++){
        for(var j=0; j<vis[0].length; j++){
          let [uid,ut,oid,ot] = [vis[i][j].uid, vis[i][j].under, vis[i][j].oid, vis[i][j].over];

          playerCtx.beginPath();
          playerCtx.shadowOffsetY = 0;

          var color = 'rgba(255,255,255,.0)'
          if(ut === Under.wall) color = 'rgba(0,0,0, .8)';
          else if(ot === Over.trail && oid === this.playerId) color = this.trailColor;
          else if(ot === Over.trail && oid !== this.playerId) color = 'rgba(220,220,220, .4)';
          else if(ot === Over.player && oid === this.playerId) color = this.color;
          else if(ot === Over.player && oid !== this.playerId) color = 'rgba(220,220,220, 1)';
          else if(ut === Under.conquered && uid === this.playerId) color = this.conquerColor;
          else if(ut === Under.conquered && uid !== this.playerId) color = 'rgba(220,220,220, .7)';

          let sz = 20
          playerCtx.fillStyle = color;
          playerCtx.rect(j*sz, i*sz, sz,sz);
          playerCtx.fill();
        }
      }
    }

    let tooFar = true;
    for(var i=0; i<vis.length; i++){
        for(var j=0; j<vis[0].length; j++){
          let [uid,ut,oid,ot] = [vis[i][j].uid, vis[i][j].under, vis[i][j].oid, vis[i][j].over];

          vis[i][j] = [0,0,0,0,0,0];
          if(ut === Under.wall) vis[i][j]  = [1,0,0,0,0,0];
          else if(ot === Over.trail && oid === this.playerId) vis[i][j] = [0,1,0,0,0,0];
          else if(ot === Over.trail && oid !== this.playerId) vis[i][j] = [0,0,1,0,0,0];
          else if(ot === Over.player && oid === this.playerId) vis[i][j] = [];
          else if(ot === Over.player && oid !== this.playerId)  vis[i][j] = [0,0,0,1,0,0];
          else if(ut === Under.conquered && uid === this.playerId) {tooFar=false; vis[i][j] = [0,0,0,0,1,0]}
          else if(ut === Under.conquered && uid !== this.playerId) vis[i][j] = [0,0,0,0,0,1];
        }
    }
    return [vis.flat().flat(),tooFar]
  }
}
