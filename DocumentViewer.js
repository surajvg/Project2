import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, Box, Typography, List, ListItemButton, 
  ListItemIcon, ListItemText, IconButton, Divider, CircularProgress
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import axios from 'axios';

const DocumentViewer = ({ open, onClose, stepName }) => {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://192.168.0.20:2001/api"; 

  useEffect(() => {
    if (open && stepName) {
      fetchAndSync();
    }
  }, [open, stepName]);

  const fetchAndSync = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/list-pdfs`, { params: { step_name: stepName } });
      setFiles(res.data);
      if (res.data.length > 0) setSelectedFileId(res.data[0].id);
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth 
      PaperProps={{ sx: { height: '80vh', borderRadius: 2 } }}>
      
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{stepName} Documents</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        {/* File List Pane */}
        <Box sx={{ width: 300, borderRight: '1px solid #ddd', overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', p: 5 }}><CircularProgress size={24} /></Box>
          ) : (
            <List>
              {files.map((file) => (
                <ListItemButton 
                  key={file.id} 
                  selected={selectedFileId === file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  sx={{ "&.Mui-selected": { borderRight: '4px solid #1976d2' } }}
                >
                  <ListItemIcon sx={{ minWidth: 35 }}><PictureAsPdfIcon color="error" /></ListItemIcon>
                  <ListItemText 
                    primary={file.filename} 
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }} 
                  />
                </ListItemButton>
              ))}
              {files.length === 0 && (
                <Typography variant="caption" align="center" sx={{ display: 'block', mt: 4, color: 'gray' }}>
                  No PDFs found in folder.
                </Typography>
              )}
            </List>
          )}
        </Box>

        {/* PDF View Pane */}
        <Box sx={{ flexGrow: 1, bgcolor: '#525659' }}>
          {selectedFileId ? (
            <iframe
              src={`${API_BASE}/view-pdf/${selectedFileId}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="PDF View"
            />
          ) : (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
               <Typography sx={{ color: 'white' }}>Select a file to preview</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
