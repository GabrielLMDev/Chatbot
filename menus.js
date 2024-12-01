const db = require('./firebaseConnection');

const menus = async (context, input, from) => {
  const mainMenu = `*Menú principal:*\n\n1️⃣ - Servicios Digitales *GabrielLMDev*\n2️⃣ - Servicios Plataformas Streaming`;

  const serviciosMenu = `*Servicios Digitales GabrielLMDev:*\n\n1️⃣ - _Necesito una cotización_\n2️⃣ - _Quiero conocer el trabajo de GabrielLMDev_\n3️⃣ - _Quiero invitarte un café._\n4️⃣ - _Volver al menú principal_`;
  const plataformasMenu = `*Servicios Plataformas Streaming:*\n\n1️⃣ - _Precios del Día_\n2️⃣ - _Consultar Cuentas_\n3️⃣ - _Cómo hacer una compra_\n4️⃣ - _Métodos de Pago_\n5️⃣ - _Volver al menú principal_`;

  let newContext = context;
  let message = '';

  switch (context) {
    case 'main_menu':
      if (input === '1') {
        newContext = 'servicios_menu';
        message = serviciosMenu;
      } else if (input === '2') {
        newContext = 'plataformas_menu';
        message = plataformasMenu;
      } else {
        return null; // No responder a comandos no válidos
      }
      break;

    case 'plataformas_menu':
      if (input === '1') {
        const products = await db.collection('apps').orderBy('group').get();
        const productList = products.docs
          .map((doc) => `${setEmoji(new Date())} _${doc.data().name}:_ *$${doc.data().price}* ${doc.data().available ? "" : "_(AGOTADO)_"}`)
          .join('\n');
        message = `${setEmojiTittle(new Date())} _*PRECIOS DE HOY: ${setFormatDate(new Date())}*_ ${setEmojiTittle(new Date())}\n\n${productList}\n\n*Digita '0' para regresar.*`;
      } else if (input === '2') {
        const formattedNumber = from.replace(/^\d{3}/, '').split('@')[0];
        const services = await db.collection('streaming_data').where('phone', '==', formattedNumber).get();
        if (services.empty) {
          message = `No encontramos cuentas asociadas a tu número (${formattedNumber}).`;
        } else {
          const doc = services.docs[0];
          const accountsSnapshot = await doc.ref.collection("accounts").get();
          const accounts = accountsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return `*Plataforma: _${data.name}_*\n*Correo: _${data.mail}_*\n*Perfil: _${data.profile}_*\n*PIN: _${data.Pin}_*\n*Fecha de activación: _${data.activation_date}_*\n*Fecha de término: _${data.end_date}_*`;
          }).join('\n\n');
          message = `*CUENTAS CONTRATADAS:*\n\n${accounts}\n\n*Digita '0' para regresar.*`;
        }
      } else if (input === '3') {
        const numero = "5215538495677";
        const texto = encodeURIComponent("Hola, quiero una cuenta de:");
        message = `✅ *¿Cómo hacer una compra?* ✅\n\n1️⃣ Verifica costo y disponibilidad de la cuenta (Opción 1 del menú Plataformas).\n\n2️⃣ Consulta "Métodos de Pago" (Opción 4 del menú Plataformas) y copia el número de cuenta.\n\n3️⃣ Realiza el pago y envía un mensaje a [este enlace](https://api.whatsapp.com/send?phone=${numero}&text=${texto}) con tu comprobante.`;
      } else if (input === '4') {
        message = `💲 *MÉTODOS DE PAGO* 💲\n\n✅ BANCO NU MÉXICO ✅\n_*Si eres de un banco diferente usa este número:_*\nNúmero CLABE: 638180010170338560\n\n_*Si eres del Banco NU usa este número:_*\nNúmero de cuenta: 01017033856\n\nBeneficiario: Gabriel Luengas\n\nConcepto: *Pago Tu Nombre*\n\n*Digita '0' para regresar.*`;
      } else if (input === '5' || input === '0') {
        newContext = 'main_menu';
        message = mainMenu;
      } else {
        return null; // No responder a comandos no válidos
      }
      break;

    case 'servicios_menu':
      if (input === '1') {
        const urlPrice = "https://wa.link/9b9qth";
        message = `Te comunicaré con Gabriel de inmediato.\n*Haz clic aquí:* ${urlPrice}\n\n*Digita '0' para regresar.*`;
      } else if (input === '2') {
        const webSite = "https://www.gabriellmdev.com";
        message = `Por supuesto, aquí tienes el sitio web oficial.\n*Haz clic aquí:* ${webSite}\n\n*Digita '0' para regresar.*`;
      } else if (input === '3') {
        const urlCoffe = "https://wa.link/pq2co2";
        message = `Claro, envía un mensaje a Gabriel haciendo clic aquí: ${urlCoffe}\n\n*Digita '0' para regresar.*`;
      } else if (input === '4' || input === '0') {
        newContext = 'main_menu';
        message = mainMenu;
      } else {
        return null; // No responder a comandos no válidos
      }
      break;

    default:
      return null; // No responder si el contexto no es válido
  }

  return { newContext, message };
};

function setEmoji(date) {
  const month = new Date(date).getMonth();
  return month === 11 ? "🎁" : month === 10 ? "🎃" : month === 0 ? "✨" : "✅";
}

function setEmojiTittle(date) {
  const month = new Date(date).getMonth();
  return month === 11 ? "🎄🎅" : month === 10 ? "🕷️🕸️" : month === 0 ? "🎉🎊" : "🌞";
}

function setFormatDate(date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

module.exports = { menus, setFormatDate, setEmoji, setEmojiTittle };
