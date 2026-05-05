const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const runInference = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.AI_PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, '../../ai/predict.py');
    
    // Đảm bảo đường dẫn tuyệt đối cho CSV
    const absoluteCsvPath = path.resolve(csvFilePath);

    const pythonProcess = spawn(pythonPath, [scriptPath, absoluteCsvPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(`AI Script exited with code ${code}. Error: ${errorString}`);
      }
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (e) {
        reject(`Failed to parse AI output: ${dataString}`);
      }
    });
  });
};

module.exports = { runInference };
