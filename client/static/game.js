$(document).ready(function() {
    $.get('/session', (data) => {
        if (!data.success) {
            window.location.replace("/logout");
        }
        else {
            var user = data.user;
            // need a better way of having access to this
            var game_id = $('#game_id').text();

            var actions = {
                'construct': false,
                'produce': false,
                'recruit': false,
                'move': false,
                'sell': false,
                'buy': false
            };

            var num_actions = 0;
            var confirmed_actions = false;

            var socket = io.connect('http://localhost:8000');

            socket.emit("returned", {user: user, game_id: game_id});

            socket.on("new_message", (data) => {
                // display message received from server (will only be sent if you are in correct room)
                let message_string = "<p><span class='name'>" + data.user + "</span>: " + data.message + "</p>";
                $('#chatbox').append(message_string);
            });

            socket.on("incomplete_actions", (data) => {
                alert(data.message);
            });

            socket.on("complete_actions", (data) => {
                for (let key in data.actions) {
                    if (key !== 'count') {
                        console.log(key + " selected " + data.actions[key]);
                    }
                }
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

            $('#actions button').click(function() {
                const action = $(this).data('action');
                actions[action] = !actions[action];
                if (actions[action] === false || num_actions < 4) {
                    $(this).toggleClass('btn-success');
                    $(this).toggleClass('btn-secondary');
                    if (actions[action] === true) {
                        num_actions++;
                    }
                    else {
                        num_actions--;
                    }
                }
                else {
                    alert("You may only select 4 actions per turn!");
                    actions[action] = !actions[action];
                }
            });

            $('#confirm').click(function() {
                if (num_actions < 4) {
                    alert("You must select 4 actions for the turn!");
                }
                else if (confirmed_actions) {
                    alert("you have already confirmed actions for the turn!");
                }
                else if (num_actions === 4) {
                    confirmed_actions = true;
                    let chosen = [];
                    for (let key in actions) {
                        if (actions[key]) {
                            chosen.push(key);
                        }
                    }
                    socket.emit("chose_actions", {actions: chosen, user: user, game_id: game_id});
                }
            });
        }  
    });
});