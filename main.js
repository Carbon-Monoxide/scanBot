const phantom = require("phantom");
const prefix = "s!";

function generateScreenshot(url, message) {
  let urlsTraveled = [];
  // console.log(`Array: ${typeof urlsTraveled}`);
  phantom.create().then(function (ph) {
    ph.createPage().then(function (page) {
      page.on("onNavigationRequested", (newUrl, type, willNavigate, main) => {
        // console.log("Trying to navigate to: " + newUrl);
        // console.log("Will actually navigate: " + willNavigate);
        // console.log(`Array: ${typeof urlsTraveled}`);
        urlsTraveled.push(newUrl);
      });
      page.property("viewportSize", { width: 1280, height: 720 });

      page.open(url).then((status) => {
        // console.log(status);
        page.property("content").then((content) => {
          if (
            status !== "success" ||
            content == "<html><head></head><body></body></html>"
          ) {
            message.channel.send("Couldn't find your page!");
            page.close();
            ph.exit();
            return;
          }
          page.render("webpage.png").then(() => {
            // console.log(`Array: ${typeof urlsTraveled}`);
            let resultEmbed = new Discord.MessageEmbed()
              .setColor("#2f3136")
              .setTitle(`Results from scanning ${url}`)
              .setDescription(`Website redirect path`)
              .attachFiles(["./webpage.png"])
              .setImage("attachment://webpage.png")
              .setTimestamp();
            generateEmbedFields(urlsTraveled, resultEmbed);
            resultEmbed.addField(`Requested by`, message.author);
            message.channel.send(resultEmbed);
            // channel.send(urlsTraveled, {
            //   files: ["./webpage.png"],
            // });
            page.close();
            ph.exit();
          });
        });
      });
    });
  });
}

function generateEmbedFields(array, embed) {
  // console.log("generating fields..." + array);
  // console.log(array.length);
  for (let i = 0; i < array.length; i++) {
    embed.addField(`Website #${i + 1}`, `${array[i]}`);
  }
}

const Discord = require("discord.js");
const client = new Discord.Client();

function validURL(str) {
  let pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

client.on("message", (message) => {
  let args;
  let command;
  if (message.channel.type !== "dm") {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    args = message.content.slice(prefix.length).trim().split(" ");
    command = args.shift().toLowerCase();
  } else if (!message.author.bot) {
    // console.log(message.content);
    args = message.content.split(" ")
    command = "scan"
  }
  // console.log(`${args} + ${command}`);
  if (command == "scan") {
    if (!args.length) {
      return message.channel.send(
        `You didn't provide a website ${message.author}!`
      );
    } else if (!validURL(args[0])) {
      return message.channel.send(`Thats not a url ${message.author}!`);
    }

    if (!args[0].startsWith("http")) {
      args[0] = `http://${args[0]}`;
    }
    generateScreenshot(args[0], message);
  }
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Serving ${client.guilds.cache.size} servers!`)
  client.user.setActivity(`Use s;scan to scan a url, or dm me the link!`);
})

client.login("token-here");
