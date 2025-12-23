const mongoose = require('mongoose');

const CheckpointSchema = new mongoose.Schema({
  thread_id: { type: String, required: true },
  checkpoint_id: { type: String, required: true },
  parent_checkpoint_id: { type: String },
  checkpoint: { type: Object, required: true }, // The serialized checkpoint
  metadata: { type: Object, default: {} }
}, { timestamps: true });

// Compound index for fast retrieval of the latest checkpoint for a thread
CheckpointSchema.index({ thread_id: 1, checkpoint_id: 1 }, { unique: true });

module.exports = mongoose.model('Checkpoint', CheckpointSchema);
