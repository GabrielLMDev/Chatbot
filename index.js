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

// Inicializa Baileys
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

        // Obtener el contexto actual del usuario
        const session = getSession(from) || { context: 'main_menu' };

        let response;

        // Manejo de comandos globales
        if (userMessage.toLowerCase() === '/inicio') {
            response = {
                newContext: 'main_menu',
                message: mainMenu,
            };
        } else if (userMessage.toLowerCase().startsWith('/precios')) {
            const products = await db.collection('apps').orderBy('group').get();
            const productList = products.docs
                .map((doc) => `${setEmoji(new Date())} _${doc.data().name}:_ *$${doc.data().price}* ${doc.data().available ? "" : "_(AGOTADO)_"}`)
                .join('\n');
            const pricesMessage = `${setEmojiTittle(new Date())} _*PRECIOS DE HOY: ${setFormatDate(new Date())}*_ ${setEmojiTittle(new Date())}\n\n${productList}`;
            response = {
                newContext: session.context, // Mantener el contexto actual
                message: pricesMessage,
            };
        } else {
            // Manejo de submenús basado en el contexto actual
            response = await menus(session.context, userMessage, from);
        }

        // Si no hay respuesta (comando no reconocido), no hacer nada
        if (!response || !response.message) return;

        // Actualizar el estado del usuario solo si el contexto cambia
        if (response.newContext) {
            updateSession(from, response.newContext);
        }

        // Enviar el mensaje de respuesta
        await sock.sendMessage(from, { text: response.message });
    });

    sock.ev.on("creds.update", saveCreds);
};

startBot();


// Inicializa Express
app.get('/', (req, res) => res.send('Chatbot funcionando'));
app.listen(port, () => console.log(`Servidor Express en http://localhost:${port}`));