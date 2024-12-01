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
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const { Boom } = require("@hapi/boom");

// Inicializar Firebase
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Configuración de Express
const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Node Api GabrielLMDev");
});

app.post("/webhook", async (req, res) => {
    try {
        // Captura el mensaje del usuario
        const message = req.body.messages?.[0]?.text?.body || "";

        // Busca el producto en Firebase
        const snapshot = await db
            .collection("products")
            .where("name", "==", message)
            .get();

        if (snapshot.empty) {
            return res.json({
                messages: [
                    { text: { body: "Lo siento, no encontré el producto que mencionaste." } },
                ],
            });
        }

        const product = snapshot.docs[0].data();
        return res.json({
            messages: [
                { text: { body: `El producto ${product.name} cuesta ${product.price} USD.` } },
            ],
        });
    } catch (error) {
        console.error("Error manejando el webhook:", error);
        res.status(500).send("Error interno del servidor");
    }
});

app.get("/api/users", async (req, res) => {
    try {
        const snapshot = await db.collection("streaming_data").get();
        const products = snapshot.docs.map((doc) => doc.data());
        res.json(products);
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        res.status(500).send("Error interno del servidor");
    }
});

app.get("/api/users/:user", async (req, res) => {
    const phone = parseInt(req.params.user);
    try {
        const snapshot = await db
            .collection("streaming_data")
            .where("phone", "==", phone)
            .get();

        if (snapshot.empty) {
            return res.json({
                messages: [
                    { text: { body: `Lo siento, no encontré el producto que mencionaste. Numero: ${phone}` } },
                ],
            });
        } else {
            const doc = snapshot.docs[0];
            const accountsSnapshot = await doc.ref.collection("accounts").get();
            const accounts = accountsSnapshot.docs.map((doc) => doc.data());
            return res.json({ message: "Cuentas:", accounts });
        }

    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        res.status(500).send("Error interno del servidor");
    }
});


// Endpoint para enviar mensajes desde una solicitud HTTP
app.post("/send-message", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: "Se requiere phone y message en el cuerpo de la solicitud." });
    }

    try {
        await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
        res.json({ success: true, message: "Mensaje enviado correctamente." });
    } catch (error) {
        console.error("Error enviando mensaje:", error);
        res.status(500).json({ success: false, error: "No se pudo enviar el mensaje." });
    }
});

// Endpoint para consultar productos en Firebase
app.post("/product-query", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Se requiere un query en el cuerpo de la solicitud." });
    }

    try {
        const response = await handleFirebaseQuery(query);
        res.json({ success: true, response });
    } catch (error) {
        console.error("Error consultando productos:", error);
        res.status(500).json({ success: false, error: "Error al consultar los productos." });
    }
});


// Inicia el servidor Express
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
