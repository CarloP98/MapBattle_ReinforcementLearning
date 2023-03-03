class Agent {
  constructor() {
    //experience replay
    this.trainAgent = false;
    this.visionArea = [13,13];
    this.discountFactor = 0.9;
	  this.experience = [];
    this.inSize = (this.visionArea[0] * this.visionArea[1] * 6) - 6;
	  this.model = new nn([[(13*13*6)-6], [20, "relu"], [3]], "mse", 0.0001, {optimizer: "adam"});;
    this.replay = [];
    this.plays = 0;
    this.explore = this.trainAgent?0.9:0.01;
    this.model.parameters = trainedModel;
    //this.model.parameters = JSON.parse(localStorage.getItem('PARAMS'));
  }

  getBestMove(state){
    //EXPLORATION
    if(Math.random() < this.explore)
      return Math.floor(Math.random() * 3);
	  //EXPLOITATION
	  else
      return argMax(this.model.predict([state]).flat());
  }

  train(state, nextState, reward){
    if(!this.trainAgent)
      return
      if(nextState == null){
        this.model.train([state], [reward]);
        this.replay.push({state: state, reward: reward});
      }
      else{
        var nextRewards = this.model.predict([nextState]);
        var newVal = mul(this.discountFactor, nextRewards.flat());
        newVal = sum(reward, newVal);
        this.model.train([state], [newVal]);
        this.replay.push({state: state, reward: newVal});
      }
      //experience replay
      if(this.replay.length > 100){
        let [Xbatch,Ybatch] = [[],[]];
        for(var x=0; x<100; x++){
          let action =  this.replay[Math.floor(Math.random() * this.replay.length)];
          Xbatch.push(action.state);
          Ybatch.push(action.reward);
        }
        this.model.train(Xbatch, Ybatch);
        replay = [];
      }

      this.plays+=1;
      if(this.plays%2000==0){
        this.explore *= .999
        console.log(`trains:${this.plays}, explore:${this.explore}`)
        localStorage.setItem('PARAMS', JSON.stringify(this.model.parameters));
      }
    }
}
