const express = require("express");
const router = express.Router();

// Load Validator
const validator = require("validator");
const isEmpty = require("../../validation/isEmpty");

// Load User model
const User = require("../../models/User");

// For handling dates
const moment = require("moment");

// Get all user
router.get("/users", (req, res) => {
    User.find({}, "-log")
        .then(users => res.json(users))
        .catch(err => console.log(err));
});

router.get("/log", (req, res) => {
    let { userId, from, to, limit } = req.query;
    let resultLimit = {};
    // return res.json(req.query);
    if (!userId) {
        return res
            .status(404)
            .json({ error: "You must enter a valid user ID" });
    }

    if (!isEmpty(limit)) {
        let parseLimit = Number(limit);
        resultLimit = { log: { $slice: parseLimit } };
    }

    if (!isEmpty(from) && !validator.isISO8601(from)) {
        return res.json({ error: "From is a Invalid Date" });
    }

    if (!isEmpty(to) && !validator.isISO8601(to)) {
        return res.json({ error: "To is a Invalid Date" });
    }

    /**
     * @todo Check is the filter must be after or before query
     */
    // return res.json(filter);
    User.findById({ _id: userId }, resultLimit)
        .then(user => {
            // If "from" or "to" exist filter logs
            console.log(to);
            if (true) {
                let filteredLog = user.log.filter(value => {
                    console.log(value.date);
                    if (from && to) {
                        return (
                            moment(value.date).isSameOrBefore(to) &&
                            moment(value.date).isSameOrAfter(from)
                        );
                    } else if (from) {
                        return moment(value.date).isSameOrAfter(from);
                    } else {
                        return moment(value.date).isSameOrBefore(to);
                    }
                });
                user.log = filteredLog;
            }
            user.count = user.log.length;
            res.json(user);
        })
        .catch(err => res.json(err));
});

// Create new user
router.post("/new-user", (req, res) => {
    const username = req.body.username;

    const user = new User({ username: username });
    user.save()
        .then(user =>
            res.json({
                _id: user._id,
                username: user.username
            })
        )
        .catch(err => console.log(err));
});

router.post("/add", (req, res) => {
    const { userId, description, duration, date } = req.body;

    if (isEmpty(userId) || isEmpty(description) || isEmpty(duration)) {
        return res.status(404).json({
            error: "userId, description and duration must be filled"
        });
    }

    let newExercise = {
        description: description,
        duration: duration
    };

    // If the date is submited. Validate it
    if (!isEmpty(date)) {
        if (!validator.isISO8601(date)) {
            return res.status(404).send({ error: "Invalidad date" });
        } else {
            newExercise.date = date;
        }
    }

    User.findById(userId)
        .then(user => {
            user.log.unshift(newExercise);

            user.save()
                .then(user => res.json(user))
                .catch(err => res.json(err));
        })
        .catch(err => res.json(err));
});

module.exports = router;
