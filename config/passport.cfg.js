const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20')
const User = require('../components/user/User')

require('dotenv').config()

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        // options for strategy
        callbackURL: process.env.CALLBACK_URL,
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
      },
      // This parameters extracted from req.body
      async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0].value
        // check if user already exists
        const currentUser = await User.findOne({ googleId: profile.id })
        if (currentUser) {
          // already have the user -> return (login)
          return done(null, currentUser)
        } else {
          // register user and return
          const newUser = await new User({ email: email, googleId: profile.id }).save()
          return done(null, newUser)
        }
      }
    )
  )
}
