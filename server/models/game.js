var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
    users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    started: {type: Boolean},
    turn: {type: Number},
    actions: Object
}, {timestamps: true});

var Game = mongoose.model("Game", GameSchema);