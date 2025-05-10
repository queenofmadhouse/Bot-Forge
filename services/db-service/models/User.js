const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bots: [{
    type: String,
    ref: 'Bot'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
