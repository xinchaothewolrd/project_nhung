# File: main.py
from data_loader import load_mitbih_data
from preprocess import build_dataset_pro, augment_train_data
from sklearn.model_selection import train_test_split
from model import build_cnn_lstm
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, classification_report,
    roc_auc_score, roc_curve
)

print("=== BƯỚC 1: BỐC VÁC DATA ===")
signals, labels, record_ids = load_mitbih_data()

print("\n=== BƯỚC 2: PHÂN LÔ BÁN NỀN (CHIA 3 MÂM BỆNH NHÂN) ===")
# Chia 3 mâm: Train (70%), Val (15%), Test (15%)
TRAIN_RECORDS, TEMP_RECORDS = train_test_split(record_ids, test_size=0.3, random_state=42)
VAL_RECORDS, TEST_RECORDS = train_test_split(TEMP_RECORDS, test_size=0.5, random_state=42)

print(f"Bệnh nhân Train: {len(TRAIN_RECORDS)} người")
print(f"Bệnh nhân Val:   {len(VAL_RECORDS)} người")
print(f"Bệnh nhân Test:  {len(TEST_RECORDS)} người")

print("\n=== BƯỚC 3: XẮT THỊT (KHÔNG AUGMENT Ở BƯỚC NÀY) ===")
# Hàm build_dataset_pro giờ chỉ cắt thịt thuần túy, không nhận apply_augment nữa
print("Đang xử lý tập Train...")
X_train, y_train = build_dataset_pro(TRAIN_RECORDS, signals, labels, record_ids)

print("Đang xử lý tập Val...")
X_val, y_val = build_dataset_pro(VAL_RECORDS, signals, labels, record_ids)

print("Đang xử lý tập Test...")
X_test, y_test = build_dataset_pro(TEST_RECORDS, signals, labels, record_ids)

print("\n=== BƯỚC 4: TIÊM DOPING (AUGMENT) DÀNH RIÊNG CHO TẬP TRAIN ===")
# Gọi riêng thằng quản lý ra để bơm nhiễu và xào bài
X_train_aug, y_train_aug = augment_train_data(X_train, y_train, num_copies=1)

print("\n=== BÁO CÁO NGHIỆM THU CHO HỘI ĐỒNG ===")
print(f"Train (Đã cân bằng): {X_train_aug.shape} | Tỉ lệ bệnh: {y_train_aug.mean()*100:.1f}%")
print(f"Val (Nguyên bản)   : {X_val.shape}   | Tỉ lệ bệnh: {y_val.mean()*100:.1f}%")
print(f"Test (Nguyên bản)  : {X_test.shape}  | Tỉ lệ bệnh: {y_test.mean()*100:.1f}%")

# Xong! Từ dòng này trở đi là mày vác X_train_aug, y_train_aug tống vào model.fit() được rồi đấy!

'''-----------------------------------------------------------------------------------------------------------'''

print("\n=== BƯỚC 5: KHAI MỞ LÒ BÁT QUÁI (BUILD MODEL) ===")
# Gọi thợ rèn đúc ra con AI
model = build_cnn_lstm(input_shape=(500, 1))

# In ra bản vẽ thiết kế xem dung lượng bao nhiêu
model.summary()

print("Mô hình đã sẵn sàng! Đợi chủ nhân ném 3 bước tiếp theo vào...")

print("\n=== BƯỚC 6: CẮM ĐIỆN VÀ HUẤN LUYỆN AI (TRAINING) ===")

# 1. Định nghĩa thang đo và thuật toán tối ưu
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='binary_crossentropy',
    metrics=[
        'accuracy',
        tf.keras.metrics.Recall(name='recall'),
        tf.keras.metrics.Precision(name='precision'),
        tf.keras.metrics.AUC(name='auc'),
    ]
)

# 2. Bộ quy tắc chống ngáo (Callbacks của Claude - Quá đỉnh, giữ nguyên!)
callbacks = [
    # Lưu mô hình tốt nhất (Đuôi .keras là chuẩn mới, .h5 cũ rồi)
    tf.keras.callbacks.ModelCheckpoint(
        filepath='best_ecg_model.keras',
        monitor='val_recall',   # Bác sĩ quan tâm Recall (độ nhạy) nhất!
        mode='max',
        save_best_only=True,
        verbose=1
    ),

    # Dừng sớm nếu AI bắt đầu "học vẹt"
    tf.keras.callbacks.EarlyStopping(
        monitor='val_recall',
        patience=10,
        mode='max',
        restore_best_weights=True,
        verbose=1
    ),

    # Hết động lực thì cho uống bò húc (Giảm Learning Rate)
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
    X_train_aug, y_train_aug,    # CHÚ Ý: Dùng data ĐÃ AUGMENT!
    validation_data=(X_val, y_val),
    epochs=50,
    batch_size=64,               # Để 64 cho nó chạy lẹ, RAM yếu thì hạ xuống 32
    callbacks=callbacks,
    verbose=1
)

print("\n=== ĐÃ TRAIN XONG! LƯU MÔ HÌNH VÀO TAY TRANG BỊ CHUẨN BỊ CHO ESP32 ===")

'''=================================================================================================='''
print("\n=== BƯỚC 7: GỌI HỒN AI XỊN NHẤT VÀ LÀM BÀI THI TỐT NGHIỆP ===")

# 1. Load model đúng tên anh em mình đã thống nhất
print("Đang nạp kiến thức từ best_ecg_model.keras...")
model = tf.keras.models.load_model('best_ecg_model.keras')

# 2. Bắt nó khám bệnh trên tập Test (tập dữ liệu nó chưa từng thấy bao giờ)
print("Đang khám bệnh cho tập Test...")
y_prob = model.predict(X_test).flatten()  

# Chuyển xác suất -> Phán quyết (Trên 50% là Bệnh, dưới là Khỏe)
THRESHOLD = 0.5
y_pred = (y_prob >= THRESHOLD).astype(int)

# 3. BÁO CÁO BẰNG SỐ (Để copy vào file Word)
print("\n👉 BẢNG ĐIỂM TỔNG KẾT (CLASSIFICATION REPORT):")
print(classification_report(
    y_test, y_pred,
    target_names=['Khỏe (0)', 'Bệnh (1)']
))

auc = roc_auc_score(y_test, y_prob)
print(f"🔥 ĐIỂM TỔNG HỢP AUC-ROC: {auc:.4f} (Mục tiêu > 0.90 là xuất sắc!)")

# 4. VẼ BIỂU ĐỒ (Dùng Snipping Tool cắt dán thẳng vào Slide thuyết trình)
plt.figure(figsize=(12, 5))

# --- Hình 1: Ma trận nhầm lẫn ---
plt.subplot(1, 2, 1)
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Đoán Khỏe', 'Đoán Bệnh'], 
            yticklabels=['Thực Khỏe', 'Thực Bệnh'])
plt.title('Ma Trận Nhầm Lẫn (Confusion Matrix)')
plt.xlabel('AI Dự Đoán')
plt.ylabel('Thực Tế')

# --- Hình 2: Đường cong ROC ---
plt.subplot(1, 2, 2)
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
plt.plot(fpr, tpr, color='red', lw=2, label=f'Đường ROC (AUC = {auc:.3f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--') # Đường random
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('Tỉ lệ báo động giả (False Positive Rate)')
plt.ylabel('Tỉ lệ bắt trúng bệnh (True Positive Rate)')
plt.title('Đường cong đặc trưng hoạt động (ROC Curve)')
plt.legend(loc="lower right")

# Hiện hình!
plt.tight_layout()
plt.show()