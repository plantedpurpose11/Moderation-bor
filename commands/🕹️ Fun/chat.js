const {
  MessageEmbed
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const fetch = require("node-fetch");
module.exports = {
  name: "chat",
  category: "🕹️ Fun",
  aliases: ["ai", "aichat", "ai-chat"],
  cooldown: 2,
  usage: "chat <TEXT>",
  description: "Let's you chat with the Bot via cmd",
  type: "text",
  run: async (client, message, args, cmduser, text, prefix) => {
    
    let es = client.settings.get(message.guild.id, "embed");let ls = client.settings.get(message.guild.id, "language")
    if (!client.settings.get(message.guild.id, "FUN")) {
      return message.reply({embeds : [new MessageEmbed()
        .setColor(es.wrongcolor)
        .setFooter(client.getFooter(es))
        .setTitle(client.la[ls].common.disabled.title)
        .setDescription(require(`${process.cwd()}/handlers/functions`).handlemsg(client.la[ls].common.disabled.description, {prefix: prefix}))
      ]});
    }
    try {
      if (!args[0])
        return message.reply({embeds : [new MessageEmbed()
          .setColor(es.wrongcolor)
          .setFooter(client.getFooter(es))
          .setTitle(eval(client.la[ls]["cmds"]["fun"]["chat"]["variable1"]))
          .setDescription(eval(client.la[ls]["cmds"]["fun"]["chat"]["variable2"]))
        ]});
      if (message.content)
        message.content = args.join(" ")
      if (message.attachments.size > 0)
        return message.reply({content : "Look at this too...", files : "https://cdn.discordapp.com/attachments/816645188461264896/826736269509525524/I_CANNOT_READ_FILES.png"})
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini_api_key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: args.join(" ") }] }],
          generationConfig: { maxOutputTokens: 500 }
        })
      })
      .then(res => res.json())
      .then(data => {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) message.reply({content: reply.substring(0, 2000)}).catch(e => console.log("ERROR | " + e.stack));
        else message.reply({content: "❌ Couldn't generate a response."}).catch(e => console.log("ERROR | " + e.stack));
      })
      .catch(e => {
        message.reply({content: "❌ AI Chat API is currently unavailable."}).catch(() => {});
      })
    } catch (e) {
      console.log(String(e.stack).grey.bgRed)
      return message.reply({embeds : [new MessageEmbed()
        .setColor(es.wrongcolor)
        .setFooter(client.getFooter(es))
        .setTitle(client.la[ls].common.erroroccur)
        .setDescription(eval(client.la[ls]["cmds"]["fun"]["chat"]["variable3"]))
      ]});
    }
  }
}
/**
 * @INFO
 * Bot Coded by bestgamershk | https://discord.gg/ronee
 * @INFO
 * Work for Indocraft Network | https://discord.gg/rone
 * @INFO
 * Please mention him, when using this Code!
 * @INFO
 */
