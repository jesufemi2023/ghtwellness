import nodemailer from 'nodemailer';
import { Telegraf } from 'telegraf';
import { formatProductNameWithBottles, extractBottleCount } from '../utils/bottleFormatter';

// --- Gmail Configuration ---
// We use a singleton pattern to reuse the transporter connection
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn("Gmail credentials missing. Email notifications are disabled.");
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }
  return transporter;
}

// --- Telegram Configuration ---
let bot: Telegraf | null = null;

function getTelegramBot() {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("Telegram Bot Token missing. Telegram notifications are disabled.");
      return null;
    }
    bot = new Telegraf(token);
  }
  return bot;
}

// --- Notification Service ---
export const NotificationService = {
  
  async sendOrderNotification(orderData: any, items: any[]) {
    const { 
      id, 
      full_name, 
      phone_number, 
      delivery_address, 
      landmark, 
      total_amount, 
      payment_method, 
      payment_receipt_url,
      distributor_id 
    } = orderData;

    // Format the items list
    let itemsList = '';
    const packages = new Map<string, any[]>();
    const singleProducts: any[] = [];

    items.forEach(item => {
      if (item.is_package && item.package_name) {
        if (!packages.has(item.package_name)) {
          packages.set(item.package_name, []);
        }
        packages.get(item.package_name)!.push(item);
      } else {
        singleProducts.push(item);
      }
    });

    packages.forEach((pkgItems, pkgName) => {
      const firstItem = pkgItems[0];
      const pkgQuantity = firstItem.quantity || 1;
      const pkgPrice = firstItem.package_price || pkgItems.reduce((sum, p) => sum + (p.price_at_time || 0), 0);
      const pkgFormattedName = formatProductNameWithBottles(pkgName, firstItem.bottles, pkgQuantity);
      itemsList += `- ${pkgFormattedName} (₦${(pkgPrice * pkgQuantity).toLocaleString()})\n`;
      
      // If included_products list exists on package item
      if (firstItem.included_products && Array.isArray(firstItem.included_products) && firstItem.included_products.length > 0) {
        firstItem.included_products.forEach((inc: string) => {
          itemsList += `    ↳ ${formatProductNameWithBottles(inc, firstItem.bottles, 1)}\n`;
        });
      } else {
        pkgItems.forEach(p => {
          itemsList += `    ↳ ${formatProductNameWithBottles(p.name || 'Product', p.bottles, 1)}\n`;
        });
      }
    });

    singleProducts.forEach(item => {
      const price = item.price_at_time || item.price_naira || 0;
      const qty = item.quantity || 1;
      const formattedName = formatProductNameWithBottles(item.name || 'Product', item.bottles, qty);
      itemsList += `- ${formattedName} (₦${(price * qty).toLocaleString()})\n`;
    });

    itemsList = itemsList.trim();

    // Create a clean, readable message body
    const messageBody = `
🚨 NEW ORDER RECEIVED! 🚨

Order ID: #${id.slice(0, 8).toUpperCase()}
Total Amount: ₦${total_amount.toLocaleString()}
Payment Method: ${payment_method.toUpperCase()}
${payment_receipt_url ? `Receipt URL: ${payment_receipt_url}\n` : ''}Distributor ID: ${distributor_id || 'N/A'}

👤 CUSTOMER DETAILS:
Name: ${full_name}
Phone: ${phone_number}

📍 DELIVERY ADDRESS:
${delivery_address}
${landmark ? `Landmark: ${landmark}` : ''}

📦 ORDER ITEMS:
${itemsList}

Please check the Admin Dashboard to process this order.
    `.trim();

    // 1. Send via Telegram (Fastest)
    try {
      const tgBot = getTelegramBot();
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (tgBot && chatId) {
        await tgBot.telegram.sendMessage(chatId, messageBody);
        console.log("✅ Telegram notification sent successfully.");
      }
    } catch (error) {
      console.error("❌ Failed to send Telegram notification:", error);
    }

    // 2. Send via Gmail (Reliable Backup/Record)
    try {
      const mailer = getTransporter();
      const toEmail = process.env.NOTIFICATION_EMAIL_TO || process.env.GMAIL_USER;
      
      if (mailer && toEmail) {
        const mailOptions: any = {
          from: `"SD GHT Orders" <${process.env.GMAIL_USER}>`,
          to: toEmail,
          subject: `🚨 New Order: ₦${total_amount.toLocaleString()} from ${full_name}`,
          text: messageBody,
        };

        await mailer.sendMail(mailOptions);
        console.log("✅ Email notification sent successfully.");
      }
    } catch (error) {
      console.error("❌ Failed to send Email notification:", error);
    }
  }
};
