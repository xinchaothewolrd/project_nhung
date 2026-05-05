import sys
import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from preprocess import downsample_signal, extract_windows

# Đảm bảo tắt log của TensorFlow để không làm bẩn output JSON
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

def predict(csv_path):
    try:
        # 1. Load model
        model_path = os.path.join(os.path.dirname(__file__), 'best_ecg_model.keras')
        if not os.path.exists(model_path):
            return {"error": f"Model not found at {model_path}"}
            
        model = tf.keras.models.load_model(model_path)

        # 2. Đọc dữ liệu từ CSV
        # Giả định CSV chỉ có 1 cột dữ liệu thô (raw ECG)
        data = pd.read_csv(csv_path, header=None).values.flatten()
        
        # Nếu ESP32 gửi 18,000 điểm (3 phút @ 100Hz hoặc 360Hz tùy cấu hình)
        # Ở đây ta giả định ESP32 gửi 18,000 điểm thô
        # Ta cần biết tần số gốc. Giả sử ESP32 gửi 100Hz sẵn rồi.
        
        # 3. Tiền xử lý
        # Nếu cần downsample thì dùng downsample_signal(data, fs_orig=360, fs_target=100)
        # Giả sử ESP32 đã gửi 100Hz.
        sig = data.astype(float)
        
        # 4. Cắt đoạn (Windowing) - 500 điểm/đoạn
        WINDOW_SIZE = 500
        STEP_SIZE = 500 # Không overlap để đúng 36 đoạn từ 18,000 điểm
        
        windows = []
        for start in range(0, len(sig) - WINDOW_SIZE + 1, STEP_SIZE):
            end = start + WINDOW_SIZE
            window = sig[start:end]
            
            # Chuẩn hóa biên độ
            max_abs = np.max(np.abs(window))
            if max_abs > 0:
                window = window / max_abs
            
            windows.append(window)
            
        if not windows:
            return {"error": "No windows extracted from signal"}

        X = np.array(windows).reshape(-1, 500, 1)

        # 5. Dự đoán
        predictions = model.predict(X, verbose=0)
        y_pred = (predictions > 0.5).astype(int).flatten()

        # 6. Tổng hợp kết quả
        # Nếu > 3 đoạn bất thường => Có bệnh (theo PDF kiến trúc)
        abnormal_count = int(np.sum(y_pred))
        is_abnormal = abnormal_count > 3
        diagnosis = "Rung nhi (Atrial Fibrillation)" if is_abnormal else "Binh thuong (Normal)"

        return {
            "diagnosis": diagnosis,
            "is_abnormal": bool(is_abnormal),
            "abnormal_segments": abnormal_count,
            "total_segments": len(y_pred)
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No CSV path provided"}))
        sys.exit(1)
        
    csv_file = sys.argv[1]
    result = predict(csv_file)
    print(json.dumps(result))
