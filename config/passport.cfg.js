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
  // passport.use(
  //   new LocalStrategy(function (email, password, done) {
  //     User.findOne({ email: email }, async function (err, user) {
  //       if (err) {
  //         return done(err)
  //       }
  //       if (!user) {
  //         return done(null, false)
  //       }
  //       const isMatch = await bcrypt.compare(user.password, password)
  //       if (!isMatch) {
  //         return done(null, false, {
  //           message: 'Password khong dung'
  //         })
  //       }
  //       if (!user.isActive) {
  //         return done(null, false, {
  //           message: 'Tai khoan chua duoc kich hoat'
  //         })
  //       }
  //       return done(null, user)
  //     })
  //   })
  // )
}
