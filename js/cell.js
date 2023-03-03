const Over = {
  none: 0,
  player: 1,
  trail: 2
};
const Under = {
  empty: 0,
  conquered: 1,
  wall:2
};

class Cell{
  constructor(uid=null, under=Under.empty, oid=null, over=Over.none) {
    this.uid = uid;
    this.under = under;
    this.oid = oid;
    this.over = over;
  }

  getCellInfo(){
    return [this.uid,this.under,this.oid,this.over];
  }

  setCellInfo(uid=null,under=Under.empty,oid=null,over=Over.none){
    this.uid = uid;
    this.oid = oid;
    this.under = under;
    this.over = over;
  }

  setOver(oid=null,over=Over.none){
    this.oid = oid;
    this.over = over;
  }

  setUnder(uid=null,under=Under.empty){
    this.uid = uid;
    this.under = under;
  }

  empty(){
    return this.under == Under.empty && this.over == Over.none;
  }

  remPlayer(id){
    if(this.uid === id){
      this.uid = null;
      this.under = Under.empty;
    }
    if(this.oid === id){
      this.oid = null;
      this.over = Over.none;
    }
  }
}
