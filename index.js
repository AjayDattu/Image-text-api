const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const port = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    // Create a unique file name with a timestamp
    const uniqueName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    console.log('Saving file:', uniqueName); // Print file name
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Route to handle file uploads and text extraction with language code
app.post('/upload/:langCode', upload.single('image'), (req, res) => {
  const filePath = path.resolve(__dirname, 'uploads', req.file.filename); // Ensure filePath is correctly resolved
  const langCode = req.params.langCode; // Get the language code from the URL parameter

  console.log('File path:', filePath); // Log file path for debugging
  console.log('Language code:', langCode); // Log language code for debugging

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File does not exist' });
  }

  Tesseract.recognize(
    filePath,
    langCode, // Use the language code from the URL parameter
    {
      logger: info => console.log(info) // Log progress
    }
  ).then(({ data: { text } }) => {
    res.json({ text });

    // Remove the file after the text extraction
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error removing file:', err);
      } else {
        console.log('File removed:', filePath);
      }
    });
  }).catch(err => {
    console.error(err);
    res.status(500).send('Error occurred during text extraction');

    // Remove the file in case of an error
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error removing file:', unlinkErr);
      } else {
        console.log('File removed after error:', filePath);
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
