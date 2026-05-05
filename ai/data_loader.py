import wfdb
import os

"""
MIT-BIH có 3 loại file
.dat: file chứa dữ liệu ECG thô
.hea: file chứa thông tin về dữ liệu ECG: tần số lấy mẫu, số kênh, số mẫu, tên kênh, v.v.
.atr: file chứa thông tin về nhịp tim: vị trí nhịp, nhãn nhịp, v.v.
"""
def load_mitbih_data(data_dir='./data'):
    # 1. Kiểm tra và tải dữ liệu nếu chưa có
    if not os.path.exists(data_dir):
        print("Chưa có data, đang tiến hành tải về...")
        os.makedirs(data_dir)
        wfdb.dl_database('mitdb', data_dir)
    else:
        print("Data đã có sẵn trong máy!")

    # 2. Lấy danh sách bản ghi
    ALL_RECORDS = [f[:3] for f in os.listdir(data_dir) if f.endswith('.dat')]
    ALL_RECORDS.sort()

    # Vì 2 kênh 102 và 104 không có MLII nên ta bỏ qua
    if '102' in ALL_RECORDS: ALL_RECORDS.remove('102')
    if '104' in ALL_RECORDS: ALL_RECORDS.remove('104')

    all_signals    = []
    all_labels     = []
    all_record_ids = []

    print("Đang đọc dữ liệu, đợi xíu nha...")
    for rec_id in ALL_RECORDS:
        try:
            record = wfdb.rdrecord(f'{data_dir}/{rec_id}')      
            ann    = wfdb.rdann(f'{data_dir}/{rec_id}', 'atr')

            channel_names = record.sig_name
            
            # Chỉ lấy kênh MLII
            if 'MLII' in channel_names:
                mlii_index = channel_names.index('MLII')
                signal = record.p_signal[:, mlii_index]
                
                all_signals.append(signal)
                all_labels.append(ann)
                all_record_ids.append(rec_id)
            else:
                print(f"Bỏ qua bản ghi {rec_id} vì không có MLII.")

        except Exception as e:
            print(f"Lỗi bản ghi {rec_id}: {e}")

    print(f"=====================================")
    print(f"Đã load thành công: {len(all_signals)} bản ghi chuẩn MLII!")
    
    return all_signals, all_labels, all_record_ids