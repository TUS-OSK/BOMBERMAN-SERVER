window.mw = new window.Middleware();
let currentRid = null;
$(() => {
  const mw = window.mw;

  $('.create-room button').on('click', () => {
    mw.roomAction('createRoom');
  });

  $(document).on('click', '.room', (event) => {
    const $room = $(event.currentTarget);
    const roomID = $room.find('.room-number').text();
    currentRid = roomID;
    mw.roomAction('join', roomID);
    startWaiting(roomID);
  });

  // $(window).bind("beforeunload", function() {
  //   mw.roomAction('remove');
  //   console.log("remove");
  // });

  // mw.on('room-createUser', (d) => {
  //   const roomList = d.data.roomList;
  //   $('.room-list').html('');
  //   Object.keys(roomList).forEach((roomID) => {
  //     const memberCount = roomList[roomID].members.length;
  //     addRoomElement(roomID, memberCount);
  //   });
  // });
  mw.on('room-update', (d) => {
    const roomList = d.data.roomList;
    $('.room-list').html('');
    Object.keys(roomList).forEach((roomID) => {
      const memberCount = roomList[roomID].members.length;
      addRoomElement(roomID, memberCount);
    });
  });
  mw.on('room-createRoom', (d) => {
    const rid = d.data.user.rid;
    currentRid = rid;
    addRoomElement(rid, 1);
    console.log(d.data.user.uid,mw.uid);

    if (d.data.user.uid === mw.uid) {
      startWaiting(rid);
      mw.roomAction('join', rid);
    }
  });
  mw.on('startGame', (d) => {
    startGame();
  });

  mw.on('room-all', (d) => {
    const rid = d.data.user.rid;
    const room = d.data.roomList[rid];
    const memberNumber = room && room.members.length;
    // debugger;
    $('.room-members-number').text(memberNumber);
  });

  function addRoomElement(rid, count) {
    $('.room-list').append(`
      <div class="room">
        <div class="room-id">
          ROOM <span class="room-number">${rid}</span>
        </div>
        <div class="room-members">
          member: <span class="room-members-number">${count}</span>/8
        </div>
      </div>
    `);
  }

  function startWaiting(rid){
    $(".container").html(`
      <div class="waiting-content">
        <div class="waiting-message">
          <p><img src="./images/loading.svg" width="50" height="50"></p>
          <p class="waiting-message-status">8人揃うのを待機しています....</p>
          <p><span class="waiting-message-info">Room ID: ${rid}, 人数: <span class="room-members-number">1</span>/8</span></p>
        </div>
        <div class="waiting-buttons">
          <input type="button" value="待たずに始める" onclick="sendStartSignal()">　　
          <input type="button" value="部屋から抜ける" onclick="location.reload()">
        </div>
      </div>
    `);
  }


});

function sendStartSignal(){
  mw.bombermanAction('startGame');
}
