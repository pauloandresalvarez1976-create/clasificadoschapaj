const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Anthropic = require("@anthropic-ai/sdk");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const ACCESS_TOKEN = "APP_USR-7410307993640629-051011-066deffbe0abf910c06dfaaf084c9dce-70114001";
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

const PRECIOS_DEFAULT = {
  esmeralda: { titulo: "Plan Esmeralda", precio: 4600 },
  diamante:  { titulo: "Plan Diamante",  precio: 9200 },
};

// ── INICIALIZAR ADMIN LAZY ───────────────────────────────────────
let adminInitialized = false;
let db, storageBucket;
function getAdmin() {
  if (!adminInitialized) {
    const admin = require("firebase-admin");
    admin.initializeApp();
    db = admin.firestore();
    storageBucket = admin.storage().bucket();
    adminInitialized = true;
  }
  return { db, storageBucket };
}
function getDb() { return getAdmin().db; }
function getBucket() { return getAdmin().storageBucket; }

// ── HELPER: borrar archivo de Storage por URL ────────────────────
async function borrarPorUrl(url) {
  try {
    if (!url || !url.includes("firebasestorage")) return;
    const match = url.match(/\/o\/(.+?)\?/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);
    await getBucket().file(filePath).delete();
    console.log(`[storage] Borrado: ${filePath}`);
  } catch (e) {
    if (e.code !== 404) console.error(`[storage] Error borrando ${url}:`, e.message);
  }
}

// ── TRIGGER: borrar fotos cuando se elimina un anuncio ───────────
exports.limpiarFotosAnuncio = onDocumentDeleted(
  "anuncios/{anuncioId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const fotos = data.fotos || [];
    console.log(`[limpiarFotos] Anuncio ${event.params.anuncioId} — ${fotos.length} foto(s) a borrar`);
    await Promise.all(fotos.map(url => borrarPorUrl(url)));
    console.log(`[limpiarFotos] Limpieza completa`);
  }
);

// ── FUNCIÓN PROGRAMADA: limpiar comprobantes viejos ──────────────
// Corre el día 1 de cada mes a las 4am Argentina
exports.limpiarComprobantes = onSchedule(
  {
    schedule: "0 7 1 * *",
    timeZone: "America/Argentina/Buenos_Aires",
  },
  async () => {
    const firestore = getDb();
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);
    console.log(`[limpiarComp] Limpiando comprobantes anteriores a ${hace30dias.toLocaleDateString("es-AR")}`);
    try {
      const snap = await firestore.collection("pagos")
        .where("status", "in", ["aprobado", "rechazado"])
        .where("createdAt", "<=", hace30dias)
        .get();
      if (snap.empty) { console.log("[limpiarComp] Nada para limpiar."); return; }
      let borrados = 0;
      for (const d of snap.docs) {
        const { comprobante } = d.data();
        if (comprobante) {
          await borrarPorUrl(comprobante);
          await d.ref.update({ comprobante: null, comprobanteLimpiadoEn: new Date() });
          borrados++;
        }
      }
      console.log(`[limpiarComp] ${borrados} comprobante(s) borrado(s).`);
    } catch (e) { console.error("[limpiarComp] Error:", e); }
  }
);

// ── FUNCIÓN PROGRAMADA: degradar anuncios vencidos ───────────────
// Corre todos los días a las 3am Argentina
exports.degradarAnunciosVencidos = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/Argentina/Buenos_Aires",
  },
  async () => {
    const firestore = getDb();
    const ahora = new Date();
    console.log(`[degradar] Corriendo a las ${ahora.toISOString()}`);
    try {
      const snap = await firestore.collection("anuncios")
        .where("plan", "in", ["esmeralda", "diamante"])
        .where("vencimientoAt", "<=", ahora)
        .get();
      if (snap.empty) { console.log("[degradar] No hay anuncios vencidos."); return; }
      const batch = firestore.batch();
      snap.docs.forEach(d => batch.update(d.ref, { plan: "cuarzo", planVencidoEn: ahora, updatedAt: ahora }));
      await batch.commit();
      console.log(`[degradar] ${snap.size} anuncio(s) bajado(s) a Cuarzo.`);
    } catch (e) { console.error("[degradar] Error:", e); }
  }
);

// ── CREAR PREFERENCIA MERCADOPAGO ────────────────────────────────
exports.crearPreferencia = onRequest(
  { cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    const { plan, userId, email } = req.body;
    if (!plan || !userId || !email) return res.status(400).send("Faltan datos");
    const planKey = plan.toLowerCase();
    if (!["esmeralda", "diamante"].includes(planKey)) return res.status(400).send("Plan invalido");
    let precioFinal, tituloFinal;
    try {
      const snap = await getDb().collection("config").doc("site").get();
      const pricing = snap.exists ? (snap.data().pricing || {}) : {};
      precioFinal = planKey === "esmeralda"
        ? (Number(pricing.plataPrice) || PRECIOS_DEFAULT.esmeralda.precio)
        : (Number(pricing.oroPrice)   || PRECIOS_DEFAULT.diamante.precio);
      tituloFinal = planKey === "esmeralda" ? "Plan Esmeralda" : "Plan Diamante";
    } catch (e) {
      precioFinal = PRECIOS_DEFAULT[planKey].precio;
      tituloFinal = PRECIOS_DEFAULT[planKey].titulo;
    }
    try {
      const preference = new Preference(client);
      const response = await preference.create({
        body: {
          items: [{ title: tituloFinal, quantity: 1, unit_price: precioFinal, currency_id: "ARS" }],
          payer: { email },
          external_reference: `${userId}_${plan}`,
          back_urls: {
            success: "https://www.clasificadoschapaj.com.ar/pago-exitoso",
            failure: "https://www.clasificadoschapaj.com.ar/pago-fallido",
            pending: "https://www.clasificadoschapaj.com.ar/pago-pendiente",
          },
          auto_return: "approved",
        },
      });
      res.json({ init_point: response.init_point });
    } catch (e) {
      console.error("Error MP:", e);
      res.status(500).json({ error: "Error al crear preferencia" });
    }
  }
);

// ── WEBHOOK MERCADOPAGO ──────────────────────────────────────────
exports.webhookMP = onRequest(
  { cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    const { type, data } = req.body;
    if (type !== "payment") return res.status(200).send("ok");
    try {
      const mpClient = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
      const payment = new Payment(mpClient);
      const pago = await payment.get({ id: data.id });
      if (pago.status !== "approved") return res.status(200).send("ok");
      const [userId, plan] = (pago.external_reference || "").split("_");
      if (!userId || !plan) return res.status(200).send("ok");
      const firestore = getDb();
      const nuevaFecha = new Date();
      nuevaFecha.setDate(nuevaFecha.getDate() + 30);
      const snap = await firestore.collection("usuarios").where("uid", "==", userId).get();
      if (!snap.empty) await snap.docs[0].ref.update({ plan, planActivadoEn: new Date() });
      const anuncios = await firestore.collection("anuncios")
        .where("uid", "==", userId).where("status", "==", "activo").get();
      await Promise.all(anuncios.docs.map(d => d.ref.update({ plan, vencimientoAt: nuevaFecha })));
      res.status(200).send("ok");
    } catch (e) {
      console.error("Error webhook:", e);
      res.status(500).send("error");
    }
  }
);

// ── ASISTENTE IA ─────────────────────────────────────────────────
exports.asistenteia = onRequest(
  { secrets: [ANTHROPIC_API_KEY], region: "us-east1", cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    const { descripcionUsuario } = req.body;
    if (!descripcionUsuario || descripcionUsuario.trim().length < 5) return res.status(400).json({ error: "Descripción muy corta" });
    try {
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: `Sos un asistente para el sitio de clasificados argentino "Clasificados Chapa J" de San Juan.
Analizá la descripción del usuario y respondé ÚNICAMENTE con JSON válido sin texto adicional:
{"titulo":"máx 70 chars","descripcion":"3-4 oraciones en español argentino","categoria":"una de: Vehículos,Inmuebles,Servicios,Hogar Muebles Jardín,Electrónica Audio Video,Ropa y Accesorios,Deportes,Computación,Electrodomésticos,Celulares Telefonía,Animales Mascotas,Otros","estado":"usado o nuevo"}`,
        messages: [{ role: "user", content: descripcionUsuario.trim().slice(0, 1000) }],
      });
      const texto = message.content[0].text.trim().replace(/```json|```/g, "").trim();
      return res.status(200).json(JSON.parse(texto));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);