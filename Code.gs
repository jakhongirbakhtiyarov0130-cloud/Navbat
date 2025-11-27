// --- KONFIGURATSIYA (O'zgartirilishi kerak) ---
const BOT_TOKEN = "TOKE qoyish uchun joy";
const SHEET_NAME = "Sheet1";
const SERVICE_DURATION_INFO = "Xizmat ko‘rsatish muddati 3-5 daqiqadan iborat.";
const ADMIN_PASSWORD = "Parol"; 
const PAGE_SIZE = 5; // Bir sahifada ko'rsatiladigan navbatlar soni (Telegram uchun)

const SERVICES = {
  '1': "Akademik (oʻquv) faoliyati boʻyicha",
  '2': "Yoshlar masalalari va maʼnaviy-maʼrifiy faoliyat boʻyicha",
  '3': "Buxgalteriya va marketing boʻyicha",
  '4': "Ilmiy faoliyat boʻyicha",
  '5': "Boshqa qoʻshimcha xizmatlar"
};
// ---------------------------------------------

// --- ASOSIY TELEGRAM FUNKSIYALARI ---

function doPost(e) {
  const update = JSON.parse(e.postData.contents);
  if (update.message) {
    handleMessage(update.message);
  } else if (update.callback_query) {
    handleCallbackQuery(update.callback_query);
  }
}

function sendMessage(chatId, text, keyboard = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: keyboard
    })
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log("Xabar yuborishda xatolik: " + error.toString());
  }
}

// ... Qolgan funksiyalar ...

/**
 * Foydalanuvchi yuborgan matnli xabarlarni qayta ishlaydi.
 * @param {object} message - Telegram Message obyekti.
 */
function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  
  // Foydalanuvchi ma'lumotlarini saqlash uchun Script Properties'dan foydalanamiz
  const props = PropertiesService.getScriptProperties();
  const stepKey = `STEP_${chatId}`;
  let currentStep = props.getProperty(stepKey);

  if (text === '/admin_panel') {
    props.setProperty(stepKey, "AWAITING_ADMIN_PASSWORD");
    sendMessage(chatId, "🔐 Admin paneliga kirish uchun parolni kiriting:");
    return;
  }
  
  if (currentStep === "AWAITING_ADMIN_PASSWORD") {
    // [Admin login logikasi o'z joyida qoladi]
    if (text === ADMIN_PASSWORD) {
      props.setProperty(stepKey, "ADMIN_LOGGED_IN");
      sendMessage(chatId, "✅ Kirish muvaffaqiyatli! Admin panelini yuklash...");
      showNextQueuePanel(chatId, null, null, 0); 
    } else {
      sendMessage(chatId, "❌ Noto'g'ri parol. Qayta urinib ko'ring yoki /start bosing.");
      props.deleteProperty(stepKey); 
    }
    return;
  }
  
  // --- TALABA NAVBAT LOGIKASI (IKKI BOSQICHGA AJRATILDI) ---

  if (text === '/start') {
    // 1-bosqich: Ism Familyani so'rash
    props.setProperty(stepKey, "AWAITING_FULL_NAME");
    sendMessage(chatId, "Assalomu alaykum! Navbatga yozilish uchun *Ism Familyangizni* kiriting:\n\n*Masalan: Ali Valiev*");
    return;
  }
  
  // 2-bosqich: Ism Familyani saqlash va Raqamni so'rash
  if (currentStep === "AWAITING_FULL_NAME" && text) {
    // Oddiy format tekshiruvi (faqat bo'sh emasligini tekshirish)
    const fullName = text.trim();
    
    if (fullName.length > 3) {
      props.setProperty(`FULL_NAME_${chatId}`, fullName);
      props.setProperty(stepKey, "AWAITING_PHONE_NUMBER"); // Keyingi qadam
      sendMessage(chatId, "Rahmat! Endi *telefon raqamingizni* quyidagi formatda kiriting:\n\n*Masalan: 998901234567*");
    } else {
      sendMessage(chatId, "Iltimos, *Ism Familyangizni* to'liq kiriting.");
    }
    return;
  }
  
  // 3-bosqich: Raqamni saqlash va Xizmat menyusiga o'tish
  if (currentStep === "AWAITING_PHONE_NUMBER" && text) {
    // Raqamni tekshirish (faqat raqamlardan iboratligini)
    const phoneNumber = text.trim().replace(/\s/g, ''); // Bo'sh joylarni olib tashlash
    
    // Minimal 9 raqam va faqat raqamlardan iboratligini tekshirish
    if (phoneNumber.match(/^\d{9,14}$/)) {
      props.setProperty(`PHONE_NUMBER_${chatId}`, phoneNumber);
      
      // Navbatga yozilish menyusini ko'rsatish
      showServiceMenu(chatId);
      props.setProperty(stepKey, "AWAITING_SERVICE_CHOICE"); // Keyingi qadam
      
    } else {
      sendMessage(chatId, "Kiritish formati noto'g'ri. Iltimos, *telefon raqamingizni* faqat raqamlardan iborat to'g'ri formatda kiriting:\n\n*Masalan: 998901234567*");
    }
    return;
  }
  
  // Agar boshqa xabar bo'lsa (yoki oldingi qadamda bo'lmasa)
  if (text !== '/start' && currentStep !== "ADMIN_LOGGED_IN") {
     sendMessage(chatId, "Boshlash uchun */start* buyrug'ini bosing yoki admin bo'lsangiz /admin_panel buyrug'ini kiriting.");
  }
}


function showServiceMenu(chatId) {
  let menuText = "🧾 *Navbatga yozilish menyusi*\n\n" + SERVICE_DURATION_INFO + "\n\nIltimos, kerakli xizmat turini tanlang:";
  
  let keyboardButtons = [];
  for (let key in SERVICES) {
    keyboardButtons.push([{ 
      text: `${key}. ${SERVICES[key]}`, 
      callback_data: `SERVICE_${key}` 
    }]);
  }
  
  const keyboard = { inline_keyboard: keyboardButtons };
  sendMessage(chatId, menuText, keyboard);
}

function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  answerCallbackQuery(callbackQuery.id);
  
  // --- ADMIN AMALLARI ---
  if (data.startsWith('ADMIN_ACCEPT_') || data.startsWith('ADMIN_FINISH_') || data.startsWith('ADMIN_CANCEL_') || data.startsWith('ADMIN_PAGE_') || data === 'ADMIN_REFRESH') {
    handleAdminActions(callbackQuery);
    return;
  }
  // --- TALABA AMALLARI ---
  if (data.startsWith('SERVICE_')) {
    const serviceKey = data.split('_')[1];
    const serviceName = SERVICES[serviceKey];
    const result = saveToSheet(chatId, serviceName);
    if (result) {
      const queueNumber = result.queueNumber; 
      const fullName = result.fullName;
      const queueDate = result.queueDate;
      const successMessage = ` ♻️ *Siz navbatga yozildingiz!*
**Navbat Raqamingiz:** *#${queueNumber}*
**Ism Familya:** ${fullName}
**Xizmat Turi:** ${serviceName}
**Holati:** ⚠️ *Admin tomonidan qabul qilinishini kutmoqda*
**Navbat Sanasi:** ${queueDate}
${SERVICE_DURATION_INFO}`;
      sendMessage(chatId, successMessage);
      PropertiesService.getScriptProperties().deleteProperty(`STEP_${chatId}`);
    } else {
      sendMessage(chatId, "⚠️ Navbatga yozilishda kutilmagan xatolik yuz berdi. Iltimos, /start orqali qayta urinib ko'ring.");
    }
  }
}

function saveToSheet(chatId, serviceName) {
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const fullName = props.getProperty(`FULL_NAME_${chatId}`);
  const phoneNumber = props.getProperty(`PHONE_NUMBER_${chatId}`);
  if (!fullName || !phoneNumber) return null;
  const lastRow = sheet.getLastRow();
  const queueNumber = lastRow; 
  // Xatolik tuzatildi: ss.getSpreadsheetTimeZone() ishlatildi
  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd.MM.yyyy"); 
  const rowData = [
    chatId,                 
    queueNumber,            
    fullName,               
    phoneNumber,            
    serviceName,            
    today,                  
    "Kutmoqda",             
    ""                      
  ];
  sheet.appendRow(rowData);
  return { queueNumber, fullName, phoneNumber, queueDate: today };
}

function answerCallbackQuery(callbackQueryId) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      callback_query_id: callbackQueryId
    })
  };
  UrlFetchApp.fetch(url, options);
}

// --- ADMIN PANEL FUNKSIYALARI (TELEGRAM UCHUN) ---

function handleAdminActions(callbackQuery) {
  const adminChatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;
  
  let action = null;
  let queueId = null;
  let page = 0;
  
  const parts = data.split('_');
  
  if (parts[0] === 'ADMIN' && (parts[1] === 'ACCEPT' || parts[1] === 'FINISH' || parts[1] === 'CANCEL')) {
    action = parts[1].toLowerCase();
    queueId = parts[2];
    page = parseInt(parts[3] || 0); 
  } else if (parts[0] === 'ADMIN' && parts[1] === 'PAGE') {
    page = parseInt(parts[2]);
    action = 'page_change';
  } else if (data === 'ADMIN_REFRESH') {
    editMessage(adminChatId, messageId, "🔄 Ma'lumotlar yangilanmoqda...");
    showNextQueuePanel(adminChatId, messageId, "Panel yangilandi.", 0);
    return;
  }
  
  if (action === 'page_change') {
    showNextQueuePanel(adminChatId, messageId, null, page);
    return;
  }

  if (action && queueId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const values = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];
    
    const result = manageQueueAction(queueId, action, values, sheet);
    
    showNextQueuePanel(adminChatId, messageId, result.message, page);
  }
}


function manageQueueAction(queueId, action, values, sheet) {
  const rowIndex = values.findIndex(row => row[1] == queueId);
  
  if (rowIndex === -1) return { success: false, message: `Navbat #${queueId} topilmadi.` };
  
  const targetRowIndex = rowIndex + 2;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Xatolik tuzatildi: ss.getSpreadsheetTimeZone() ishlatildi
  const time = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "HH:mm:ss"); 
  const targetRow = values[rowIndex];
  const chatId = targetRow[0];
  const fullName = targetRow[2];
  const serviceName = targetRow[4];

  let success = true;
  let message = "";
  let userNotification = null;

  switch (action) {
    case 'accept':
      if (targetRow[6] === "Kutmoqda") {
        const acceptingQueueIndex = values.findIndex(row => row[6] === "Qabul Qilinmoqda");
        if (acceptingQueueIndex !== -1) {
            sheet.getRange(acceptingQueueIndex + 2, 7).setValue("Tugatildi");
            sendMessage(values[acceptingQueueIndex][0], `🟢 *Oldingi navbatingiz tugatildi.* Xizmat yakunlandi.`);
        }
        
        sheet.getRange(targetRowIndex, 7).setValue("Qabul Qilinmoqda"); // Status (G)
        sheet.getRange(targetRowIndex, 8).setValue(time);     // Vaqt (H)
        message = `Navbat #${queueId} (${fullName}) qabul qilindi.`;
        
        userNotification = `✅ *Siz qabul qilindingiz!*
**Navbat Raqamingiz:** *#${queueId}*
**Xizmat Turi:** ${serviceName}`; 


      } else {
        success = false;
        message = `Navbat #${queueId} qabul qilish uchun tayyor emas (Holat: ${targetRow[6]}).`;
      }
      break;
    
    case 'cancel': 
      if (targetRow[6] === "Kutmoqda") {
        sheet.getRange(targetRowIndex, 7).setValue("Bekor Qilindi"); 
        message = `Navbat #${queueId} (${fullName}) bekor qilindi.`;
        userNotification = `❌ *Sizning navbatingiz bekor qilindi.* Iltimos, /start orqali qayta yoziling.`;
      } else {
        success = false;
        message = `Navbat #${queueId} (${fullName}) allaqachon ${targetRow[6]} holatida.`;
      }
      break;
      
    case 'finish':
      if (targetRow[6] === "Qabul Qilinmoqda") {
        sheet.getRange(targetRowIndex, 7).setValue("Tugatildi");
        message = `Navbat #${queueId} tugatildi.`;
        userNotification = `🟢 *Sizning navbatingiz tugatildi.* Xizmat ko'rsatish yakunlandi.`;
      } else {
        success = false;
        message = `Navbat #${queueId} tugatilgani uchun tayyor emas (Holat: ${targetRow[6]}).`;
      }
      break;
  }
  
  if (success && userNotification) {
      sendMessage(chatId, userNotification);
  }
  
  return { success: success, message: message };
}

function showNextQueuePanel(chatId, messageId = null, statusMessage = null, page = 0) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  const allQueues = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];
  
  let activeQueues = allQueues.filter(row => row[6] === "Kutmoqda" || row[6] === "Qabul Qilinmoqda");
  activeQueues.sort((a, b) => a[1] - b[1]); 

  // --- SAHIFALASH LOGIKASI ---
  const totalItems = activeQueues.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  page = Math.max(0, Math.min(page, totalPages - 1)); 
  
  const startIndex = page * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageQueues = activeQueues.slice(startIndex, endIndex);
  
  // Statistikani hisoblash
  const stats = { jami: allQueues.length, kutmoqda: 0, jarayonda: 0 };
  allQueues.forEach(row => {
    const status = row[6];
    if (status === "Kutmoqda") {
      stats.kutmoqda++;
    } else if (status === "Qabul Qilinmoqda") {
      stats.jarayonda++;
    }
  });
  
  // --- Xabar Matnini Yaratish ---
  let messageText = "📋 *Navbat Boshqaruvi Paneli*\n\n";
  
  if (statusMessage) {
    messageText += `_Status: ${statusMessage}_\n---\n\n`;
  }
  
  messageText += `*📊 Umumiy statistika:*\n`;
  messageText += `Jami navbatlar: ${stats.jami}\n`;
  messageText += `*Kutayotgan:* ${stats.kutmoqda}\n`;
  messageText += `*Qabul qilinmoqda:* ${stats.jarayonda}\n\n`;
  messageText += "--- \n";
  
  let keyboardButtons = [];

  if (activeQueues.length === 0) {
    messageText += "✅ *Hozirda faol navbatlar mavjud emas.*";
  }
  
  // Har bir sahifadagi navbatni ro'yxatga chiqarish
  pageQueues.forEach((queue, index) => {
    const id = queue[1];
    const status = queue[6];
    const fullName = queue[2];
    const service = queue[4];
    
    const displayStatus = status === 'Qabul Qilinmoqda' ? '🟢 Qabulda' : '🟡 Kutmoqda';
    const namePart = fullName.split(' ')[0] || "Noma'lum";
    const serviceShort = service.length > 20 ? service.substring(0, 20) + '...' : service;

    messageText += `\n*${startIndex + index + 1}. ID: #${id}* (${displayStatus})\n`;
    messageText += `_Ism: ${namePart} / Xizmat: ${serviceShort}_\n`;
    
    let row = [];
    
    if (status === "Kutmoqda") {
      row.push({ text: "✅ Qabul qilish", callback_data: `ADMIN_ACCEPT_${id}_${page}` });
      row.push({ text: "❌ Bekor qilish", callback_data: `ADMIN_CANCEL_${id}_${page}` });
    } else if (status === "Qabul Qilinmoqda") {
      row.push({ text: "➡️ Tugatish", callback_data: `ADMIN_FINISH_${id}_${page}` });
    }
    
    if (row.length > 0) {
      keyboardButtons.push(row);
    }
  });
  
  // --- SAHIFALASH TUGMALARI (Oldinga/Orqaga) ---
  if (totalPages > 1) {
    let pageNavRow = [];
    
    if (page > 0) {
      pageNavRow.push({ text: "⬅️ Avvalgi", callback_data: `ADMIN_PAGE_${page - 1}` });
    }
    
    pageNavRow.push({ text: `${page + 1}/${totalPages}`, callback_data: `ADMIN_PAGE_${page}` });
    
    if (page < totalPages - 1) {
      pageNavRow.push({ text: "Keyingi ➡️", callback_data: `ADMIN_PAGE_${page + 1}` });
    }
    
    keyboardButtons.push(pageNavRow);
  }
  
  // Eng oxirida alohida Yangilash tugmasi
  keyboardButtons.push([{ 
    text: "🔄 Yangilash", 
    callback_data: 'ADMIN_REFRESH' 
  }]);

  const keyboard = { inline_keyboard: keyboardButtons };
  
  if (messageId) {
    editMessage(chatId, messageId, messageText, keyboard);
  } else {
    sendMessage(chatId, messageText, keyboard);
  }
}

function editMessage(chatId, messageId, text, keyboard = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: keyboard
    })
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Xabarni tahrirlashda xatolik: " + e.toString());
  }
}

// --- GOOGLE SHEETS UCHUN FUNKSIYALAR ---

/**
 * Sheets ochilganda yuqori menyuga 'Admin Panel' menyusini qo'shadi.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🛠️ Admin Panel')
      .addItem('Admin Panelini Ochish', 'openAdminPanelSidebar')
      .addToUi();
}

/**
 * Yon panel (Sidebar) orqali Admin Panelini ko'rsatadi.
 */
function openAdminPanelSidebar() {
  // AdminPanelSheets.html ni yuklaydi
  const html = HtmlService.createTemplateFromFile('AdminPanelSheets');
  
  // Sidebar ustida ko'rsatish
  SpreadsheetApp.getUi()
      .showSidebar(html.evaluate().setTitle('Reg_office Navbat Boshqaruvi'));
}

/**
 * Admin Panel Sidebar'i uchun faqat ma'lumotlarni Sheets'dan oladi.
 */
function sendAdminData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() < 2) {
    return JSON.stringify({
      stats: { jami: 0, kutmoqda: 0, jarayonda: 0 },
      calls: []
    });
  }
  
  // Sheet'dan o'qish: [Chat ID(0)... Vaqt(7)]
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  
  let jami = values.length;
  let kutmoqda = 0;
  let jarayonda = 0;
  
  const calls = [];

  values.forEach(row => {
    const status = row[6]; 
    
    if (status === "Kutmoqda") {
      kutmoqda++;
    } else if (status === "Qabul Qilinmoqda") {
      jarayonda++;
    }
    
    calls.push({
      id: row[1],   
      masul: row[2], 
      bolum: row[4], 
      holat: status,
    });
  });

  return JSON.stringify({
    stats: { jami: jami, kutmoqda: kutmoqda, jarayonda: jarayonda },
    calls: calls.reverse() 
  });
}


/**
 * Sidebar uchun soddalashtirilgan manageQueueAction.
 * Sidebar bu funksiyani to'g'ridan-to'g'ri chaqiradi.
 */
function manageQueueActionSimple(queueId, action) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const values = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];
    
    // Asosiy manageQueueAction funksiyasini to'g'ridan-to'g'ri chaqiramiz
    return manageQueueAction(queueId, action, values, sheet);
}


function doGet(e) {
  return ContentService.createTextOutput("OK. Bot ishlamoqda. Sheets panelini sinab ko'ring.");
}
