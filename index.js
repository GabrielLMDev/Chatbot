const express = require("express");
const log = (pino = require("pino"));
const {
    default: makeWASocket,
    MessageType,
    MessageOptions,
    Mimetype,
    DisconnectReason,
    BufferJSON,
    AnyMessageContent,
    delay,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    MessageRetryMap,
    useMultiFileAuthState,
    msgRetryCounterMap,
} = require("@whiskeysockets/baileys");
const { session } = { session: "session_auth_info" };
const qrcode = require("qrcode-terminal");
const bodyParser = require("body-parser");
const { Boom } = require("@hapi/boom");
const { menus, setFormatDate, setEmoji, setEmojiTittle } = require('./menus');
const { getSession, updateSession } = require('./session');
const db = require('./firebaseConnection');

// Configuración de Express
const app = express();
const port = 80;
app.use(bodyParser.json());

const mainMenu = `*Menú principal:*\n\n1️⃣ - Servicios Digitales *GabrielLMDev*\n2️⃣ - Servicios Plataformas Streaming`;

// Inicializa Baileys}
const startBot = async () => {

    const { state, saveCreds } = await useMultiFileAuthState("session_auth_info");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: log({ level: "silent" }),
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message.message || message.key.fromMe) return;

        const from = message.key.remoteJid;
        const userMessage = message.message.conversation || '';

        let response;
        // Manejo de palabra "inicio"
        if (userMessage.toLowerCase() === '/Inicio' || userMessage.toLowerCase() === '/inicio' || userMessage.toLowerCase() === '/INICIO') {
            response = {
                newContext: 'main_menu',
                message: mainMenu,
            };
        } else if (userMessage.toLowerCase() === '/precios' || userMessage.toLowerCase() === '/Precios' || userMessage.toLowerCase() === '/PRECIOS' || userMessage.toLowerCase() === '/precio' || userMessage.toLowerCase() === '/Precio' || userMessage.toLowerCase() === '/PRECIO') {
            const products = await db.collection('apps').orderBy('group').get();
            const productList = products.docs
                .map((doc) => `${setEmoji(new Date())} _${doc.data().name}:_ *$${doc.data().price}* ${doc.data().available ? "" : "_(AGOTADO)_"}`)
                .join('\n');
            const pricesMessage = `${setEmojiTittle(new Date())} _*PRECIOS DE HOY: ${setFormatDate(new Date())}*_ ${setEmojiTittle(new Date())}\n\n${productList}`;
            response = {
                message: pricesMessage,
            };
        } else {
            // Ignorar otros mensajes
            return;
        }

        updateSession(from, response.newContext);

        await sock.sendMessage(from, { text: response.message });
    });

    sock.ev.on("creds.update", saveCreds);
};

startBot();

// Inicializa Express
app.get('/', (req, res) => res.send('Chatbot funcionando'));
app.listen(port, () => console.log(`Servidor Express en http://localhost:${port}`));