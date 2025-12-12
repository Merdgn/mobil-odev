# Fokus – Odaklanma Takibi ve Raporlama Uygulaması

Bu proje, **Mobil Uygulama Geliştirme** dersi kapsamında geliştirilen bir **React Native (Expo)** uygulamasıdır.  
Amaç, kullanıcının başlattığı odaklanma seanslarını (Pomodoro benzeri) takip etmek, dikkat dağınıklığı durumlarını kaydetmek ve bu verileri istatistiksel olarak raporlamaktır.

---

## 1. Uygulama Özeti

- Kullanıcı farklı odak modları (Kısa / Pomodoro / Uzun) arasından seçim yapar.
- Seans başlamadan önce kategori seçer (Ders, Proje, Kitap vb.).
- Zamanlayıcı çalışırken uygulamadan çıkarsa bu bir **dikkat dağınıklığı** olarak sayılır ve sayaç duraklatılır.
- Uygulamaya geri dönünce kullanıcıya **“Devam etmek ister misin?”** sorulur.
- Seans tamamlandığında veya yarıda bırakıldığında oturum özeti kaydedilir.
- Raporlar ekranında tüm seanslar grafiklerle ve istatistiklerle gösterilir.

---

## 2. Özellikler

### 🎯 Zamanlayıcı Ekranı (Ana Sayfa)

- **Odak Modları**
  - Kısa
  - Pomodoro
  - Uzun
- **Süreyi Manuel Ayarlama**
  - Seçilen modun süresi dakika bazlı olarak (+ / −) butonları ile ayarlanabilir.
  - Örneğin 27 dakika gibi özel süreler belirlenebilir.
- **Butonlar**
  - Başlat
  - Duraklat
  - Devam Et
  - Sıfırla
- **Kategori Seçimi (Seans başlamadan önce)**
  - Ders Çalışma  
  - Proje / Kodlama  
  - Ödev  
  - Kitap Okuma  
  - Meditasyon  
  - Genel Odak
- **Seans Özeti Modalı**
  - Seans bittiğinde **veya kullanıcı seansı yarım bıraktığında** açılır.
  - Gösterilen bilgiler:
    - Seans süresi
    - Kategori
    - Mod (Kısa / Pomodoro / Uzun)
    - Dikkat dağınıklığı sayısı
    - Geçen süre / kalan süre
    - Bitiş saati
  - Yarım bırakılan oturumlar da ayrıca işaretlenerek kaydedilir.

---

### 👀 Dikkat Dağınıklığı Takibi (AppState API)

- Sayaç çalışırken uygulama **arka plana** alınırsa (`AppState: background / inactive`):
  - Seans otomatik olarak **duraklatılır**.
  - Dikkat dağınıklığı sayacı 1 artırılır.
- Kullanıcı uygulamaya geri döndüğünde (`AppState: active`):
  - **iOS / Android** için: `Alert` ile  
  - **Web** için: özel bir modal ile  
  “Devam etmek ister misin?” sorusu gösterilir.
- Kullanıcı:
  - **Evet** derse → sayaç kaldığı yerden devam eder.
  - **Hayır** derse → seans **yarım kalmış** olarak kaydedilir ve seans özeti gösterilir.

---

### 📊 Raporlar (Dashboard) Ekranı

- Kayıtlı tüm oturumlar `HistoryContext` üzerinden okunur.
- **Genel İstatistikler**
  - Bugün toplam odaklanma süresi
  - Tüm zamanların toplam odaklanma süresi
  - Toplam dikkat dağınıklığı sayısı
- **Grafikler** (`react-native-chart-kit`)
  - Son 7 güne ait odaklanma süreleri → Bar Chart
  - Kategorilere göre odaklanma dağılımı → Pie Chart  
    (Örnek: %50 Kitap Okuma, %50 Meditasyon)
- **Seans Listesi**
  - Tamamlanan ve yarım kalan seanslar ayrı ayrı listelenir.
  - Mod, kategori, süre, dikkat dağınıklığı ve tarih bilgileri gösterilir.

---

### 🎨 Tema & Ayarlar

- **Tema**
  - Açık / koyu tema desteği (`ThemeContext`)
- **Ayarlar Modalı**
  - Titreşim aç/kapat
  - Günlük hedef süresi (dakika cinsinden)
  - Günlük hedef ilerleme çubuğu (progress bar):
    - Bugünkü toplam odaklanma süresi / belirlenen hedef

---

### 💾 Veri Saklama

- Tüm odak seansları kalıcı olarak **AsyncStorage** üzerinde saklanır.
- Uygulama kapatılıp açılsa bile:
  - Geçmiş seanslar
  - Toplam odaklanma süreleri
  - Dikkat dağınıklığı sayıları
  - Günlük hedef bilgisi  
  korunur ve yeniden yüklenir.

---

## 3. Kullanılan Teknolojiler

- **React Native (Expo)**
- **TypeScript**
- **React Navigation – Bottom Tab Navigator**
- **AppState API** (dikkat dağınıklığı takibi)
- **AsyncStorage** – `@react-native-async-storage/async-storage`
- **react-native-chart-kit** – Bar ve Pie chart için
- **Context API**
  - `HistoryContext` – Seans geçmişi ve rapor verileri
  - `ThemeContext` – Açık / koyu tema yönetimi
  - `SettingsContext` – Titreşim, günlük hedef, toplam süre

---

## 4. Proje Dosya Yapısı

```text
fokus/
  ├─ App.tsx
  ├─ index.ts
  ├─ app.json
  ├─ package.json
  ├─ package-lock.json
  ├─ tsconfig.json
  ├─ .gitignore
  ├─ assets/                    # Görseller ve statik dosyalar
  └─ src/
     ├─ context/
     │  ├─ HistoryContext.tsx   # Seans geçmişi & odak verileri
     │  ├─ SettingsContext.tsx  # Titreşim, günlük hedef, toplam süre
     │  └─ ThemeContext.tsx     # Tema yönetimi (dark / light)
     └─ screens/
        ├─ TimerScreen.tsx      # Zamanlayıcı ekranı (Ana ekran)
        ├─ ReportsScreen.tsx    # Raporlar / Dashboard ekranı
        └─ SettingsScreen.tsx   # Ayarlar ekranı

```

## 5. Kurulum ve Çalıştırma

Bu bölüm, projeyi kendi bilgisayarınızda nasıl çalıştıracağınızı açıklar.

### 5.1. Önkoşullar

- Node.js (önerilen: 18+)
- npm 
- Telefonda **Expo Go** uygulaması (iOS / Android)

### 5.2. Kaynak Kodun İndirilmesi

git clone https://github.com/Merdgn/mobil-odev.git
cd mobil-odev

### 5.3. Bağımlılıkların Kurulması

Projeyi ilk kez çalıştırmadan önce gerekli paketlerin yüklenmesi gerekir:

npm install

### 5.4. Uygulamanın Çalıştırılması
npx expo start

Not: Bağlantı problemi yaşarsanız alternatif olarak:
npx expo start --clear --tunnel
