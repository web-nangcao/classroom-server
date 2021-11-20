const jwt = require("jsonwebtoken");

// Issue Token
exports.signToken = (req, res) => {
  jwt.sign(
    { userId: req.user._id },
    process.env.MY_SECRET_KEY,
    { expiresIn: "120 min" },
    (err, token) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.json({ token });
      }
    }
  );
};



// check if Token exists on request Header and attach token to request as attribute
exports.checkToken = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    req.token = bearerHeader.split(" ")[1];

    jwt.verify(req.token, process.env.MY_SECRET_KEY, (err, authData) =>{
      if (err) {
        res.sendStatus(403)
      }
      else {
        req.authData = authData
        next()
      }
    })
  } else {
    res.sendStatus(403);
  }
};