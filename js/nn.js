function gaussianRandom() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}


const activations = {
  	sigmoid: (x) => math.dotDivide(1, math.add(1,math.exp(math.multiply(-1,x)))),
  	relu: (x) => x.map(function(r){return r.map(function(c){return Math.max(0,c);});})
};

const activations_bp = {
	sigmoid: (dA, Z) => math.dotMultiply(dA,math.dotMultiply(activations["sigmoid"](Z), math.subtract(1,activations["sigmoid"](Z)))),
	relu: (dA, Z) => dA.map((row,i)=>row.map((col,j)=>(Z[i][j]<=0)?0:col))
}

const costs ={
	"cross-entrophy": (AL,Y)=> (-1/Y.length)*math.sum(math.add(math.dotMultiply(Y, math.log(AL)), math.dotMultiply(math.subtract(1,Y), math.log(math.subtract(1,AL))))),
	"mse": (AL,Y)=> (1/Y.length)*math.sum(math.square(math.subtract(Y,AL))),
}

const costs_bp = {
	"cross-entrophy": (AL,Y) => math.multiply(-1,math.subtract(math.dotDivide(Y, AL),math.dotDivide(math.subtract(1,Y),math.subtract(1,AL)))),
	"mse": (AL,Y) => math.multiply(-2/AL[0].length, math.subtract(Y,AL))
}

const weightInitialize = (size) =>{
    return gaussianRandom()*Math.sqrt(2/size);
};


class nn {
	constructor(nnShape, costf, learningRate) {
  		this.cache = [];
  		this.costf = costf;
		this.layers = nnShape;
		this.learningRate = learningRate;
  		this.parameters = this.initializeParameters();
	};

	train(xs, ys, iterations=1){
		for(var i=0; i<iterations; i++){
        	var prediction = this.modelForward(xs)
        	var cost = this.computeCost(prediction, ys)
        	//console.log(cost)
        	var grads = this.modelBackward(prediction, ys)
        	this.updateParameters(grads)
    	}
	}

	predict(xs){
		return this.modelForward(xs)
	}

  	initializeParameters(nnShape){
  		var parameters = {};
  		for(var layer=1; layer < this.layers.length; layer++){
  			parameters['W' + layer] = Array.from(Array(this.layers[layer][0]), () => Array.from(Array(this.layers[layer-1][0])).map(x=>weightInitialize(this.layers[layer-1][0])))
        	parameters['b' + layer] = Array(this.layers[layer][0]).fill(Array(1).fill(0));
  		}
    	return parameters
  	}

  	modelForward(X){
  		this.cache = []
  		var prevLayer = math.transpose(X);
	    for(var layer=1; layer < Math.floor(Object.keys(this.parameters).length/2)+1; layer++){
			var W = this.parameters['W' + layer]
			var b = this.parameters['b' + layer]
			var Z = math.multiply(W, prevLayer)
			var Z = Z.map((row,i)=>row.map((col)=>col+parseFloat(b[i])))
			this.cache.push([prevLayer, W, b, Z])
			prevLayer = (this.layers[layer].length < 2)?Z:activations[this.layers[layer][1]](Z);
	    }
	    return prevLayer
  	}

  	modelBackward(AL, Y){
  		var grads = {}
    	var m = AL[0].length
  		Y = math.reshape(Y, [AL.length, AL[0].length])
    	var dA_prev = costs_bp[this.costf](AL,Y)

    	for(var layer=this.cache.length; layer>0; layer--){
    		var [A_prev, W, b, Z] = this.cache[layer-1];
    		var dZ = (this.layers[layer].length < 2)?dA_prev:activations_bp[this.layers[layer][1]](dA_prev, Z)
    		var dW = math.multiply(1/m, math.multiply(dZ, math.transpose(A_prev)));
			var db = math.multiply(1/m, dZ.map(r => [r.reduce((a, b) => a + b)]));
    		var dA_prev = math.multiply(math.transpose(W), dZ);
			grads["dA" + (layer)] = dA_prev;
        	grads["dW" + (layer)] = dW;
        	grads["db" + (layer)] = db;
    	}
    	return grads
  	}

  	computeCost(AL, Y){
  		return costs[this.costf](math.transpose(AL),Y);
  	}

  	updateParameters(grads){
  		for(var layer=1; layer<Math.floor(Object.keys(this.parameters).length/2)+1; layer++){
  			this.parameters["W" + layer] = math.subtract(this.parameters["W" + layer], math.dotMultiply(this.learningRate, grads["dW" + layer]));
  			this.parameters["b" + layer] = math.subtract(this.parameters["b" + layer], math.dotMultiply(this.learningRate, grads["db" + layer]));
  		}
  	}
}
