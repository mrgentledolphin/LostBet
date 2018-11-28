const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
let utentiModel = require('./utenti.js')

passport.use(new LocalStrategy(authenticate))
passport.use('local-register', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password'
}, register))

function authenticate(email, password, done) {
    utentiModel.findOne({
        'email': email
    }, (err, user) => {
        if (err) return handleError(err)
        if (!user) {
            return done(null, false, {
                message: "User not found!"
            })
        }
        if (user.password !== password) {
            return done(null, false, {
                message: "Wrong password!"
            })
        }
        done(null, user)
    })
}

function register(req, email, password, done) {
    utentiModel.findOne({
        'email': email
    }, (err, user) => {
        if (password != req.body.password2) {
            console.log('Passwords dont match!')
            return done(null, false, {
                message: 'Passwords dont match!'
            })
        }
        const newUser = {
            email: req.body.email,
            password: req.body.password,
            username: req.body.username,
            crediti: 10
        }
        utentiModel.create(newUser, (err) => {
            if (err) return handleError(err)
            utentiModel.findOne({
                'email': req.body.email
            }, (err, user) => {
                if (err) return handleError(err)
                done(null, user)
            })
        })
    })
}

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser((id, done) => {
    utentiModel.findById(id, (err, user) => {
        if (err) handleError(err)
        done(null, user)
    })
})