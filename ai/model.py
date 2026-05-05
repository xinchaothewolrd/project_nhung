# File: model.py
import tensorflow as tf
from tensorflow.keras import layers, Model, Input

def build_cnn_lstm(input_shape=(500, 1)):
    """
    Xây dựng kiến trúc mạng lai CNN - LSTM để khám bệnh điện tim.
    """
    inputs = Input(shape=input_shape)

    # ── Khối CNN 1 (Mắt thần - Đã nâng cấp kernel_size lên 15) ──
    x = layers.Conv1D(64, kernel_size=15, padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling1D(pool_size=2)(x)

    # ── Khối CNN 2 (Soi chi tiết) ──
    x = layers.Conv1D(128, kernel_size=3, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling1D(pool_size=2)(x)

    # ── Khối LSTM 1 (Não trái) ──
    x = layers.LSTM(128, return_sequences=True)(x)
    x = layers.Dropout(0.3)(x)

    # ── Khối LSTM 2 (Não phải) ──
    x = layers.LSTM(64, return_sequences=False)(x)
    x = layers.Dropout(0.3)(x)

    # ── Fully Connected (Tòa án chốt hạ) ──
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)

    return Model(inputs, outputs, name='ECG_CNN_LSTM')