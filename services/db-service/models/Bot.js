const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommandSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  response: String
});

const OptionSchema = new Schema({
  text: String,
  next: String
});

const StepSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  message: String,
  options: [OptionSchema]
});

const FlowSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  name: String,
  trigger: String,
  steps: [StepSchema]
});

const BotSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  commands: [CommandSchema],
  flows: [FlowSchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bot', BotSchema);
