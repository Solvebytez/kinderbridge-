const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.sheets = null;
    this.folderId = '1N6LprDW5Uw9xqjZQl-gPJ5REUuiurqyG'; // Your shared folder ID
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const credentialsPath = path.join(__dirname, '../../../google_keys/client_secret_581682960977-0qkpk2in3rqfhccu3sfus11lkrmuve01.apps.googleusercontent.com.json');
      const tokenPath = path.join(__dirname, '../../../google_keys/token.json');

      const credentials = JSON.parse(fs.readFileSync(credentialsPath));
      const token = JSON.parse(fs.readFileSync(tokenPath));

      this.auth = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.auth_uri
      );

      this.auth.setCredentials(token);
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      console.log('✅ Google Drive service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Drive service:', error.message);
    }
  }

  // Get all files from the shared folder
  async getFolderContents() {
    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      throw error;
    }
  }

  // Get specific file by name
  async getFileByName(fileName) {
    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)'
      });

      return response.data.files[0] || null;
    } catch (error) {
      console.error('Error fetching file by name:', error);
      throw error;
    }
  }

  // Download file content
  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Read Google Sheets data
  async readSheetData(spreadsheetId, range = 'A:Z') {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
      });

      return response.data.values;
    } catch (error) {
      console.error('Error reading sheet data:', error);
      throw error;
    }
  }

  // Upload file to the folder
  async uploadFile(fileName, fileContent, mimeType = 'text/plain') {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [this.folderId]
      };

      const media = {
        mimeType: mimeType,
        body: fileContent
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Update file content
  async updateFile(fileId, fileContent, mimeType = 'text/plain') {
    try {
      const media = {
        mimeType: mimeType,
        body: fileContent
      };

      const response = await this.drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, name, webViewLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get file sharing info
  async getFileSharingInfo(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink, sharing'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file sharing info:', error);
      throw error;
    }
  }

  // Create shared link for file
  async createSharedLink(fileId, permission = 'reader') {
    try {
      const response = await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: permission,
          type: 'anyone'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating shared link:', error);
      throw error;
    }
  }

  // Search files by query
  async searchFiles(query) {
    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and (name contains '${query}' or fullText contains '${query}') and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  // Get folder statistics
  async getFolderStats() {
    try {
      const files = await this.getFolderContents();
      
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        fileTypes: {},
        lastModified: null
      };

      files.forEach(file => {
        if (file.size) {
          stats.totalSize += parseInt(file.size);
        }
        
        const fileType = file.mimeType.split('/')[1] || 'unknown';
        stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
        
        if (!stats.lastModified || file.modifiedTime > stats.lastModified) {
          stats.lastModified = file.modifiedTime;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting folder stats:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService(); 