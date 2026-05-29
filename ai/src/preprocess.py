from scipy.signal import resample_poly
from collections import Counter
import math
from tensorflow.keras.utils import to_categorical
import numpy as np

WINDOW_SIZE = 500   # 5 giây @ 100Hz
STEP_SIZE   = 250   # Overlap 50% (bước nhảy 2.5s)

# Mapping nhãn MIT-BIH → 5 class (chuẩn AAMI)
CLASS_MAP = {
    'N': 0, 'e': 0, 'j': 0,             # Normal
    'L': 1,                               # LBBB
    'R': 2,                               # RBBB
    'A': 3, 'a': 3, 'J': 3, 'S': 3,      # PAC/APC
    'V': 4, 'E': 4,                       # PVC
}

CLASS_NAMES = ['N', 'L', 'R', 'A', 'V']
NUM_CLASSES = 5

# ---------------------------------------------------------
# 1. CÁC HÀM XỬ LÝ CƠ BẢN
# ---------------------------------------------------------

# Giảm tần số lấy mẫu từ 360Hz về 100Hz
def downsample_signal(signal, fs_orig=360, fs_target=100):
    gcd = math.gcd(fs_target, fs_orig)
    up = fs_target // gcd
    down = fs_orig // gcd
    signal = signal.astype(float)
    return resample_poly(signal, up, down)

# scale lại vị trí khi downsample từ 360 -> 100
def rescale_annotations(sample_indices, fs_orig=360, fs_target=100):
    scale = fs_target / fs_orig
    return (np.array(sample_indices) * scale).astype(int)

# Gắn nhãn cho từng cửa sổ (window) - Majority Voting
# Đếm nhãn xuất hiện nhiều nhất trong window → gán cho window đó
def label_window(window_start, window_end, ann_samples, ann_symbols):
    mask = (ann_samples >= window_start) & (ann_samples < window_end)
    symbols_in_window = [
        ann_symbols[i] for i, m in enumerate(mask) 
        if m and ann_symbols[i] in CLASS_MAP
    ]
    if len(symbols_in_window) == 0:
        return None
    
    # Majority voting: đếm số lượng từng class, lấy class nhiều nhất
    class_counts = Counter(CLASS_MAP[sym] for sym in symbols_in_window)
    return class_counts.most_common(1)[0][0]

# Cắt tín hiệu thành các đoạn nhỏ (windowing)
def extract_windows(signal, ann_samples, ann_symbols):
    X_windows = []
    y_labels  = []
    for start in range(0, len(signal) - WINDOW_SIZE, STEP_SIZE):
        end    = start + WINDOW_SIZE
        window = signal[start:end]

        max_abs = np.max(np.abs(window))
        if max_abs > 0:
            window = window / max_abs

        label = label_window(start, end, ann_samples, ann_symbols)
        if label is None:
            continue

        X_windows.append(window)
        y_labels.append(label)
    return X_windows, y_labels

# ---------------------------------------------------------
# 2. Xử lý và gộp dữ liệu
# ---------------------------------------------------------
def build_dataset_pro(target_records, all_signals, all_labels, all_record_ids):
    X_list, y_list = [], []
    
    for rec_id in target_records:
        if rec_id not in all_record_ids:
            continue
            
        idx = all_record_ids.index(rec_id)
        sig  = downsample_signal(all_signals[idx]) 
        samp = rescale_annotations(all_labels[idx].sample)
        syms = all_labels[idx].symbol
        
        X_rec, y_rec = extract_windows(sig, samp, syms)
        
        if len(X_rec) == 0:
            continue
            
        X_list.extend(X_rec)
        y_list.extend(y_rec)

    X = np.array(X_list)
    y = np.array(y_list)
    
    # One-hot encoding cho multi-class (5 class)

    y_onehot = to_categorical(y, num_classes=NUM_CLASSES)
    
    # Return ra shape 3D (N, 500, 1) cho CNN
    return X.reshape(-1, 500, 1), y_onehot

# ---------------------------------------------------------
# 3. HÀM AUGMENTATION DÀNH RIÊNG CHO TẬP TRAIN - Thêm nhiễu tránh overfiting
# ---------------------------------------------------------
def augment_ecg(window, label):
    aug = window.copy()

    # 1. Gaussian noise
    if np.random.random() < 0.7:   
        noise_level = np.random.uniform(0.02, 0.10)
        aug += np.random.normal(0, noise_level, aug.shape)

    # 2. Baseline wander
    if np.random.random() < 0.6:
        freq = np.random.uniform(0.05, 0.5)
        amp  = np.random.uniform(0.05, 0.20)
        t    = np.linspace(0, 5, aug.shape[0]).reshape(-1, 1)
        aug += amp * np.sin(2 * np.pi * freq * t)

    # 3. Amplitude scaling
    if np.random.random() < 0.5:
        scale = np.random.uniform(0.8, 1.2)
        aug  *= scale

    # Chuẩn hóa lại sau khi bơm nhiễu
    max_abs = np.max(np.abs(aug))
    if max_abs > 0:
        aug = aug / max_abs

    return aug, label

def augment_train_data(X_train, y_train, num_copies=3):
    """
    Augment các class thiểu số để cân bằng dữ liệu.
    y_train: one-hot encoded (N, NUM_CLASSES)
    """
    X_aug, y_aug = [], []
    
    # Chuyển one-hot → class index để đếm
    y_classes = np.argmax(y_train, axis=1)
    class_counts = np.bincount(y_classes, minlength=NUM_CLASSES)
    max_count = class_counts.max()
    
    # Augment từng class thiểu số lên gần bằng class lớn nhất
    for cls in range(NUM_CLASSES):
        cls_idx = np.where(y_classes == cls)[0]
        if len(cls_idx) == 0:
            continue
        n_needed = max_count - len(cls_idx)
        for _ in range(n_needed):
            idx = np.random.choice(cls_idx)
            x_a, y_a = augment_ecg(X_train[idx], y_train[idx])
            X_aug.append(x_a)
            y_aug.append(y_a)

    if len(X_aug) == 0:
        return X_train, y_train 

    X_aug = np.array(X_aug)
    y_aug = np.array(y_aug)
    
    X_train_final = np.concatenate([X_train, X_aug], axis=0)
    y_train_final = np.concatenate([y_train, y_aug], axis=0)

    # Lắc xí ngầu
    shuffle_idx = np.random.permutation(len(X_train_final))
    return X_train_final[shuffle_idx], y_train_final[shuffle_idx]