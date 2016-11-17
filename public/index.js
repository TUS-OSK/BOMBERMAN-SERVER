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
      <div class="title">
        <img src="images/title.png">
      </div>
      <div class="waitingContent">
        <p>揃うの待ち</p>
        <p>Room ID: ${rid}</p>
        <p>人数:<span class="waiting-count">1</span>/8</p>
        <input type="button" value="待たずに始める" onclick="sendStartSignal()">
      </div>
    `);
  }


});

function sendStartSignal(){
  mw.bombermanAction('startGame');
}
