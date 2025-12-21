const express = require('express');
const router = express.Router();
const googleDriveService = require('../services/googleDrive');

// Get all files from Google Drive folder
router.get('/files', async (req, res) => {
  try {
    const files = await googleDriveService.getFolderContents();
    res.json({
      success: true,
      data: files,
      message: 'Files retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: error.message
    });
  }
});

// Get specific file by name
router.get('/files/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const file = await googleDriveService.getFileByName(fileName);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file,
      message: 'File retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: error.message
    });
  }
});

// Download file content
router.get('/files/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    const content = await googleDriveService.downloadFile(fileId);
    
    res.json({
      success: true,
      data: content,
      message: 'File downloaded successfully'
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: error.message
    });
  }
});

// Read Google Sheets data
router.get('/sheets/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range = 'A:Z' } = req.query;
    
    const data = await googleDriveService.readSheetData(spreadsheetId, range);
    
    res.json({
      success: true,
      data: data,
      message: 'Sheet data retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading sheet data',
      error: error.message
    });
  }
});

// Upload file to Google Drive
router.post('/upload', async (req, res) => {
  try {
    const { fileName, content, mimeType = 'text/plain' } = req.body;
    
    if (!fileName || !content) {
      return res.status(400).json({
        success: false,
        message: 'fileName and content are required'
      });
    }

    const uploadedFile = await googleDriveService.uploadFile(fileName, content, mimeType);
    
    res.json({
      success: true,
      data: uploadedFile,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Update file content
router.put('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content, mimeType = 'text/plain' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content is required'
      });
    }

    const updatedFile = await googleDriveService.updateFile(fileId, content, mimeType);
    
    res.json({
      success: true,
      data: updatedFile,
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating file',
      error: error.message
    });
  }
});

// Delete file
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    await googleDriveService.deleteFile(fileId);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Search files
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'query parameter is required'
      });
    }

    const files = await googleDriveService.searchFiles(query);
    
    res.json({
      success: true,
      data: files,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching files',
      error: error.message
    });
  }
});

// Get folder statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await googleDriveService.getFolderStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Folder statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting folder stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting folder statistics',
      error: error.message
    });
  }
});

// Create shared link for file
router.post('/files/:fileId/share', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { permission = 'reader' } = req.body;
    
    const sharedLink = await googleDriveService.createSharedLink(fileId, permission);
    
    res.json({
      success: true,
      data: sharedLink,
      message: 'Shared link created successfully'
    });
  } catch (error) {
    console.error('Error creating shared link:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating shared link',
      error: error.message
    });
  }
});

// Get file sharing info
router.get('/files/:fileId/share', async (req, res) => {
  try {
    const { fileId } = req.params;
    const sharingInfo = await googleDriveService.getFileSharingInfo(fileId);
    
    res.json({
      success: true,
      data: sharingInfo,
      message: 'File sharing info retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting file sharing info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file sharing info',
      error: error.message
    });
  }
});

module.exports = router; 