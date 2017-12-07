var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var session = require("express-session");
var mongoose = require("mongoose");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "./client/static")));
app.use(session({
    secret: "fjias891z0zn0fj01",
    resave: true,
    saveUninitialized: true
}));

app.set("views", path.join(__dirname, "./client/views"));
app.set("view engine", "ejs");

require('./server/config/mongoose.js');

var routes = require('./server/config/routes.js');
routes(app);

var server = require('http').createServer(app);
var io = require('socket.io')(server);

var users = {};
var lobby_users = [];
var games = {};

var game_controller = require('./server/controllers/games.js');

io.sockets.on("connection", function (socket) {

    socket.on("returned", (data) => {
        // this gets sent if user is loading from a game
        users[socket.id] = data.user;
        socket.room = data.game_id;
        socket.join(socket.room);
    });

    socket.on("chose_actions", (data) => {
        game_controller.set_actions(data, (actions) => {
            socket.emit("complete_actions", {actions: actions});
            socket.broadcast.to(socket.room).emit("complete_actions", {actions: actions});
        }, (message) => {
            socket.emit("incomplete_actions", {message: message});
        });
    });

    socket.on("logged_in", (data) => {
        // add user to users object, and to lobby
        users[socket.id] = data.user;
        lobby_users.push(data.user.username);

        // put user into lobby and store that room name for later ref
        socket.room = "lobby";
        socket.join("lobby");

        // send current lobby users to this socket
        socket.emit("lobby_users", {users: lobby_users, games: games});
        // and info about new user to current lobby users
        socket.broadcast.to('lobby').emit("new_user", {user: users[socket.id].username});
    });

    socket.on("sent_message", (data) => {
        // broadcast message to the room this socket is in
        socket.broadcast.to(socket.room).emit("new_message", {user: users[socket.id].username, message: data.message});
    });

    socket.on("create_game", () => {
        // call game controller to make new game, add this socket user to it
        // provide callback to broadcast info after DB finishes
        game_controller.create(users[socket.id], (game) => {
            games[game._id] = [users[socket.id].username];
            socket.broadcast.to('lobby').emit("new_game", {id: game._id, name: users[socket.id].username});
            
            // different event for game creator (they have access to start button)
            socket.emit("made_game", {id: game._id});
        });
    });

    socket.on("join_game", (data) => {
        // call game controller to add user to game with sent id
        // provide callback to broadcast info after DB finishes
        game_controller.join(users[socket.id], data.id, () => {
            games[data.id].push(users[socket.id].username);
            io.sockets.in('lobby').emit("joined_game", {game_id: data.id, user: users[socket.id].username, player_slot: data.player_slot});
        });
    });

    socket.on("start_game", (data) => {
        // call game controller to start game (it will check # players)
        game_controller.start(data.id, (players) => {
            // callback for success
            let players_in_game = [];
            for (let player of players) {
                for (let key in users) {
                    if (users[key]._id == player) {
                        players_in_game.push(users[key].username);
                        // send "start game" event to specific sockets (those in this game)
                        socket.broadcast.to(key).emit("start_game", {game_id: data.id});
                        // remove player from lobby_users
                        let idx = lobby_users.indexOf(users[key].username);
                        lobby_users.splice(idx, 1);
                    }
                }
            }
            // send "start game" to creator
            socket.emit("start_game", {game_id: data.id});
            // broadcast to lobby to update lobby users and available games
            io.sockets.in('lobby').emit("game_started", {game_id: data.id, players_in_game: players_in_game});
            // clear game out of active games
            delete games[data.id];
        }, (message) => {
            // errorback, receives message depending on how it failed
            socket.emit("start_error", {message: message});
        });
    });

    socket.on("disconnect", () => {
        // if in lobby, notify other users (to remove them from list)
        // need a different case to handle disconnect from game
        // should be able to check on login/load if user is in an active game
        if (socket.room === "lobby") {
            let idx = lobby_users.indexOf(users[socket.id].username);
            lobby_users.splice(idx, 1);
            socket.broadcast.to(socket.room).emit("user_left", {user: users[socket.id].username});
        }
        delete users[socket.id];
    });

});

server.listen(8000, function(){
    console.log("listening on port 8000");
});