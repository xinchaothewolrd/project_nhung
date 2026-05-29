#include <FS.h>
#include <LittleFS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>

#include "MAX30105.h"
#include "spo2_algorithm.h"

// =========================================================
// CẤU HÌNH
// =========================================================
const char* WIFI_SSID           = "FPT Telecom-60EE";
const char* WIFI_PASS           = "passlagi";
const int   ECG_POINTS_TARGET   = 6000;        // Ép lấy ĐÚNG 6000 điểm
const long  SPO2_DURATION_MS    = 15000;       // Đo SpO2 trong 15 giây
const char* ECG_FILE_PATH       = "/ecg_data.csv";

const char* BACKEND_HOST        = "192.168.1.4"; // IP máy chạy backend (điều chỉnh cho phù hợp)
const int   BACKEND_PORT        = 5000;

// =========================================================
// PHẦN CỨNG
// =========================================================
LiquidCrystal_I2C lcd(0x27, 16, 2);
MAX30105 particleSensor;

#define PIN_ECG_OUT   32
#define PIN_LO_PLUS   34
#define PIN_LO_MINUS  35
#define PIN_SDA       21
#define PIN_SCL       22

// =========================================================
// STATE MACHINE TÁCH PHÂN ĐOẠN
// =========================================================
enum State { IDLE, MEASURE_ECG, MEASURE_SPO2, RESULT };
State currentState = IDLE;

// =========================================================
// BIẾN ĐO LƯỜNG
// =========================================================
uint32_t irBuffer[100];
uint32_t redBuffer[100];

int32_t  spo2          = 0;
int8_t   validSPO2     = 0;
int32_t  heartRate     = 0;
int8_t   validHeartRate = 0;

long     totalHeartRate = 0;
long     totalSpO2      = 0;
int      hrCount        = 0;
int      spo2Count      = 0;
float    avgHeartRate   = 0.0;
float    avgSpO2        = 0.0;

unsigned long phaseStartTime = 0;
File ecgFile;

// Biến cho ECG
unsigned long lastEcgMicros = 0;
int ecgCount = 0; 
bool spo2Initialized = false;

// =========================================================
// TIỆN ÍCH LCD
// =========================================================
void lcdPrint(const char* line1, const char* line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// =========================================================
// GỬI DỮ LIỆU SỨC KHỎE LÊN BACKEND (STREAM FILE TIẾT KIỆM RAM)
// =========================================================
String uploadData(float bpm, float spo2) {
  WiFiClient client;
  Serial.printf("\nDang ket noi den Backend: %s:%d...\n", BACKEND_HOST, BACKEND_PORT);
  
  if (!client.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("[ERROR] Ket noi Backend that bai!");
    return "Conn Failed";
  }

  // Mở file dữ liệu ECG để gửi
  if (!LittleFS.exists(ECG_FILE_PATH)) {
    Serial.println("[ERROR] File ECG khong ton tai!");
    return "No ECG File";
  }
  
  File file = LittleFS.open(ECG_FILE_PATH, FILE_READ);
  if (!file) {
    Serial.println("[ERROR] Khong mo duoc file ECG!");
    return "File Open Err";
  }
  
  unsigned long fileSize = file.size();
  Serial.printf("Kich thuoc file ECG: %lu bytes\n", fileSize);

  // Tạo boundary ngẫu nhiên cho multipart/form-data
  String boundary = "ESP32Boundary" + String(millis());
  
  // Xây dựng phần header multipart
  String header = "";
  header += "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"mac_address\"\r\n\r\n";
  header += WiFi.macAddress() + "\r\n";
  
  header += "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"bpm\"\r\n\r\n";
  header += String(bpm, 1) + "\r\n";
  
  header += "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"spo2\"\r\n\r\n";
  header += String(spo2, 1) + "\r\n";
  
  header += "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"ecg_file\"; filename=\"ecg_data.csv\"\r\n";
  header += "Content-Type: text/csv\r\n\r\n";

  String footer = "\r\n--" + boundary + "--\r\n";

  // Tổng chiều dài Content-Length
  long totalLength = header.length() + fileSize + footer.length();

  // Gửi request HTTP headers
  client.print("POST /api/upload HTTP/1.1\r\n");
  client.print("Host: " + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + "\r\n");
  client.print("Content-Type: multipart/form-data; boundary=" + boundary + "\r\n");
  client.print("Content-Length: " + String(totalLength) + "\r\n");
  client.print("Connection: close\r\n\r\n");

  // Gửi nội dung header multipart
  client.print(header);

  // Gửi nội dung file theo từng chunk để bảo vệ RAM
  uint8_t buffer[512];
  size_t bytesSent = 0;
  while (file.available()) {
    size_t len = file.read(buffer, sizeof(buffer));
    client.write(buffer, len);
    bytesSent += len;
    
    // In tiến độ gửi
    if (bytesSent % 10240 == 0 || bytesSent == fileSize) {
      Serial.printf("Da gui: %d/%d bytes...\n", bytesSent, fileSize);
    }
    yield(); // Nhường luồng tránh kích hoạt Watchdog Timer
  }
  file.close();

  // Gửi phần footer kết thúc multipart
  client.print(footer);
  Serial.println("Gui file ECG thanh cong. Dang cho Backend phan hoi...");

  // Chờ phản hồi từ Backend với timeout 60 giây
  unsigned long timeout = millis();
  while (client.connected() && !client.available()) {
    if (millis() - timeout > 60000) {
      Serial.println("[ERROR] Timeout cho phan hoi tu Backend!");
      client.stop();
      return "Timeout";
    }
    delay(10);
  }

  // Đọc phản hồi
  String response = "";
  bool isBody = false;
  while (client.available()) {
    String line = client.readStringUntil('\n');
    if (line == "\r" || line == "") {
      isBody = true;
      continue;
    }
    if (isBody) {
      response += line;
    }
  }
  client.stop();

  Serial.println("Response tu Backend: " + response);

  // Trích xuất chẩn đoán "diagnosis" từ JSON
  int diagIdx = response.indexOf("\"diagnosis\":\"");
  if (diagIdx != -1) {
    int startIdx = diagIdx + 13;
    int endIdx = response.indexOf("\"", startIdx);
    if (endIdx != -1) {
      String diagResult = response.substring(startIdx, endIdx);
      Serial.println("Chan doan AI trinh chieu: " + diagResult);
      return diagResult;
    }
  }

  if (response.indexOf("Device not registered") != -1) {
    return "Unregistered Dev";
  }

  return "Upload OK";
}

// =========================================================
// SETUP
// =========================================================
void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  lcdPrint("Khoi dong...");

  Wire.begin(PIN_SDA, PIN_SCL);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(PIN_LO_PLUS,  INPUT);
  pinMode(PIN_LO_MINUS, INPUT);

  if (!LittleFS.begin(true)) {
    Serial.println("[ERROR] LittleFS that bai!");
    lcdPrint("LittleFS ERROR", "Reset lai!");
    while (1) delay(1000);
  }
  
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("[ERROR] Khong tim thay MAX30102!");
    lcdPrint("MAX30102 ERROR", "Kiem tra cam bien!");
    while (1) delay(1000);
  }
  
  byte ledBrightness = 60; // Độ sáng LED (0-255)
  byte sampleAverage = 4;  // Trung bình 4 mẫu -> 100/4 = 25Hz output
  byte ledMode = 2;        // Red + IR
  int sampleRate = 100;    // Tần số lấy mẫu 100Hz
  int pulseWidth = 411;    // Độ rộng xung max
  int adcRange = 4096;     // ADC Range
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  lcdPrint("Ket noi WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 30) {
    delay(500);
    timeout++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    lcdPrint("WiFi FAILED!", "Kiem tra lai");
    while (1) delay(1000);
  }

  lcdPrint("WiFi OK!", WiFi.localIP().toString().c_str());
  delay(2000);

  currentState = IDLE;
}

// =========================================================
// RESET BIẾN ĐO
// =========================================================
void resetMeasurementVars() {
  totalHeartRate  = 0;
  totalSpO2       = 0;
  hrCount         = 0;
  spo2Count       = 0;
  avgHeartRate    = 0.0;
  avgSpO2         = 0.0;
  heartRate       = 0;
  spo2            = 0;
  validHeartRate  = 0;
  validSPO2       = 0;
  
  ecgCount        = 0;
  spo2Initialized = false;
}

// =========================================================
// BẮT ĐẦU ĐO ECG
// =========================================================
bool startECG() {
  resetMeasurementVars();

  if (LittleFS.exists(ECG_FILE_PATH)) {
    LittleFS.remove(ECG_FILE_PATH);
  }
  ecgFile = LittleFS.open(ECG_FILE_PATH, FILE_WRITE);
  if (!ecgFile) {
    Serial.println("[ERROR] Khong tao duoc file ECG!");
    return false;
  }
  ecgFile.println("timestamp,value");

  phaseStartTime = millis();
  lastEcgMicros = micros();
  Serial.println("\n========== BAT DAU DO ECG (DUNG 6000 DIEM) ==========");
  return true;
}

// =========================================================
// LOOP CHÍNH
// =========================================================
void loop() {
  unsigned long currentMillis = millis();

  switch (currentState) {

    // -----------------------------------------------------
    // TRẠNG THÁI: CHỜ
    // -----------------------------------------------------
    case IDLE:
    {
      static bool idleDisplayed = false;
      if (!idleDisplayed) {
        lcdPrint("San sang do!", "Go 's' de bat dau");
        idleDisplayed = true;
      }

      while (Serial.available() > 0) {
        char cmd = Serial.read();
        if (cmd == 's' || cmd == 'S') {
          idleDisplayed = false;
          if (startECG()) {
            currentState = MEASURE_ECG;
          } else {
            lcdPrint("Loi tao file!", "Thu lai...");
            delay(2000);
          }
          break;
        }
      }
    }
    break;

    // -----------------------------------------------------
    // TRẠNG THÁI: ĐO ECG ĐỘC LẬP (ĐÚNG 6000 ĐIỂM)
    // -----------------------------------------------------
    case MEASURE_ECG:
    {
      unsigned long currentMicros = micros();
      
      // Dùng micros() và cộng dồn 10000us (10ms) để không bị trượt mili-giây nào
      if (currentMicros - lastEcgMicros >= 10000) {
        lastEcgMicros += 10000; // Bí kíp chống trôi thời gian ở đây

        if (digitalRead(PIN_LO_PLUS) == HIGH || digitalRead(PIN_LO_MINUS) == HIGH) {
          if (ecgFile) ecgFile.close();
          lcdPrint("Loi: Rot dien cuc", "Do lai tu dau");
          delay(3000);
          currentState = IDLE;
          break;
        }

        int ecgValue = analogRead(PIN_ECG_OUT);
        if (ecgFile) {
          ecgFile.printf("%d,%d\n", ecgCount * 10, ecgValue); // In thẳng timestamp quy chuẩn
        }
        ecgCount++;

        // Khi đủ ĐÚNG 6000 điểm -> Chuyển trạng thái
        if (ecgCount >= ECG_POINTS_TARGET) {
          if (ecgFile) ecgFile.close();
          Serial.printf("Xong ECG! Da luu CHINH XAC %d diem.\n", ecgCount);
          
          phaseStartTime = millis(); 
          Serial.println("========== BAT DAU DO SpO2 (15s) ==========");
          currentState = MEASURE_SPO2;
        }
      }

      // Cập nhật LCD
      static unsigned long lastLcdUpdate = 0;
      if (currentMillis - lastLcdUpdate >= 1000) {
        lastLcdUpdate = currentMillis;
        int pct = (ecgCount * 100) / ECG_POINTS_TARGET;
        char line1[17], line2[17];
        snprintf(line1, sizeof(line1), "Dang do ECG... ");
        snprintf(line2, sizeof(line2), "Tien do: %3d%% ", pct);
        lcdPrint(line1, line2);
      }
    }
    break;

    // -----------------------------------------------------
    // TRẠNG THÁI: ĐO SPO2 (15 GIÂY - BLOCKING CHUẨN SPARKFUN)
    // -----------------------------------------------------
    case MEASURE_SPO2:
    {
      unsigned long elapsed = currentMillis - phaseStartTime;
      int remaining = (SPO2_DURATION_MS - elapsed) / 1000;

      // Cập nhật LCD
      static unsigned long lastLcdUpdateSpo2 = 0;
      if (currentMillis - lastLcdUpdateSpo2 >= 1000) {
        lastLcdUpdateSpo2 = currentMillis;
        char line1[17], line2[17];
        snprintf(line1, sizeof(line1), "Dang do SpO2...");
        snprintf(line2, sizeof(line2), "Con lai: %2ds", remaining);
        lcdPrint(line1, line2);
      }

      // Bước 1: Khởi tạo dữ liệu 100 mẫu đầu tiên (chỉ chạy 1 lần)
      if (!spo2Initialized) {
        particleSensor.clearFIFO();
        for (byte i = 0 ; i < 100 ; i++) {
          while (particleSensor.available() == false) {
            particleSensor.check();
            yield(); // Tránh bị Watchdog Reset
          }
          redBuffer[i] = particleSensor.getRed();
          irBuffer[i]  = particleSensor.getIR();
          particleSensor.nextSample();
        }
        maxim_heart_rate_and_oxygen_saturation(irBuffer, 100, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
        spo2Initialized = true;
      }

      // Bước 2: Dịch chuyển 25 mẫu cũ và đọc thêm 25 mẫu mới liên tục
      for (byte i = 25; i < 100; i++) {
        redBuffer[i - 25] = redBuffer[i];
        irBuffer[i - 25]  = irBuffer[i];
      }
      for (byte i = 75; i < 100; i++) {
        while (particleSensor.available() == false) {
          particleSensor.check();
          yield();
        }
        redBuffer[i] = particleSensor.getRed();
        irBuffer[i]  = particleSensor.getIR();
        particleSensor.nextSample();
      }

      // Bước 3: Tính toán lại với dữ liệu mới
      maxim_heart_rate_and_oxygen_saturation(irBuffer, 100, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
      Serial.printf("-> Check SpO2: BPM=%d (Hop le=%d) | SpO2=%d (Hop le=%d)\n", heartRate, validHeartRate, spo2, validSPO2);

      if (validHeartRate == 1 && heartRate > 40 && heartRate < 180) {
        totalHeartRate += heartRate;
        hrCount++;
      }
      if (validSPO2 == 1 && spo2 > 70 && spo2 <= 100) {
        totalSpO2 += spo2;
        spo2Count++;
      }

      // Hết 15 giây -> Kết thúc đo
      if (elapsed >= SPO2_DURATION_MS) {
        if (hrCount > 0)   avgHeartRate = (float)totalHeartRate / hrCount;
        if (spo2Count > 0) avgSpO2      = (float)totalSpO2      / spo2Count;

        Serial.println("\n========== DO XONG TOAN BO ==========");
        Serial.printf("So diem ECG da lay: %d diem\n", ecgCount); 
        Serial.printf("AVG BPM : %.1f (tu %d phep tinh)\n", avgHeartRate, hrCount);
        Serial.printf("AVG SpO2: %.1f%% (tu %d phep tinh)\n", avgSpO2, spo2Count);
        
        currentState = RESULT;
      }
    }
    break;

    // -----------------------------------------------------
    // TRẠNG THÁI: HIỂN THỊ KẾT QUẢ
    // -----------------------------------------------------
    case RESULT:
    {
      static bool resultDisplayed = false;
      static unsigned long resultTime = 0;
      static String diagnosisResult = "";

      if (!resultDisplayed) {
        char l1[17], l2[17];
        snprintf(l1, sizeof(l1), "%.0fBPM  SpO2:%.0f%%", avgHeartRate, avgSpO2);
        
        // Hiển thị trạng thái đang tải lên
        snprintf(l2, sizeof(l2), "Uploading...");
        lcdPrint(l1, l2);

        // Gọi hàm gửi dữ liệu và lấy chẩn đoán AI
        diagnosisResult = uploadData(avgHeartRate, avgSpO2);

        // Cập nhật kết quả lên màn hình LCD
        char l2_diag[17];
        snprintf(l2_diag, sizeof(l2_diag), "%.16s", diagnosisResult.c_str());
        lcdPrint(l1, l2_diag);

        resultDisplayed = true;
        resultTime = millis();
      }

      // Sau 5 phút tự về IDLE
      if (millis() - resultTime >= 300000) {
        resultDisplayed = false;
        currentState = IDLE;
      }

      // Gõ 's' để đo lại sớm
      while (Serial.available() > 0) {
        char cmd = Serial.read();
        if (cmd == 's' || cmd == 'S') {
          resultDisplayed = false;
          if (startECG()) {
            currentState = MEASURE_ECG;
          }
          break;
        }
      }
    }
    break;
  }
}