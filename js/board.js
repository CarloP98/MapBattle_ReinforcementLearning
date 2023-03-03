class Board{
  constructor(size) {
    this.state = Array.from({ length: size }, () => Array.from({ length: size }, () => new Cell()));
  }

  getFreeSpaceCoordinates() {
    let S = this.state.map(function(arr){return [...arr]})
    let [rows, cols] = [S.length,S[0].length];

    for(var x=0; x<rows; x++)
      S[x][0] = (S[x][0].empty())?1:0
    for(var x=1; x<cols; x++)
      S[0][x] = (S[0][x].empty())?1:0

    var [max_of_s, max_i, max_j] = [S[0][0], 0, 0];
    for(var i = 1; i < rows; i++)
      for(var j = 1; j < cols; j++)
        if(S[i][j].empty()){
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
