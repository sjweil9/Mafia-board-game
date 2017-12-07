var mongoose = require('mongoose');
// import packages

// import models
var Game = mongoose.model('Game');
var User = mongoose.model('User');

module.exports = {
    create: (user, callback) => {
        let game = new Game({started: false, actions: {}});
        game.users.push(user._id);
        game.save( (err) => {
            if (err) {
                return null;
            }
            User.update({_id: user._id}, {$set: {game: game._id}}, (err) => {
                if (err) {
                    return null;
                }
                callback(game);
            });
        });
    },
    join: (user, game_id, callback) => {
        Game.update({_id: game_id}, {$push: {users: user}}, (err) => {
            if (err) {
                return null;
            }
            callback();
        });
    },
    start: (game_id, callback, errorback) => {
        Game.findOne({_id: game_id}, (err, game) => {
            if (err) {
                errorback('Game not found');
            }
            else if (game.users.length < 3) {
                errorback('You need 3 players to start.');
            }
            else {
                Game.update({_id: game_id}, {$set: {started: true}}, (err) => {
                    if (err) {
                        errorback('Error starting game');
                    }
                    else {
                        callback(game.users);
                    }
                });
            }
        });
    },
    render: (req, res) => {
        if ('user_id' in req.session) {
            Game.findOne({_id: req.params.id})
            .populate('users')
            .exec( (err, game) => {
                if (err) {
                    return res.redirect("/dashboard");
                }
                User.findOne({_id: req.session.user_id}, (err, user) => {
                    if (err) {
                        return res.redirect("/dashboard");
                    }
                    return res.render("game", {game: game, user: user});
                });
            });
        }
        else {
            return res.redirect("/");
        }
    },
    set_actions: (data, complete, incomplete) => {
        Game.findOne({_id: data.game_id}, (err, game) => {
            if (err) {
                incomplete("Could not find game");
            }
            let current_actions = game.actions;
            if (current_actions === undefined) {
                current_actions = {};
            }
            // should validate there are 4 actions here
            current_actions[data.user.username] = data.actions;
            if ('count' in current_actions) {
                current_actions.count++;
            }
            else {
                current_actions.count = 1;
            }
            game.actions = current_actions;
            game.markModified('actions');
            game.save( (err) => {
                if (err) {
                    incomplete("Could not set actions");
                }
                else if (game.actions.count < 3) {
                    incomplete("Waiting on other users to pick actions");
                }
                else if (game.actions.count === 3) {
                    complete(game.actions);
                }
            });
        });
    }
};