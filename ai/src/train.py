# File: train.py
import os
from data_loader import load_mitbih_data
from preprocess import build_dataset_pro, augment_train_data, CLASS_NAMES, NUM_CLASSES
from sklearn.model_selection import train_test_split
from model import build_cnn_lstm
from collections import Counter
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

# Setup absolute paths to prevent saving errors
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'models', 'best_ecg_model_5classes.keras')
REPORT_SAVE_PATH = os.path.join(BASE_DIR, 'reports', 'evaluation_results_5classes.png')

print("=== BƯỚC 1: LOAD DATA ===")
signals, labels, record_ids = load_mitbih_data()

print("\n=== BƯỚC 2: CHIA TẬP ĐỂ TRAIN, VALIDATION, TEST ===")
# Chia 3 mâm: Train (70%), Val (15%), Test (15%)
TRAIN_RECORDS, TEMP_RECORDS = train_test_split(record_ids, test_size=0.3, random_state=42)
VAL_RECORDS, TEST_RECORDS = train_test_split(TEMP_RECORDS, test_size=0.5, random_state=42)

print(f"Bệnh nhân Train: {len(TRAIN_RECORDS)} người")
print(f"Bệnh nhân Val:   {len(VAL_RECORDS)} người")
print(f"Bệnh nhân Test:  {len(TEST_RECORDS)} người")

print("\n=== BƯỚC 3: CHUẨN BỊ DỮ LIỆU ===")
print("Đang xử lý tập Train...")
X_train, y_train = build_dataset_pro(TRAIN_RECORDS, signals, labels, record_ids)

print("Đang xử lý tập Val...")
X_val, y_val = build_dataset_pro(VAL_RECORDS, signals, labels, record_ids)

print("Đang xử lý tập Test...")
X_test, y_test = build_dataset_pro(TEST_RECORDS, signals, labels, record_ids)

print("\n=== BƯỚC 4: TĂNG CƯỜNG DỮ LIỆU CHO TẬP TRAIN ===")
X_train_aug, y_train_aug = augment_train_data(X_train, y_train, num_copies=1)

def print_class_dist(name, y_onehot):
    y_cls = np.argmax(y_onehot, axis=1)
    counts = Counter(y_cls)
    dist = " | ".join([f"{CLASS_NAMES[c]}:{counts.get(c,0)}" for c in range(NUM_CLASSES)])
    print(f"{name}: {y_onehot.shape[0]} mẫu | {dist}")

print("\n=== BÁO CÁO PHÂN BỐ CLASS ===")
print_class_dist("Train (Đã cân bằng)", y_train_aug)
print_class_dist("Val (Nguyên bản)   ", y_val)
print_class_dist("Test (Nguyên bản)  ", y_test)

'''-----------------------------------------------------------------------------------------------------------'''

print("\n=== BƯỚC 5: XÂY DỰNG MÔ HÌNH ===")
model = build_cnn_lstm(input_shape=(500, 1))

model.summary()

print("Mô hình đã sẵn sàng!")

print("\n=== BƯỚC 6: HUẤN LUYỆN MÔ HÌNH ===")

# 1. Định nghĩa thang đo và thuật toán tối ưu
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=[
        'accuracy',
        tf.keras.metrics.Recall(name='recall'),
        tf.keras.metrics.Precision(name='precision'),
    ]
)

# Đảm bảo thư mục models tồn tại
os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)

# 2. Bộ quy tắc chống ngáo
callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        filepath=MODEL_SAVE_PATH,
        monitor='val_recall',
        mode='max',
        save_best_only=True,
        verbose=1
    ),
    tf.keras.callbacks.EarlyStopping(
        monitor='val_recall',
        patience=10,
        mode='max',
        restore_best_weights=True,
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,       
        patience=5,
        min_lr=1e-6,
        verbose=1
    ),
]

# 3. Quăng vào lò nung (Fit)
print("Đang bật lò bát quái, Laptop chuẩn bị cất cánh...")
history = model.fit(
    X_train_aug, y_train_aug,
    validation_data=(X_val, y_val),
    epochs=50,
    batch_size=64,
    callbacks=callbacks,
    verbose=1
)

print(f"\n=== ĐÃ TRAIN XONG! LƯU MÔ HÌNH TẠI {MODEL_SAVE_PATH} ===")

'''=================================================================================================='''
print("\n=== BƯỚC 7: GỌI HỒN AI XỊN NHẤT VÀ LÀM BÀI THI TỐT NGHIỆP ===")

print(f"Đang nạp kiến thức từ {MODEL_SAVE_PATH}...")
model = tf.keras.models.load_model(MODEL_SAVE_PATH)

print("Đang khám bệnh cho tập Test...")
y_prob = model.predict(X_test)

y_pred = np.argmax(y_prob, axis=1)
y_true = np.argmax(y_test, axis=1)

TARGET_NAMES = ['N (Normal)', 'L (LBBB)', 'R (RBBB)', 'A (PAC)', 'V (PVC)']

print("\n👉 BẢNG ĐIỂM TỔNG KẾT (CLASSIFICATION REPORT):")
print(classification_report(
    y_true, y_pred,
    target_names=TARGET_NAMES
))

# 4. VẼ BIỂU ĐỒ
plt.figure(figsize=(14, 5))

# --- Hình 1: Ma trận nhầm lẫn 5x5 ---
plt.subplot(1, 2, 1)
cm = confusion_matrix(y_true, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['N','L','R','A','V'], 
            yticklabels=['N','L','R','A','V'])
plt.title('Ma Trận Nhầm Lẫn (Confusion Matrix) - 5 Class')
plt.xlabel('AI Dự Đoán')
plt.ylabel('Thực Tế')

# --- Hình 2: Biểu đồ phân bố class trong tập Test ---
plt.subplot(1, 2, 2)
true_counts = Counter(y_true)
pred_counts = Counter(y_pred)
x_pos = np.arange(NUM_CLASSES)
width = 0.35
bars1 = plt.bar(x_pos - width/2, [true_counts.get(i, 0) for i in range(NUM_CLASSES)], 
                width, label='Thực tế', color='steelblue')
bars2 = plt.bar(x_pos + width/2, [pred_counts.get(i, 0) for i in range(NUM_CLASSES)], 
                width, label='AI Dự đoán', color='coral')
plt.xticks(x_pos, CLASS_NAMES)
plt.xlabel('Class')
plt.ylabel('Số lượng đoạn')
plt.title('Phân bố Class: Thực tế vs AI Dự đoán')
plt.legend()

os.makedirs(os.path.dirname(REPORT_SAVE_PATH), exist_ok=True)
plt.tight_layout()
plt.savefig(REPORT_SAVE_PATH, dpi=300)
print(f"Đã lưu biểu đồ tại {REPORT_SAVE_PATH}")
plt.show()