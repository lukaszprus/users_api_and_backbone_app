/*
 * User Routes
 */
var User = require('../data/models/user');
var loadUser = require('./middleware/load_user');
var async = require('async');
var maxUsersPerPage = 5;
module.exports = function (app) {
    app.get('/users', function (req, res, next) {
        var page = (req.query.page && parseInt(req.query.page, 10)) || 0;
        async.parallel([
                function (next) {
                    User.count(next);
                },
                function (next) {
                    User.find({})
                        .sort('name')
                        .skip(page * maxUsersPerPage)
                        .limit(maxUsersPerPage)
                        .exec(next);
                }
            ],
            // final callback

            function (err, results) {
                if (err) {
                    return next(err);
                }
                var count = results[0],
                    users = results[1],
                    lastPage = (page + 1) * maxUsersPerPage >= count;
                res.json({
                    users: users,
                    lastPage: lastPage
                });
            });
    });
    app.get('/users/:name', loadUser, function (req, res) {
        // console.log( req.user.hasOwnProperty('email'));
        res.json(req.user);
    });
    app.post('/users', function (req, res) {
        User.create(req.body, function (err) {
            if (err) {
                if (err.code === 11000 || err.code === 11001) {
                    return res.json({
                        error: {
                            message: 'Conflict'
                        }
                    }, 409);
                }
                if (err.name === 'ValidationError') {
                    return res.json({
                        error: {
                            message: Object.keys(err.errors).map(function (errField) {
                                return err.errors[errField].message;
                            }).join('. \n')
                        }
                    }, 406);
                }
                return res.json({
                    error: err
                }, 500);
            }
            return res.json({
                success: 'User created'
            });
        });
    });
    app.put('/users/:name', loadUser, function (req, res) {
        User.findOne({
            username: req.user.username
        }, function (err, user) {
            if (err) {
                return res.json({
                    error: err
                }, 500);
            }
            user.save(function (err) {
                if (err) {
                    if (err.code === 11000 || err.code === 11001) {
                        return res.json({
                            error: {
                                message: 'Conflict'
                            }
                        }, 409);
                    }
                    if (err.name === 'ValidationError') {
                        return res.json({
                            error: {
                                message: Object.keys(err.errors).map(function (errField) {
                                    return err.errors[errField].message;
                                }).join('. ')
                            }
                        }, 406);
                    }
                    return res.json({
                        error: err
                    }, 500);
                }
                return res.json({
                    success: 'User updated'
                });
            });
        });
    });
    app.del('/users/:name', loadUser, function (req, res) {
        req.user.remove(function (err) {
            if (err) {
                res.json({
                    error: err
                }, 500);
            } else {
                res.json({
                    success: 'User deleted'
                });
            }
        });
    });
};