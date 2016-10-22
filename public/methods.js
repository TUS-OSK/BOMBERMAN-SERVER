const methods = {
  setBomb(x,y,time){

  },
  move(user,x,y,time){

  },
  setItem(item,x,y,time){

  },
};

// mw.on("setBomb", methods.setBomb);

Object.keys(methods).forEach((key) => {
  mw.on(key, methods[key]);
});
