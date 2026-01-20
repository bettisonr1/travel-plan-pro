const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const crypto = require('crypto');

class StorageService {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'trip-images';
    
    if (this.connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      // Ensure container exists
      this.containerClient.createIfNotExists({
        access: 'blob'
      }).catch(err => {
        console.error('Error creating container:', err.message);
      });
    } else {
      console.warn('AZURE_STORAGE_CONNECTION_STRING is not set. Image upload will fail.');
    }
  }

  async uploadImage(file) {
    if (!this.blobServiceClient) {
      throw new Error('Storage service is not configured');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
      });
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading to Azure Blob Storage:', error);
      throw new Error('Failed to upload image');
    }
  }
}

module.exports = new StorageService();
