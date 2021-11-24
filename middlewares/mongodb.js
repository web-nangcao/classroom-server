const mongoose = require('mongoose')

module.exports = function(app) {
    // const conn_str = 'mongodb://localhost:27017/classroom'
    const conn_str = process.env.MONGODB_URI

    mongoose.connect(conn_str, ()=>{
        console.log('Database conected');
    });
}