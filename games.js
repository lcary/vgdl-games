var play_game = function (game_name, desc, level) {
  window.location.href = `games/${game_name}/0.html`;
}

$(document).ready(function () {
  $(".game").click(e => {
    play_game(e.target.id, 0, 0);
  })
})
