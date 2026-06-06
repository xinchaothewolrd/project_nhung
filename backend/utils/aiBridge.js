const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const runInference = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.AI_PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, '../../ai/scripts/predict.py');
    
    // Đảm bảo đường dẫn tuyệt đối cho CSV
    const absoluteCsvPath = path.resolve(csvFilePath);

    const pythonProcess = spawn(pythonPath, [scriptPath, absoluteCsvPath], {
      cwd: path.join(__dirname, '../../ai'),
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, '../../ai')
      }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.on('error', (err) => {
      reject(`Failed to start AI process. Error: ${err.message}`);
    });

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
        // Trích xuất chuỗi JSON từ stdout bằng RegExp để phòng tránh lỗi
        // khi TensorFlow/Python in các cảnh báo, log oneDNN thừa vào stdout.
        const jsonMatch = dataString.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return reject(`No JSON object found in AI output: ${dataString}`);
        }
        const result = JSON.parse(jsonMatch[0]);
        resolve(result);
      } catch (e) {
        reject(`Failed to parse AI output: ${dataString}. Error: ${e.message}`);
      }
    });
  });
};

module.exports = { runInference };
