$(document).ready(function() {
    $.get('/session', (data) => {
        if (!data.success) {
            window.location.replace("/logout");
        }
        else {
            var user = data.user;
            var in_game = false;
            var socket = io.connect('http://localhost:8000');

            socket.emit("logged_in", {user: user});

            socket.on("lobby_users", (data) => {
                // get list of users in lobby, and available games, then display
                $('#users').html("");
                for (let user of data.users) {
                    $('#users').append("<li id='" + user + "'>" + user + "</li>");
                }
                for (let key in data.games) {
                    // outer game div contains game ID
                    let game_string = "<div class='game' id='" + key + "'>";
                    for (var i = 1; i !== 4; i++) {
                        // inner divs have either player name
                        game_string += "<div class='player p" + i + "'>";
                        if (data.games[key].length >= i) {
                            game_string += data.games[key][i - 1];
                        }
                        // or join button (if no player yet)
                        else {
                            game_string += "<button class='btn btn-success join' data-player-id='" + i + "' data-game-id='" + key + "'>Join Game</button>";
                        }
                        game_string += "</div>";
                    }
                    game_string += "</div>";
                    $('#games').append(game_string);
                }
            });

            socket.on("new_user", (data) => {
                // display in chatbox when new user joins lobby
                $('#chatbox').append("<p class='sysmessage'>" + data.user + " entered the lobby!</p>");
                $('#users').append("<li id='" + data.user + "'>" + data.user + "</li>");
            });

            socket.on("user_left", (data) => {
                // display in chatbox when user leaves site
                $('#chatbox').append("<p class='sysmessage'>" + data.user + " went offline!</p>");
                $('#' + data.user).remove();
            });

            socket.on("new_message", (data) => {
                // display message received from server (will only be sent if you are in correct room)
                let message_string = "<p><span class='name'>" + data.user + "</span>: " + data.message + "</p>";
                $('#chatbox').append(message_string);
            });

            socket.on("new_game", (data) => {
                // creates new game div, displays creator and buttons to join
                let game_string = "<div class='game' id='" + data.id + "'><div class='player p1'>";
                game_string += data.name + "</div>";
                game_string += "<div class='player p2'><button class='btn btn-success join' data-player-id='2' data-game-id='" + data.id + "'>Join Game</button></div>";
                game_string += "<div class='player p3'><button class='btn btn-success join' data-player-id='3' data-game-id='" + data.id + "'>Join Game</button></div></div>";
                $('#games').append(game_string);
            });

            socket.on("made_game", (data) => {
                // different event if active user created game
                // no join buttons, instead has start button
                let game_string = "<div class='game' id='" + data.id + "'><div class='player p1'>";
                game_string += user.username + "</div>";
                game_string += "<div class='player p2'>Waiting for Player 2...</div>";
                game_string += "<div class='player p3'>Waiting for Player 3...</div>";
                game_string += "<button class='btn btn-danger start' data-game-id='" + data.id + "'>Start Game</button></div>";
                $('#games').append(game_string);
            });

            socket.on("joined_game", (data) => {
                // updates game div at specific player slot when a user joins
                $('#' + data.game_id + ' .p' + data.player_slot).html(data.user);
            });

            socket.on("game_started", (data) => {
                // removes game div from lobby when it has started
                $('#' + data.game_id).remove();
                // also removes players in that game from lobby
                for (let player of data.players_in_game) {
                    $('#' + player).remove();
                }
            });

            socket.on("start_game", (data) => {
                // redirect to new game page (with that ID)
                window.location.replace("/game/" + data.game_id);
            });

            socket.on("start_error", (data) => {
                // displays message from server if start button fails
                // i.e. "need 3 players to start"
                alert(data.message);
            });

            $('form#chat').submit( (e) => {
                // emits to server when user sends message (will then broadcast)
                // displays that message on local chatbox
                e.preventDefault();
                let message_text = $('#message').val();
                let message_string = "<p><span class='myname'>" + user.username + "</span>: " + message_text + "</p>";
                $('#chatbox').append(message_string);
                socket.emit("sent_message", {message: message_text});
                $('#message').val("");
            });
            
            $('#logout').click( () => {
                // roundbout way to use button as link
                window.location.replace("/logout");
            });
            
            $('#newgame').click( () => {
                // create game if not already in one
                if (!in_game) {
                    in_game = true;
                    socket.emit("create_game");
                }
                else {
                    alert("You are already in a game!");
                }
            });

            $('.games').on('click', 'button.join', function() {
                // join buttons are created dynamically, can't put event listener directly on them
                if (in_game) {
                    alert("You are already in a game!");
                }
                else {
                    in_game = true;
                    socket.emit("join_game", {id: $(this).data("game-id"), player_slot: $(this).data("player-id")});
                }
            });

            $('.games').on('click', 'button.start', function() {
                // start buttons are created dynamically, can't put event listeners directly on them
                if (!in_game) {
                    alert("Not sure what you're up to. But you gotta be in a game to start it!");
                }
                else {
                    socket.emit("start_game", {id: $(this).data("game-id")});
                }
            });
        }  
    });
});