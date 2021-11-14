const mongoose = require("mongoose");

const UserType = require("../user/UserType");

const ClassroomSchema = mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  host: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  member: [
    {
      type: mongoose.Schema.ObjectId,
      user_type: UserType,
      ref: "users",
    },
  ],
});

const ClassRoom = mongoose.model("ClassRoom", ClassroomSchema, "classrooms");

module.exports = ClassRoom;
