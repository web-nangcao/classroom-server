const GoogleTokenStrategy = require('passport-google-token').Strategy
const User = require('../components/user/User')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

module.exports = function (passport) {
  passport.use(
    new GoogleTokenStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('accessToken: ', accessToken)
        const email = profile.emails[0].value

        // Check if user already exists
        const currentUser = await User.findOne({ email: email })
        if (currentUser) {
          if (!currentUser.isActive) {
            return done(null, false)
          } else if (currentUser.isLock) {
            return done(null, false)
          }
          // User already exists
          return done(null, currentUser)
        } else {
          // register new user
          const newUser = await new User({
            email: email,
            googleId: profile.id,
            isActive: true,
          }).save()
          return done(null, newUser)
        }
      }
    )
  )
}
