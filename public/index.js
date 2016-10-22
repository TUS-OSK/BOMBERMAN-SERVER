let roomList, isPlayMode;

function display(){ // モードに合わせて部屋を表示する関数
  $('#displayList').empty();
  if(isPlayMode == false){ // 観戦モード
    $.get("/api/room/list", (data) => { // roomListの取得、htmlに書き込み
      roomList = data.data;
      for(let val of roomList){
        dispList(val, false);
      }
    });
    $('body').removeClass("playing").addClass("notPlaying");
    $('h1').removeClass("playing").addClass("notPlaying");
    $('#displayList span').removeClass("playing").addClass("notPlaying");
    $('button[id=makeRoom]').remove();
    $('#displayMode').html('観戦モード');
    $('#changeMode').html('参戦モードへ');
  } else { // 参戦モード
    isPlayMode = true;
    $.get("/api/room/list", (data) => { // roomListの取得、htmlに書き込み
      roomList = data.data;
      for(let val of roomList){
        if(val.population >= 8) continue;
        dispList(val, true);
      }
    });
    $('body').removeClass("notPlaying").addClass("playing");
    $('h1').removeClass("notPlaying").addClass("playing");
    $('#displayList span').removeClass("notPlaying").addClass("playing");
    $('button[id=makeRoom]').remove();
    $('#displayMode').html('参戦モード');
    $('#changeMode').html('観戦モードへ');
    // 部屋を作るボタンを作る
    $(`<button id="makeRoom">
      <span class="mainInfo">new Room</span>
      </button>`).insertAfter('div[id=displayList]');
    $("button[id=makeRoom]").click(() => { // 部屋を作るボタンの設定
      $.post("/api/room/make", (data) => {
        $.post("/api/room/" + data.data + "/connect", (data) => { // 何か投げる (予定)
          console.log(data);
        });
      });
    });
  }
  function dispList(val,isPlayMode){ // Listのvalをもとにhtmlに書き込む関数
    let html = `<button class="room ${isPlayMode == false ? 'notPlaying' : 'playing'}" onClick=clickedButton('${val.id}')>
    <span class="mainInfo">${('00' + val.number).slice(-3)}</span><br>
    <span class="addInfo">member ${val.population}/8</span>
    </button>`;
    $("#displayList").append(html);
  }
}

function clickedButton(id){ // clickされたButtonの内容を送る?関数 (予定)
  if(isPlayMode){
    $.post(`/api/room/${id}/connect`, (data) => {
      console.log(data);
    });
  } else {
    $.post(`/api/room/${id}/watch`, (data) => {
      console.log(data);
    });
  }
}

function changeMode(){ // モードを変える
  if(isPlayMode == true){
    isPlayMode = false;
    display();
  } else {
    isPlayMode = true;
    display();
  }
}

window.mw = new window.Middleware();
