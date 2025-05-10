const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema({
  botId: {
    type: String,
    required: true,
    ref: 'Bot'
  },
  date: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  userCount: {
    type: Number,
    default: 0
  },
  commandUsage: {
    type: Map,
    of: Number,
    default: {}
  }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
