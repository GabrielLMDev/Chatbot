const db = require('./firebaseConnection');
const menus = async (context, input, from) => {
  const mainMenu = `*Menú principal:*\n\n1️⃣ - Servicios Digitales *GabrielLMDev*\n2️⃣ - Servicios Plataformas Streaming`;

  const serviciosMenu = `*Servicios Digitales GabrielLMDev:*\n\n1️⃣ - _Necesito una cotización_\n2️⃣ - _Quiero conocer el trabajo de GabrielLMDev_\n3️⃣ - _Quiero invitarte un café._\n4️⃣ - _Volver al menú principal_`;
  const plataformasMenu = `*Servicios Plataformas Streaming:*\n\n1️⃣ - _Precios del Dia_\n2️⃣ - _Consultar Cuentas_\n3️⃣ - _Cómo hacer una compra_\n4️⃣ - _Métodos de Pago_\n5️⃣ - _Volver al menú principal_`;

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
        message = mainMenu;
      }
      break;

    case 'plataformas_menu':
      if (input === '1') {

        const products = await db.collection('apps').orderBy('group').get();
        const productList = products.docs
          .map((doc) => `${setEmoji(new Date())} _${doc.data().name}:_ *$${doc.data().price}* ${doc.data().available ? "" : "_(AGOTADO)_"}`)
          .join('\n');
        message = `${setEmojiTittle(new Date())} _*PRECIOS DE HOY: ${setFormatDate(new Date())}*_ ${setEmojiTittle(new Date())}\n\n${productList}\n\n *Digita '0' para regresar.*`;

      } else if (input === '2') {
        const formattedNumber = from.replace(/^\d{3}/, '').split('@')[0];
        const services = await db.collection('streaming_data').where('phone', '==', formattedNumber).get();
        if (services.empty) {
          message = 'No encontramos cuentas asociadas a tu número. ->' + formattedNumber;
        } else {

          const doc = services.docs[0];
          const accountsSnapshot = await doc.ref.collection("accounts").get();
          const accounts = accountsSnapshot.docs.map((doc) => `*Plataforma: _${doc.data().name}_* \n*Correo: _${doc.data().mail}_* \n*Perfil: _${doc.data().profile}_* \n*PIN: _${doc.data().Pin}_* \n*Fecha de activación: _${doc.data().activation_date}_* \n*Fecha de termino: _${doc.data().end_date}_*`)
            .join('\n\n');
          message = `*CUENTAS CONTRATADAS:*\n${accounts}\n\n *Digita '0' para regresar.*`;
        }

      } else if (input === '3') {

        const numero = "5215538495677";
        const texto = encodeURIComponent("Hola, quiero una cuenta de:");
        // Instrucciones para comprar
        message = `✅ *¿Cómo hacer una compra:?* ✅\n\n1. Verifica costo y disponibilidad de la cuenta que quieras. (Opcion 1 del Menu Plataformas)`
          + `\n\n2. Escribe la opcion "Métodos de Pago" (Opcion 4 del Menu Plataformas) y copia el numero de cuenta bancario.`
          + `\n\n3. Realiza el pago via transferencia, correspondiente al precio de la cuenta que quieras. (Concepto: Pago).`
          + `\n\n4. Envia un mensaje a https://api.whatsapp.com/send?phone=${numero}&text=${texto}, adjunta foto del comprobante de pago.`

      } else if (input === '4') {
        message = `💲 *MÉTODOS DE PAGO* 💲` +
          `\n\n✅ BANCO NU MÉXICO ✅` +
          `\n_*Si eres de un banco diferente usa este número*_` +
          `\nNúmero CLABE: 638180010170338560` +
          `\n\n_*Si eres del Banco NU usa este número*_` +
          `\nNúmero de cuenta: 01017033856` +
          `\n\nBeneficiario: Gabriel Luengas` +
          `\n\nConcepto\nPago *Tu nombre\n\n *Digita '0' para regresar.*`;

      } else if (input === '5') {
        newContext = 'main_menu';
        message = mainMenu;
      }
      else {
        message = plataformasMenu;
      }
      break;

    case 'servicios_menu':
      if (input === '1') {
        const urlPrice = "https://wa.link/9b9qth";
        message = `Te comunicare con él de inmediato.\n*Click aqui =>* ${urlPrice}\n\n *Digita '0' para regresar.*`;
      } else if (input === '2') {
        const webSite = encodeURIComponent("www.gabriellmdev.com");;
        message = `Por supuesto, aqui tienes el sitio web oficial.\n Donde no solo veras el trabajo, tambien la forma de trabajar, la opinion de sus clientes, entre muchas mas cosas...\n *Click aqui =>* ${webSite}\n\n *Digita '0' para regresar.*`;
      } else if (input === '3') {
        const urlCoffe = encodeURIComponent("https://wa.link/pq2co2");;
        message = `Claro, te sugiero envies un mensaje a Gabriel dando click aqui => ${urlCoffe}\n\n *Digita '0' para regresar.*`;
      } else if (input === '4') {
        newContext = 'main_menu';
        message = mainMenu;
      } else {
        message = serviciosMenu;
      }
      break;

    default:
      newContext = 'main_menu';
      message = mainMenu;
  }

  return { newContext, message };
};

function setEmoji(date) {

  const currentDate = new Date(date);
  const month = currentDate.getMonth();

  return month === 11
    ? "🎁"
    : month === 10
      ? "🎃"
      : month === 0
        ? "✨"
        : "✅";
}

function setEmojiTittle(date) {

  const currentDate = new Date(date);
  const month = currentDate.getMonth();

  return month === 11
    ? "🎄🎅"
    : month === 10
      ? "🕷️🕸️"
      : month === 0
        ? "🎉🎊"
        : "🌞";
}

function setFormatDate(date) {
  currentDate = new Date(date);

  const currentFormatDate = currentDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return currentFormatDate;
}

module.exports = { menus, setFormatDate, setEmoji, setEmojiTittle};