const mongoose = require('mongoose')

module.exports = function(app) {
    // MONGODB_URI=mongodb://localhost:27017/classroom
    // MONGODB_URI=mongodb+srv://admin:admin@webctt2.rkdpz.mongodb.net/classroom?retryWrites=true&w=majority

    const conn_str = process.env.MONGODB_URI

    mongoose.connect(conn_str, ()=>{
        console.log('Database conected');
    });
}