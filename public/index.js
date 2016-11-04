window.mw = new window.Middleware();
$(() => {
  const mw = window.mw;

  $('.create-room button').on('click', () => {
    mw.roomAction('createRoom');
  });

  $(document).on('click', '.room', (event) => {
    const $room = $(event.currentTarget);
    const roomID = $room.find('.room-number').text();
    mw.roomAction('join', roomID);
    startWaiting();
  });

  mw.on('room-createUser', (d) => {
    const roomList = d.data.roomList;
    Object.keys(roomList).forEach((roomID) => {
      const memberCount = roomList[roomID].members.length;
      addRoomElement(roomID, memberCount);
    });
  });
  mw.on('room-createRoom', (d) => {
    const rid = d.data.user.rid;
    addRoomElement(rid, 1);
  });
  mw.on('room-startGame', (d) => {
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

  function startWaiting(){
    $(".container").html(`
      <div class="title">
        <img src="images/title.png">
      </div>
      <div class="waitingContent">
        <p>揃うの待ち</p>
        <p>人数:<span class="waiting-count">1</span>/8</p>
        <input type="button" value="待たずに始める" onclick="sendStartSignal()">
      </div>
    `);
  }


});

function sendStartSignal(){
  mw.roomAction('startGame');
}
