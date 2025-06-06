const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const COMM_DIR = path.join(__dirname, 'public', 'claude-communication');

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));
app.use('/claude-communication', express.static(path.join('public', 'claude-communication')));

// Ensure communication directory exists
async function ensureCommDir() {
  try {
    await fs.access(COMM_DIR);
  } catch {
    await fs.mkdir(COMM_DIR, { recursive: true });
    console.log('Created communication directory:', COMM_DIR);
  }
}

// API endpoint to send instructions to AI agent
app.post('/api/send-instruction', async (req, res) => {
  try {
    const { instruction, sessionId } = req.body;
    if (!instruction || !sessionId) {
      return res.status(400).json({ error: 'Instruction and sessionId are required' });
    }
    const filename = `claude-comm-request-${sessionId}.txt`;
    const filepath = path.join(COMM_DIR, filename);
    await fs.writeFile(filepath, instruction, 'utf8');
    console.log(`Instruction written: ${filename}`);
    res.json({ success: true, sessionId, filename, message: 'Instruction sent successfully' });
  } catch (error) {
    console.error('Error writing instruction:', error);
    res.status(500).json({ error: 'Failed to write instruction file' });
  }
});

// Start server
async function startServer() {
  await ensureCommDir();
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Communication directory: ${COMM_DIR}`);
  });
}

startServer(); 