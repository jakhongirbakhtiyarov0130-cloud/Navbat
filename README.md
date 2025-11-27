Albatta, mana shu formatda, to'liq Markdown sintaksisidan foydalanilgan **README.md** fayli:

# 📋 Navbat Boshqaruvi Telegram Boti va Google Sheets Integratsiyasi

Ushbu loyiha **Google Apps Script (GAS)** yordamida yaratilgan bo'lib, talabalarning/mijozlarning xizmat ko'rsatish navbatini **Telegram** orqali boshqarish va ma'lumotlarni real vaqt rejimida **Google Sheets**'da saqlash, shuningdek, Sheets yon paneli orqali boshqarish imkonini beradi.

## 🎯 Loyihaning Maqsadi

  * **Telegram** orqali avtomatik ikki bosqichli navbatga yozish tizimini (Ism Familya, Telefon raqami, Xizmat turi) yaratish.
  * Barcha navbat ma'lumotlarini markazlashtirilgan holda **Google Sheet**'da saqlash.
  * Adminlar uchun Telegram orqali va Google Sheets'dagi yon panel (Sidebar) orqali navbat holatini (**Qabul qilish**, **Bekor qilish**, **Tugatish**) real vaqtda boshqarish imkoniyatini taqdim etish.

-----

## ⚙️ Konfiguratsiya (Sozlamalar)

`Code.gs` faylining boshidagi quyidagi o'zgaruvchilarni **o'zingizning ma'lumotlaringiz bilan almashtirishingiz shart**:

| O'zgaruvchi | Maqsad | Izoh |
| :--- | :--- | :--- |
| `BOT_TOKEN` | Telegram botingizning tokeni. | **⚠️ Juda muhim\! Albatta o'zgartiring.** |
| `SHEET_NAME` | Navbatlar saqlanadigan Google Sheet varag'ining nomi. | Odatda `Sheet1`. |
| `ADMIN_PASSWORD` | Admin paneliga (Telegram orqali) kirish uchun parol. | **⚠️ Xavfsizlik uchun o'zgartiring.** |
| `PAGE_SIZE` | Telegram admin panelida bir sahifada ko'rsatiladigan navbatlar soni. | Loyihada 5 ga o'rnatilgan. |

-----

## 📁 Fayllar Tuzilishi

Loyiha Google Apps Script muharririda quyidagi ikkita asosiy fayldan iborat bo'lishi kerak:

| Fayl nomi | Turi | Maqsad |
| :--- | :--- | :--- |
| `Code.gs` | Apps Script (JS) | Telegram xabarlarini qayta ishlash, navbatni boshqarish logikasi va Sheets bilan aloqa. |
| `AdminPanelSheets.html` | HTML / CSS / JS | Google Sheets'ning yon panelida (Sidebar) ko'rsatiladigan vizual boshqaruv paneli. |

-----

## 📊 Google Sheets Jadvali (MUHIM STRUKTURA)

Google Sheet'dagi varaqning (ko'rsatilgan `SHEET_NAME` bo'yicha) **birinchi qatoridagi** ustunlar tartibi **qat'iy ravishda** quyidagicha bo'lishi kerak. Bu botning ma'lumotlarni to'g'ri yozishi uchun shart:

| Ustun (A) | Ustun (B) | Ustun (C) | Ustun (D) | Ustun (E) | Ustun (F) | Ustun (G) | Ustun (H) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Chat ID** | **Queue Number** | **Full Name** | **Phone Number** | **Service** | **Date** | **Status** | **Time** |
| (Bot ID) | (Navbat raqami) | (Talaba Ismi) | (Telefon raqami) | (Xizmat turi) | (Yozilgan sana) | (Holat: Kutmoqda / Qabul qilinmoqda / Tugatildi / Bekor qilindi) | (Qabul vaqti) |

-----

## 🚀 O'rnatish Bo'yicha Bosqichlar

1.  **Google Sheet yaratish:** Yangi Google Sheet oching va yuqoridagi jadval asosida birinchi qatorga ustun nomlarini kiriting.

2.  **Apps Script ochish:** Google Sheet'da **Extensions** (Kengaytmalar) -\> **Apps Script** ni bosing.

3.  **Kodlarni joylash:** `Code.gs` va `AdminPanelSheets.html` (nomi bilan) fayllarini Apps Script muharririga joylang va konfiguratsiyani o'zgartiring.

4.  **Web App sifatida joylash (Deploy):**

      * **Deploy** -\> **New deployment** ni bosing.
      * Turini **Web app** deb tanlang.
      * **"Execute as"**: **Me** (Men).
      * **"Who has access"**: **Anyone** (Har kim).
      * **Deploy** ni bosing va hosil bo'lgan **Web app URL** ni nusxalab oling.

5.  **Webhook sozlash:** Telegram API yordamida botingizni GAS URL bilan bog'lang (Brauzerda ishga tushiring):

    ```
    https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<WEB_APP_URL>
    ```

-----

## 🕹️ Navbatni Boshqarish Amallari

### 🧑‍🎓 Talabalar/Mijozlar uchun (Telegram)

Navbatga yozilish jarayoni uch bosqichdan iborat:

| Bosqich | Harakat |
| :--- | :--- |
| **1. /start** | Navbatga yozilishni boshlaydi va **Ism Familyani** so'raydi. |
| **2. Telefon raqami** | Ism Familyani saqlab, **Telefon raqamini** so'raydi. |
| **3. Xizmat tanlash** | Raqamni saqlab, inline tugmalar orqali **Xizmat turini** tanlash menyusini ko'rsatadi. |

### 👮‍♂️ Adminlar uchun (Boshqaruv)

| Platforma | Kirish Buyrug'i | Boshqaruv usuli |
| :--- | :--- | :--- |
| **Telegram** | `/admin_panel` (paroldan so'ng) | Inline tugmalar orqali navbat holatini o'zgartirish. |
| **Google Sheets** | `🛠️ Admin Panel` menyusi | Yon panel (Sidebar) orqali vizual boshqaruv. |
