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
    // TODO: ボンバーマンの画面に遷移する
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

  function addRoomElement(rid, count) {
    $('.room-list').append(`
      <div class="room" onclick="startGame()">
        <div class="room-id">
          ROOM <span class="room-number">${rid}</span>
        </div>
        <div class="room-members">
          member: <span class="room-members-number">${count}</span>/8
        </div>
      </div>
    `);
  }
});
