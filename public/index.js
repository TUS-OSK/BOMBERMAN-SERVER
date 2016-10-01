let roomList = [];

let isPlayMode = true;

display();

function display(){
  $('#displayList').empty();
  if(isPlayMode){
    $.get("/api/room/list", (data) => {
      roomList = data.data;
      for(let i in roomList){
        if(roomList[i].population >= 8) continue;
        let html = `<button class="room playing" onClick=clickedButton('${roomList[i].id}')>
        <span class="mainInfo">${('00' + roomList[i].number).slice(-3)}</span><br>
        <span class="addInfo">member ${roomList[i].population}/8</span>
        </button>`;
        $("#displayList").append(html);
      }
    });
  } else {
    $.get("/api/room/list", (data) => {
      roomList = data.data;
      for(let i in roomList){
        let html = `<button class="room notPlaying" onClick=clickedButton('${roomList[i].id}')>
        <span class="mainInfo">${('00' + roomList[i].number).slice(-3)}</span><br>
        <span class="addInfo">member ${roomList[i].population}/8</span>
        </button>`;
        $("#displayList").append(html);
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

$('button[id=changeMode]').click(() => {
  if(isPlayMode){
    isPlayMode = false;
  } else {
    isPlayMode = true;
  }
});

function changeMode(){
  if(isPlayMode){
    display();
    $('#displayMode').html('参戦');
    $('#changeMode').html('観戦モードへ');
    $('button[id=makeRoom]').remove();
    $(`<button id="makeRoom">
      <span class="mainInfo">new Room</span>
    </button>`).insertAfter('div[id=displayList]');
    $('body').removeClass("notPlaying").addClass("playing");
    $("button[id=makeRoom]").click(() => {
      $.post("/api/room/make", (data) => {
        $.post("/api/room/" + data.data + "/connect", (data) => {
          console.log(data);
        });
      });
    });
  } else {
    display();
    $('#displayMode').html('観戦');
    $('body').removeClass("playing").addClass("notPlaying");
    $('#changeMode').html('参戦モードへ');
    $('button[id=makeRoom]').remove();
  }
}
