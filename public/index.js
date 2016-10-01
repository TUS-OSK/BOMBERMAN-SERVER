let roomList, isPlayMode;

function display(){
  $('#displayList').empty();
  if(isPlayMode == false){
    $.get("/api/room/list", (data) => {
      roomList = data.data;
      for(let val of roomList){
        let html = `<button class="room notPlaying" onClick=clickedButton('${val.id}')>
        <span class="mainInfo">${('00' + val.number).slice(-3)}</span><br>
        <span class="addInfo">member ${val.population}/8</span>
        </button>`;
        $("#displayList").append(html);
        $('body').removeClass("playing").addClass("notPlaying");
      }
    });
  } else {
    isPlayMode = true;
    $.get("/api/room/list", (data) => {
      roomList = data.data;
      for(let val of roomList){
        if(val.population >= 8) continue;
        let html = `<button class="room playing" onClick=clickedButton('${val.id}')>
        <span class="mainInfo">${('00' + val.number).slice(-3)}</span><br>
        <span class="addInfo">member ${val.population}/8</span>
        </button>`;
        $("#displayList").append(html);
        $('body').removeClass("notPlaying").addClass("playing");
      }
    });
  }
}

function clickedButton(id){
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

function changeMode(){
  if(isPlayMode == true){
    isPlayMode = false;
  } else {
    isPlayMode = true;
  }
  if(isPlayMode == false){
    display();
    $('#displayMode').html('観戦');
    $('#changeMode').html('参戦モードへ');
    $('button[id=makeRoom]').remove();
  } else {
    display();
    $('#displayMode').html('参戦');
    $('#changeMode').html('観戦モードへ');
    $('button[id=makeRoom]').remove();
    $(`<button id="makeRoom">
      <span class="mainInfo">new Room</span>
      </button>`).insertAfter('div[id=displayList]');
    $("button[id=makeRoom]").click(() => {
      $.post("/api/room/make", (data) => {
        $.post("/api/room/" + data.data + "/connect", (data) => {
          console.log(data);
        });
      });
    });
  }
}
