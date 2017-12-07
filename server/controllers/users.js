var mongoose = require('mongoose');
// import packages
var bcrypt = require('bcrypt-as-promised');

// import models
var User = mongoose.model('User');

module.exports = {
    login: (req, res) => {
        var user = User.findOne({username: req.body.username}, (err, user) => {
            req.session.status = "login";
            if (err || user === null) {
                req.session.errors = "Invalid login information.";
                return res.redirect("/");
            }
            bcrypt.compare(req.body.pword, user.pword).then( () => {
                req.session.user_id = user._id;
                return res.redirect("/dashboard");
            }).catch( (err) => {
                console.log(err);
                req.session.errors = "Invalid login information.";
                return res.redirect("/");
            });
        });
    },
    create: (req, res) => {
        req.session.status = "register";
        if (req.body.pword === req.body.conf) {
            delete req.body.conf;
            var user = new User(req.body);
            user.save( (err) => {
                if (err) {
                    if (err.name === "MongoError") {
                        req.session.errors = "That username is already registered.";
                    }
                    else {
                        req.session.errors = err;
                    }
                    return res.redirect("/");
                }
                else {
                    bcrypt.hash(req.body.pword, 10).then( (hashed_password) => {
                        User.update({_id: user._id}, {$set: {pword: hashed_password}}, (err) => {
                            if (err) {
                                console.log(err);
                                return res.redirect("/");
                            }
                            req.session.user_id = user._id;
                            return res.redirect("/dashboard");
                        });
                    }).catch( (err) => {
                        return res.redirect("/");
                    });
                }
            });
        }
        else {
            req.session.errors = "Password did not match confirmation.";
            return res.redirect("/");
        }
    }
};