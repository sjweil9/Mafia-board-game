var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username is already taken"],
        maxlength: [25, "Username cannot exceed 25 characters"],
        validate: {
            validator: function(value) {
                return /^[a-zA-Z0-0_-]+$/.test(value);
            },
            message: "Username may only contain letters, numbers, underscores, and dashes."
        }
    },
    pword: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        maxlength: [32, "Password may not exceed 32 characters"],
        validate: {
            validator: function(value) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,32}/.test(value);
            },
            message: "Password must contain at least 1 number, 1 uppercase, and a special character."
        }
    },
    _game: {type: Schema.Types.ObjectId, ref: 'Game'}
}, {timestamps: true});

var User = mongoose.model("User", UserSchema);