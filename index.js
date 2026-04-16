// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const TOKEN = process.env.TOKEN;

BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

const defaultGatewayIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
];

let intents = [];

if (process.env.GATEWAY_INTENTS && process.env.GATEWAY_INTENTS.split(',').length > 0) {
  for (let gatewayIntent of process.env.GATEWAY_INTENTS.split(',')) {
    gatewayIntent = gatewayIntent.trim()
    if (Number.isInteger(GatewayIntentBits[gatewayIntent.trim()])) {
      intents.push(GatewayIntentBits[gatewayIntent.trim()]);
    }
  }
} else {
  intents = defaultGatewayIntents;
}
console.log(`Intents for Discord Client: ${intents}`)


// Create a new client instance
const client = new Client({ intents: intents });

// No-code / low-code backend message endpoint (ie: BuildShip, Fastgen, etc)
client.on(Events.MessageCreate, async message => {
  try {
    const response = await fetch(process.env.MESSAGE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        message_data: message.toJSON()
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log(await response.json())
  } catch (e) {
    console.error(error);
  }
})

client.on(Events.GuildMemberAdd, async member => {
  console.log('member add event fired', member)
  try {
    const response = await fetch(process.env.UPDATE_ROLE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        data: member.toJSON()
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data = await response.json()
    console.log(data)
  } catch (e) {
    console.error(e);
  }
})

// No-code / low-code backend message endpoint (ie: BuildShip, Fastgen, etc)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const response = await fetch(process.env.INTERACTION_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        interaction_id: interaction.id,
        interaction_token: interaction.token,
        interaction_data: { ...interaction.toJSON(), options: interaction.options.data }
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log(await response.json())
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});


// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(TOKEN);
