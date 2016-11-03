window.mw = new window.Middleware();
{
  const mw = window.mw;
  $('.room').click((event) => {
    const $room = $(event.currentTarget);
    const roomID = $room.find('.room-number').text();
    console.log(roomID);
    mw.roomAction('join', roomID);
    // TODO: ボンバーマンの画面に遷移する
  });

  $('.create-room button').click(() => {
    mw.roomAction('createRoom');
  });
}
