class Agent {
  constructor(inSize) {
    this.discountFactor = 0.9;
		this.explorationFactor = 0.05;
		this.experience = [];
    this.inSize = inSize;
  	this.model = new nn([[inSize], [20, "sigmoid"], [3]], "mse", 0.001)
    this.model.parameters = trainedModel;
    //if(JSON.parse(localStorage.getItem('PARAMS')) != null)
    //  this.model.parameters = JSON.parse(localStorage.getItem('PARAMS'))
  }

 getBestMove(state){
    //EXPLORATION
	  if(Math.random() < this.explorationFactor)
		  return Math.floor(Math.random() * 3);
	  //EXPLOITATION
	  else
      return this.model.predict([state]).reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  }

  train(state, nextState, reward){

    //if(nextState == null){
    //  this.model.train([state], [reward]);
    //  this.explorationFactor *=.99999
    //}
	  //else{
	  //  var nextRewards = this.model.predict([nextState]);
	  //  var newVal = math.dotMultiply(this.discountFactor, nextRewards.flat());
    //  newVal = math.add(reward, newVal);
    //  this.model.train([state], [newVal]);
	  //}
  }
}
