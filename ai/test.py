import os
import sys
import csv
import numpy as np
import tensorflow as tf
from collections import Counter

# Fix lỗi in tiếng Việt trên Terminal Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Các thông số giống lúc train (xem preprocess.py)
WINDOW_SIZE = 500
STEP_SIZE = 250
CLASS_NAMES = ['N (Normal)', 'L (LBBB)', 'R (RBBB)', 'A (PAC)', 'V (PVC)']

def extract_windows(signal):
    windows = []
    # Cắt thành các cửa sổ trượt (sliding window)
    for start in range(0, len(signal) - WINDOW_SIZE + 1, STEP_SIZE):
        end = start + WINDOW_SIZE
        window = signal[start:end]
        
        # Chuẩn hóa (chia cho max absolute) giống lúc train
        max_abs = np.max(np.abs(window))
        if max_abs > 0:
            window = window / max_abs
            
        windows.append(window)
    return np.array(windows)

def main():
    print("=== CHẨN ĐOÁN DỮ LIỆU TỪ ECG_DATA.CSV ===")
    
    # Do file test.py nằm ở thư mục ai/, nên đường dẫn tương đối sẽ là:
    csv_path = 'ecg-data1.csv'
    model_path = 'models/best_ecg_model.keras'
    
    if not os.path.exists(csv_path):
        print(f"Lỗi: Không tìm thấy file {csv_path}")
        return
        
    if not os.path.exists(model_path):
        print(f"Lỗi: Không tìm thấy model ở {model_path}")
        return
            
    print(f"1. Đọc dữ liệu từ {csv_path}...")
    signal = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        if 'value' not in reader.fieldnames:
            print("Lỗi: File CSV phải có cột 'value'")
            return
        for row in reader:
            signal.append(float(row['value']))
            
    signal = np.array(signal)
    print(f"   Đã đọc được {len(signal)} điểm dữ liệu.")
    
    print(f"2. Cắt tín hiệu thành các đoạn {WINDOW_SIZE} điểm...")
    X_windows = extract_windows(signal)
    
    if len(X_windows) == 0:
        print("Dữ liệu quá ngắn, không đủ 1 đoạn để dự đoán.")
        return
        
    print(f"   Đã cắt được {len(X_windows)} đoạn dữ liệu.")
    
    # Reshape về dạng 3D (N, 500, 1) cho model CNN
    X_windows = X_windows.reshape(-1, WINDOW_SIZE, 1)
    
    print(f"3. Load mô hình từ {model_path}...")
    model = tf.keras.models.load_model(model_path)
    
    print("4. Bắt đầu chẩn đoán...")
    y_prob = model.predict(X_windows)
    
    # Lấy class có xác suất cao nhất
    y_pred = np.argmax(y_prob, axis=1)
    
    print("\n=== CHI TIẾT KẾT QUẢ CHẨN ĐOÁN ===")
    for i in range(len(y_pred)):
        pred_class = CLASS_NAMES[y_pred[i]]
        prob = y_prob[i][y_pred[i]] * 100
        print(f"Đoạn {i+1:02d} (từ dòng {i*STEP_SIZE} - {i*STEP_SIZE+WINDOW_SIZE}): {pred_class:12s} | Độ tin cậy: {prob:.2f}%")
        
    print("\n=== THỐNG KÊ TỔNG QUAN ===")
    counts = Counter(y_pred)
    for cls_idx in range(len(CLASS_NAMES)):
        if counts[cls_idx] > 0:
            print(f"- Phát hiện {counts[cls_idx]} đoạn bị {CLASS_NAMES[cls_idx]}")

    # ============================================
    # KẾT LUẬN CUỐI CÙNG - Majority Voting
    # ============================================
    total = len(y_pred)
    
    # Tính trung bình xác suất từng class trên tất cả các đoạn
    avg_prob = np.mean(y_prob, axis=0)  # shape: (5,)
    
    # Class có xác suất trung bình cao nhất = kết luận cuối
    final_class = np.argmax(avg_prob)
    final_confidence = avg_prob[final_class] * 100
    
    print(f"\n{'='*50}")
    print(f"=== KẾT LUẬN CHẨN ĐOÁN CUỐI CÙNG ===")
    print(f"{'='*50}")
    print(f"Chẩn đoán: {CLASS_NAMES[final_class]}")
    print(f"Độ tin cậy tổng hợp: {final_confidence:.2f}%")
    
    # Hiển thị phân bố
    dist_parts = []
    for cls_idx in range(len(CLASS_NAMES)):
        if counts[cls_idx] > 0:
            pct = counts[cls_idx] / total * 100
            dist_parts.append(f"{CLASS_NAMES[cls_idx]}={counts[cls_idx]} ({pct:.1f}%)")
    print(f"Phân bố: {' | '.join(dist_parts)} | Tổng: {total} đoạn")
    
    # Cảnh báo nếu có class bất thường chiếm > 20%
    for cls_idx in range(1, len(CLASS_NAMES)):  # Bỏ qua class 0 (Normal)
        if counts[cls_idx] > 0:
            pct = counts[cls_idx] / total * 100
            if pct > 20:
                print(f"⚠️  Lưu ý: Phát hiện {counts[cls_idx]} đoạn {CLASS_NAMES[cls_idx]} ({pct:.1f}%) - Nên theo dõi thêm")

if __name__ == "__main__":
    main()