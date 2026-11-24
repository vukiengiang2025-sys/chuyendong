# Hướng dẫn xuất file Android APK (`Mô phỏng Hình học Động`)

Dự án đã được chuyển đổi sang ứng dụng Android hoàn chỉnh bằng Capacitor (thư mục `android/` và mã nguồn web đóng gói offline trong `dist/`).

## Cách 1: Build APK bằng dòng lệnh (Gradle)
Yêu cầu: Đã cài **JDK 21** và **Android SDK**.

```bash
npm install
npm run cap:sync
cd android
./gradlew assembleDebug
```

File APK đầu ra nằm tại:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Cách 2: Build APK bằng Android Studio
1. Chạy `npm run cap:sync` để đồng bộ mã nguồn mới nhất vào `android/`.
2. Mở thư mục `android/` bằng **Android Studio**.
3. Chọn **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Cách 3: Tự động build APK trên GitHub Actions
Đẩy mã nguồn lên GitHub (nhánh `main` hoặc `master`), workflow `.github/workflows/build-apk.yml` sẽ tự động biên dịch và tạo file tải xuống `app-debug.apk` trong mục **Actions > Artifacts**.
