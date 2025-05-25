const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// List available scripts
app.get('/api/scripts', (req, res) => {
  try {
    const files = fs.readdirSync(SCRIPTS_DIR)
      .filter(f => f.endsWith('.js') && !f.startsWith('.'))
      .map(f => f.replace('.js', ''));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list scripts' });
  }
});

// Execute a script
app.post('/api/scripts/:scriptName/execute', upload.fields([{ name: 'file1' }, { name: 'file2' }]), async (req, res) => {
  const { scriptName } = req.params;
  const scriptPath = path.join(SCRIPTS_DIR, `${scriptName}.js`);
  if (!fs.existsSync(scriptPath)) return res.status(404).json({ error: 'Script not found' });

  try {
    // Clear require cache for hot-reloading during dev
    delete require.cache[require.resolve(scriptPath)];
    const script = require(scriptPath);
    const XLSX = require('xlsx');
    const file1 = req.files['file1']?.[0]?.buffer;
    const file2 = req.files['file2']?.[0]?.buffer;
    if (!file1 || !file2) return res.status(400).json({ error: 'Both files are required' });
    const result = await script(XLSX, file1, file2);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)); 