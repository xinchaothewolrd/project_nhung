#include <FS.h>
#include <LittleFS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Phong C5";
const char* password = "22446688";
const char* serverUrl = "https://httpbin.org/post"; 

LiquidCrystal_I2C lcd(0x27, 16, 2);
enum State { IDLE, MEASURING, SENDING, RESULT };
State currentState = IDLE;

unsigned long startTime;
const long duration = 20000; // 3 phút
String aiResult = "";

void setup() {
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();
  
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  if (!LittleFS.begin(true)) {
    Serial.println("Loi LittleFS!");
    return;
  }

  pinMode(34, INPUT); 
  pinMode(35, INPUT); 
  
  WiFi.begin(ssid, password);
  lcd.print("Ket noi WiFi...");
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print(".");
  }
  
  Serial.println("\nWiFi OK!");
  currentState = IDLE;
}

void loop() {
  switch (currentState) {
    case IDLE:
      lcd.setCursor(0, 0);
      lcd.print("San sang do!    ");
      lcd.setCursor(0, 1);
      lcd.print("Go 's' de bat dau"); 
      
      // ĐỌC LỆNH 's' CHUẨN HƠN Ở ĐÂY
      if (Serial.available() > 0) {
        char command = Serial.read();
        if (command == 's') { 
          startNewMeasurement(); 
          currentState = MEASURING; // Chuyển sang trạng thái ĐO và giữ ở đó
        }
      }
      break;

    case MEASURING:
      performMeasurement(); // Hàm này sẽ chạy lặp đi lặp lại liên tục
      break;

    case SENDING:
      lcd.clear();
      lcd.print("Dang gui data...");
      if (sendDataToServer()) {
        currentState = RESULT;
      } else {
        lcd.setCursor(0,1);
        lcd.print("Loi gui file!");
        delay(2000);
        currentState = IDLE;
      }
      break;

    case RESULT:
      lcd.clear();
      lcd.print("Ket qua: ");
      lcd.setCursor(0,1);
      lcd.print("Check Monitor!"); 
      delay(5000); 
      currentState = IDLE;
      break;
  }
}

void startNewMeasurement() {
  File file = LittleFS.open("/ecg_data.csv", FILE_WRITE);
  if (file) {
    file.println("timestamp,value");
    file.close();
  }
  startTime = millis();
  lcd.clear();
  Serial.println("--- BAT DAU DO LIEN TUC ---");
}

void performMeasurement() {
  unsigned long elapsed = millis() - startTime;
  int remaining = (duration - elapsed) / 1000;

  // Kiểm tra rơi điện cực
  if (digitalRead(34) == 1 || digitalRead(35) == 1) { 
    lcd.clear();
    lcd.print("Loi: Rot dien cuc!");
    Serial.println("LOI: Rot dien cuc!");
    currentState = IDLE; // Bị lỗi thì quay về chờ
    return;
  }

  if (elapsed < duration) {
    // ĐỌC CHÂN 32 - ĐẢM BẢO CÓ SÓNG KHI BẬT WIFI
    int val = analogRead(32); 
    
    File file = LittleFS.open("/ecg_data.csv", FILE_APPEND); 
    if (file) {
      file.printf("%lu,%d\n", elapsed, val);
      file.close();
    }
    
    // Cập nhật LCD mỗi giây (để không làm chậm quá trình đo)
    if (elapsed % 1000 < 50) { 
        lcd.setCursor(0,0);
        lcd.print("Dang do: "); lcd.print(remaining); lcd.print("s   ");
    }
    
    Serial.println(val); 
    delay(10); // Tốc độ lấy mẫu 100Hz ổn định
  } else {
    // Hết thời gian thì tự động chuyển sang trạng thái GỬI
    currentState = SENDING;
    Serial.println("--- DO XONG! DANG GUI FILE ---");
  }
}

bool sendDataToServer() {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "text/csv");
  http.addHeader("Device-ID", WiFi.macAddress());

  File file = LittleFS.open("/ecg_data.csv", FILE_READ);
  if (!file) return false;

  int httpResponseCode = http.sendRequest("POST", &file, file.size());
  
  if (httpResponseCode > 0) {
    aiResult = http.getString(); 
    Serial.println("--- SERVER PHAN HOI ---");
    Serial.println(aiResult); 
    file.close();
    http.end();
    return true;
  }
  file.close();
  http.end();
  return false;
}