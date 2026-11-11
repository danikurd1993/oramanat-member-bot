
import "dotenv/config";
import { Bot } from "grammy";
import fs from "node:fs";

const bot = new Bot(process.env.BOT_TOKEN);
const admins = (process.env.ADMIN_IDS || "").split(",").map(x => x.trim());

const file = "data.json";
let data = { events: [] };

if (fs.existsSync(file)) {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
}

function save() {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isAdmin(ctx) {
  return admins.includes(String(ctx.from?.id));
}

bot.command("start", ctx =>
  ctx.reply("سلام! به سامانه هوشمند تریبون شهروندی اورامانات خوش آمدی ❤️")
);

bot.command("help", ctx =>
  ctx.reply("/stats - آمار ورود و خروج\n/channel - تعداد اعضای کانال\n/group - تعداد اعضای گروه")
);

bot.command("channel", async ctx => {
  if (!isAdmin(ctx)) return ctx.reply("این بخش مخصوص مدیر است.");
  try {
    const count = await ctx.api.getChatMemberCount("@oramanat_k_shahrvnd");
    ctx.reply(`تعداد اعضای کانال: ${count}`);
  } catch {
    ctx.reply("دریافت آمار کانال ناموفق بود.");
  }
});

bot.command("group", async ctx => {
  if (!isAdmin(ctx)) return ctx.reply("این بخش مخصوص مدیر است.");
  try {
    const count = await ctx.api.getChatMemberCount("@oramanat_T_SHAHRVAND");
    ctx.reply(`تعداد اعضای گروه: ${count}`);
  } catch {
    ctx.reply("دریافت آمار گروه ناموفق بود.");
  }
});

bot.command("stats", ctx => {
  if (!isAdmin(ctx)) return ctx.reply("این بخش مخصوص مدیر است.");

  const joins = data.events.filter(x => x.type === "join").length;
  const leaves = data.events.filter(x => x.type === "leave").length;

  ctx.reply(`گزارش ثبت‌شده:\nورود: ${joins}\nخروج: ${leaves}\nرشد خالص: ${joins - leaves}`);
});

bot.on("chat_member", ctx => {
  const update = ctx.update.chat_member;
  const oldStatus = update.old_chat_member.status;
  const newStatus = update.new_chat_member.status;

  const wasMember = ["member", "administrator", "creator", "restricted"].includes(oldStatus);
  const isMember = ["member", "administrator", "creator", "restricted"].includes(newStatus);

  if (!wasMember && isMember) {
    data.events.push({ type: "join", user: update.new_chat_member.user.id, date: new Date().toISOString() });
    save();
  }

  if (wasMember && !isMember) {
    data.events.push({ type: "leave", user: update.old_chat_member.user.id, date: new Date().toISOString() });
    save();
  }
});

bot.start({
  allowed_updates: ["message", "chat_member", "my_chat_member"]
});

console.log("Oramanat Member started");
