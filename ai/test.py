import wfdb
import numpy as np
import matplotlib.pyplot as plt

# Tải bản ghi số 100 (1 trong 48 bản ghi của MIT-BIH)
record = wfdb.rdrecord('100', pn_dir='mitdb')

# Xem thông tin cơ bản
print("Tên kênh:", record.sig_name)   # ['MLII', 'V5']
print("Tần số lấy mẫu:", record.fs)    # 360
print("Shape tín hiệu:", record.p_signal.shape)  # (650000, 2)

# Chỉ lấy kênh 0 (MLII) — quan trọng, không được lấy cả 2
ecg_mlii = record.p_signal[:, 0]
print("Shape sau khi lấy kênh MLII:", ecg_mlii.shape)  # (650000,)

# Đọc nhãn (annotation)
annotation = wfdb.rdann('100', 'atr', pn_dir='mitdb')
print("Số nhịp tim:", len(annotation.symbol))  # ~2000 nhịp/30 phút
print("Vị trí nhịp (samples):", annotation.sample[:5])
print("Nhãn nhịp:", annotation.symbol[:5])