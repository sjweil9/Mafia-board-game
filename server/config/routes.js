var mongoose = require('mongoose');

// import controllers
var games = require('../controllers/games.js');
var users = require('../controllers/users.js');
var User = mongoose.model('User');

module.exports = (app) => {
    app.get("/", (req, res) => {
        // loads index (signin) page - sends errors and status (reg or login)
        // status is used to determine if page shows login or reg form first
        var errors;
        if ('errors' in req.session) {
            errors = req.session.errors;
            delete req.session['errors'];
        }
        if (!req.session.hasOwnProperty('status')) {
            req.session.status = "";
        }
        return res.render("index", {errors: errors, status: req.session.status});
    });

    app.get("/dashboard", (req, res) => {
        // grabs current user, loads dashboard
        if ('user_id' in req.session) {
            User.findOne({_id: req.session.user_id}, (err, user) => {
                if (err) {
                    return res.redirect("/");
                }
                return res.render("dashboard", {user: user});
            });
        }
        else {
            return res.redirect("/");
        }
    });

    app.get("/session", (req, res) => {
        // so that client side can ping to get user info
        if ('user_id' in req.session) {
            User.findOne({_id: req.session.user_id}, (err, user) => {
                if (err) {
                    return res.json({success: false});
                }
                return res.json({success: true, user: user});
            });
        }
        else {
            return res.json({success: false});
        }
    });

    app.get("/game/:id", games.render);

    app.get("/logout", (req, res) => {
        delete req.session.user;
        delete req.session.status;
        return res.redirect("/");
    });

    app.post("/register", users.create);

    app.post("/login", users.login);
};