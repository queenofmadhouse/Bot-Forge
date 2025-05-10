const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BotRuntimeDataSchema = new Schema({
  botId: {
    type: String,
    required: true,
    ref: 'Bot'
  },
  userId: {
    type: String,
    required: true
  },
  currentFlow: String,
  currentStep: String,
  conversationState: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
});

BotRuntimeDataSchema.index({ botId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('BotRuntimeData', BotRuntimeDataSchema);
