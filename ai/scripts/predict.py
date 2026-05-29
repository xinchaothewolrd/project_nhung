import sys
import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf

# Thêm thư mục src vào sys.path để import preprocess
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from src.preprocess import downsample_signal, extract_windows

# Đảm bảo tắt log của TensorFlow để không làm bẩn output JSON
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

# 5 class chẩn đoán
CLASS_NAMES = ['N', 'L', 'R', 'A', 'V']
CLASS_LABELS = {
    'N': 'Normal (Binh thuong)',
    'L': 'LBBB (Block nhanh trai)',
    'R': 'RBBB (Block nhanh phai)',
    'A': 'PAC/APC (Ngoai tam thu nhi)',
    'V': 'PVC (Ngoai tam thu that)',
}

def predict(csv_path):
    try:
        # 1. Load model
        model_path = os.path.join(os.path.dirname(__file__), '../models/best_ecg_model.keras')
        if not os.path.exists(model_path):
            return {"error": f"Model not found at {model_path}"}
            
        model = tf.keras.models.load_model(model_path)

        # 2. Đọc dữ liệu từ CSV
        df = pd.read_csv(csv_path)
        if 'value' in df.columns:
            data = df['value'].values
        else:
            # Fallback nếu không có header
            data = pd.read_csv(csv_path, header=None).values[:, -1]
        
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

        # 5. Dự đoán (multi-class: 5 class)
        predictions = model.predict(X, verbose=0)
        y_pred_classes = np.argmax(predictions, axis=1)
        
        # 6. Tổng hợp kết quả - Trung bình xác suất
        from collections import Counter
        class_counts = Counter(y_pred_classes)
        total = len(y_pred_classes)
        
        # Tính trung bình xác suất từng class trên tất cả các đoạn
        avg_prob = np.mean(predictions, axis=0)  # shape: (5,)
        
        # Class có xác suất trung bình cao nhất = kết luận cuối
        final_class = int(np.argmax(avg_prob))
        primary_diagnosis = CLASS_NAMES[final_class]
        final_confidence = float(avg_prob[final_class] * 100)
        
        # Tạo chi tiết phân bố
        distribution = {CLASS_NAMES[c]: int(n) for c, n in sorted(class_counts.items())}
        
        # Cảnh báo nếu có class bất thường chiếm > 20%
        warnings = []
        for cls_idx in range(1, 5):  # Bỏ qua class 0 (Normal)
            if class_counts.get(cls_idx, 0) > 0:
                pct = class_counts[cls_idx] / total * 100
                if pct > 20:
                    warnings.append(f"Phat hien {class_counts[cls_idx]} doan {CLASS_NAMES[cls_idx]} ({pct:.1f}%) - Nen theo doi them")
        
        return {
            "diagnosis": CLASS_LABELS[primary_diagnosis],
            "diagnosis_code": primary_diagnosis,
            "is_abnormal": primary_diagnosis != 'N',
            "confidence": round(final_confidence, 2),
            "distribution": distribution,
            "total_segments": total,
            "warnings": warnings
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

