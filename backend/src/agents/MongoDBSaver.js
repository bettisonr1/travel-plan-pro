const { BaseCheckpointSaver } = require("@langchain/langgraph");
const Checkpoint = require("../models/Checkpoint");

class MongoDBSaver {
  constructor() {
    this.model = Checkpoint;
  }

  async getTuple(config) {
    const thread_id = config.configurable?.thread_id;
    if (!thread_id) return undefined;

    const query = { thread_id };
    // If checkpoint_id is specified in config, fetch that one.
    // Otherwise, fetch the latest one (sorted by descending createdAt or implicit insertion order usually works, but explicit ordering is better).
    // The BaseCheckpointSaver usually expects us to handle 'checkpoint_id' if provided?
    // Actually, looking at the interface, 'get' receives config.
    
    // For simplicity, let's assume we want the latest if no checkpoint_id, or specific if provided.
    // But BaseCheckpointSaver.get usually expects to return { config, checkpoint, metadata, parentConfig? }
    
    // Let's look for the latest checkpoint for this thread.
    // In a real implementation we might need to handle checkpoint_ns, etc.
    
    const checkpointDoc = await this.model.findOne(query).sort({ createdAt: -1 });
    
    if (!checkpointDoc) return undefined;

    return {
      config: { configurable: { thread_id, checkpoint_id: checkpointDoc.checkpoint_id } },
      checkpoint: checkpointDoc.checkpoint,
      metadata: checkpointDoc.metadata,
      parentConfig: checkpointDoc.parent_checkpoint_id 
        ? { configurable: { thread_id, checkpoint_id: checkpointDoc.parent_checkpoint_id } } 
        : undefined
    };
  }

  async list(config, options) {
      // Implement if needed for history
      return [];
  }

  async put(config, checkpoint, metadata) {
    const thread_id = config.configurable?.thread_id;
    const checkpoint_id = checkpoint.id; // Usually checkpoint has an id
    const parent_checkpoint_id = config.configurable?.checkpoint_id; // The previous checkpoint

    if (!thread_id) return;

    await this.model.create({
      thread_id,
      checkpoint_id,
      parent_checkpoint_id,
      checkpoint,
      metadata
    });

    return {
      configurable: {
        thread_id,
        checkpoint_id
      }
    };
  }
}

module.exports = { MongoDBSaver };
