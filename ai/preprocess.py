from scipy.signal import resample_poly
import math
import numpy as np

WINDOW_SIZE = 500   # 5 giây @ 100Hz
STEP_SIZE   = 250   # Overlap 50% (bước nhảy 2.5s)

# Nhãn chuẩn của AAMI
NORMAL_LABELS   = ['N', 'L', 'R', 'e', 'j']
ABNORMAL_LABELS = ['A', 'a', 'J', 'S', 'V', 'E', 'F', '/', 'f', 'Q']
VALID_SYMBOLS   = set(NORMAL_LABELS + ABNORMAL_LABELS)

# ---------------------------------------------------------
# 1. CÁC HÀM XỬ LÝ CƠ BẢN
# ---------------------------------------------------------
def downsample_signal(signal, fs_orig=360, fs_target=100):
    gcd = math.gcd(fs_target, fs_orig)
    up = fs_target // gcd
    down = fs_orig // gcd
    signal = signal.astype(float)
    return resample_poly(signal, up, down)

def rescale_annotations(sample_indices, fs_orig=360, fs_target=100):
    scale = fs_target / fs_orig
    return (np.array(sample_indices) * scale).astype(int)

def label_window(window_start, window_end, ann_samples, ann_symbols):
    mask = (ann_samples >= window_start) & (ann_samples < window_end)
    symbols_in_window = [
        ann_symbols[i] for i, m in enumerate(mask) 
        if m and ann_symbols[i] in VALID_SYMBOLS
    ]
    if len(symbols_in_window) == 0:
        return None
    for sym in symbols_in_window:
        if sym in ABNORMAL_LABELS:
            return 1
    return 0

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
# 2. HÀM BĂM THỊT (TINH GỌN, KHÔNG AUGMENT TRONG NÀY NỮA)
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
    
    # Return ra shape 3D (N, 500, 1) cho CNN
    return X.reshape(-1, 500, 1), y

# ---------------------------------------------------------
# 3. HÀM AUGMENTATION DÀNH RIÊNG CHO TẬP TRAIN
# ---------------------------------------------------------
def augment_ecg(window, label):
    """
    Tạo 1 bản augmented từ 1 window gốc.
    Đã FIX lỗi Shape: Hỗ trợ window có shape (500, 1).
    """
    aug = window.copy()

    # 1. Gaussian noise
    if np.random.random() < 0.7:   
        noise_level = np.random.uniform(0.02, 0.10)
        # Fix: Dùng aug.shape thay vì len(aug) để nhiễu khớp đúng chiều (500, 1)
        aug += np.random.normal(0, noise_level, aug.shape)

    # 2. Baseline wander
    if np.random.random() < 0.6:
        freq = np.random.uniform(0.05, 0.5)
        amp  = np.random.uniform(0.05, 0.20)
        # Fix: Reshape biến t thành (500, 1) cho khớp
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
    X_aug, y_aug = [], []
    
    abnormal_idx = np.where(y_train == 1)[0]
    print(f"Đang tiến hành phẫu thuật thẩm mỹ cho {len(abnormal_idx)} ca bệnh...")

    for idx in abnormal_idx:
        for _ in range(num_copies):
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