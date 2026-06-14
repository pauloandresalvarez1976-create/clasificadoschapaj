const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const ACCESS_TOKEN = "APP_USR-7410307993640629-051011-066deffbe0abf910c06dfaaf084c9dce-70114001";
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

const PRECIOS_DEFAULT = {
  esmeralda:            { titulo: "Plan Esmeralda",           precio: 4600  },
  diamante:             { titulo: "Plan Diamante",            precio: 9200  },
  tienda_esmeralda_30:  { titulo: "Tienda Esmeralda 30 días", precio: 9000  },
  tienda_esmeralda_90:  { titulo: "Tienda Esmeralda 90 días", precio: 23000 },
  tienda_esmeralda_180: { titulo: "Tienda Esmeralda 180 días",precio: 41000 },
  tienda_diamante_30:   { titulo: "Tienda Diamante 30 días",  precio: 18000 },
  tienda_diamante_90:   { titulo: "Tienda Diamante 90 días",  precio: 45000 },
  tienda_diamante_180:  { titulo: "Tienda Diamante 180 días", precio: 85000 },
};

// ── ADMIN SDK (lazy) ─────────────────────────────────────────────
let adminInitialized = false;
let db, storageBucket, adminAuth;
function getAdmin() {
  if (!adminInitialized) {
    const admin = require("firebase-admin");
    admin.initializeApp();
    db            = admin.firestore();
    storageBucket = admin.storage().bucket();
    adminAuth     = admin.auth();
    adminInitialized = true;
  }
  return { db, storageBucket, adminAuth };
}
function getDb()     { return getAdmin().db; }
function getBucket() { return getAdmin().storageBucket; }
function getAuth()   { return getAdmin().adminAuth; }

// ── HELPER: borrar archivo de Storage por URL ────────────────────
async function borrarPorUrl(url) {
  try {
    if (!url || !url.includes("firebasestorage")) return;
    const match = url.match(/\/o\/(.+?)(\?|$)/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);
    await getBucket().file(filePath).delete();
  } catch (e) {
    console.log("No se pudo borrar archivo:", e.message);
  }
}

// ── CREAR PREFERENCIA MERCADOPAGO ────────────────────────────────
exports.crearPreferencia = onRequest(
  { cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")   return res.status(405).send("Method Not Allowed");

    try {
      const { plan, userId, email } = req.body;

      // Leer precios dinámicos desde Firestore
      let precios = { ...PRECIOS_DEFAULT };
      try {
        const { db } = getAdmin();
        const cfgSnap = await db.collection("config").doc("planes").get();
        if (cfgSnap.exists) {
          const d = cfgSnap.data();
          if (d.esmeraldaPrecio) precios.esmeralda.precio = Number(d.esmeraldaPrecio);
          if (d.diamantePrecio)  precios.diamante.precio  = Number(d.diamantePrecio);
          // Planes de tienda
          if (d.tiendaPlata30)  precios.tienda_esmeralda_30  = { titulo: "Tienda Esmeralda 30 días",  precio: Number(d.tiendaPlata30)  };
          if (d.tiendaPlata90)  precios.tienda_esmeralda_90  = { titulo: "Tienda Esmeralda 90 días",  precio: Number(d.tiendaPlata90)  };
          if (d.tiendaPlata180) precios.tienda_esmeralda_180 = { titulo: "Tienda Esmeralda 180 días", precio: Number(d.tiendaPlata180) };
          if (d.tiendaOro30)    precios.tienda_diamante_30   = { titulo: "Tienda Diamante 30 días",   precio: Number(d.tiendaOro30)    };
          if (d.tiendaOro90)    precios.tienda_diamante_90   = { titulo: "Tienda Diamante 90 días",   precio: Number(d.tiendaOro90)    };
          if (d.tiendaOro180)   precios.tienda_diamante_180  = { titulo: "Tienda Diamante 180 días",  precio: Number(d.tiendaOro180)   };
        }
      } catch(e) {}

      const planData = precios[plan];
      if (!planData) return res.status(400).json({ error: "Plan inválido: " + plan });

      const preference = new Preference(client);
      const response = await preference.create({
        body: {
          items: [{ title: planData.titulo, quantity: 1, unit_price: planData.precio }],
          payer: { email },
          external_reference: `${userId}_${plan}`,
          back_urls: {
            success: "https://clasificadoschapaj.com.ar/?pago=ok",
            failure: "https://clasificadoschapaj.com.ar/?pago=error",
            pending: "https://clasificadoschapaj.com.ar/?pago=pendiente",
          },
          auto_return: "approved",
          notification_url: "https://us-central1-clasificados-chapa-j.cloudfunctions.net/webhookMP",
        },
      });

      res.json({ init_point: response.init_point });
    } catch (err) {
      console.error("Error crearPreferencia:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── WEBHOOK MERCADOPAGO ──────────────────────────────────────────
exports.webhookMP = onRequest(
  { cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const { type, data } = req.body;
      if (type !== "payment" || !data?.id) return res.status(200).send("ok");

      const payment   = new Payment(client);
      const pagoData  = await payment.get({ id: data.id });
      if (pagoData.status !== "approved") return res.status(200).send("ok");

      const ref       = pagoData.external_reference || "";
      const [userId, ...planParts] = ref.split("_");
      const plan      = planParts.join("_");
      if (!userId || !plan) return res.status(200).send("ok");

      const { db } = getAdmin();

      // Planes de anuncio
      if (plan === "esmeralda" || plan === "diamante") {
        const snap = await db.collection("usuarios").where("uid","==",userId).get();
        if (!snap.empty) {
          const vigSnap = await db.collection("config").doc("planes").get();
          const vig = plan === "esmeralda"
            ? (vigSnap.data()?.plataVigencia || 30)
            : (vigSnap.data()?.oroVigencia   || 30);
          const hasta = new Date();
          hasta.setDate(hasta.getDate() + Number(vig));
          await snap.docs[0].ref.update({ plan, planHasta: hasta });
        }
        return res.status(200).send("ok");
      }

      // Planes de tienda
      if (plan.startsWith("tienda_")) {
        const dias = plan.endsWith("_180") ? 180 : plan.endsWith("_90") ? 90 : 30;
        const tipoPlan = plan.includes("diamante") ? "diamante" : "esmeralda";
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + dias);

        // 1. Actualizar la tienda
        const snapTienda = await db.collection("tiendas").where("userId","==",userId).get();
        if (!snapTienda.empty) {
          await snapTienda.docs[0].ref.update({ activa: true, plan: tipoPlan, planHasta: hasta });
        }

        // 2. Actualizar el usuario con el plan de tienda
        const snapUser = await db.collection("usuarios").where("uid","==",userId).get();
        if (!snapUser.empty) {
          await snapUser.docs[0].ref.update({ tiendaPlan: tipoPlan, tiendaPlanHasta: hasta });
        }

        // 3. Actualizar el plan en TODOS sus anuncios existentes
        const snapAnuncios = await db.collection("anuncios").where("uid","==",userId).get();
        await Promise.all(snapAnuncios.docs.map(d => d.ref.update({ plan: tipoPlan })));

        return res.status(200).send("ok");
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("Error webhookMP:", err);
      res.status(500).send("error");
    }
  }
);

// ── ELIMINAR USUARIO COMPLETO ────────────────────────────────────
// Borra al usuario de Firebase Auth + Firestore (usuarios, anuncios, alertas, favoritos, denuncias)
exports.eliminarUsuario = onRequest(
  { cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST")   return res.status(405).send("Method Not Allowed");

    try {
      const { uid, usuarioDocId } = req.body;
      if (!uid) return res.status(400).json({ error: "Falta uid" });

      const { db, adminAuth } = getAdmin();

      // 1. Borrar de Firebase Authentication
      try {
        await adminAuth.deleteUser(uid);
      } catch(e) {
        // Si el usuario no existe en Auth igual seguimos
        console.log("Auth delete:", e.message);
      }

      // 2. Borrar documento de usuarios
      if (usuarioDocId) {
        await db.collection("usuarios").doc(usuarioDocId).delete();
      } else {
        const snap = await db.collection("usuarios").where("uid","==",uid).get();
        await Promise.all(snap.docs.map(d => d.ref.delete()));
      }

      // 3. Borrar todos sus anuncios (y sus fotos de Storage)
      const anunciosSnap = await db.collection("anuncios").where("uid","==",uid).get();
      for (const d of anunciosSnap.docs) {
        const data = d.data();
        // Borrar fotos de Storage
        if (data.fotos?.length) {
          await Promise.all(data.fotos.map(url => borrarPorUrl(url)));
        }
        await d.ref.delete();
      }

      // 4. Borrar alertas del usuario
      const alertasSnap = await db.collection("alertas").where("uid","==",uid).get();
      await Promise.all(alertasSnap.docs.map(d => d.ref.delete()));

      // 5. Borrar denuncias hechas por el usuario
      const denunciasSnap = await db.collection("denuncias").where("uid","==",uid).get();
      await Promise.all(denunciasSnap.docs.map(d => d.ref.delete()));

      // 6. Borrar su tienda si tiene
      const tiendaSnap = await db.collection("tiendas").where("userId","==",uid).get();
      await Promise.all(tiendaSnap.docs.map(d => d.ref.delete()));

      console.log(`Usuario ${uid} eliminado completamente.`);
      res.json({ ok: true });
    } catch (err) {
      console.error("Error eliminarUsuario:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── DEGRADAR ANUNCIOS VENCIDOS (diario 3am Argentina) ───────────
exports.degradarAnunciosVencidos = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/Argentina/Buenos_Aires",
  },
  async () => {
    const firestore = getDb();
    const ahora = new Date();
    try {
      const snap = await firestore.collection("anuncios")
        .where("plan", "in", ["esmeralda", "diamante"])
        .where("vencimientoAt", "<=", ahora)
        .get();
      if (snap.empty) { console.log("[degradar] Sin vencidos."); return; }
      const batch = firestore.batch();
      snap.docs.forEach(d => batch.update(d.ref, { plan: "cuarzo" }));
      await batch.commit();
      console.log(`[degradar] ${snap.size} anuncio(s) degradados.`);
    } catch(e) {
      console.error("[degradar] Error:", e);
    }
  }
);

// ── LIMPIEZA DE COMPROBANTES (cada 30 días) ──────────────────────
exports.limpiarComprobantes = onSchedule(
  {
    schedule: "0 4 1 * *",
    timeZone: "America/Argentina/Buenos_Aires",
  },
  async () => {
    const firestore = getDb();
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    try {
      const snap = await firestore.collection("comprobantes")
        .where("createdAt", "<=", hace30)
        .get();
      if (snap.empty) { console.log("[limpiar] Sin comprobantes viejos."); return; }
      const batch = firestore.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`[limpiar] ${snap.size} comprobante(s) eliminados.`);
    } catch(e) {
      console.error("[limpiar] Error:", e);
    }
  }
);

// ── LIMPIEZA DE FOTOS AL ELIMINAR ANUNCIO ───────────────────────
exports.limpiarFotosAnuncio = onDocumentDeleted(
  "anuncios/{anuncioId}",
  async (event) => {
    const data = event.data?.data();
    if (!data?.fotos?.length) return;
    await Promise.all(data.fotos.map(url => borrarPorUrl(url)));
    console.log(`[fotos] ${data.fotos.length} foto(s) eliminadas del anuncio ${event.params.anuncioId}`);
  }
);
