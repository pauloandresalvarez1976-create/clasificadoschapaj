import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail, sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, setDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment,
} from "firebase/firestore";
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";

// ── FIREBASE INIT ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAijs0P3LiEMFJe9j07UUf9XXKT3PNoiBE",
  authDomain: "clasificados-chapa-j.firebaseapp.com",
  projectId: "clasificados-chapa-j",
  storageBucket: "clasificados-chapa-j.firebasestorage.app",
  messagingSenderId: "871996634395",
  appId: "1:871996634395:web:7d799fcde64bec19d30fbe"
};
const fbApp  = initializeApp(firebaseConfig);
const auth   = getAuth(fbApp);
const db     = getFirestore(fbApp);
const storage = getStorage(fbApp);

// ── COLORS ───────────────────────────────────────────────────────
const P  = "#FF6B2B", PD = "#E05520", AC = "#1A1A2E";
const OK = "#10B981", WA = "#F59E0B", ER = "#EF4444", IN = "#3B82F6";
const GO = "#F5A623", BR = "#E5E7EB", TX = "#111827", TM = "#4B5563";
const TL = "#9CA3AF", BG = "#F7F7FA", SF = "#FFFFFF";
// Admin aliases
const PRIMARY=P, PRIMARY_D=PD, ACCENT=AC, SUCCESS=OK, WARNING=WA;
const DANGER=ER, INFO=IN, GOLD=GO, BORDER=BR, TEXT=TX;
const TEXT_MID=TM, TEXT_LIGHT=TL, SURFACE=SF;

// ── CATEGORIES ───────────────────────────────────────────────────
const DEFAULT_CATS = [
  { id:1,  name:"Vehículos",                     icon:"🚗", color:"#FF6B2B", sub:["Autos","Camiones","Camionetas, Utilitarios, SUV","Motos, Cuatriciclos","Náutica","Otros vehículos","Planes de Ahorro"] },
  { id:2,  name:"Inmuebles",                     icon:"🏠", color:"#0EA5E9", sub:["Casas","Cocheras","Departamentos","Fincas, Campos, Quintas","Galpones","Locales, Salones, Oficinas","Negocios, Industrias","Parcelas, Nichos","Terrenos, Lotes","Transferencias, Carpetas"] },
  { id:3,  name:"Servicios",                     icon:"🔧", color:"#10B981", sub:["Capacitaciones","Cuidado personal","Empleos","Fiestas, Eventos","Imprenta","Mant. de Vehículos","Mant. del Hogar","Otros servicios","Profesionales","Servicio Técnico","Transporte General","Viajes, Turismo"] },
  { id:4,  name:"Hogar, Muebles, Jardín",        icon:"🛋️", color:"#F59E0B", sub:["Muebles","Decoración","Jardín","Electrodomésticos","Iluminación","Textiles","Herramientas del hogar"] },
  { id:5,  name:"Industrias, Oficinas",          icon:"🏭", color:"#64748B", sub:["Maquinaria","Herramientas","Equipos de oficina","Insumos industriales","Repuestos industriales","Construcción"] },
  { id:6,  name:"Repuestos y Acc. Vehículos",    icon:"🔩", color:"#78716C", sub:["Repuestos autos","Repuestos motos","Accesorios","Neumáticos","Audio para autos","GPS y alarmas"] },
  { id:7,  name:"Electrónica, Audio, Video",     icon:"📺", color:"#8B5CF6", sub:["Audio","Video / TV","Iluminación LED","Componentes electrónicos","Alarmas","Energía solar"] },
  { id:8,  name:"Ropa y Accesorios",             icon:"👗", color:"#EC4899", sub:["Ropa mujer","Ropa hombre","Ropa niños","Calzado","Carteras y bolsos","Bijouterie","Ropa deportiva"] },
  { id:9,  name:"Deportes",                      icon:"⚽", color:"#14B8A6", sub:["Fútbol","Ciclismo","Natación","Montaña y trekking","Artes marciales","Fitness","Deportes de invierno"] },
  { id:10, name:"Computación",                   icon:"💻", color:"#3B82F6", sub:["Notebooks","PC de escritorio","Monitores","Impresoras","Accesorios PC","Almacenamiento","Redes y WiFi"] },
  { id:11, name:"Electrodomésticos",             icon:"🧺", color:"#F97316", sub:["Heladeras","Lavarropas","Cocinas","Microondas","Aire acondicionado","Ventiladores","Pequeños electrodom."] },
  { id:12, name:"Celulares, Telefonía",          icon:"📱", color:"#06B6D4", sub:["Smartphones","Accesorios celulares","Tablets","Smartwatches","Teléfonos fijos","SIM y recargas"] },
  { id:13, name:"Salud, Belleza, Cuidado Pers.", icon:"💊", color:"#EF4444", sub:["Medicamentos","Equipos médicos","Belleza y cosmética","Cuidado del cabello","Óptica","Ortopedia"] },
  { id:14, name:"Instrumentos Musicales",        icon:"🎸", color:"#A855F7", sub:["Guitarras","Teclados y pianos","Batería y percusión","Vientos","Cuerdas","Accesorios musicales","Equipos de sonido"] },
  { id:15, name:"Animales, Mascotas",            icon:"🐾", color:"#22C55E", sub:["Perros","Gatos","Aves","Peces y acuarios","Roedores","Accesorios mascotas","Veterinaria"] },
  { id:16, name:"Consolas, Videojuegos",         icon:"🎮", color:"#7C3AED", sub:["PlayStation","Xbox","Nintendo","PC gaming","Juegos digitales","Accesorios gaming","Retro gaming"] },
  { id:17, name:"Comestibles y Bebidas",         icon:"🍷", color:"#DC2626", sub:["Vinos y cervezas","Alimentos artesanales","Delicatessen","Especias","Dulces y conservas","Sin TACC"] },
  { id:18, name:"Juegos y Juguetes",             icon:"🧸", color:"#FB923C", sub:["Juguetes bebés","Muñecos y figuras","Juegos de mesa","Juguetes educativos","Juguetes exterior","Coleccionables"] },
  { id:19, name:"Música, Cine, Libros",          icon:"📚", color:"#0284C7", sub:["Libros","Revistas","CDs y vinilos","DVDs y Blu-ray","Películas digitales","Partituras"] },
  { id:20, name:"Arte, Artesanía, Antigüedades", icon:"🎨", color:"#B45309", sub:["Pinturas y cuadros","Esculturas","Artesanías","Antigüedades","Coleccionismo","Fotografía artística"] },
  { id:21, name:"Artículos para Bebés",          icon:"🍼", color:"#38BDF8", sub:["Ropa bebé","Carricoches","Cunas y moisés","Juguetes bebés","Alimentación","Seguridad bebé"] },
  { id:22, name:"Cámaras y Fotografía",          icon:"📷", color:"#1D4ED8", sub:["Cámaras DSLR","Cámaras compactas","Lentes","Trípodes","Drones","Accesorios fotografía"] },
  { id:23, name:"Camping",                       icon:"⛺", color:"#15803D", sub:["Carpas","Bolsas de dormir","Mochilas","Cocina camping","Iluminación outdoor","Ropa outdoor"] },
  { id:24, name:"Joyas y Relojes",               icon:"💍", color:"#CA8A04", sub:["Anillos","Collares","Pulseras","Relojes hombre","Relojes mujer","Metales preciosos"] },
  { id:25, name:"Fiestas y Eventos",             icon:"🎉", color:"#DB2777", sub:["Decoración fiestas","Cotillón","Disfraces","Vajilla descartable","Sonido e iluminación","Mesas y sillas"] },
  { id:26, name:"Anuncios de Compra",            icon:"🛒", color:"#0891B2", sub:["Busco vehículo","Busco inmueble","Busco electrónica","Busco ropa","Busco muebles","Busco otros"] },
];

// ── ADMIN SECURITY ───────────────────────────────────────────────
const ADMIN_CFG = {
  user: "admin", pass: "Admin2026!",
  hotkey: "KeyA", ctrl: true, shift: true, alt: false,
  maxAttempts: 3, lockMins: 15, sessionMins: 60,
};

// ── HELPERS ──────────────────────────────────────────────────────
const compressAndUpload = (file, path, onProg) => new Promise((res, rej) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = (h * MAX) / w; w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        const sRef = ref(storage, path);
        const task = uploadBytesResumable(sRef, blob, { contentType: "image/jpeg" });
        task.on("state_changed",
          s => onProg && onProg(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          rej,
          async () => res(await getDownloadURL(task.snapshot.ref))
        );
      }, "image/jpeg", 0.8);
    };
  };
});

const timeAgo = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff/60)}min`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
};

// ── UI ATOMS ─────────────────────────────────────────────────────
const Btn = ({ children, onClick, color=P, outline=false, size="md", disabled=false, full=false, type="button" }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    padding: size==="sm"?"6px 14px":size==="lg"?"14px 32px":"10px 22px",
    borderRadius: 8, fontSize: size==="sm"?12:size==="lg"?16:14,
    fontWeight: 700, fontFamily: "inherit", cursor: disabled?"not-allowed":"pointer",
    border: `1.5px solid ${color}`, background: outline?"transparent":color,
    color: outline?color:"#fff", opacity: disabled?.5:1,
    width: full?"100%":"auto", transition: "all .15s",
  }}>{children}</button>
);

const Inp = ({ label, value, onChange, type="text", placeholder="", hint="", required=false }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#4B5563", marginBottom:5 }}>
      {label}{required&&<span style={{ color:"#EF4444" }}> *</span>}
    </label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} required={required}
      style={{ width:"100%", padding:"9px 13px", borderRadius:8, border:"1.5px solid #E5E7EB",
        fontSize:14, fontFamily:"inherit", outline:"none", color:"#111827",
        background:"#FFFFFF", boxSizing:"border-box" }}
      onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
    />
    {hint && <div style={{ fontSize:11, color:"#9CA3AF", marginTop:3 }}>{hint}</div>}
  </div>
);

const Txta = ({ label, value, onChange, rows=4, placeholder="" }) => (
  <div style={{ marginBottom:16 }}>
    {label && <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#4B5563", marginBottom:5 }}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 13px", borderRadius:8, border:"1.5px solid #E5E7EB",
        fontSize:14, fontFamily:"inherit", outline:"none", color:"#111827",
        background:"#FFFFFF", boxSizing:"border-box", resize:"vertical" }}
      onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
    />
  </div>
);

const Sel = ({ label, value, onChange, options, required=false }) => (
  <div style={{ marginBottom:16 }}>
    {label && <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#4B5563", marginBottom:5 }}>
      {label}{required&&<span style={{ color:"#EF4444" }}> *</span>}
    </label>}
    <select value={value} onChange={e=>onChange(e.target.value)} required={required}
      style={{ width:"100%", padding:"9px 13px", borderRadius:8, border:"1.5px solid #E5E7EB",
        fontSize:14, fontFamily:"inherit", outline:"none", color:"#111827", background:"#fff", boxSizing:"border-box" }}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:SF, borderRadius:14, border:`1px solid ${BR}`, padding:24, ...style }}>{children}</div>
);

const Alert = ({ type="info", children }) => {
  const colors = { info:{bg:"#EFF6FF",color:IN,border:"#BFDBFE"}, success:{bg:"#F0FDF4",color:OK,border:"#BBF7D0"}, error:{bg:"#FEF2F2",color:ER,border:"#FECACA"}, warning:{bg:"#FFFBEB",color:WA,border:"#FDE68A"} };
  const s = colors[type];
  return <div style={{ padding:"10px 14px", borderRadius:8, background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontSize:13, marginBottom:14 }}>{children}</div>;
};

const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
    <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${BR}`, borderTopColor:P, animation:"spin 0.8s linear infinite" }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const AdBadge = ({ type }) => {
  const s = { DIAMANTE:{bg:"#EFF6FF",color:"#1D4ED8",border:"#60A5FA",e:"💠"}, ESMERALDA:{bg:"#F0FDF4",color:"#16A34A",border:"#4ADE80",e:"💚"}, CUARZO:{bg:"#F9FAFB",color:"#6B7280",border:"#D1D5DB",e:"🪨"} };
  const d = s[type]||s.CUARZO;
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, padding:"2px 8px", borderRadius:20, background:d.bg, color:d.color, border:`1px solid ${d.border}` }}>{d.e} {type}</span>;
};

const StarRating = ({ value, onChange, readonly=false }) => (
  <div style={{ display:"flex", gap:4 }}>
    {[1,2,3,4,5].map(s=>(
      <span key={s} onClick={()=>!readonly&&onChange&&onChange(s)}
        style={{ fontSize:20, cursor:readonly?"default":"pointer", color:s<=value?"#F5A623":"#D1D5DB" }}>★</span>
    ))}
  </div>
);

// ── AUTH MODAL ───────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    if (!email||!pass) return setError("Completá todos los campos");
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onSuccess();
    } catch(e) {
      setError("Email o contraseña incorrectos");
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email||!pass||!nombre) return setError("Completá todos los campos obligatorios");
    if (pass.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: nombre });
      await sendEmailVerification(cred.user);
      await addDoc(collection(db, "usuarios"), {
        uid: cred.user.uid, nombre, email, telefono: tel, whatsapp: tel,
        rol: "usuario", verificado: false, plan: "cuarzo", puntos: 0,
        rating: 0, totalCalificaciones: 0, anunciosActivos: 0, createdAt: serverTimestamp(),
      });
      onSuccess();
    } catch(e) {
      setError(e.code==="auth/email-already-in-use"?"Este email ya está registrado":"Error al registrarse. Intentá de nuevo.");
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) return setError("Ingresá tu email");
    try { await sendPasswordResetEmail(auth, email); setResetSent(true); } catch { setError("Email no encontrado"); }
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:SF,borderRadius:20,padding:32,width:"100%",maxWidth:400,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:36,marginBottom:8 }}>🚗</div>
          <h2 style={{ fontFamily:"'Georgia',serif",fontSize:20,margin:"0 0 4px",color:AC }}>Clasificados Chapa "J"</h2>
          <p style={{ color:TL,fontSize:13,margin:0 }}>Los clasificados con patente sanjuanina</p>
        </div>

        {!resetSent ? (
          <>
            <div style={{ display:"flex",gap:4,marginBottom:20,background:BG,borderRadius:10,padding:4 }}>
              {["login","register"].map(t=>(
                <button key={t} onClick={()=>{setTab(t);setError("");}} style={{
                  flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",
                  fontFamily:"inherit",fontSize:13,fontWeight:700,
                  background:tab===t?SF:"transparent", color:tab===t?AC:TL,
                  boxShadow:tab===t?"0 1px 4px rgba(0,0,0,.1)":"none",
                }}>{t==="login"?"Ingresar":"Registrarme"}</button>
              ))}
            </div>
            {tab==="register" && (
              <div style={{ background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#1E40AF" }}>
                📧 Al registrarte te enviaremos un email para verificar tu cuenta. El badge <strong>✅ Verificado</strong> aparece una vez que confirmés tu email.
              </div>
            )}

            {error && <Alert type="error">{error}</Alert>}

            {tab==="register" && <Inp label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Ej: Juan Pérez" required />}
            <Inp label="Email" value={email} onChange={setEmail} type="email" placeholder="tu@email.com" required />
            <Inp label="Contraseña" value={pass} onChange={setPass} type="password" placeholder="••••••••" required />
            {tab==="register" && <Inp label="Teléfono / WhatsApp" value={tel} onChange={setTel} placeholder="Ej: 2645000000" hint="Sin 0 ni 15, solo 10 dígitos"/>}

            <Btn full color={AC} onClick={tab==="login"?handleLogin:handleRegister} disabled={loading}>
              {loading?"Cargando...":(tab==="login"?"Ingresar":"Crear cuenta gratis")}
            </Btn>

            {tab==="login" && (
              <div style={{ textAlign:"center",marginTop:12 }}>
                <button onClick={()=>setTab("reset")} style={{ background:"none",border:"none",color:P,cursor:"pointer",fontSize:13,fontWeight:600 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </>
        ) : (
          <Alert type="success">✅ Te enviamos un email para restablecer tu contraseña.</Alert>
        )}

        {tab==="reset" && !resetSent && (
          <>
            <Alert type="info">Ingresá tu email y te enviamos un link para restablecer la contraseña.</Alert>
            <Inp label="Email" value={email} onChange={setEmail} type="email" placeholder="tu@email.com"/>
            <Btn full onClick={handleReset}>Enviar link</Btn>
          </>
        )}

        <button onClick={onClose} style={{ position:"absolute",top:14,right:16,background:"none",border:"none",cursor:"pointer",fontSize:20,color:TL }}>✕</button>
      </div>
    </div>
  );
}

// ── PUBLICAR ANUNCIO ─────────────────────────────────────────────
function PublicarModal({ user, userData, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [estado, setEstado] = useState("usado");
  const [localidad, setLocalidad] = useState("Capital");
  const [contactoWA, setContactoWA] = useState(userData?.whatsapp||"");
  const [mostrarWA, setMostrarWA] = useState(true);
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const fileRef = useRef();
  const iaRef = useRef(false);

  const catActual = (window.__CATS__||DEFAULT_CATS).find(c=>c.name===categoria);

  const handleFotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 20 - fotos.length);
    setFotos(prev=>[...prev,...files]);
    files.forEach(f=>{
      const r = new FileReader();
      r.onload = ev => setPreviews(prev=>[...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  const removeFoto = (i) => {
    setFotos(prev=>prev.filter((_,j)=>j!==i));
    setPreviews(prev=>prev.filter((_,j)=>j!==i));
  };

  // IA asistente de publicación
  const handleIA = async () => {
    if (!titulo) return setError("Escribí algo en el título primero");
    setAiLoading(true); setError("");
    try {
      const allCats = (window.__CATS__||DEFAULT_CATS);
      const catsConSubs = allCats.map(c=>`"${c.name}" (subcategorías: ${c.sub.join(", ")})`).join("\n");
      const res = await fetch("https://claude-ia.paulo-andres-alvarez-1976.workers.dev", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 800,
          messages:[{ role:"user", content:`Sos un asistente para el portal de clasificados "Clasificados Chapa J" de San Juan, Argentina.
El usuario quiere publicar este anuncio: "${titulo}"

Categorías disponibles con sus subcategorías:
${catsConSubs}

Respondé ÚNICAMENTE con un objeto JSON válido, sin backticks, sin texto extra, sin comentarios:
{"titulo":"título corto y atractivo máx 70 caracteres","descripcion":"descripción de 3 oraciones en español argentino informal, mencionando características clave","categoria":"nombre exacto de una categoría de la lista","subcategoria":"nombre exacto de una subcategoría correspondiente","estado":"nuevo o usado","moneda":"ARS o USD","precio":"solo el número sin puntos ni comas ni símbolo, o la palabra Consultar"}` }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(c=>c.text||"").join("").trim();
      const clean = raw.replace(/```json|```/g,"").trim();
      const json = JSON.parse(clean);

      if (json.titulo)       setTitulo(json.titulo);
      if (json.descripcion)  setDesc(json.descripcion);
      if (json.estado)       setEstado(json.estado==="nuevo"?"nuevo":"usado");
      if (json.moneda)       setMoneda(json.moneda==="USD"?"USD":"ARS");

      // Categoría — verificar que exista en la lista
      const catMatch = allCats.find(c=>c.name.toLowerCase()===json.categoria?.toLowerCase());
      if (catMatch) {
        iaRef.current = true;
        setCategoria(catMatch.name);
        // Subcategoría — verificar que exista dentro de esa categoría
        if (json.subcategoria) {
          const subQ = json.subcategoria.toLowerCase().replace(/[^a-záéíóúñ0-9]/gi," ").trim();
          const subMatch =
            catMatch.sub.find(s=>s.toLowerCase()===json.subcategoria.toLowerCase()) ||
            catMatch.sub.find(s=>s.toLowerCase().includes(subQ)) ||
            catMatch.sub.find(s=>subQ.split(" ").some(w=>w.length>3 && s.toLowerCase().includes(w)));
          if (subMatch) setSubcategoria(subMatch);
        }
        setTimeout(()=>{ iaRef.current = false; }, 100);
      }

      // Precio
      if (json.precio && json.precio!=="Consultar") {
        const numPrecio = String(json.precio).replace(/[^0-9]/g,"");
        if (numPrecio) setPrecio(numPrecio);
      }

      setAiSuccess(true);
      setTimeout(()=>setAiSuccess(false), 4000);

    } catch(e) {
      setError("Error al usar IA. Completá el formulario manualmente.");
    } finally { setAiLoading(false); }
  };

  const handlePublicar = async () => {
    if (!titulo||!categoria||!localidad) return setError("Completá los campos obligatorios");
    // Validar palabras prohibidas y spam
    try {
      const modSnap = await getDoc(doc(db,"config","moderation"));
      if(modSnap.exists() && modSnap.data().autoFilter!==false){
        const textoCompleto = `${titulo} ${desc}`.toLowerCase();
        const palabras = (modSnap.data().words||"").split(",").map(w=>w.trim().toLowerCase()).filter(Boolean);
        const frases = (modSnap.data().spam||"").split(",").map(w=>w.trim().toLowerCase()).filter(Boolean);
        const bloqueado = [...palabras,...frases].find(w=>w && textoCompleto.includes(w));
        if(bloqueado) return setError(`Tu anuncio contiene contenido no permitido: "${bloqueado}"`);
      }
    } catch(e){}
    setUploading(true); setError("");
    try {
      const urls = [];
      for (let i=0; i<fotos.length; i++) {
        const url = await compressAndUpload(
          fotos[i],
          `anuncios/${user.uid}/${Date.now()}_${i}.jpg`,
          p => setProgress(Math.round((i/fotos.length)*100 + p/fotos.length))
        );
        urls.push(url);
      }
      const venc = new Date(); venc.setDate(venc.getDate() + 30);
      await addDoc(collection(db, "anuncios"), {
        titulo, descripcion: desc, precio: precio||"Consultar", moneda,
        categoria, subcategoria, estado, localidad,
        fotos: urls, fotoPortada: urls[0]||"",
        contactoWA: mostrarWA?contactoWA:"", mostrarWA,
        uid: user.uid, nombreVendedor: userData?.nombre||user.displayName||"",
        vendedorVerificado: user.emailVerified || false,
        plan: "cuarzo", status: "activo",
        vistas:0, consultas:0, favoritos:0, reportes:0,
        vencimientoAt: venc,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      onSuccess();
    } catch(e) {
      setError("Error al publicar. Intentá de nuevo.");
    } finally { setUploading(false); }
  };

  const LOCALIDADES = ["Capital","Rawson","Rivadavia","Santa Lucía","Pocito","Chimbas","Godoy","Caucete","25 de Mayo","Sarmiento","Angaco","Albardón","Calingasta","Iglesia","Jáchal","San Martín","Ullum","Valle Fértil","Zonda"];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto" }}>
      <div style={{ background:SF,borderRadius:20,padding:32,width:"100%",maxWidth:560,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)",maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Georgia',serif",fontSize:20,color:AC,margin:0 }}>📋 Publicar anuncio</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:TL }}>✕</button>
        </div>

        {/* Steps */}
        <div style={{ display:"flex",gap:8,marginBottom:24 }}>
          {["Datos","Fotos","Contacto"].map((s,i)=>(
            <div key={s} style={{ flex:1,textAlign:"center" }}>
              <div style={{ width:28,height:28,borderRadius:"50%",margin:"0 auto 4px",
                background:step>i+1?OK:step===i+1?P:BR,
                color:step>=i+1?"#fff":TL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700 }}>
                {step>i+1?"✓":i+1}
              </div>
              <div style={{ fontSize:11,color:step===i+1?P:TL,fontWeight:step===i+1?700:400 }}>{s}</div>
            </div>
          ))}
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Step 1 - Datos */}
        {step===1 && (
          <>
            {/* Bloque IA — solo Esmeralda y Diamante */}
            {(userData?.plan==="esmeralda"||userData?.plan==="diamante") ? (
              <div style={{ background:aiSuccess?`${OK}11`:`${P}11`,border:`1px solid ${aiSuccess?OK+"44":P+"33"}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,transition:"all .3s" }}>
                <span style={{ fontSize:20 }}>{aiSuccess?"✅":"🤖"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:aiSuccess?OK:P }}>{aiSuccess?"¡IA completó el formulario!":"Asistente IA"}</div>
                  <div style={{ fontSize:12,color:TM }}>{aiSuccess?"Revisá los campos y ajustá lo que necesites":"Escribí qué vendés y la IA completa título, descripción, categoría, precio y más"}</div>
                </div>
                <Btn size="sm" color={aiSuccess?OK:P} onClick={handleIA} disabled={aiLoading}>{aiLoading?"Generando...":aiSuccess?"Regenerar":"Usar IA"}</Btn>
              </div>
            ) : (
              <div style={{ background:"#F9FAFB",border:"1.5px solid #E5E7EB",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:20 }}>🔒</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:TM }}>Asistente IA</div>
                  <div style={{ fontSize:12,color:TL }}>Disponible en plan <strong style={{ color:"#16A34A" }}>Esmeralda</strong> o <strong style={{ color:"#7C3AED" }}>Diamante</strong></div>
                </div>
                <span style={{ fontSize:11,fontWeight:700,background:"#F3F4F6",color:TL,padding:"4px 10px",borderRadius:20,border:"1px solid #E5E7EB" }}>🪨 Plan Cuarzo</span>
              </div>
            )}

            <Inp label="Título del anuncio" value={titulo} onChange={setTitulo} placeholder="Ej: Vendo heladera Gafa con freezer" required />
            <Txta label="Descripción" value={desc} onChange={setDesc} placeholder="Describí el artículo con detalles..." rows={4}/>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Inp label="Precio" value={precio} onChange={setPrecio} placeholder="Consultar = vacío" type="number"/>
              <Sel label="Moneda" value={moneda} onChange={setMoneda} options={[{value:"ARS",label:"Pesos ($)"},{value:"USD",label:"Dólares (U$S)"}]}/>
            </div>

            <Sel label="Categoría" value={categoria} onChange={v=>{ setCategoria(v); if(!iaRef.current) setSubcategoria(""); }} required
              options={[{value:"",label:"Seleccioná una categoría"},...(window.__CATS__||DEFAULT_CATS).map(c=>({value:c.name,label:`${c.icon} ${c.name}`}))]}/>

            {catActual && <Sel label="Subcategoría" value={subcategoria} onChange={setSubcategoria}
              options={[{value:"",label:"(opcional)"},...catActual.sub.map(s=>({value:s,label:s}))]}/>}

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Sel label="Estado" value={estado} onChange={setEstado} options={[{value:"usado",label:"Usado"},{value:"nuevo",label:"Nuevo"}]}/>
              <Sel label="Localidad" value={localidad} onChange={setLocalidad} options={LOCALIDADES.map(l=>({value:l,label:l}))}/>
            </div>

            <div style={{ display:"flex",justifyContent:"flex-end" }}>
              <Btn onClick={()=>{if(!titulo||!categoria)return setError("Completá título y categoría");setError("");setStep(2);}}>Siguiente →</Btn>
            </div>
          </>
        )}

        {/* Step 2 - Fotos */}
        {step===2 && (
          <>
            <div style={{ border:`2px dashed ${BR}`,borderRadius:12,padding:24,textAlign:"center",marginBottom:16,cursor:"pointer" }}
              onClick={()=>fileRef.current.click()}>
              <div style={{ fontSize:36,marginBottom:8 }}>📷</div>
              <div style={{ fontWeight:600,color:TM }}>Subir fotos</div>
              <div style={{ fontSize:12,color:TL }}>Hasta 20 fotos · Se comprimen automáticamente</div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFotos} style={{ display:"none" }}/>
            </div>

            {previews.length>0 && (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16 }}>
                {previews.map((p,i)=>(
                  <div key={i} style={{ position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden" }}>
                    <img src={p} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                    <button onClick={()=>removeFoto(i)} style={{
                      position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",border:"none",
                      color:"#fff",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12
                    }}>✕</button>
                    {i===0 && <div style={{ position:"absolute",bottom:4,left:4,background:P,color:"#fff",fontSize:10,padding:"2px 6px",borderRadius:4 }}>Portada</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <Btn outline color={TM} onClick={()=>setStep(1)}>← Anterior</Btn>
              <Btn onClick={()=>setStep(3)}>Siguiente →</Btn>
            </div>
          </>
        )}

        {/* Step 3 - Contacto */}
        {step===3 && (
          <>
            <div style={{ background:BG,borderRadius:10,padding:16,marginBottom:16 }}>
              <div style={{ fontWeight:700,marginBottom:12,color:AC }}>📞 Datos de contacto</div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:500 }}>Mostrar WhatsApp en el anuncio</div>
                  <div style={{ fontSize:12,color:TL }}>Los compradores te van a contactar directo</div>
                </div>
                <div onClick={()=>setMostrarWA(v=>!v)} style={{
                  width:42,height:22,borderRadius:11,cursor:"pointer",
                  background:mostrarWA?P:BR,position:"relative",transition:"background .2s"
                }}>
                  <div style={{ position:"absolute",top:2,left:mostrarWA?22:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s" }}/>
                </div>
              </div>
              {mostrarWA && <Inp label="Número de WhatsApp" value={contactoWA} onChange={setContactoWA} placeholder="Ej: 2645000000" hint="10 dígitos sin 0 ni 15"/>}
            </div>

            <div style={{ background:"#FFF8E1",border:"1px solid #F5A623",borderRadius:10,padding:12,marginBottom:16,fontSize:12,color:"#92400E" }}>
              ⚠️ <strong>Revisá bien tu anuncio antes de publicar.</strong> Una vez publicado podés editarlo desde "Mis Anuncios".
            </div>

            {uploading && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13,color:TM,marginBottom:6 }}>Subiendo fotos... {progress}%</div>
                <div style={{ height:6,borderRadius:3,background:BR }}>
                  <div style={{ height:6,borderRadius:3,width:`${progress}%`,background:P,transition:"width .3s" }}/>
                </div>
              </div>
            )}

            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <Btn outline color={TM} onClick={()=>setStep(2)}>← Anterior</Btn>
              <Btn color={OK} onClick={handlePublicar} disabled={uploading}>
                {uploading?"Publicando...":"✅ Publicar gratis"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── AD DETAIL ────────────────────────────────────────────────────
// ── MENSAJERÍA PRIVADA ───────────────────────────────────────────
function MensajesModal({ user, onClose }) {
  const [convs, setConvs] = useState([]);
  const [selConv, setSelConv] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editTexto, setEditTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // Cargar conversaciones del usuario
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "conversaciones"),
      where("participantes", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setConvs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Cargar mensajes de la conversación seleccionada
  useEffect(() => {
    if (!selConv) return;
    const q = query(
      collection(db, "conversaciones", selConv.id, "mensajes"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Marcar como leídos
      snap.docs.forEach(d => {
        if (d.data().receptorUid === user.uid && !d.data().leido) {
          updateDoc(doc(db, "conversaciones", selConv.id, "mensajes", d.id), { leido: true });
        }
      });
      // Reset unread en la conversación
      updateDoc(doc(db, "conversaciones", selConv.id), {
        [`unread_${user.uid}`]: 0
      }).catch(() => {});
    });
    return () => unsub();
  }, [selConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!texto.trim() || !selConv) return;
    const otroUid = selConv.participantes.find(p => p !== user.uid);
    await addDoc(collection(db, "conversaciones", selConv.id, "mensajes"), {
      emisorUid: user.uid,
      emisorNombre: user.displayName || "Usuario",
      receptorUid: otroUid,
      texto: texto.trim(),
      leido: false,
      editado: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "conversaciones", selConv.id), {
      updatedAt: serverTimestamp(),
      ultimoMsg: texto.trim(),
      [`unread_${otroUid}`]: increment(1),
    });
    setTexto("");
  };

  const editarMensaje = async (msgId) => {
    if (!editTexto.trim()) return;
    await updateDoc(doc(db, "conversaciones", selConv.id, "mensajes", msgId), {
      texto: editTexto.trim(),
      editado: true,
    });
    setEditandoId(null);
    setEditTexto("");
  };

  const eliminarMensaje = async (msg) => {
    // Solo el receptor puede eliminar lo que recibió
    if (msg.receptorUid !== user.uid) return;
    await deleteDoc(doc(db, "conversaciones", selConv.id, "mensajes", msg.id));
  };

  const otroNombre = (conv) => {
    if (!conv) return "";
    const otroUid = conv.participantes.find(p => p !== user.uid);
    return conv.nombres?.[otroUid] || "Usuario";
  };

  const unreadConv = (conv) => conv[`unread_${user.uid}`] || 0;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:SF,borderRadius:20,width:"100%",maxWidth:820,height:"85vh",
        display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,.3)",overflow:"hidden" }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:AC,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {selConv && (
              <button onClick={()=>{ setSelConv(null); setMensajes([]); }} style={{ background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:20,padding:"0 8px 0 0" }}>←</button>
            )}
            <span style={{ color:"#fff",fontWeight:800,fontSize:16 }}>
              {selConv ? `✉️ ${otroNombre(selConv)}` : "✉️ Mensajes"}
            </span>
          </div>
          <button onClick={onClose} style={{ background:"none",border:`1px solid rgba(255,255,255,.3)`,color:"rgba(255,255,255,.7)",padding:"4px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>✕ Cerrar</button>
        </div>

        {!selConv ? (
          /* Lista de conversaciones */
          <div style={{ flex:1,overflowY:"auto",padding:16 }}>
            {loading && <Spinner/>}
            {!loading && convs.length===0 && (
              <div style={{ textAlign:"center",padding:60,color:TL }}>
                <div style={{ fontSize:48,marginBottom:12 }}>✉️</div>
                <div style={{ fontWeight:700,fontSize:16,marginBottom:6 }}>No tenés mensajes</div>
                <div style={{ fontSize:13 }}>Cuando contactes a un vendedor o te contacten, aparecerá acá.</div>
              </div>
            )}
            {convs.map(conv => {
              const unread = unreadConv(conv);
              return (
                <div key={conv.id} onClick={()=>setSelConv(conv)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,
                    cursor:"pointer",border:`1.5px solid ${unread>0?P:BR}`,marginBottom:8,
                    background:unread>0?"#FFF7F5":SF,transition:"all .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=P}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=unread>0?P:BR}>
                  <div style={{ width:44,height:44,borderRadius:"50%",background:AC,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18,flexShrink:0 }}>
                    {otroNombre(conv)[0]?.toUpperCase()||"?"}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,color:TX,fontSize:14 }}>{otroNombre(conv)}</div>
                    <div style={{ fontSize:12,color:TL,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{conv.ultimoMsg||"..."}</div>
                    {conv.anuncioTitulo && <div style={{ fontSize:11,color:P,marginTop:2 }}>📦 {conv.anuncioTitulo}</div>}
                  </div>
                  {unread>0 && (
                    <span style={{ background:"#EF4444",color:"#fff",borderRadius:"50%",minWidth:22,height:22,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {unread>9?"9+":unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Chat */
          <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0 }}>
            {/* Mensajes */}
            <div style={{ flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:8 }}>
              {mensajes.length===0 && (
                <div style={{ textAlign:"center",color:TL,fontSize:13,margin:"auto" }}>
                  Todavía no hay mensajes. ¡Mandá el primero!
                </div>
              )}
              {mensajes.map(msg => {
                const esMio = msg.emisorUid === user.uid;
                return (
                  <div key={msg.id} style={{ display:"flex",flexDirection:"column",alignItems:esMio?"flex-end":"flex-start" }}>
                    {editandoId===msg.id ? (
                      <div style={{ display:"flex",gap:6,maxWidth:"72%",width:"100%" }}>
                        <input value={editTexto} onChange={e=>setEditTexto(e.target.value)}
                          onKeyDown={e=>{ if(e.key==="Enter") editarMensaje(msg.id); if(e.key==="Escape"){setEditandoId(null);} }}
                          style={{ flex:1,padding:"8px 12px",borderRadius:10,border:`2px solid ${P}`,fontSize:13,fontFamily:"inherit",outline:"none" }}
                          autoFocus/>
                        <button onClick={()=>editarMensaje(msg.id)} style={{ padding:"6px 12px",background:OK,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>✓</button>
                        <button onClick={()=>setEditandoId(null)} style={{ padding:"6px 10px",background:BG,color:TM,border:`1px solid ${BR}`,borderRadius:8,cursor:"pointer",fontSize:12 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ maxWidth:"72%",background:esMio?AC:BG,color:esMio?"#fff":TX,
                        padding:"10px 14px",borderRadius:esMio?"16px 16px 4px 16px":"16px 16px 16px 4px",
                        fontSize:14,lineHeight:1.5,position:"relative" }}>
                        {msg.texto}
                        {msg.editado && <span style={{ fontSize:10,opacity:.6,marginLeft:6 }}>(editado)</span>}
                        <div style={{ fontSize:10,opacity:.6,marginTop:4,textAlign:esMio?"right":"left" }}>
                          {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}) : ""}
                          {esMio && <span style={{ marginLeft:4 }}>{msg.leido?"✓✓":"✓"}</span>}
                        </div>
                      </div>
                    )}
                    {/* Acciones */}
                    <div style={{ display:"flex",gap:4,marginTop:2 }}>
                      {esMio && editandoId!==msg.id && (
                        <button onClick={()=>{ setEditandoId(msg.id); setEditTexto(msg.texto); }}
                          style={{ fontSize:10,color:TL,background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4 }}>
                          ✏️ Editar
                        </button>
                      )}
                      {!esMio && (
                        <button onClick={()=>eliminarMensaje(msg)}
                          style={{ fontSize:10,color:"#EF4444",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4 }}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"12px 16px",borderTop:`1px solid ${BR}`,display:"flex",gap:8,flexShrink:0 }}>
              <input value={texto} onChange={e=>setTexto(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviarMensaje();} }}
                placeholder="Escribí un mensaje... (Enter para enviar)"
                style={{ flex:1,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${BR}`,
                  fontSize:14,fontFamily:"inherit",outline:"none" }}
                onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BR}
              />
              <button onClick={enviarMensaje} disabled={!texto.trim()}
                style={{ padding:"10px 20px",background:texto.trim()?AC:"#ccc",color:"#fff",border:"none",
                  borderRadius:10,cursor:texto.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:14,transition:"background .2s" }}>
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnuncioDetalle({ anuncio, onClose, user }) {
  const [fotoIdx, setFotoIdx] = useState(0);
  const [consulta, setConsulta] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [calificado, setCalificado] = useState(false);

  // Pantalla completa — push history para que "atrás" lo cierre
  useEffect(()=>{
    window.history.pushState({ anuncioDetalle: true }, "");
    const handlePop = () => onClose();
    window.addEventListener("popstate", handlePop);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", handlePop);
      document.body.style.overflow = "";
    };
  },[]);

  useEffect(()=>{ updateDoc(doc(db,"anuncios",anuncio.id),{vistas:increment(1)}); },[]);

  const handleConsulta = async () => {
    if (!user) return;
    // Buscar conversación existente entre estos dos usuarios sobre este anuncio
    const convId = [user.uid, anuncio.uid].sort().join("_") + "_" + anuncio.id;
    const convRef = doc(db, "conversaciones", convId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      await setDoc(convRef, {
        participantes: [user.uid, anuncio.uid],
        nombres: {
          [user.uid]: user.displayName || "Usuario",
          [anuncio.uid]: anuncio.nombreVendedor || "Vendedor",
        },
        anuncioId: anuncio.id,
        anuncioTitulo: anuncio.titulo,
        ultimoMsg: "Conversación iniciada",
        updatedAt: serverTimestamp(),
        [`unread_${anuncio.uid}`]: 1,
        [`unread_${user.uid}`]: 0,
      });
    }
    // Agregar mensaje de inicio
    await addDoc(collection(db, "conversaciones", convId, "mensajes"), {
      emisorUid: user.uid,
      emisorNombre: user.displayName || "Usuario",
      receptorUid: anuncio.uid,
      texto: `Hola, me interesa tu anuncio: "${anuncio.titulo}"`,
      leido: false,
      editado: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(convRef, {
      ultimoMsg: `Hola, me interesa tu anuncio: "${anuncio.titulo}"`,
      updatedAt: serverTimestamp(),
      [`unread_${anuncio.uid}`]: increment(1),
    });
    setEnviado(true);
  };

  const handleWA = () => {
    const num = `549${anuncio.contactoWA}`;
    const msg = encodeURIComponent(`Hola! Vi tu anuncio "${anuncio.titulo}" en Clasificados Chapa J y me interesa. ¿Está disponible?`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  const handleCalificar = async () => {
    if (!user||!rating) return;
    await addDoc(collection(db,"calificaciones"),{
      anuncioId:anuncio.id, vendedorUid:anuncio.uid,
      compradorUid:user.uid, puntos:rating, comentario, createdAt:serverTimestamp()
    });
    setCalificado(true);
  };

  const fotos = anuncio.fotos||[];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:BG,overflowY:"auto",fontFamily:"Nunito,sans-serif" }}>

      {/* Barra superior */}
      <div style={{ position:"sticky",top:0,zIndex:10,background:SF,borderBottom:`1px solid ${BR}`,
        padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <button onClick={onClose}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,
            border:`1.5px solid ${BR}`,background:"transparent",cursor:"pointer",fontFamily:"inherit",
            fontSize:13,fontWeight:700,color:TM }}>
          ← Volver
        </button>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:14,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{anuncio.titulo}</div>
          <div style={{ fontSize:12,color:TL }}>{anuncio.categoria}{anuncio.subcategoria?` · ${anuncio.subcategoria}`:""}{anuncio.localidad?` · ${anuncio.localidad}`:""}</div>
        </div>
        <div onClick={e=>e.stopPropagation()}>
          <FavBtn adId={anuncio.id}/>
        </div>
        <button onClick={onClose}
          style={{ width:34,height:34,borderRadius:"50%",background:BG,border:`1.5px solid ${BR}`,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
            fontSize:16,color:TL,flexShrink:0,transition:"all .2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=ER;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=ER;}}
          onMouseLeave={e=>{e.currentTarget.style.background=BG;e.currentTarget.style.color=TL;e.currentTarget.style.borderColor=BR;}}>
          ✕
        </button>
      </div>

      <div style={{ maxWidth:860,margin:"0 auto",padding:"24px 20px 60px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr",gap:20 }}>

          {/* Fotos */}
          <div style={{ background:SF,borderRadius:16,overflow:"hidden",border:`1px solid ${BR}` }}>
            <div style={{ position:"relative",background:BG,height:360 }}>
          {fotos.length>0 ? (
            <>
              <img src={fotos[fotoIdx]} style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
              {fotos.length>1 && (
                <>
                  <button onClick={()=>setFotoIdx(i=>(i-1+fotos.length)%fotos.length)}
                    style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:18 }}>‹</button>
                  <button onClick={()=>setFotoIdx(i=>(i+1)%fotos.length)}
                    style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:18 }}>›</button>
                  <div style={{ position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6 }}>
                    {fotos.map((_,i)=><div key={i} onClick={()=>setFotoIdx(i)} style={{ width:8,height:8,borderRadius:"50%",background:i===fotoIdx?"#fff":"rgba(255,255,255,.5)",cursor:"pointer" }}/>)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:64 }}>🖼️</div>
          )}
          {anuncio.plan&&anuncio.plan!=="cuarzo" && <div style={{ position:"absolute",top:12,left:12 }}><AdBadge type={anuncio.plan.toUpperCase()}/></div>}
            </div>{/* end foto relative */}

            {/* Miniaturas */}
            {fotos.length>1 && (
              <div style={{ display:"flex",gap:6,padding:"10px 12px",overflowX:"auto" }}>
                {fotos.map((f,i)=>(
                  <img key={i} src={f} onClick={()=>setFotoIdx(i)}
                    style={{ width:56,height:56,objectFit:"cover",borderRadius:8,cursor:"pointer",
                      border:`2px solid ${i===fotoIdx?P:BR}`,flexShrink:0 }}/>
                ))}
              </div>
            )}
          </div>{/* end foto card */}
          <div style={{ background:SF,borderRadius:16,padding:24,border:`1px solid ${BR}` }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:16,marginBottom:20 }}>
            <div>
              <div style={{ fontSize:12,color:P,fontWeight:600,marginBottom:4 }}>
                {anuncio.categoria} {anuncio.subcategoria?`· ${anuncio.subcategoria}`:""} · {anuncio.localidad}
              </div>
              <h2 style={{ fontSize:22,fontWeight:800,color:AC,margin:"0 0 8px" }}>{anuncio.titulo}</h2>
              <div style={{ fontSize:26,fontWeight:900,color:TX }}>
                {anuncio.precio==="Consultar"?"Consultar precio":`${anuncio.moneda==="USD"?"U$S":"$"} ${Number(anuncio.precio).toLocaleString("es-AR")}`}
              </div>
            </div>
            <div style={{ textAlign:"right",fontSize:12,color:TL }}>
              <div>👁️ {anuncio.vistas||0} vistas</div>
              <div>❤️ {anuncio.favoritos||0} favoritos</div>
              <div style={{ marginTop:4 }}>{anuncio.estado==="nuevo"?"🆕 Nuevo":"♻️ Usado"}</div>
            </div>
          </div>

          {anuncio.descripcion && (
            <div style={{ marginBottom:20,padding:"14px",background:BG,borderRadius:10,fontSize:14,color:TM,lineHeight:1.7 }}>
              {anuncio.descripcion}
            </div>
          )}

          {/* Vendedor */}
          <div style={{ background:BG,borderRadius:10,padding:14,marginBottom:20,display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:"50%",background:AC,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0 }}>
              {(anuncio.nombreVendedor||"?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <span style={{ fontWeight:700,color:TX }}>{anuncio.nombreVendedor||"Vendedor"}</span>
                {anuncio.vendedorVerificado && (
                  <span title="Usuario verificado" style={{ fontSize:13,background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE",borderRadius:20,padding:"1px 7px",fontSize:11,fontWeight:700 }}>✅ Verificado</span>
                )}
              </div>
              <div style={{ fontSize:12,color:TL }}>Publicado {timeAgo(anuncio.createdAt)}</div>
            </div>
          </div>

          {/* Contacto */}
          <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
            {anuncio.mostrarWA && anuncio.contactoWA && (
              <button onClick={handleWA} style={{
                flex:1,padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
                background:"#25D366",color:"#fff",fontWeight:700,fontSize:14,fontFamily:"inherit"
              }}>💬 Contactar por WhatsApp</button>
            )}
            {user && user.uid !== anuncio.uid ? (
              enviado ? (
                <Alert type="success">✅ Mensaje enviado. Revisá tu bandeja de mensajes.</Alert>
              ) : (
                <button onClick={handleConsulta}
                  style={{ flex:1,padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
                    background:IN,color:"#fff",fontWeight:700,fontSize:14,fontFamily:"inherit" }}>
                  ✉️ Enviar mensaje privado
                </button>
              )
            ) : !user ? (
              <div style={{ flex:1,padding:"12px",borderRadius:10,border:`1px solid ${BR}`,textAlign:"center",fontSize:13,color:TL }}>
                Iniciá sesión para enviar un mensaje
              </div>
            ) : null}
          </div>

          {/* Calificar */}
          {user && user.uid!==anuncio.uid && !calificado && (
            <div style={{ borderTop:`1px solid ${BR}`,paddingTop:16 }}>
              <div style={{ fontWeight:700,marginBottom:10,color:AC }}>⭐ Calificar al vendedor</div>
              <StarRating value={rating} onChange={setRating}/>
              {rating>0 && <>
                <Txta label="" value={comentario} onChange={setComentario} rows={2} placeholder="Comentario opcional..."/>
                <Btn size="sm" onClick={handleCalificar}>Enviar calificación</Btn>
              </>}
            </div>
          )}
          {calificado && <Alert type="success">✅ ¡Gracias por tu calificación!</Alert>}
          </div>{/* end content card */}
        </div>{/* end grid */}
      </div>{/* end maxWidth container */}
    </div>
  );
}

// ── NAVBAR ───────────────────────────────────────────────────────
function Navbar({ user, onLogin, onPublicar, onMiCuenta, onMensajes, onLogout, unreadMsgs=0, searchQuery, setSearchQuery, onNavClick, onSearch, siteInfo={} }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{ const h=()=>setScrolled(window.scrollY>10); window.addEventListener("scroll",h); return()=>window.removeEventListener("scroll",h); },[]);

  return (
    <nav style={{ position:"sticky",top:0,zIndex:100,background:scrolled?"rgba(255,255,255,.97)":SF,
      borderBottom:`1px solid ${BR}`,backdropFilter:"blur(12px)",
      boxShadow:scrolled?"0 2px 20px rgba(0,0,0,.08)":"none",transition:"box-shadow .3s" }}>
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",gap:14,height:64 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${P},${PD})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:`0 4px 12px ${P}44`,overflow:"hidden" }}>
            {siteInfo.logo && siteInfo.logo.startsWith("http")
              ? <img src={siteInfo.logo} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
              : <span>{siteInfo.logo||"🚗"}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily:"'Georgia',serif",fontWeight:700,fontSize:16,color:AC,lineHeight:1.1 }}>{(siteInfo.name||"Clasificados Chapa J").split(" ").slice(0,-1).join(" ")||"Clasificados"}</div>
            <div style={{ fontFamily:"'Georgia',serif",fontWeight:900,fontSize:14,color:P,lineHeight:1.1 }}>{(siteInfo.name||"Clasificados Chapa J").split(" ").slice(-2).join(" ")||'Chapa "J"'}</div>
          </div>
        </div>

        <div style={{ flex:1,maxWidth:480,display:"flex" }}>
          <div style={{ position:"relative",flex:1 }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,color:TL }}>🔍</span>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder='Buscar en Clasificados Chapa "J"...'
              style={{ width:"100%",height:42,padding:"0 12px 0 38px",borderRadius:"10px 0 0 10px",
                border:`1.5px solid ${BR}`,borderRight:"none",outline:"none",fontSize:14,color:TX,background:BG,fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor=P} onBlur={e=>e.target.style.borderColor=BR}
              onKeyDown={e=>{ if(e.key==="Enter"){ e.target.blur(); onSearch&&onSearch(); } }}
            />
            {searchQuery && (
              <button onClick={()=>setSearchQuery("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:TL,lineHeight:1 }}>✕</button>
            )}
          </div>
          <button onClick={()=>{ onSearch&&onSearch(); }} style={{ height:42,padding:"0 18px",background:P,color:"#fff",border:"none",
            borderRadius:"0 10px 10px 0",cursor:"pointer",fontWeight:600,fontSize:14,fontFamily:"inherit" }}>Buscar</button>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto" }}>
          {user ? (
            <>
              <button onClick={onMensajes} title="Mensajes" style={{ position:"relative",width:38,height:38,borderRadius:8,border:`1.5px solid ${BR}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>
                ✉️
                {unreadMsgs>0 && (
                  <span style={{ position:"absolute",top:-4,right:-4,background:"#EF4444",color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>
                    {unreadMsgs>9?"9+":unreadMsgs}
                  </span>
                )}
              </button>
              <button onClick={onMiCuenta} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 14px",
                borderRadius:8,border:`1.5px solid ${BR}`,background:"transparent",cursor:"pointer",fontFamily:"inherit" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:AC,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700 }}>
                  {(user.displayName||user.email||"U")[0].toUpperCase()}
                </div>
                <span style={{ fontSize:13,fontWeight:600,color:TX }}>{user.displayName?.split(" ")[0]||"Mi cuenta"}</span>
              </button>
              <button onClick={onLogout} title="Cerrar sesión" style={{ padding:"7px 14px",borderRadius:8,border:`1.5px solid ${ER}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:700,color:ER,fontFamily:"inherit",transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.background="#FEF2F2";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                Salir
              </button>
            </>
          ) : (
            <button onClick={onLogin} style={{ padding:"8px 14px",borderRadius:8,border:`1.5px solid ${BR}`,
              background:"transparent",color:TX,cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>
              Mi Cuenta
            </button>
          )}
          <button onClick={user?onPublicar:onLogin} style={{ padding:"8px 18px",borderRadius:8,
            background:`linear-gradient(135deg,${P},${PD})`,color:"#fff",border:"none",
            cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:`0 4px 12px ${P}44` }}>
            + Publicar GRATIS
          </button>
        </div>
      </div>

      <div style={{ borderTop:`1px solid ${BR}`,overflowX:"auto",scrollbarWidth:"none" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center" }}>
          {["Vehículos","Inmuebles","Servicios","Artículos","Tiendas Virtuales","Últimos Publicados"].map(item=>{
            const isTiendas = item === "Tiendas Virtuales";
            return (
              <button key={item} onClick={()=>onNavClick&&onNavClick(item)}
                style={{
                  padding: isTiendas ? "5px 14px" : "9px 16px",
                  border: isTiendas ? "none" : "none",
                  background: "transparent",
                  color: isTiendas ? "transparent" : TM,
                  fontWeight: isTiendas ? 700 : 500,
                  fontSize:13, cursor:"pointer", whiteSpace:"nowrap",
                  fontFamily:"inherit", borderBottom:"2px solid transparent",
                  transition:"all .2s", position:"relative",
                  margin: isTiendas ? "0 4px" : 0,
                }}
                onMouseEnter={e=>{
                  if(!isTiendas){e.currentTarget.style.color=P;e.currentTarget.style.borderBottomColor=P;}
                  else{e.currentTarget.querySelector("span").style.transform="scale(1.04)";}
                }}
                onMouseLeave={e=>{
                  if(!isTiendas){e.currentTarget.style.color=TM;e.currentTarget.style.borderBottomColor="transparent";}
                  else{e.currentTarget.querySelector("span").style.transform="scale(1)";}
                }}
              >
                {isTiendas ? (
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:5,
                    background:`linear-gradient(135deg,${P},#9333EA)`,
                    color:"#fff", padding:"4px 12px", borderRadius:20,
                    fontSize:12, fontWeight:800, letterSpacing:0.3,
                    boxShadow:`0 3px 10px ${P}55`,
                    transition:"transform .2s",
                  }}>
                    🏪 Tiendas Virtuales
                  </span>
                ) : item}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ── MI CUENTA ────────────────────────────────────────────────────
// ── PLAN TAB ─────────────────────────────────────────────────────
// ── MI TIENDA TAB ────────────────────────────────────────────────
function MiTiendaTab({ user, userData, tiendaId }) {
  const [tienda, setTienda]       = useState(null);
  const [anuncios, setAnuncios]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [subTab, setSubTab]       = useState("dashboard"); // dashboard | productos | editar
  const [editForm, setEditForm]   = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedEdit, setSavedEdit]   = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [nuevoAnuncio, setNuevoAnuncio]   = useState(false);
  const [aiLoading, setAiLoading]         = useState(null);
  const [aiResult, setAiResult]           = useState(null);
  const [aiLoadingEdit, setAiLoadingEdit] = useState(false);
  const [aiEditOk, setAiEditOk]           = useState(false);

  const handleIAEditarTienda = async () => {
    if (!editForm?.nombre) return;
    setAiLoadingEdit(true); setAiEditOk(false);
    try {
      const res = await fetch("https://claude-ia.paulo-andres-alvarez-1976.workers.dev", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-5", max_tokens:600,
          messages:[{ role:"user", content:`Sos un asistente para el portal "Clasificados Chapa J" de San Juan, Argentina.
El comercio se llama: "${editForm.nombre}"${editForm.categoria?`\nRubro: "${editForm.categoria}"`:""}
${editForm.descripcion?`Descripción actual: "${editForm.descripcion}"`:""}

Mejorá o generá una descripción atractiva para la tarjeta de tienda virtual.
Respondé ÚNICAMENTE con JSON válido sin backticks:
{"descripcion":"descripción de 2-3 oraciones atractivas en español argentino informal","categoria":"categoría corta del rubro si no hay una"}` }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(c=>c.text||"").join("").trim();
      const json = JSON.parse(raw.replace(/```json|```/g,"").trim());
      if (json.descripcion) setEditForm(p=>({...p, descripcion:json.descripcion}));
      if (json.categoria && !editForm.categoria) setEditForm(p=>({...p, categoria:json.categoria}));
      setAiEditOk(true); setTimeout(()=>setAiEditOk(false), 3000);
    } catch(e){ console.error(e); }
    setAiLoadingEdit(false);
  };

  useEffect(()=>{
    Promise.all([
      getDoc(doc(db,"tiendas",tiendaId)),
      getDocs(query(collection(db,"anuncios"),where("uid","==",user.uid),orderBy("createdAt","desc")))
    ]).then(([tSnap, aSnap])=>{
      if(tSnap.exists()) { setTienda({id:tSnap.id,...tSnap.data()}); setEditForm({id:tSnap.id,...tSnap.data()}); }
      setAnuncios(aSnap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[tiendaId]);

  const handleSaveEditar = async () => {
    setSavingEdit(true);
    try {
      await updateDoc(doc(db,"tiendas",tiendaId), { ...editForm, updatedAt: serverTimestamp() });
      setTienda(editForm);
      setSavedEdit(true); setTimeout(()=>setSavedEdit(false),2000);
    } catch(e){ console.error(e); }
    setSavingEdit(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploadingLogo(true);
    const sRef = ref(storage,`tiendas/logo_${tiendaId}_${Date.now()}`);
    const task = uploadBytesResumable(sRef,file,{contentType:file.type});
    task.on("state_changed",null,()=>setUploadingLogo(false),async()=>{
      const url = await getDownloadURL(task.snapshot.ref);
      setEditForm(p=>({...p,logo:url}));
      setUploadingLogo(false);
    });
  };

  const handleToggleAnuncio = async (id, status) => {
    const newStatus = status==="activo"?"suspendido":"activo";
    await updateDoc(doc(db,"anuncios",id),{status:newStatus});
    setAnuncios(prev=>prev.map(a=>a.id===id?{...a,status:newStatus}:a));
  };

  const handleDeleteAnuncio = async (id) => {
    if(!window.confirm("¿Eliminar este producto?")) return;
    await deleteDoc(doc(db,"anuncios",id));
    setAnuncios(prev=>prev.filter(a=>a.id!==id));
  };

  const handleToggleBadge = async (id, badge) => {
    const anuncio = anuncios.find(a=>a.id===id);
    const current = anuncio?.[badge]||false;
    await updateDoc(doc(db,"anuncios",id),{[badge]:!current});
    setAnuncios(prev=>prev.map(a=>a.id===id?{...a,[badge]:!current}:a));
  };

  const handleMejorarIA = async (anuncio) => {
    setAiLoading(anuncio.id); setAiResult(null);
    try {
      const res = await fetch("https://claude-ia.paulo-andres-alvarez-1976.workers.dev", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-5",
          max_tokens:800,
          messages:[{
            role:"user",
            content:`Sos un experto en marketing para comercios argentinos. Mejorá este anuncio del portal "Clasificados Chapa J" de San Juan, Argentina.

Título actual: ${anuncio.titulo}
Descripción actual: ${anuncio.descripcion||"Sin descripción"}
Categoría: ${anuncio.categoria}
Precio: ${anuncio.precio} ${anuncio.moneda||"ARS"}
Estado: ${anuncio.estado||"usado"}

Respondé ÚNICAMENTE con JSON válido sin backticks ni texto extra:
{"titulo":"título mejorado atractivo máx 70 chars","descripcion":"descripción mejorada de 3 oraciones llamativas en español argentino informal","tip":"un consejo corto y concreto para vender más rápido"}`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.map(c=>c.text||"").join("").trim();
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setAiResult({id:anuncio.id, ...parsed});
    } catch(e){ setAiResult({id:anuncio.id, error:true}); }
    setAiLoading(null);
  };

  const handleAplicarIA = async (anuncioId) => {
    if(!aiResult) return;
    await updateDoc(doc(db,"anuncios",anuncioId),{ titulo:aiResult.titulo, descripcion:aiResult.descripcion });
    setAnuncios(prev=>prev.map(a=>a.id===anuncioId?{...a,titulo:aiResult.titulo,descripcion:aiResult.descripcion}:a));
    setAiResult(null);
  };

  if(loading) return <div style={{ textAlign:"center",padding:40 }}><Spinner/></div>;
  if(!tienda) return <div style={{ textAlign:"center",padding:40,color:TL }}>No se encontró la tienda.</div>;

  const planColor = tienda.plan==="diamante"?"#7C3AED":"#16A34A";
  const activos   = anuncios.filter(a=>a.status==="activo").length;
  const vistas    = anuncios.reduce((s,a)=>s+(a.vistas||0),0);
  const contactos = anuncios.reduce((s,a)=>s+(a.consultas||0),0);

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[["dashboard","📊 Dashboard"],["productos","📦 Mis Productos"],["editar","✏️ Editar Tienda"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSubTab(k)} style={{
            padding:"8px 16px", borderRadius:20, border:`1.5px solid ${subTab===k?planColor:BR}`,
            background:subTab===k?planColor:"transparent", color:subTab===k?"#fff":TM,
            fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all .15s"
          }}>{l}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {subTab==="dashboard" && (
        <div>
          {/* Header tienda */}
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:`linear-gradient(135deg,${planColor}15,${planColor}05)`, border:`1.5px solid ${planColor}30`, borderRadius:16, marginBottom:20 }}>
            <div style={{ width:60,height:60,borderRadius:14,overflow:"hidden",background:`${planColor}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {tienda.logo?<img src={tienda.logo} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:28 }}>🏪</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:18, color:TX }}>{tienda.nombre}</div>
              <div style={{ fontSize:12, color:TL }}>{tienda.categoria}</div>
              <div style={{ display:"inline-block", background:planColor, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, marginTop:4 }}>
                {tienda.plan==="diamante"?"💠 DIAMANTE":"💚 ESMERALDA"}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:tienda.activa?OK:ER, fontWeight:700 }}>{tienda.activa?"🟢 Activa":"🔴 Pausada"}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            {[
              { icon:"📦", label:"Productos activos", value:activos, color:OK },
              { icon:"👁️", label:"Visitas totales",   value:vistas,    color:"#3B82F6" },
              { icon:"💬", label:"Consultas recibidas",value:contactos, color:P },
            ].map(s=>(
              <div key={s.label} style={{ background:BG, borderRadius:12, padding:"16px", textAlign:"center", border:`1px solid ${BR}` }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontWeight:800, fontSize:22, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:TL }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Últimos productos */}
          <div style={{ fontWeight:700, fontSize:14, color:TX, marginBottom:12 }}>Últimos productos</div>
          {anuncios.slice(0,3).map(a=>(
            <div key={a.id} style={{ display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${BR}`,alignItems:"center" }}>
              <div style={{ width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:BG }}>
                {a.fotoPortada?<img src={a.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:20 }}>🖼️</span>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:13,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.titulo}</div>
                <div style={{ fontSize:11,color:TL }}>{a.categoria}</div>
              </div>
              <div style={{ fontSize:13,fontWeight:700,color:AC }}>{a.precio==="Consultar"?"Consultar":`$${Number(a.precio||0).toLocaleString("es-AR")}`}</div>
            </div>
          ))}
          {anuncios.length>3 && <button onClick={()=>setSubTab("productos")} style={{ marginTop:10,background:"none",border:"none",color:P,fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Ver todos ({anuncios.length}) →</button>}
        </div>
      )}

      {/* ── MIS PRODUCTOS ── */}
      {subTab==="productos" && (
        <div>
          {anuncios.length===0 ? (
            <div style={{ textAlign:"center",padding:40,color:TL }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
              <div style={{ marginBottom:16 }}>No tenés productos todavía</div>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {anuncios.map(a=>(
                <div key={a.id} style={{ border:`1.5px solid ${BR}`,borderRadius:14,padding:"14px",background:SF }}>
                  <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                    <div style={{ width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:BG }}>
                      {a.fotoPortada?<img src={a.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",height:"100%" }}>🖼️</span>}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:14,color:TX,marginBottom:2 }}>{a.titulo}</div>
                      <div style={{ fontSize:12,color:TL,marginBottom:6 }}>{a.categoria} · {a.localidad}</div>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
                        <span style={{ padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:a.status==="activo"?OK+"22":ER+"22",color:a.status==="activo"?OK:ER }}>{a.status}</span>
                        {a.esNovedad && <span style={{ padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:"#FFF3CD",color:"#856404" }}>🔥 Novedad</span>}
                        {a.esOferta  && <span style={{ padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:"#D1FAE5",color:"#065F46" }}>💥 Oferta</span>}
                      </div>
                      {/* Acciones */}
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                        <button onClick={()=>handleToggleAnuncio(a.id,a.status)} style={{ padding:"5px 10px",borderRadius:8,border:`1px solid ${a.status==="activo"?WA:OK}`,color:a.status==="activo"?WA:OK,background:"transparent",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>
                          {a.status==="activo"?"⏸ Pausar":"▶ Activar"}
                        </button>
                        <button onClick={()=>handleToggleBadge(a.id,"esNovedad")} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid #F59E0B",color:"#B45309",background:a.esNovedad?"#FEF3C7":"transparent",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>
                          🔥 Novedad
                        </button>
                        <button onClick={()=>handleToggleBadge(a.id,"esOferta")} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid #10B981",color:"#065F46",background:a.esOferta?"#D1FAE5":"transparent",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>
                          💥 Oferta
                        </button>
                        {(tienda.plan==="esmeralda"||tienda.plan==="diamante") ? (
                          <button onClick={()=>handleMejorarIA(a)} disabled={aiLoading===a.id} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid #8B5CF6",color:"#6D28D9",background:"transparent",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>
                            {aiLoading===a.id?"⏳ Mejorando...":"✨ Mejorar con IA"}
                          </button>
                        ) : (
                          <span title="Disponible en plan Esmeralda o Diamante" style={{ padding:"5px 10px",borderRadius:8,border:"1px solid #E5E7EB",color:TL,background:"#F9FAFB",fontSize:11,cursor:"not-allowed",userSelect:"none" }}>
                            🔒 IA (Esm/Dia)
                          </span>
                        )}
                        <button onClick={()=>handleDeleteAnuncio(a.id)} style={{ padding:"5px 10px",borderRadius:8,border:`1px solid ${ER}`,color:ER,background:"transparent",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>
                          🗑️
                        </button>
                      </div>

                      {/* Resultado IA */}
                      {aiResult?.id===a.id && !aiResult.error && (
                        <div style={{ marginTop:12,padding:"12px 14px",borderRadius:10,background:"#F5F3FF",border:"1.5px solid #8B5CF6" }}>
                          <div style={{ fontWeight:700,fontSize:12,color:"#6D28D9",marginBottom:8 }}>✨ Sugerencia de Claude IA</div>
                          <div style={{ fontSize:12,color:TX,marginBottom:4 }}><strong>Título:</strong> {aiResult.titulo}</div>
                          <div style={{ fontSize:12,color:TX,marginBottom:4 }}><strong>Descripción:</strong> {aiResult.descripcion}</div>
                          {aiResult.tip && <div style={{ fontSize:12,color:"#6D28D9",marginBottom:8 }}>💡 {aiResult.tip}</div>}
                          <div style={{ display:"flex",gap:8 }}>
                            <button onClick={()=>handleAplicarIA(a.id)} style={{ padding:"6px 14px",borderRadius:8,border:"none",background:"#8B5CF6",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                              ✅ Aplicar
                            </button>
                            <button onClick={()=>setAiResult(null)} style={{ padding:"6px 14px",borderRadius:8,border:"1px solid #8B5CF6",background:"transparent",color:"#6D28D9",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                              Descartar
                            </button>
                          </div>
                        </div>
                      )}
                      {aiResult?.id===a.id && aiResult.error && (
                        <div style={{ marginTop:8,fontSize:12,color:ER }}>No se pudo conectar con la IA. Intentá de nuevo.</div>
                      )}
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontWeight:800,fontSize:14,color:AC }}>{a.precio==="Consultar"?"Consultar":`$${Number(a.precio||0).toLocaleString("es-AR")}`}</div>
                      <div style={{ fontSize:11,color:TL,marginTop:2 }}>{a.vistas||0} vistas</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EDITAR TIENDA ── */}
      {subTab==="editar" && editForm && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {/* Info básica */}
              <div style={{ background:BG,borderRadius:12,padding:"16px",border:`1px solid ${BR}` }}>
                <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:12 }}>📋 Información básica</div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>Nombre</div>
                  <input value={editForm.nombre||""} onChange={e=>setEditForm(p=>({...p,nombre:e.target.value}))}
                    style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:13,boxSizing:"border-box" }}/>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <span>Descripción</span>
                    {(tienda.plan==="esmeralda"||tienda.plan==="diamante") ? (
                      <button onClick={handleIAEditarTienda} disabled={aiLoadingEdit}
                        style={{ padding:"3px 10px",borderRadius:6,border:`1px solid ${aiEditOk?"#16A34A":P}`,
                          background:aiEditOk?"#16A34A":P,color:"#fff",fontWeight:700,fontSize:11,
                          cursor:"pointer",fontFamily:"inherit",opacity:aiLoadingEdit?.7:1 }}>
                        {aiLoadingEdit?"⏳ Generando...":aiEditOk?"✅ Listo":"🤖 Generar con IA"}
                      </button>
                    ) : (
                      <span title="Disponible en plan Esmeralda o Diamante"
                        style={{ padding:"3px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:"#F9FAFB",color:TL,fontSize:11,cursor:"not-allowed",userSelect:"none" }}>
                        🔒 IA (Esm/Dia)
                      </span>
                    )}
                  </div>
                  <textarea value={editForm.descripcion||""} onChange={e=>setEditForm(p=>({...p,descripcion:e.target.value}))} rows={3}
                    style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${aiEditOk?"#86EFAC":BR}`,fontFamily:"inherit",fontSize:13,resize:"vertical",boxSizing:"border-box",transition:"border-color .3s" }}/>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>Categoría</div>
                  <input value={editForm.categoria||""} onChange={e=>setEditForm(p=>({...p,categoria:e.target.value}))}
                    style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:13,boxSizing:"border-box" }}/>
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>WhatsApp de contacto</div>
                  <input value={editForm.whatsapp||""} onChange={e=>setEditForm(p=>({...p,whatsapp:e.target.value}))} placeholder="2645XXXXXX"
                    style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:13,boxSizing:"border-box" }}/>
                </div>
              </div>

              {/* Ubicación y horario */}
              <div style={{ background:BG,borderRadius:12,padding:"16px",border:`1px solid ${BR}` }}>
                <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:12 }}>📍 Ubicación y horario</div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>Dirección</div>
                  <input value={editForm.direccion||""} onChange={e=>setEditForm(p=>({...p,direccion:e.target.value}))}
                    style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:13,boxSizing:"border-box" }}/>
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>Horario</div>
                  <HorarioEditor value={editForm.horarioData||editForm.horario||[]} onChange={v=>setEditForm(p=>({...p,horarioData:v,horario:horarioDataToString(v)}))}/>
                </div>
              </div>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {/* Logo */}
              <div style={{ background:BG,borderRadius:12,padding:"16px",border:`1px solid ${BR}` }}>
                <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:12 }}>🖼️ Logo</div>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                  <div style={{ width:60,height:60,borderRadius:12,overflow:"hidden",background:`${planColor}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {editForm.logo?<img src={editForm.logo} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:26 }}>🏪</span>}
                  </div>
                  <label style={{ flex:1,padding:"8px 12px",borderRadius:8,border:`1.5px dashed ${BR}`,background:SF,cursor:"pointer",fontSize:12,color:TL,textAlign:"center" }}>
                    {uploadingLogo?"⏳ Subiendo...":"📷 Cambiar logo"}
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                  </label>
                </div>
              </div>

              {/* Redes sociales */}
              <div style={{ background:BG,borderRadius:12,padding:"16px",border:`1px solid ${BR}` }}>
                <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:12 }}>🔗 Redes sociales</div>
                {[["web","🌐 Sitio web","https://misitioweb.com"],["instagram","📸 Instagram","https://instagram.com/..."],["facebook","📘 Facebook","https://facebook.com/..."],["tiktok","🎵 TikTok","https://tiktok.com/@..."]].map(([k,l,ph])=>(
                  <div key={k} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:TL,marginBottom:4 }}>{l}</div>
                    <input value={editForm[k]||""} onChange={e=>setEditForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                      style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:12,boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>

              {/* Vista previa */}
              <div style={{ background:BG,borderRadius:12,padding:"16px",border:`1px solid ${BR}` }}>
                <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:10 }}>👁️ Vista previa</div>
                <div style={{ background:`${planColor}10`,border:`1.5px solid ${planColor}40`,borderRadius:12,padding:"12px",display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:44,height:44,borderRadius:10,overflow:"hidden",background:`${planColor}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {editForm.logo?<img src={editForm.logo} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:20 }}>🏪</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:TX }}>{editForm.nombre||"Nombre de tu tienda"}</div>
                    <div style={{ fontSize:11,color:TL }}>{editForm.categoria||"Categoría"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSaveEditar} disabled={savingEdit}
            style={{ padding:"12px 28px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${planColor},${planColor}CC)`,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",alignSelf:"flex-start" }}>
            {savingEdit?"Guardando...":savedEdit?"✅ Guardado!":"💾 Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

function PlanTab({ userData, user, onSubView }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null); // null | "mp" | "transferencia"
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [uploadingComp, setUploadingComp] = useState(false);
  const [compEnviado, setCompEnviado] = useState(false);

  useEffect(()=>{
    getDoc(doc(db,"config","site")).then(snap=>{
      if(snap.exists() && snap.data().pricing) setPricing(snap.data().pricing);
    }).catch(()=>{});
  },[]);

  const planActual = userData?.plan || "cuarzo";
  const precioEsmeralda = pricing ? Number(pricing.plataPrice)||5000 : 5000;
  const precioDiamante  = pricing ? Number(pricing.oroPrice)||9000  : 9000;
  const vigEsmeralda    = pricing ? pricing.plataVigencia||"30" : "30";
  const vigDiamante     = pricing ? pricing.oroVigencia||"30"   : "30";
  const mpEnabled       = pricing?.mercadopagoEnabled !== false;
  const transferEnabled = pricing?.transferEnabled === true;
  const transferInfo    = pricing?.transferInstructions || "Consultá el CBU por WhatsApp.";
  const descActivo      = pricing?.descAnunciosActivo === true;
  const descPct         = Number(pricing?.descAnunciosPct||10);
  const precioEsmDesc   = Math.round(precioEsmeralda * (1 - descPct/100));
  const precioDiaDesc   = Math.round(precioDiamante  * (1 - descPct/100));

  const planes = [
    { id:"cuarzo",    icon:"🪨", label:"Cuarzo",    color:"#6B7280", bg:"#F9FAFB", border:"#D1D5DB",
      precio:"Gratis", precioNum:0, precioDesc:null,
      desc:"Para publicar sin costo. Ideal para empezar.",
      features:["Hasta 5 fotos","Listado general","Sin vigencia"],
      noFeatures:["Badge destacado","Prioridad en búsquedas","Asistente IA"] },
    { id:"esmeralda", icon:"💚", label:"Esmeralda", color:"#16A34A", bg:"#F0FDF4", border:"#4ADE80",
      precio:`$${precioEsmeralda.toLocaleString("es-AR")} / mes`, precioNum:precioEsmeralda, precioDesc: descActivo?precioEsmDesc:null,
      desc:"Destacate en verde. Mayor visibilidad en búsquedas.",
      features:["Hasta 10 fotos","Badge verde destacado","Aparecés antes que Cuarzo",`${vigEsmeralda} días de vigencia`,"🤖 Asistente IA incluido"],
      noFeatures:[] },
    { id:"diamante",  icon:"💠", label:"Diamante",  color:"#7C3AED", bg:"#F5F3FF", border:"#8B5CF6",
      precio:`$${precioDiamante.toLocaleString("es-AR")} / mes`, precioNum:precioDiamante, precioDesc: descActivo?precioDiaDesc:null,
      desc:"El plan premium. Primero en todo, máxima exposición.",
      features:["Hasta 20 fotos","Badge violeta premium","Primero en todos los listados",`${vigDiamante} días de vigencia`,"🤖 Asistente IA incluido"],
      noFeatures:[] },
  ];

  const handleContratar = (planId) => {
    setPlanSeleccionado(planId);
    setMetodoPago(mpEnabled && transferEnabled ? null : mpEnabled ? "mp" : transferEnabled ? "transferencia" : null);
    setError(""); setComprobante(null); setCompEnviado(false);
    onSubView&&onSubView(true);
  };

  const handlePagarMP = async () => {
    setError(""); setLoading("mp");
    try {
      const res = await fetch("https://crearpreferencia-ww7mv25tba-uc.a.run.app", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ plan: planSeleccionado, userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if(data.init_point) window.location.href = data.init_point;
      else setError("Error al generar el pago. Intentá de nuevo.");
    } catch { setError("No se pudo conectar con MercadoPago."); }
    finally { setLoading(null); }
  };

  const handleSubirComprobante = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploadingComp(true);
    try {
      const sRef = ref(storage, `comprobantes/${user.uid}_${planSeleccionado}_${Date.now()}`);
      const task = uploadBytesResumable(sRef, file, { contentType: file.type });
      task.on("state_changed", null, ()=>setUploadingComp(false), async()=>{
        const url = await getDownloadURL(task.snapshot.ref);
        setComprobante(url);
        setUploadingComp(false);
      });
    } catch { setUploadingComp(false); }
  };

  const handleEnviarTransferencia = async () => {
    if(!comprobante) return setError("Subí el comprobante antes de enviar.");
    setLoading("transferencia");
    try {
      await addDoc(collection(db,"pagos"), {
        userId: user.uid, email: user.email,
        nombre: userData?.nombre || "",
        plan: planSeleccionado,
        metodo: "transferencia",
        comprobante,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });
      setCompEnviado(true);
    } catch { setError("Error al enviar. Intentá de nuevo."); }
    finally { setLoading(null); }
  };

  // Modal de pago
  if(planSeleccionado && !compEnviado) {
    const plan = planes.find(p=>p.id===planSeleccionado);
    return (
      <div>
        <button onClick={()=>{ setPlanSeleccionado(null); setMetodoPago(null); onSubView&&onSubView(false); }}
          style={{ background:"none", border:`1.5px solid ${BR}`, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, color:TL, fontFamily:"inherit", marginBottom:20 }}>
          ← Volver a los planes
        </button>
        <div style={{ background:plan.bg, border:`2px solid ${plan.color}`, borderRadius:16, padding:"20px", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontSize:24 }}>{plan.icon}</span>
            <span style={{ fontWeight:800, fontSize:18, color:plan.color }}>Plan {plan.label}</span>
          </div>
          <div style={{ fontWeight:800, fontSize:22, color:plan.color }}>{plan.precio}</div>
        </div>
        {error && <Alert type="error">{error}</Alert>}

        {/* Selector método si ambos están activos */}
        {!metodoPago && (mpEnabled && transferEnabled) && (
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:TX, marginBottom:14 }}>¿Cómo querés pagar?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={()=>setMetodoPago("mp")}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderRadius:12, border:`2px solid #009EE3`, background:"#F0F9FF", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                <span style={{ fontSize:28 }}>💳</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#009EE3" }}>MercadoPago</div>
                  <div style={{ fontSize:12, color:TL }}>Tarjeta, débito o efectivo. Se activa automáticamente.</div>
                </div>
              </button>
              <button onClick={()=>setMetodoPago("transferencia")}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderRadius:12, border:`2px solid #16A34A`, background:"#F0FDF4", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                <span style={{ fontSize:28 }}>🏦</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#16A34A" }}>Transferencia bancaria</div>
                  <div style={{ fontSize:12, color:TL }}>Transferí y subí el comprobante. Se activa en 24hs.</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* MercadoPago */}
        {metodoPago === "mp" && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💳</div>
            <div style={{ fontWeight:700, fontSize:16, color:TX, marginBottom:6 }}>Pagar con MercadoPago</div>
            <div style={{ fontSize:13, color:TL, marginBottom:20 }}>Serás redirigido al checkout seguro de MercadoPago</div>
            <Btn color="#009EE3" onClick={handlePagarMP} disabled={loading==="mp"}>
              {loading==="mp" ? "Redirigiendo..." : "💳 Ir a MercadoPago"}
            </Btn>
          </div>
        )}

        {/* Transferencia */}
        {metodoPago === "transferencia" && (
          <div>
            <div style={{ background:"#F0FDF4", border:"1.5px solid #4ADE80", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#15803D", marginBottom:8 }}>🏦 Datos para transferir</div>
              <div style={{ fontSize:13, color:"#166534", whiteSpace:"pre-wrap", lineHeight:1.8 }}>{transferInfo}</div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, color:TX, marginBottom:8 }}>📎 Subir comprobante de pago</div>
              {comprobante ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"#F0FDF4", border:"1.5px solid #4ADE80" }}>
                  <span style={{ fontSize:20 }}>✅</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#15803D" }}>Comprobante subido</div>
                    <a href={comprobante} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#16A34A" }}>Ver imagen</a>
                  </div>
                  <button onClick={()=>setComprobante(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:TL }}>✕</button>
                </div>
              ) : (
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:10, border:`1.5px dashed ${BR}`, background:BG, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>📷</span>
                  <span style={{ fontSize:13, color:TL }}>{uploadingComp ? "Subiendo..." : "Seleccioná la foto del comprobante"}</span>
                  <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={handleSubirComprobante} disabled={uploadingComp}/>
                </label>
              )}
            </div>
            <Btn onClick={handleEnviarTransferencia} disabled={!comprobante || loading==="transferencia"}>
              {loading==="transferencia" ? "Enviando..." : "📨 Enviar comprobante"}
            </Btn>
          </div>
        )}
      </div>
    );
  }

  // Confirmación transferencia enviada
  if(compEnviado) {
    return (
      <div style={{ textAlign:"center", padding:"40px 20px" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
        <div style={{ fontWeight:800, fontSize:18, color:TX, marginBottom:8 }}>¡Comprobante enviado!</div>
        <div style={{ fontSize:14, color:TL, marginBottom:20 }}>Revisaremos tu transferencia y activaremos tu plan en menos de 24 horas.</div>
        <button onClick={()=>{ setPlanSeleccionado(null); setCompEnviado(false); setMetodoPago(null); }}
          style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Volver a mis planes
        </button>
      </div>
    );
  }

  // Lista de planes
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800, fontSize:16, color:AC, marginBottom:4 }}>Tu plan actual</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:20,
          background: planActual==="diamante"?"#F5F3FF":planActual==="esmeralda"?"#F0FDF4":"#F9FAFB",
          border:`1.5px solid ${planActual==="diamante"?"#8B5CF6":planActual==="esmeralda"?"#4ADE80":"#D1D5DB"}`,
          color: planActual==="diamante"?"#7C3AED":planActual==="esmeralda"?"#16A34A":"#6B7280",
          fontWeight:800, fontSize:14 }}>
          {planActual==="diamante"?"💠":planActual==="esmeralda"?"💚":"🪨"} {planActual.toUpperCase()}
        </div>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {planes.map(p=>(
          <div key={p.id} style={{ border:`2px solid ${planActual===p.id?p.color:p.border}`, borderRadius:14, overflow:"hidden",
            background:planActual===p.id?p.bg:SF, boxShadow:planActual===p.id?`0 4px 16px ${p.color}33`:"none" }}>

            {/* Header de la tarjeta */}
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${p.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:p.bg }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{p.icon}</span>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:900, fontSize:17, color:p.color }}>{p.label}</span>
                    {planActual===p.id && <span style={{ fontSize:10, fontWeight:700, background:p.color, color:"#fff", padding:"2px 8px", borderRadius:20 }}>ACTIVO</span>}
                  </div>
                  <div style={{ fontSize:12, color:TM }}>{p.desc}</div>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {p.id!=="cuarzo" && p.precioDesc ? (
                  <>
                    <div style={{ fontSize:11, color:TL, textDecoration:"line-through" }}>{p.precio}</div>
                    <div style={{ fontWeight:900, fontSize:18, color:"#DC2626", lineHeight:1.1 }}>${p.precioDesc.toLocaleString("es-AR")}<span style={{ fontSize:11, fontWeight:600 }}>/mes</span></div>
                    <span style={{ display:"inline-block", background:"#DC2626", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>🏷️ {descPct}% OFF</span>
                  </>
                ) : (
                  <div style={{ fontWeight:900, fontSize:18, color:p.id==="cuarzo"?OK:p.color }}>{p.precio}</div>
                )}
              </div>
            </div>

            {/* Features */}
            <div style={{ padding:"14px 20px", display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {p.features.map(f=>(
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:TX }}>
                    <span style={{ width:18, height:18, borderRadius:"50%", background:"#DCFCE7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0 }}>✓</span>
                    {f}
                  </div>
                ))}
                {p.noFeatures.map(f=>(
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:TL }}>
                    <span style={{ width:18, height:18, borderRadius:"50%", background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0 }}>✕</span>
                    <span style={{ textDecoration:"line-through" }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ flexShrink:0 }}>
                {p.id==="cuarzo" ? (
                  <span style={{ fontSize:12, color:TL, fontStyle:"italic" }}>Plan base</span>
                ) : planActual===p.id ? (
                  <span style={{ fontSize:12, color:OK, fontWeight:700 }}>✅ Activo</span>
                ) : (
                  <Btn size="sm" color={p.precioDesc?"#DC2626":p.color} onClick={()=>handleContratar(p.id)}>Contratar</Btn>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
      <div style={{ marginTop:16, padding:"12px 16px", borderRadius:10, background:"#FFFBEB", border:"1px solid #FDE68A", fontSize:12, color:"#92400E" }}>
        💡 Podés pagar con MercadoPago (automático) o por transferencia bancaria (manual en 24hs).
      </div>
    </div>
  );
}

// ── MI CUENTA ────────────────────────────────────────────────────
function MiCuenta({ user, userData, onClose, onPublicar, initialTab="anuncios" }) {
  const [misAnuncios, setMisAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [renovandoId, setRenovandoId] = useState(null);
  const [showRenovarPago, setShowRenovarPago] = useState(null); // anuncio obj
  const [planEnPago, setPlanEnPago] = useState(false); // true cuando PlanTab muestra sub-flujo de pago

  useEffect(()=>{
    const q = query(collection(db,"anuncios"),where("uid","==",user.uid),orderBy("createdAt","desc"));
    getDocs(q).then(snap=>{ setMisAnuncios(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  },[]);

  const handleSuspender = async (id) => {
    await updateDoc(doc(db,"anuncios",id),{status:"suspendido"});
    setMisAnuncios(prev=>prev.map(a=>a.id===id?{...a,status:"suspendido"}:a));
  };

  const handleActivar = async (id) => {
    await updateDoc(doc(db,"anuncios",id),{status:"activo",updatedAt:serverTimestamp()});
    setMisAnuncios(prev=>prev.map(a=>a.id===id?{...a,status:"activo"}:a));
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este anuncio? Esta acción no se puede deshacer.")) return;
    await deleteDoc(doc(db,"anuncios",id));
    setMisAnuncios(prev=>prev.filter(a=>a.id!==id));
  };

  const handleRenovarGratis = async (id) => {
    setRenovandoId(id);
    try {
      const nuevaFecha = new Date();
      nuevaFecha.setDate(nuevaFecha.getDate() + 30);
      await updateDoc(doc(db,"anuncios",id), {
        vencimientoAt: nuevaFecha,
        status: "activo",
        updatedAt: serverTimestamp(),
      });
      setMisAnuncios(prev => prev.map(a => a.id===id ? {...a, vencimientoAt: nuevaFecha, status:"activo"} : a));
    } catch(e){ console.error(e); }
    finally { setRenovandoId(null); }
  };

  const diasRestantes = (a) => {
    if (!a.vencimientoAt) return null;
    const venc = a.vencimientoAt?.toDate ? a.vencimientoAt.toDate() : new Date(a.vencimientoAt);
    const diff = Math.ceil((venc - Date.now()) / 86400000);
    return diff;
  };

  const handleLogout = async () => { await signOut(auth); onClose(); };

  const [seleccionados, setSeleccionados] = React.useState([]);
  const [filtroEstado, setFiltroEstado] = React.useState("todos");
  const [busquedaLocal, setBusquedaLocal] = React.useState("");
  const [editandoId, setEditandoId] = React.useState(null);
  const [editTitulo, setEditTitulo] = React.useState("");
  const [editPrecio, setEditPrecio] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [showEditFotos, setShowEditFotos] = React.useState(null); // anuncio obj
  const [showDestacar, setShowDestacar] = React.useState(null);   // anuncio obj

  const handleSaveEdit = async (id) => {
    setSavingEdit(true);
    await updateDoc(doc(db,"anuncios",id),{ titulo:editTitulo, precio:editPrecio, updatedAt:serverTimestamp() });
    setMisAnuncios(prev=>prev.map(a=>a.id===id?{...a,titulo:editTitulo,precio:editPrecio}:a));
    setEditandoId(null); setSavingEdit(false);
  };

  const handleAccionLote = async (accion) => {
    if(!seleccionados.length) return;
    if(accion==="borrar" && !window.confirm(`¿Eliminar ${seleccionados.length} anuncio(s)?`)) return;
    await Promise.all(seleccionados.map(id=>{
      if(accion==="borrar") return deleteDoc(doc(db,"anuncios",id));
      return updateDoc(doc(db,"anuncios",id),{ status:accion==="pausar"?"pausado":"activo", updatedAt:serverTimestamp() });
    }));
    if(accion==="borrar") setMisAnuncios(prev=>prev.filter(a=>!seleccionados.includes(a.id)));
    else setMisAnuncios(prev=>prev.map(a=>seleccionados.includes(a.id)?{...a,status:accion==="pausar"?"pausado":"activo"}:a));
    setSeleccionados([]);
  };

  const anunciosFiltrados = misAnuncios.filter(a=>{
    const dias = diasRestantes(a);
    const vencido = dias !== null && dias <= 0;
    if(filtroEstado==="activos" && (a.status!=="activo"||vencido)) return false;
    if(filtroEstado==="pausados" && a.status!=="pausado") return false;
    if(filtroEstado==="vencidos" && !vencido) return false;
    if(busquedaLocal && !a.titulo?.toLowerCase().includes(busquedaLocal.toLowerCase())) return false;
    return true;
  });

  const todosSeleccionados = anunciosFiltrados.length>0 && seleccionados.length===anunciosFiltrados.length;

  return (
    <>
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:SF,borderRadius:20,width:"100%",maxWidth:1200,maxHeight:"96vh",height:"96vh",
        overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)",display:"flex",flexDirection:"column" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`,padding:"24px 28px",borderRadius:"20px 20px 0 0",
          display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:52,height:52,borderRadius:"50%",background:P,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700 }}>
              {(user.displayName||user.email||"U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color:"#fff",fontWeight:800,fontSize:16 }}>{user.displayName||"Usuario"}</div>
              <div style={{ color:"rgba(255,255,255,.5)",fontSize:13 }}>{user.email}</div>
              {userData?.rating>0 && <StarRating value={Math.round(userData.rating)} readonly/>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{onPublicar&&onPublicar();}} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,background:`linear-gradient(135deg,${P},${PD})`,color:"#fff",border:"none",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit",boxShadow:`0 4px 14px ${P}44`}}>
              ✏️ Publicar
            </button>
            <button onClick={()=>{ if(planEnPago){ setPlanEnPago(false); } else { onClose(); } }} style={{ background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:20,padding:"4px 8px" }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:`1px solid ${BR}`,padding:"0 24px",overflowX:"auto",scrollbarWidth:"none" }}>
          {(["anuncios","consultas","alertas","favoritos","perfil","plan",...(userData?.tiendaId?["tienda"]:[])]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"12px 14px",border:"none",background:"transparent",cursor:"pointer",
              fontFamily:"inherit",fontSize:13,fontWeight:700,whiteSpace:"nowrap",
              color:tab===t?P:TM, borderBottom:`2px solid ${tab===t?P:"transparent"}`,
            }}>
              {t==="anuncios"?"📋 Mis Anuncios":t==="consultas"?"💬 Consultas":t==="alertas"?"🔔 Alertas":t==="favoritos"?"❤️ Favoritos":t==="perfil"?"👤 Mi Perfil":t==="plan"?"💎 Mi Plan":"🏪 Mi Tienda"}
            </button>
          ))}
        </div>


        {/* Contenido tabs */}
        <div style={{ padding:24 }}>
      {tab==="anuncios" && (
        loading ? <Spinner/> : (
          <>
            {/* Header acciones */}
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap" }}>
              <button onClick={()=>{ onPublicar&&onPublicar(); }}
                style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
                  background:`linear-gradient(135deg,${P},${PD})`,color:"#fff",border:"none",
                  cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit",
                  boxShadow:`0 4px 14px ${P}44` }}>
                ✏️ Publicar anuncio
              </button>
              <div style={{ flex:1,minWidth:160,position:"relative" }}>
                <input value={busquedaLocal} onChange={e=>setBusquedaLocal(e.target.value)}
                  placeholder="Buscar en mis anuncios..."
                  style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:8,border:`1.5px solid ${BR}`,
                    fontFamily:"inherit",fontSize:12,outline:"none",boxSizing:"border-box" }}/>
                <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:TL }}>🔍</span>
              </div>
              <div style={{ display:"flex",borderRadius:8,border:`1.5px solid ${BR}`,overflow:"hidden",fontSize:12 }}>
                {[["todos","Todos"],["activos","✅ Activos"],["pausados","⏸ Pausados"],["vencidos","⛔ Vencidos"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setFiltroEstado(v)}
                    style={{ padding:"7px 10px",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,whiteSpace:"nowrap",
                      background:filtroEstado===v?AC:"transparent",color:filtroEstado===v?"#fff":TM,transition:"all .15s" }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Acciones en lote */}
            {seleccionados.length>0 && (
              <div style={{ background:`${P}11`,border:`1.5px solid ${P}33`,borderRadius:10,padding:"10px 14px",
                marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                <span style={{ fontSize:13,fontWeight:700,color:P }}>{seleccionados.length} seleccionado{seleccionados.length!==1?"s":""}</span>
                <div style={{ display:"flex",gap:6,marginLeft:"auto" }}>
                  <button onClick={()=>handleAccionLote("activo")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${OK}`,color:OK,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>✅ Activar</button>
                  <button onClick={()=>handleAccionLote("pausar")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${WA}`,color:WA,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>⏸ Pausar</button>
                  <button onClick={()=>handleAccionLote("borrar")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${ER}`,color:ER,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>🗑 Borrar</button>
                  <button onClick={()=>setSeleccionados([])} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${BR}`,color:TL,background:"transparent",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>✕ Limpiar</button>
                </div>
              </div>
            )}

            {/* Cabecera tabla */}
            {anunciosFiltrados.length>0 && (
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 10px",background:BG,borderRadius:8,marginBottom:8,fontSize:11,fontWeight:700,color:TL }}>
                <input type="checkbox" checked={todosSeleccionados}
                  onChange={()=>setSeleccionados(todosSeleccionados?[]:anunciosFiltrados.map(a=>a.id))}
                  style={{ width:15,height:15,accentColor:P,cursor:"pointer",flexShrink:0 }}/>
                <span style={{ flex:1 }}>ANUNCIO</span>
                <span style={{ width:60,textAlign:"center" }}>VISITAS</span>
                <span style={{ width:70,textAlign:"center" }}>ESTADO</span>
                <span style={{ width:120,textAlign:"center" }}>ACCIONES</span>
              </div>
            )}

            {/* Lista anuncios */}
            {anunciosFiltrados.length===0 ? (
              <div style={{ textAlign:"center",padding:"32px 20px",color:TL }}>
                <div style={{ fontSize:44,marginBottom:10 }}>📭</div>
                <div style={{ fontWeight:600 }}>{busquedaLocal?"No encontramos anuncios con esa búsqueda":filtroEstado==="todos"?"No tenés anuncios publicados todavía":`No tenés anuncios ${filtroEstado}`}</div>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {anunciosFiltrados.map(a=>{
                  const dias = diasRestantes(a);
                  const vencido = dias !== null && dias <= 0;
                  const porVencer = dias !== null && dias > 0 && dias <= 5;
                  const esPago = a.plan && a.plan !== "cuarzo";
                  const sel = seleccionados.includes(a.id);
                  const editando = editandoId===a.id;

                  return (
                    <div key={a.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"12px",
                      border:`1.5px solid ${sel?P:vencido?ER+"44":BR}`,borderRadius:12,
                      background:sel?`${P}08`:vencido?"#FFF5F5":SF,transition:"all .2s" }}>

                      {/* Checkbox */}
                      <input type="checkbox" checked={sel}
                        onChange={()=>setSeleccionados(prev=>sel?prev.filter(i=>i!==a.id):[...prev,a.id])}
                        style={{ width:15,height:15,accentColor:P,cursor:"pointer",flexShrink:0 }}/>

                      {/* Foto */}
                      <div style={{ width:56,height:56,borderRadius:8,overflow:"hidden",flexShrink:0,
                        background:BG,display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
                        {a.fotoPortada?<img src={a.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:22 }}>🖼️</span>}
                        {a.plan&&a.plan!=="cuarzo"&&(
                          <div style={{ position:"absolute",bottom:2,right:2,fontSize:9,background:a.plan==="diamante"?"#7C3AED":"#16A34A",color:"#fff",borderRadius:4,padding:"1px 4px",fontWeight:700 }}>
                            {a.plan==="diamante"?"💠":"💚"}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1,minWidth:0 }}>
                        {editando ? (
                          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                            <input value={editTitulo} onChange={e=>setEditTitulo(e.target.value)}
                              style={{ padding:"5px 8px",borderRadius:6,border:`1.5px solid ${P}`,fontFamily:"inherit",fontSize:13,fontWeight:600,outline:"none" }}/>
                            <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                              <span style={{ fontSize:12,color:TL }}>$</span>
                              <input value={editPrecio} onChange={e=>setEditPrecio(e.target.value)}
                                style={{ width:100,padding:"4px 8px",borderRadius:6,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:12,outline:"none" }}
                                placeholder="Precio"/>
                              <button onClick={()=>handleSaveEdit(a.id)} disabled={savingEdit}
                                style={{ padding:"4px 12px",borderRadius:6,background:OK,color:"#fff",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>
                                {savingEdit?"...":"✓ Guardar"}
                              </button>
                              <button onClick={()=>setEditandoId(null)}
                                style={{ padding:"4px 10px",borderRadius:6,background:"transparent",color:TL,border:`1px solid ${BR}`,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>✕</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight:700,fontSize:13,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{a.titulo}</div>
                            <div style={{ fontSize:11,color:TL,marginBottom:3 }}>{a.categoria}{a.localidad?` · ${a.localidad}`:""} · {timeAgo(a.createdAt)}</div>
                            <div style={{ fontSize:13,fontWeight:800,color:a.precio==="Consultar"?TL:AC }}>
                              {a.precio==="Consultar"?"Consultar":`$${Number(a.precio).toLocaleString("es-AR")}`}
                            </div>
                            {dias!==null && (
                              <div style={{ fontSize:10,fontWeight:700,marginTop:3,
                                color:vencido?ER:porVencer?WA:OK }}>
                                {vencido?"⛔ Vencido":porVencer?`⚠️ Vence en ${dias} día${dias===1?"":"s"}`:`✅ Vence en ${dias} días`}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Visitas */}
                      <div style={{ width:60,textAlign:"center",flexShrink:0 }}>
                        <div style={{ fontSize:16,fontWeight:800,color:TX }}>{a.vistas||0}</div>
                        <div style={{ fontSize:10,color:TL }}>visitas</div>
                      </div>

                      {/* Estado badge */}
                      <div style={{ width:70,textAlign:"center",flexShrink:0 }}>
                        <span style={{ display:"inline-block",padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:700,
                          background:vencido?ER+"22":a.status==="activo"?OK+"22":WA+"22",
                          color:vencido?ER:a.status==="activo"?OK:WA }}>
                          {vencido?"vencido":a.status==="activo"?"activo":"pausado"}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div style={{ width:120,display:"flex",flexDirection:"column",gap:4,flexShrink:0 }}>
                        {/* Editar */}
                        {!editando && (
                          <button onClick={()=>{ setEditandoId(a.id); setEditTitulo(a.titulo); setEditPrecio(a.precio||""); }}
                            style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${P}`,color:P,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",textAlign:"center" }}>
                            ✏️ Editar
                          </button>
                        )}
                        {/* Modificar fotos */}
                        <button onClick={()=>setShowEditFotos(a)}
                          style={{ padding:"4px 0",borderRadius:6,border:`1px solid #0EA5E9`,color:"#0EA5E9",background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>
                          📷 Fotos
                        </button>
                        {/* Destacar */}
                        {(!a.plan||a.plan==="cuarzo") && (
                          <button onClick={()=>setShowDestacar(a)}
                            style={{ padding:"4px 0",borderRadius:6,border:"1px solid #F59E0B",color:"#fff",background:"linear-gradient(135deg,#F59E0B,#D97706)",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>
                            ⭐ Destacar
                          </button>
                        )}
                        {/* Pausar / Activar */}
                        {!vencido && (
                          a.status==="activo"
                            ? <button onClick={()=>handleSuspender(a.id)} style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${WA}`,color:WA,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>⏸ Pausar</button>
                            : <button onClick={()=>handleActivar(a.id)} style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${OK}`,color:OK,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>▶ Activar</button>
                        )}
                        {/* Renovar */}
                        {(vencido||porVencer) && (
                          esPago
                            ? <button onClick={()=>setShowRenovarPago(a)} style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${P}`,color:"#fff",background:P,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>🔄 Renovar</button>
                            : <button onClick={()=>handleRenovarGratis(a.id)} disabled={renovandoId===a.id} style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${OK}`,color:"#fff",background:OK,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>{renovandoId===a.id?"...":"🔄 Gratis"}</button>
                        )}
                        {/* Borrar */}
                        <button onClick={()=>handleEliminar(a.id)} style={{ padding:"4px 0",borderRadius:6,border:`1px solid ${ER}`,color:ER,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>🗑 Borrar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}

      {tab==="plan" && <PlanTab userData={userData} user={user} onSubView={setPlanEnPago}/>}
      {tab==="tienda" && userData?.tiendaId && <MiTiendaTab user={user} userData={userData} tiendaId={userData.tiendaId}/>}

      {/* ── CONSULTAS ── */}
      {tab==="consultas" && <ConsultasTab user={user}/>}

      {/* ── ALERTAS ── */}
      {tab==="alertas" && <AlertasTab user={user} anuncios={misAnuncios}/>}

      {/* ── FAVORITOS ── */}
      {tab==="favoritos" && <FavoritosTab user={user}/>}
      {tab==="perfil" && (
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
            {[{icon:"📋",label:"Anuncios publicados",value:misAnuncios.length},{icon:"👁️",label:"Vistas totales",value:misAnuncios.reduce((a,b)=>a+(b.vistas||0),0)},{icon:"⭐",label:"Calificación",value:userData?.rating?`${userData.rating.toFixed(1)}/5`:"Sin calificaciones"},{icon:"🏆",label:"Puntos",value:userData?.puntos||0}].map(s=>(
              <div key={s.label} style={{ background:BG,borderRadius:10,padding:"14px 16px",textAlign:"center" }}>
                <div style={{ fontSize:24,marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontWeight:800,fontSize:20,color:TX }}>{s.value}</div>
                <div style={{ fontSize:12,color:TL }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={handleLogout} style={{ width:"100%",padding:"12px",borderRadius:10,border:`1.5px solid ${ER}`,color:ER,background:"transparent",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit" }}>
            🚪 Cerrar sesión
          </button>
        </div>
      )}
        </div>
      </div>
    </div>

    {/* Modal editar fotos */}
    {showEditFotos && (
      <EditarFotosModal anuncio={showEditFotos} onClose={()=>setShowEditFotos(null)}
        onSuccess={(urls)=>{
          setMisAnuncios(prev=>prev.map(a=>a.id===showEditFotos.id?{...a,fotos:urls,fotoPortada:urls[0]||a.fotoPortada}:a));
          setShowEditFotos(null);
        }}/>
    )}

    {/* Modal destacar */}
    {showDestacar && (
      <DestacarModal anuncio={showDestacar} userData={userData} user={user}
        onClose={()=>setShowDestacar(null)}
        onSuccess={(plan)=>{
          setMisAnuncios(prev=>prev.map(a=>a.id===showDestacar.id?{...a,plan}:a));
          setShowDestacar(null);
        }}/>
    )}
    {showRenovarPago && (
      <RenovarPagoModal
        anuncio={showRenovarPago}
        user={user}
        userData={userData}
        onClose={()=>setShowRenovarPago(null)}
        onSuccess={()=>{
          const nuevaFecha = new Date(); nuevaFecha.setDate(nuevaFecha.getDate()+30);
          setMisAnuncios(prev=>prev.map(a=>a.id===showRenovarPago.id?{...a,vencimientoAt:nuevaFecha,status:"activo"}:a));
          setShowRenovarPago(null);
        }}
      />
    )}
    </>
  );
}

// ── RENOVAR PAGO MODAL ───────────────────────────────────────────
// ── CONSULTAS TAB ────────────────────────────────────────────────
function ConsultasTab({ user }) {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selConv, setSelConv] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const bottomRef = useRef(null);

  useEffect(()=>{
    if(!user) return;
    const q = query(collection(db,"conversaciones"),where("participantes","array-contains",user.uid),orderBy("updatedAt","desc"));
    const timer = setTimeout(()=>setLoading(false), 6000);
    const unsub = onSnapshot(q,snap=>{ clearTimeout(timer); setConvs(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
    return()=>{ unsub(); clearTimeout(timer); };
  },[user]);

  useEffect(()=>{
    if(!selConv) return;
    const q = query(collection(db,"conversaciones",selConv.id,"mensajes"),orderBy("createdAt","asc"));
    const unsub = onSnapshot(q,snap=>{
      setMensajes(snap.docs.map(d=>({id:d.id,...d.data()})));
      snap.docs.forEach(d=>{ if(d.data().receptorUid===user.uid&&!d.data().leido) updateDoc(doc(db,"conversaciones",selConv.id,"mensajes",d.id),{leido:true}); });
      updateDoc(doc(db,"conversaciones",selConv.id),{[`unread_${user.uid}`]:0}).catch(()=>{});
    });
    return()=>unsub();
  },[selConv]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[mensajes]);

  const enviar = async()=>{
    if(!texto.trim()||!selConv) return;
    const otroUid = selConv.participantes.find(p=>p!==user.uid);
    await addDoc(collection(db,"conversaciones",selConv.id,"mensajes"),{
      emisorUid:user.uid, emisorNombre:user.displayName||"Usuario",
      receptorUid:otroUid, texto:texto.trim(), leido:false, createdAt:serverTimestamp()
    });
    await updateDoc(doc(db,"conversaciones",selConv.id),{ updatedAt:serverTimestamp(), ultimoMsg:texto.trim(), [`unread_${otroUid}`]:increment(1) });
    setTexto("");
  };

  if(loading) return <Spinner/>;

  if(selConv) return (
    <div style={{ display:"flex",flexDirection:"column",height:400 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${BR}`,marginBottom:10 }}>
        <button onClick={()=>setSelConv(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,color:TM }}>←</button>
        <div>
          <div style={{ fontWeight:700,fontSize:14,color:TX }}>{selConv.anuncioTitulo||"Conversación"}</div>
          <div style={{ fontSize:12,color:TL }}>{selConv.participantes.find(p=>p!==user.uid)?convs.find(c=>c.id===selConv.id)?.otroNombre||"Usuario":""}</div>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingRight:4 }}>
        {mensajes.map(m=>{
          const mio = m.emisorUid===user.uid;
          return (
            <div key={m.id} style={{ display:"flex",justifyContent:mio?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"75%",padding:"8px 12px",borderRadius:mio?"12px 12px 2px 12px":"12px 12px 12px 2px",
                background:mio?P:BG, color:mio?"#fff":TX, fontSize:13 }}>
                {m.texto}
                <div style={{ fontSize:10,opacity:.6,marginTop:3,textAlign:mio?"right":"left" }}>
                  {m.createdAt?.toDate?.().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})||""}
                  {mio && (m.leido?" ✓✓":" ✓")}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:"flex",gap:8,paddingTop:10,borderTop:`1px solid ${BR}` }}>
        <input value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()}
          placeholder="Escribí tu mensaje..." style={{ flex:1,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${BR}`,fontFamily:"inherit",fontSize:13,outline:"none" }}/>
        <button onClick={enviar} style={{ padding:"9px 16px",borderRadius:10,background:P,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Enviar</button>
      </div>
    </div>
  );

  if(convs.length===0) return (
    <div style={{ textAlign:"center",padding:"40px 20px",color:TL }}>
      <div style={{ fontSize:44,marginBottom:10 }}>💬</div>
      <div style={{ fontWeight:600 }}>No tenés consultas todavía</div>
      <div style={{ fontSize:13,marginTop:6 }}>Cuando alguien te escriba sobre un anuncio, aparecerá acá</div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      {convs.map(c=>{
        const unread = c[`unread_${user.uid}`]||0;
        return (
          <div key={c.id} onClick={()=>setSelConv(c)}
            style={{ display:"flex",alignItems:"center",gap:12,padding:"12px",borderRadius:12,
              border:`1.5px solid ${unread>0?P:BR}`,background:unread>0?`${P}08`:SF,cursor:"pointer" }}>
            <div style={{ width:42,height:42,borderRadius:"50%",background:unread>0?P:BG,color:unread>0?"#fff":TL,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>💬</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:13,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {c.anuncioTitulo||"Consulta"}
              </div>
              <div style={{ fontSize:12,color:TL,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {c.ultimoMsg||"Sin mensajes"}
              </div>
            </div>
            <div style={{ flexShrink:0,textAlign:"right" }}>
              {unread>0 && <span style={{ display:"inline-block",background:P,color:"#fff",borderRadius:"50%",width:20,height:20,fontSize:11,fontWeight:700,lineHeight:"20px",textAlign:"center" }}>{unread}</span>}
              <div style={{ fontSize:11,color:TL,marginTop:2 }}>{c.updatedAt?.toDate?.().toLocaleDateString("es-AR")||""}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ALERTAS TAB ──────────────────────────────────────────────────
function AlertasTab({ user, anuncios }) {
  const alertas = [];

  // Alertas de vencimiento
  anuncios.forEach(a=>{
    if(!a.vencimientoAt) return;
    const venc = a.vencimientoAt?.toDate ? a.vencimientoAt.toDate() : new Date(a.vencimientoAt);
    const dias = Math.ceil((venc - Date.now()) / 86400000);
    if(dias<=0) alertas.push({ id:`venc_${a.id}`, tipo:"error", icono:"⛔", titulo:"Anuncio vencido", msg:`"${a.titulo}" venció. Renovalo para que siga visible.`, accion:"renovar", anuncioId:a.id });
    else if(dias<=5) alertas.push({ id:`porVenc_${a.id}`, tipo:"warning", icono:"⚠️", titulo:`Vence en ${dias} día${dias===1?"":"s"}`, msg:`"${a.titulo}" está próximo a vencer.`, accion:"renovar", anuncioId:a.id });
  });

  // Alertas de plan Cuarzo
  const sinPlan = anuncios.filter(a=>!a.plan||a.plan==="cuarzo");
  if(sinPlan.length>0) alertas.push({ id:"sinPlan", tipo:"info", icono:"💡", titulo:"Destacá tus anuncios", msg:`Tenés ${sinPlan.length} anuncio${sinPlan.length!==1?"s":""} en plan Cuarzo. Destacalos para más visibilidad y acceso a la IA.` });

  // Sin anuncios
  if(anuncios.length===0) alertas.push({ id:"sinAnuncios", tipo:"info", icono:"📋", titulo:"¡Publicá tu primer anuncio!", msg:"Todavía no tenés anuncios. Publicar es gratis y fácil." });

  if(alertas.length===0) return (
    <div style={{ textAlign:"center",padding:"40px 20px",color:TL }}>
      <div style={{ fontSize:44,marginBottom:10 }}>🔔</div>
      <div style={{ fontWeight:600 }}>Todo en orden</div>
      <div style={{ fontSize:13,marginTop:6 }}>No tenés alertas pendientes</div>
    </div>
  );

  const colorMap = { error:ER, warning:WA, info:P };
  const bgMap = { error:"#FEF2F2", warning:"#FFFBEB", info:`${P}0D` };
  const borderMap = { error:"#FECACA", warning:"#FDE68A", info:`${P}33` };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      {alertas.map(al=>(
        <div key={al.id} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",
          borderRadius:12,background:bgMap[al.tipo],border:`1.5px solid ${borderMap[al.tipo]}` }}>
          <span style={{ fontSize:22,flexShrink:0 }}>{al.icono}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700,fontSize:13,color:colorMap[al.tipo],marginBottom:3 }}>{al.titulo}</div>
            <div style={{ fontSize:12,color:TM,lineHeight:1.5 }}>{al.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FAVORITOS TAB ────────────────────────────────────────────────
function FavoritosTab({ user }) {
  const [favAnuncios, setFavAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const favIds = getFavs();
    if(!favIds.length){ setLoading(false); return; }
    // Cargar los anuncios favoritos de Firebase
    const cargar = async()=>{
      try {
        const chunks = [];
        for(let i=0;i<favIds.length;i+=10) chunks.push(favIds.slice(i,i+10));
        const results = [];
        for(const chunk of chunks){
          const q = query(collection(db,"anuncios"),where("__name__","in",chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(d=>results.push({id:d.id,...d.data()}));
        }
        setFavAnuncios(results);
      } catch(e){ console.error(e); }
      setLoading(false);
    };
    cargar();
  },[]);

  const handleQuitarFav = (id)=>{
    toggleFav(id);
    setFavAnuncios(prev=>prev.filter(a=>a.id!==id));
  };

  if(loading) return <Spinner/>;

  if(favAnuncios.length===0) return (
    <div style={{ textAlign:"center",padding:"40px 20px",color:TL }}>
      <div style={{ fontSize:44,marginBottom:10 }}>❤️</div>
      <div style={{ fontWeight:600 }}>No tenés favoritos guardados</div>
      <div style={{ fontSize:13,marginTop:6 }}>Tocá el ❤️ en cualquier anuncio para guardarlo acá</div>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ fontSize:13,color:TL,marginBottom:4 }}>{favAnuncios.length} anuncio{favAnuncios.length!==1?"s":""} guardado{favAnuncios.length!==1?"s":""}</div>
      {favAnuncios.map(a=>(
        <div key={a.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
          border:`1.5px solid ${BR}`,borderRadius:12,background:SF }}>
          <div style={{ width:52,height:52,borderRadius:8,overflow:"hidden",flexShrink:0,background:BG,display:"flex",alignItems:"center",justifyContent:"center" }}>
            {a.fotoPortada?<img src={a.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:<span style={{ fontSize:22 }}>🖼️</span>}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:13,color:TX,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.titulo}</div>
            <div style={{ fontSize:11,color:TL }}>{a.categoria}{a.localidad?` · ${a.localidad}`:""}</div>
            <div style={{ fontSize:13,fontWeight:800,color:AC,marginTop:2 }}>
              {a.precio==="Consultar"?"Consultar":`$${Number(a.precio).toLocaleString("es-AR")}`}
            </div>
          </div>
          <button onClick={()=>handleQuitarFav(a.id)}
            style={{ background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"6px 10px",
              cursor:"pointer",fontSize:13,color:ER,fontWeight:700,fontFamily:"inherit",flexShrink:0 }}>
            🗑 Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

// ── EDITAR FOTOS MODAL ───────────────────────────────────────────
function EditarFotosModal({ anuncio, onClose, onSuccess }) {
  const fotosActuales = anuncio.fotos||[];
  const [fotos, setFotos] = useState(fotosActuales); // urls existentes
  const [nuevas, setNuevas] = useState([]);           // File objects nuevas
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleAgregarFotos = (e) => {
    const files = Array.from(e.target.files);
    const max = 20 - fotos.length - nuevas.length;
    if(files.length > max) { setError(`Podés agregar hasta ${max} foto${max!==1?"s":""} más`); return; }
    setNuevas(prev=>[...prev,...files]);
    setError("");
  };

  const handleEliminarExistente = (url) => setFotos(prev=>prev.filter(f=>f!==url));
  const handleEliminarNueva = (i) => setNuevas(prev=>prev.filter((_,j)=>j!==i));

  const handleGuardar = async () => {
    setUploading(true); setProgress(0); setError("");
    try {
      const urlsNuevas = [];
      for(let i=0; i<nuevas.length; i++) {
        const ref = storageRef(storage,`anuncios/${anuncio.id}/foto_${Date.now()}_${i}`);
        await uploadBytes(ref, nuevas[i]);
        const url = await getDownloadURL(ref);
        urlsNuevas.push(url);
        setProgress(Math.round(((i+1)/nuevas.length)*100));
      }
      const urlsFinales = [...fotos, ...urlsNuevas];
      await updateDoc(doc(db,"anuncios",anuncio.id),{ fotos:urlsFinales, fotoPortada:urlsFinales[0]||"", updatedAt:serverTimestamp() });
      onSuccess(urlsFinales);
    } catch(e){ setError("Error al guardar. Intentá de nuevo."); }
    setUploading(false);
  };

  const totalFotos = fotos.length + nuevas.length;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:SF,borderRadius:20,width:"100%",maxWidth:560,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:`linear-gradient(135deg,#0EA5E9,#0284C7)`,padding:"20px 24px",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:16 }}>📷 Modificar fotos</div>
            <div style={{ color:"rgba(255,255,255,.6)",fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:380 }}>{anuncio.titulo}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:20 }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          {error && <div style={{ background:"#FEE2E2",color:ER,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:13 }}>{error}</div>}

          {/* Fotos actuales */}
          {fotos.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:TL,marginBottom:8 }}>FOTOS ACTUALES ({fotos.length})</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {fotos.map((url,i)=>(
                  <div key={url} style={{ position:"relative",width:80,height:80 }}>
                    <img src={url} style={{ width:80,height:80,objectFit:"cover",borderRadius:8,border:i===0?`2px solid ${P}`:`1px solid ${BR}` }}/>
                    {i===0 && <div style={{ position:"absolute",bottom:2,left:2,background:P,color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4 }}>PORTADA</div>}
                    <button onClick={()=>handleEliminarExistente(url)}
                      style={{ position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:ER,color:"#fff",border:"none",cursor:"pointer",fontSize:12,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fotos nuevas */}
          {nuevas.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:TL,marginBottom:8 }}>FOTOS NUEVAS ({nuevas.length})</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {nuevas.map((f,i)=>(
                  <div key={i} style={{ position:"relative",width:80,height:80 }}>
                    <img src={URL.createObjectURL(f)} style={{ width:80,height:80,objectFit:"cover",borderRadius:8,border:`1px dashed ${P}` }}/>
                    <button onClick={()=>handleEliminarNueva(i)}
                      style={{ position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:ER,color:"#fff",border:"none",cursor:"pointer",fontSize:12,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar fotos */}
          {totalFotos < 20 && (
            <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:`2px dashed ${BR}`,borderRadius:10,cursor:"pointer",marginBottom:16,color:TM,fontSize:13 }}>
              <span style={{ fontSize:24 }}>📁</span>
              <div>
                <div style={{ fontWeight:700 }}>Agregar fotos</div>
                <div style={{ fontSize:11,color:TL }}>{totalFotos}/20 fotos · La primera es la portada</div>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleAgregarFotos} style={{ display:"none" }}/>
            </label>
          )}

          {uploading && (
            <div style={{ marginBottom:12 }}>
              <div style={{ height:6,background:BR,borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${progress}%`,background:P,transition:"width .3s" }}/>
              </div>
              <div style={{ fontSize:12,color:TL,marginTop:4,textAlign:"center" }}>Subiendo... {progress}%</div>
            </div>
          )}

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:10,border:`1px solid ${BR}`,background:"transparent",color:TM,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancelar</button>
            <button onClick={handleGuardar} disabled={uploading||(nuevas.length===0&&fotos.length===fotosActuales.length)}
              style={{ flex:2,padding:"10px",borderRadius:10,background:`linear-gradient(135deg,#0EA5E9,#0284C7)`,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,opacity:uploading?.7:1 }}>
              {uploading?"Guardando...":"💾 Guardar fotos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DESTACAR MODAL ───────────────────────────────────────────────
function DestacarModal({ anuncio, userData, user, onClose, onSuccess }) {
  const [planSel, setPlanSel] = useState("esmeralda");
  const pricing = window.__PRICING__ || {};
  const precioEsm = Number(pricing.plataPrice||2100);
  const precioDia = Number(pricing.oroPrice||9000);

  const planes = [
    { id:"esmeralda", icon:"💚", label:"Esmeralda", color:"#16A34A", bg:"#F0FDF4", border:"#4ADE80",
      precio:precioEsm,
      features:["Badge verde destacado","Aparecés antes que Cuarzo","🤖 Asistente IA incluido"] },
    { id:"diamante", icon:"💠", label:"Diamante", color:"#7C3AED", bg:"#F5F3FF", border:"#8B5CF6",
      precio:precioDia,
      features:["Badge violeta premium","Primero en todos los listados","🤖 Asistente IA incluido"] },
  ];

  const handleContratar = async () => {
    const D = DATOS_LEGALES;
    const plan = planes.find(p=>p.id===planSel);
    const msg = encodeURIComponent(`Hola! Quiero destacar mi anuncio "${anuncio.titulo}" con el plan ${plan.label} ($${plan.precio.toLocaleString("es-AR")}). Usuario: ${user?.email}`);
    window.open(`https://wa.me/549${D.whatsapp}?text=${msg}`,"_blank");
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:SF,borderRadius:20,width:"100%",maxWidth:480,boxShadow:"0 24px 80px rgba(0,0,0,.3)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:"linear-gradient(135deg,#F59E0B,#D97706)",padding:"20px 24px",borderRadius:"20px 20px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:16 }}>⭐ Destacar anuncio</div>
            <div style={{ color:"rgba(255,255,255,.7)",fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:340 }}>{anuncio.titulo}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:20 }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          <div style={{ fontSize:13,color:TM,marginBottom:16 }}>Elegí el plan para destacar este anuncio y obtener más visibilidad:</div>

          <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
            {planes.map(p=>(
              <div key={p.id} onClick={()=>setPlanSel(p.id)}
                style={{ border:`2px solid ${planSel===p.id?p.color:BR}`,borderRadius:12,padding:"14px 16px",
                  cursor:"pointer",background:planSel===p.id?p.bg:SF,transition:"all .2s" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    <span style={{ fontWeight:800,fontSize:15,color:p.color }}>{p.label}</span>
                  </div>
                  <div style={{ fontWeight:900,fontSize:18,color:p.color }}>${p.precio.toLocaleString("es-AR")}</div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  {p.features.map(f=>(
                    <div key={f} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:TX }}>
                      <span style={{ width:16,height:16,borderRadius:"50%",background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#92400E",marginBottom:16 }}>
            💡 Te contactamos por WhatsApp para coordinar el pago y activar tu destaque.
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:10,border:`1px solid ${BR}`,background:"transparent",color:TM,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancelar</button>
            <button onClick={handleContratar}
              style={{ flex:2,padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800 }}>
              ⭐ Contratar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenovarPagoModal({ anuncio, user, userData, onClose, onSuccess }) {
  const [pricing, setPricing] = useState(null);
  const [metodo, setMetodo] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [uploadingComp, setUploadingComp] = useState(false);
  const [loading, setLoading] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    getDoc(doc(db,"config","site")).then(snap=>{
      if(snap.exists()&&snap.data().pricing) setPricing(snap.data().pricing);
    });
  },[]);

  const planId = anuncio.plan || "esmeralda";
  const precioBase = planId==="diamante" ? Number(pricing?.oroPrice||9200) : Number(pricing?.plataPrice||4600);
  const descActivo = pricing?.descAnunciosActivo === true;
  const descPct    = Number(pricing?.descAnunciosPct||10);
  const precio     = descActivo ? Math.round(precioBase*(1-descPct/100)) : precioBase;
  const mpEnabled       = pricing?.mercadopagoEnabled !== false;
  const transferEnabled = pricing?.transferEnabled === true;
  const transferInfo    = pricing?.transferInstructions || "Consultá el CBU por WhatsApp.";
  const planColor  = planId==="diamante" ? "#7C3AED" : "#16A34A";
  const planIcon   = planId==="diamante" ? "💠" : "💚";

  const handleSubirComprobante = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploadingComp(true);
    try {
      const sRef = ref(storage, `comprobantes/renov_${user.uid}_${anuncio.id}_${Date.now()}`);
      const task = uploadBytesResumable(sRef, file, { contentType: file.type });
      task.on("state_changed",null,()=>setUploadingComp(false),async()=>{
        const url = await getDownloadURL(task.snapshot.ref);
        setComprobante(url); setUploadingComp(false);
      });
    } catch { setUploadingComp(false); }
  };

  const handleEnviarTransferencia = async () => {
    if(!comprobante) return setError("Subí el comprobante antes de enviar.");
    setLoading("transferencia");
    try {
      await addDoc(collection(db,"pagos"),{
        userId: user.uid, email: user.email,
        nombre: userData?.nombre||user.displayName||"",
        plan: planId, tipo:"renovacion",
        anuncioId: anuncio.id, anuncioTitulo: anuncio.titulo,
        monto: precio, metodo:"transferencia",
        comprobante, status:"pendiente",
        createdAt: serverTimestamp(),
      });
      setEnviado(true);
    } catch { setError("Error al enviar. Intentá de nuevo."); }
    finally { setLoading(null); }
  };

  const handlePagarMP = async () => {
    setLoading("mp");
    try {
      const res = await fetch("https://crearpreferencia-ww7mv25tba-uc.a.run.app",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ plan:`renovar_${planId}`, userId:user.uid, email:user.email, anuncioId:anuncio.id }),
      });
      const data = await res.json();
      if(data.init_point) window.location.href = data.init_point;
      else setError("Error al generar el pago.");
    } catch { setError("No se pudo conectar con MercadoPago."); }
    finally { setLoading(null); }
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:SF,borderRadius:20,width:"100%",maxWidth:460,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)",overflow:"hidden" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:AC,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ color:"#fff",fontWeight:800,fontSize:16 }}>🔄 Renovar anuncio</span>
          <button onClick={onClose} style={{ background:"none",border:"1px solid rgba(255,255,255,.3)",color:"rgba(255,255,255,.7)",padding:"4px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          {enviado ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ fontSize:52,marginBottom:12 }}>✅</div>
              <div style={{ fontWeight:800,fontSize:18,color:TX,marginBottom:8 }}>¡Comprobante enviado!</div>
              <div style={{ fontSize:13,color:TL,marginBottom:20 }}>Revisaremos y renovaremos tu anuncio en menos de 24 horas.</div>
              <Btn onClick={onSuccess}>Cerrar</Btn>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div style={{ background:`${planColor}11`,border:`1.5px solid ${planColor}`,borderRadius:12,padding:"14px 18px",marginBottom:20 }}>
                <div style={{ fontSize:12,color:TL,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{anuncio.titulo}</div>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>{planIcon}</span>
                  <span style={{ fontWeight:800,color:planColor,fontSize:15 }}>Plan {planId.charAt(0).toUpperCase()+planId.slice(1)} — 30 días</span>
                </div>
                <div style={{ fontWeight:900,fontSize:20,color:planColor }}>${precio.toLocaleString("es-AR")}</div>
                {descActivo && <span style={{ fontSize:11,background:"#DC2626",color:"#fff",padding:"2px 8px",borderRadius:20,fontWeight:700 }}>🏷️ {descPct}% OFF aplicado</span>}
              </div>

              {error && <Alert type="error">{error}</Alert>}

              {/* Método */}
              {!metodo && mpEnabled && transferEnabled && (
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:TX,marginBottom:4 }}>¿Cómo querés pagar?</div>
                  <button onClick={()=>setMetodo("mp")} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:"2px solid #009EE3",background:"#F0F9FF",cursor:"pointer",fontFamily:"inherit" }}>
                    <span style={{ fontSize:24 }}>💳</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontWeight:700,color:"#009EE3" }}>MercadoPago</div>
                      <div style={{ fontSize:12,color:TL }}>Se activa automáticamente</div>
                    </div>
                  </button>
                  <button onClick={()=>setMetodo("transferencia")} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:"2px solid #16A34A",background:"#F0FDF4",cursor:"pointer",fontFamily:"inherit" }}>
                    <span style={{ fontSize:24 }}>🏦</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontWeight:700,color:"#16A34A" }}>Transferencia bancaria</div>
                      <div style={{ fontSize:12,color:TL }}>Se activa en 24hs</div>
                    </div>
                  </button>
                </div>
              )}
              {!metodo && mpEnabled && !transferEnabled && <Btn color="#009EE3" full onClick={()=>setMetodo("mp")}>💳 Pagar con MercadoPago</Btn>}
              {!metodo && !mpEnabled && transferEnabled && <Btn color="#16A34A" full onClick={()=>setMetodo("transferencia")}>🏦 Pagar por transferencia</Btn>}

              {metodo==="mp" && (
                <div style={{ textAlign:"center",paddingTop:16 }}>
                  <Btn color="#009EE3" onClick={handlePagarMP} disabled={loading==="mp"} full>
                    {loading==="mp"?"Redirigiendo...":"💳 Ir a MercadoPago"}
                  </Btn>
                </div>
              )}

              {metodo==="transferencia" && (
                <div>
                  <div style={{ background:"#F0FDF4",border:"1.5px solid #4ADE80",borderRadius:10,padding:"12px 16px",marginBottom:14 }}>
                    <div style={{ fontWeight:700,fontSize:13,color:"#15803D",marginBottom:4 }}>🏦 Datos para transferir</div>
                    <div style={{ fontSize:13,color:"#166534",whiteSpace:"pre-wrap",lineHeight:1.7 }}>{transferInfo}</div>
                  </div>
                  {comprobante ? (
                    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:"#F0FDF4",border:"1.5px solid #4ADE80",marginBottom:14 }}>
                      <span style={{ fontSize:20 }}>✅</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:"#15803D" }}>Comprobante subido</div>
                        <a href={comprobante} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"#16A34A" }}>Ver imagen</a>
                      </div>
                      <button onClick={()=>setComprobante(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:TL }}>✕</button>
                    </div>
                  ) : (
                    <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,border:`1.5px dashed ${BR}`,background:BG,cursor:"pointer",marginBottom:14 }}>
                      <span style={{ fontSize:20 }}>📷</span>
                      <span style={{ fontSize:13,color:TL }}>{uploadingComp?"Subiendo...":"Seleccioná la foto del comprobante"}</span>
                      <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={handleSubirComprobante} disabled={uploadingComp}/>
                    </label>
                  )}
                  <Btn full onClick={handleEnviarTransferencia} disabled={!comprobante||loading==="transferencia"}>
                    {loading==="transferencia"?"Enviando...":"📨 Enviar comprobante"}
                  </Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AD CARD ──────────────────────────────────────────────────────
// ── FAVORITES HELPERS ────────────────────────────────────────────
const getFavs = () => { try { return JSON.parse(localStorage.getItem("favs_chapa")||"[]"); } catch { return []; } };
const toggleFav = (id) => {
  const favs = getFavs();
  const next = favs.includes(id) ? favs.filter(f=>f!==id) : [...favs, id];
  localStorage.setItem("favs_chapa", JSON.stringify(next));
  return next.includes(id);
};

function FavBtn({ adId, style={} }) {
  const [fav, setFav] = useState(()=>getFavs().includes(adId));
  return (
    <button
      onClick={e=>{ e.stopPropagation(); setFav(toggleFav(adId)); }}
      title={fav?"Quitar de favoritos":"Guardar en favoritos"}
      style={{ background:fav?"#FFF0F0":"rgba(255,255,255,.92)", border:`1.5px solid ${fav?"#EF4444":"#E5E7EB"}`,
        borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontSize:16, transition:"all .2s", flexShrink:0, ...style }}>
      {fav ? "❤️" : "🤍"}
    </button>
  );
}

function AdCard({ ad, onClick, featured }) {
  const [h, setH] = useState(false);
  const isFree = !ad.precio||ad.precio==="Consultar";
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={()=>onClick(ad)}
      style={{ background:SF,border:`1.5px solid ${h?P:BR}`,borderRadius:14,overflow:"hidden",
        cursor:"pointer",transition:"all .25s",transform:h?"translateY(-3px)":"none",
        boxShadow:h?"0 12px 32px rgba(0,0,0,.1)":"0 2px 8px rgba(0,0,0,.04)",position:"relative" }}>
      <div style={{ height:featured?155:125,background:`linear-gradient(135deg,${BG},#e8e8f0)`,
        display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}>
        {ad.fotoPortada
          ? <img src={ad.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          : <span style={{ fontSize:featured?52:44 }}>{cats.find(c=>c.name===ad.categoria)?.icon||"📦"}</span>
        }
        {ad.plan&&ad.plan!=="cuarzo"&&<div style={{ position:"absolute",top:8,left:8 }}><AdBadge type={ad.plan.toUpperCase()}/></div>}
        <div style={{ position:"absolute",top:8,right:8,background:"rgba(0,0,0,.5)",color:"#fff",padding:"1px 7px",borderRadius:20,fontSize:10 }}>
          {timeAgo(ad.createdAt)}
        </div>
        <div style={{ position:"absolute",bottom:8,right:8 }} onClick={e=>e.stopPropagation()}>
          <FavBtn adId={ad.id}/>
        </div>
      </div>
      <div style={{ padding:"11px 13px" }}>
        <div style={{ fontSize:11,color:P,fontWeight:600,marginBottom:3 }}>{ad.categoria}{ad.localidad?` · ${ad.localidad}`:""}</div>
        <div style={{ fontWeight:600,fontSize:13,color:TX,marginBottom:6,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{ad.titulo}</div>
        <div style={{ fontWeight:800,fontSize:16,color:isFree?TM:AC }}>
          {isFree?<span style={{ fontSize:12,color:TL }}>Precio a consultar</span>:`${ad.moneda==="USD"?"U$S":"$"} ${Number(ad.precio).toLocaleString("es-AR")}`}
        </div>
      </div>
    </div>
  );
}

function AdCardList({ ad, onClick }) {
  const [h, setH] = useState(false);
  const isFree = !ad.precio||ad.precio==="Consultar";
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={()=>onClick(ad)}
      style={{ background:SF, border:`1.5px solid ${h?P:BR}`, borderRadius:14, overflow:"hidden",
        cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"stretch",
        boxShadow:h?"0 6px 24px rgba(0,0,0,.09)":"0 1px 4px rgba(0,0,0,.05)" }}>
      {/* Foto */}
      <div style={{ width:130, minWidth:130, background:`linear-gradient(135deg,${BG},#e8e8f0)`,
        display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {ad.fotoPortada
          ? <img src={ad.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          : <span style={{ fontSize:40 }}>{cats.find(c=>c.name===ad.categoria)?.icon||"📦"}</span>
        }
        {ad.plan&&ad.plan!=="cuarzo"&&(
          <div style={{ position:"absolute",top:6,left:6 }}><AdBadge type={ad.plan.toUpperCase()}/></div>
        )}
      </div>
      {/* Contenido */}
      <div style={{ flex:1, padding:"14px 18px", display:"flex", alignItems:"center", gap:16, minWidth:0 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11,color:P,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
            <span>▶ {ad.categoria}</span>
            {ad.subcategoria && <><span style={{ color:TL }}>▶</span><span>{ad.subcategoria}</span></>}
            {ad.marca && <><span style={{ color:TL }}>▶</span><span>{ad.marca}</span></>}
            {ad.modelo && <><span style={{ color:TL }}>▶</span><span>{ad.modelo}</span></>}
          </div>
          <div style={{ fontWeight:700,fontSize:15,color:TX,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {ad.titulo}
          </div>
          <div style={{ fontSize:12,color:TL,display:"flex",gap:12,flexWrap:"wrap" }}>
            {ad.localidad && <span>📍 {ad.localidad}</span>}
            {ad.estado && <span>• {ad.estado}</span>}
          </div>
        </div>
        {/* Precio + meta */}
        <div style={{ textAlign:"right", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <div style={{ fontWeight:900, fontSize:18, color:isFree?TL:"#16A34A", lineHeight:1.1 }}>
            {isFree ? <span style={{ fontSize:12,color:TL }}>Consultar</span> : (
              <>
                <div style={{ fontSize:11,fontWeight:600,color:TL }}>{ad.moneda==="USD"?"U$S":"$"}</div>
                <div>{Number(ad.precio).toLocaleString("es-AR")}</div>
              </>
            )}
          </div>
          <div style={{ fontSize:11,color:TL }}>{timeAgo(ad.createdAt)}</div>
          {ad.vistas>0 && <div style={{ fontSize:11,color:TL }}>👁 {ad.vistas}</div>}
          <div onClick={e=>e.stopPropagation()}>
            <FavBtn adId={ad.id}/>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── HORARIO EDITOR ────────────────────────────────────────────────
const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const HORAS = Array.from({length:24},(_,i)=>String(i).padStart(2,"0")+":00")
  .concat(["00:30","01:30","02:30","03:30"]).concat(
    Array.from({length:24},(_,i)=>String(i).padStart(2,"0")+":30")
  ).sort();

const DEFAULT_HORARIO_DATA = DIAS.map(d=>({
  dia:d, abierto:["Lunes","Martes","Miércoles","Jueves","Viernes"].includes(d),
  turno1:{desde:"09:00",hasta:"13:00",activo:true},
  turno2:{desde:"17:00",hasta:"21:00",activo:false},
}));

function parseHorarioToData(horarioStr) {
  // Si ya es objeto, devolverlo
  if(Array.isArray(horarioStr)) return horarioStr;
  return DEFAULT_HORARIO_DATA;
}

function horarioDataToString(data) {
  const lines = [];
  data.forEach(d=>{
    if(!d.abierto){ return; }
    const t1 = d.turno1.activo ? `${d.turno1.desde} a ${d.turno1.hasta}` : null;
    const t2 = d.turno2.activo ? `${d.turno2.desde} a ${d.turno2.hasta}` : null;
    const turnos = [t1,t2].filter(Boolean).join(" y de ");
    if(turnos) lines.push(`${d.dia}: ${turnos}`);
  });
  return lines.join(" · ");
}

function HorarioEditor({ value, onChange }) {
  const [data, setData] = useState(()=>parseHorarioToData(value));
  const [collapsed, setCollapsed] = useState(true);

  const update = (newData) => {
    setData(newData);
    onChange(newData);
  };

  const toggleDia = (i) => {
    const nd = data.map((d,idx)=>idx===i?{...d,abierto:!d.abierto}:d);
    update(nd);
  };

  const toggleTurno = (i, t) => {
    const nd = data.map((d,idx)=>idx===i?{...d,[t]:{...d[t],activo:!d[t].activo}}:d);
    update(nd);
  };

  const setHora = (i, turno, campo, val) => {
    const nd = data.map((d,idx)=>idx===i?{...d,[turno]:{...d[turno],[campo]:val}}:d);
    update(nd);
  };

  const preview = horarioDataToString(data);
  const selStyle = { padding:"5px 8px", borderRadius:6, border:`1.5px solid #D1D5DB`, fontFamily:"inherit", fontSize:12, background:"#fff", cursor:"pointer" };

  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:"#6B7280", marginBottom:6 }}>🕐 Horario de atención</div>
      {/* Preview */}
      {preview && (
        <div style={{ padding:"8px 12px", borderRadius:8, background:"#F0FDF4", border:"1px solid #BBF7D0", fontSize:12, color:"#166534", marginBottom:8, lineHeight:1.6 }}>
          {preview}
        </div>
      )}
      {/* Toggle editor */}
      <button onClick={()=>setCollapsed(p=>!p)}
        style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #D1D5DB", background:"#fff", cursor:"pointer", fontSize:12, fontFamily:"inherit", color:"#374151", marginBottom:collapsed?0:12 }}>
        {collapsed?"✏️ Editar horarios":"▲ Cerrar editor"}
      </button>
      {!collapsed && (
        <div style={{ border:"1.5px solid #E5E7EB", borderRadius:12, overflow:"hidden" }}>
          {data.map((d,i)=>(
            <div key={d.dia} style={{ borderBottom:i<data.length-1?"1px solid #F3F4F6":"none" }}>
              {/* Día header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:d.abierto?"#F9FAFB":"#F3F4F6" }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", flex:1 }}>
                  <div onClick={()=>toggleDia(i)}
                    style={{ width:36, height:20, borderRadius:10, background:d.abierto?"#16A34A":"#D1D5DB", position:"relative", cursor:"pointer", transition:"background .2s", flexShrink:0 }}>
                    <div style={{ position:"absolute", top:2, left:d.abierto?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
                  </div>
                  <span style={{ fontWeight:700, fontSize:13, color:d.abierto?"#111827":"#9CA3AF", minWidth:80 }}>{d.dia}</span>
                </label>
                {!d.abierto && <span style={{ fontSize:11, color:"#9CA3AF" }}>Cerrado</span>}
              </div>
              {/* Turnos */}
              {d.abierto && (
                <div style={{ padding:"8px 14px 12px", background:"#fff" }}>
                  {[["turno1","Turno 1"],["turno2","Turno 2"]].map(([tk,tl])=>(
                    <div key={tk} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <label style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", minWidth:70 }}>
                        <input type="checkbox" checked={d[tk].activo} onChange={()=>toggleTurno(i,tk)} style={{ accentColor:"#F5A623" }}/>
                        <span style={{ fontSize:12, color:"#6B7280" }}>{tl}</span>
                      </label>
                      {d[tk].activo && (
                        <>
                          <select value={d[tk].desde} onChange={e=>setHora(i,tk,"desde",e.target.value)} style={selStyle}>
                            {Array.from({length:48},(_,h)=>{const hh=String(Math.floor(h/2)).padStart(2,"0");const mm=h%2===0?"00":"30";return `${hh}:${mm}`;}).map(h=><option key={h}>{h}</option>)}
                          </select>
                          <span style={{ fontSize:12, color:"#6B7280" }}>a</span>
                          <select value={d[tk].hasta} onChange={e=>setHora(i,tk,"hasta",e.target.value)} style={selStyle}>
                            {Array.from({length:48},(_,h)=>{const hh=String(Math.floor(h/2)).padStart(2,"0");const mm=h%2===0?"00":"30";return `${hh}:${mm}`;}).map(h=><option key={h}>{h}</option>)}
                          </select>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TIENDA CARD ──────────────────────────────────────────────────
function TiendaCard({ tienda, siteWhatsapp, onVerTienda, onVerAnunciosTienda }) {
  const [hov, setHov] = useState(false);
  const isDiamante = tienda.plan === "diamante";

  // Diamante: deep purple-to-gold luxury. Esmeralda: vivid teal-to-lime energy.
  const grad   = isDiamante
    ? "linear-gradient(135deg, #1E0A3C 0%, #3B0F6E 40%, #6B21A8 70%, #C026D3 100%)"
    : "linear-gradient(135deg, #064E3B 0%, #065F46 35%, #0D9488 70%, #34D399 100%)";
  const accent = isDiamante ? "#E879F9" : "#34D399";
  const gold   = isDiamante ? "#FCD34D" : "#A7F3D0";
  const glow   = isDiamante ? "rgba(192,38,211,0.45)" : "rgba(52,211,153,0.35)";

  const handleContacto = () => {
    const num = tienda.whatsapp ? `549${tienda.whatsapp}` : `549${siteWhatsapp}`;
    const msg = encodeURIComponent(`Hola ${tienda.nombre}! Te vi en Clasificados Chapa J y me interesa conocer más.`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={onVerTienda ? ()=>onVerTienda(tienda) : undefined}
      style={{
        borderRadius:24, overflow:"hidden", position:"relative",
        boxShadow: hov ? `0 24px 60px ${glow}, 0 8px 20px rgba(0,0,0,0.25)` : `0 6px 24px rgba(0,0,0,0.15)`,
        transform: hov ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
        cursor: onVerTienda ? "pointer" : "default",
      }}
    >
      {/* ── HERO GRADIENT HEADER ── */}
      <div style={{ background:grad, padding:"28px 22px 22px", position:"relative", overflow:"hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-20, left:-20, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>

        {/* Plan badge */}
        <div style={{
          position:"absolute", top:14, right:14,
          background: isDiamante ? "linear-gradient(135deg,#FCD34D,#F59E0B)" : "linear-gradient(135deg,#A7F3D0,#34D399)",
          color: isDiamante ? "#78350F" : "#064E3B",
          fontSize:10, fontWeight:900, padding:"4px 12px", borderRadius:20,
          letterSpacing:1, boxShadow:`0 2px 8px ${glow}`,
          display:"flex", alignItems:"center", gap:4,
        }}>
          {isDiamante ? "💠" : "💚"} {isDiamante ? "DIAMANTE" : "ESMERALDA"}
        </div>

        {/* Logo + nombre */}
        <div style={{ display:"flex", alignItems:"center", gap:16, position:"relative", zIndex:1 }}>
          <div style={{
            width:72, height:72, borderRadius:18, overflow:"hidden", flexShrink:0,
            background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)",
            border:`2px solid rgba(255,255,255,0.3)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 20px ${glow}`,
          }}>
            {tienda.logo
              ? <img src={tienda.logo} alt={tienda.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:32 }}>🏪</span>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            {tienda.verificada && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"2px 8px", marginBottom:5 }}>
                <span style={{ fontSize:10 }}>✅</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.9)", fontWeight:700, letterSpacing:0.5 }}>VERIFICADO</span>
              </div>
            )}
            <div style={{
              fontWeight:900, fontSize:18, color:"#fff", lineHeight:1.2,
              textShadow:"0 2px 8px rgba(0,0,0,0.4)",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              fontFamily:"'Georgia',serif",
            }}>
              <span>{tienda.nombre||"Tienda"}</span>
              {tienda.verificado && (
                <span style={{ fontSize:10,fontWeight:800,background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:20,padding:"1px 7px",marginLeft:6,verticalAlign:"middle" }}>✅ Verificada</span>
              )}
            </div>
            {tienda.categoria && (
              <div style={{ fontSize:12, color:gold, fontWeight:600, marginTop:3, opacity:0.9 }}>
                {tienda.categoria}
              </div>
            )}
            {tienda.rating > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:4 }}>
                {"★★★★★".split("").map((_,i)=>(
                  <span key={i} style={{ fontSize:13, color:i<Math.round(tienda.rating)?gold:"rgba(255,255,255,0.3)" }}>★</span>
                ))}
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginLeft:3 }}>{tienda.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ background:"#fff", padding:"18px 20px 20px" }}>

        {/* Descripción */}
        {tienda.descripcion && (
          <p style={{
            fontSize:13, color:"#374151", lineHeight:1.65, margin:"0 0 14px",
            display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>
            {tienda.descripcion}
          </p>
        )}

        {/* Info pills */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
          {tienda.direccion && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:8, background:isDiamante?"#F5F3FF":"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:13 }}>📍</div>
              <span style={{ fontSize:12, color:"#4B5563", fontWeight:500 }}>{tienda.direccion}</span>
            </div>
          )}
          {(tienda.horario||(tienda.horarioData&&horarioDataToString(tienda.horarioData))) && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:8, background:isDiamante?"#F5F3FF":"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:13, marginTop:1 }}>🕐</div>
              <span style={{ fontSize:12, color:"#4B5563", lineHeight:1.5 }}>{tienda.horarioData?horarioDataToString(tienda.horarioData):tienda.horario}</span>
            </div>
          )}
        </div>

        {/* Redes */}
        {(tienda.web||tienda.instagram||tienda.facebook||tienda.tiktok) && (
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {[
              tienda.web       && { href:tienda.web,       label:"Web",       icon:"🌐", bg:"#F1F5F9", color:"#334155" },
              tienda.instagram && { href:tienda.instagram, label:"Instagram",  icon:"📸", bg:"#FDF2F8", color:"#9D174D" },
              tienda.facebook  && { href:tienda.facebook,  label:"Facebook",   icon:"📘", bg:"#EFF6FF", color:"#1D4ED8" },
              tienda.tiktok    && { href:tienda.tiktok,    label:"TikTok",     icon:"🎵", bg:"#F9FAFB", color:"#111827" },
            ].filter(Boolean).map(s=>(
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:4, background:s.bg, borderRadius:10, padding:"5px 11px", fontSize:11, fontWeight:700, color:s.color, textDecoration:"none", border:"1px solid rgba(0,0,0,0.06)", transition:"transform .15s" }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                {s.icon} {s.label}
              </a>
            ))}
          </div>
        )}

        {/* Ver anuncios button */}
        {onVerAnunciosTienda && (
          <button
            onClick={e=>{ e.stopPropagation(); onVerAnunciosTienda(tienda); }}
            style={{
              width:"100%", padding:"11px", borderRadius:14, border:`2px solid ${isDiamante?"#7C3AED":"#059669"}`,
              cursor:"pointer", background:"transparent",
              color: isDiamante?"#7C3AED":"#059669",
              fontWeight:800, fontSize:13, fontFamily:"inherit",
              marginBottom:10, transition:"all .25s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background=isDiamante?"#F5F3FF":"#ECFDF5"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}
          >
            <span style={{ fontSize:15 }}>🏷️</span> Ver anuncios de esta tienda
          </button>
        )}

        {/* CTA Button */}
        <button
          onClick={handleContacto}
          style={{
            width:"100%", padding:"13px", borderRadius:14, border:"none", cursor:"pointer",
            background: hov
              ? (isDiamante?"linear-gradient(135deg,#7C3AED,#C026D3)":"linear-gradient(135deg,#059669,#0D9488)")
              : (isDiamante?"linear-gradient(135deg,#6D28D9,#A855F7)":"linear-gradient(135deg,#047857,#10B981)"),
            color:"#fff", fontWeight:800, fontSize:14, fontFamily:"inherit",
            boxShadow: hov ? `0 8px 24px ${glow}` : `0 4px 12px ${glow}`,
            transition:"all .25s",
            letterSpacing:0.3,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}
        >
          <span style={{ fontSize:16 }}>💬</span> Contactar tienda
        </button>
      </div>
    </div>
  );
}

// ── MAIN FRONTEND ────────────────────────────────────────────────
// ── TIENDA PLANES SECTION ────────────────────────────────────────
function TiendaPlanesSection({ user, userData, siteWhatsapp }) {
  const [pricing, setPricing] = useState(null);
  const [planSel, setPlanSel] = useState(null);       // "esmeralda" | "diamante"
  const [duracion, setDuracion] = useState("30");     // "30" | "90" | "180"
  const [metodo, setMetodo] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [uploadingComp, setUploadingComp] = useState(false);
  const [loading, setLoading] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    getDoc(doc(db,"config","site")).then(snap=>{
      if(snap.exists() && snap.data().pricing) setPricing(snap.data().pricing);
    }).catch(()=>{});
  },[]);

  const mpEnabled       = pricing?.mercadopagoEnabled !== false;
  const transferEnabled = pricing?.transferEnabled === true;
  const transferInfo    = pricing?.transferInstructions || "Consultá el CBU por WhatsApp.";
  const descActivo      = pricing?.descTiendaActivo === true;
  const descPct         = Number(pricing?.descTiendaPct||10);

  const preciosBase = {
    esmeralda: { "30": Number(pricing?.tiendaPlata30)||8600, "90": Number(pricing?.tiendaPlata90)||23000, "180": Number(pricing?.tiendaPlata180)||41000 },
    diamante:  { "30": Number(pricing?.tiendaOro30)||16000,  "90": Number(pricing?.tiendaOro90)||45000,   "180": Number(pricing?.tiendaOro180)||85000 },
  };
  const precios = descActivo ? {
    esmeralda: { "30": Math.round(preciosBase.esmeralda["30"]*(1-descPct/100)), "90": Math.round(preciosBase.esmeralda["90"]*(1-descPct/100)), "180": Math.round(preciosBase.esmeralda["180"]*(1-descPct/100)) },
    diamante:  { "30": Math.round(preciosBase.diamante["30"]*(1-descPct/100)),  "90": Math.round(preciosBase.diamante["90"]*(1-descPct/100)),  "180": Math.round(preciosBase.diamante["180"]*(1-descPct/100)) },
  } : preciosBase;

  const planesInfo = [
    { id:"esmeralda", icon:"💚", color:"#34D399", dark:"#059669", features:["Logo y descripción","Link a WhatsApp","Tus anuncios destacados","Verificación de tienda"] },
    { id:"diamante",  icon:"💠", color:"#818CF8", dark:"#4F46E5", features:["Todo Esmeralda","Posición prioritaria","Galería de fotos","Badge PREMIUM","Anuncios al tope"], highlight:true },
  ];

  const handleSubirComprobante = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploadingComp(true);
    try {
      const sRef = ref(storage, `comprobantes/tienda_${user?.uid}_${planSel}_${Date.now()}`);
      const task = uploadBytesResumable(sRef, file, { contentType: file.type });
      task.on("state_changed", null, ()=>setUploadingComp(false), async()=>{
        const url = await getDownloadURL(task.snapshot.ref);
        setComprobante(url); setUploadingComp(false);
      });
    } catch { setUploadingComp(false); }
  };

  const handleEnviarTransferencia = async () => {
    if(!comprobante) return setError("Subí el comprobante antes de enviar.");
    if(!user) return setError("Necesitás estar logueado.");
    setLoading("transferencia");
    try {
      await addDoc(collection(db,"pagos"), {
        userId: user.uid,
        email: user.email,
        nombre: userData?.nombre || user.displayName || "",
        plan: planSel,
        tipo: "tienda",
        duracion,
        monto: precios[planSel][duracion],
        metodo: "transferencia",
        comprobante,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });
      setEnviado(true);
    } catch { setError("Error al enviar. Intentá de nuevo."); }
    finally { setLoading(null); }
  };

  const handlePagarMP = async () => {
    if(!user) return setError("Necesitás estar logueado.");
    setError(""); setLoading("mp");
    try {
      const res = await fetch("https://crearpreferencia-ww7mv25tba-uc.a.run.app", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ plan: `tienda_${planSel}_${duracion}`, userId: user.uid, email: user.email, monto: precios[planSel][duracion] }),
      });
      const data = await res.json();
      if(data.init_point) window.location.href = data.init_point;
      else setError("Error al generar el pago. Intentá de nuevo.");
    } catch { setError("No se pudo conectar con MercadoPago."); }
    finally { setLoading(null); }
  };

  // Pantalla de confirmación
  if(enviado) return (
    <div style={{ background:"linear-gradient(135deg,#0F0C29,#1a1a3e)", padding:"56px 20px" }}>
      <div style={{ maxWidth:480, margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:22, marginBottom:8 }}>¡Comprobante enviado!</div>
        <div style={{ color:"rgba(255,255,255,.6)", fontSize:14, marginBottom:24 }}>Revisaremos tu transferencia y activaremos tu tienda en menos de 24 horas.</div>
        <button onClick={()=>{ setPlanSel(null); setEnviado(false); setMetodo(null); setComprobante(null); }}
          style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"10px 28px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>
          Volver a los planes
        </button>
      </div>
    </div>
  );

  // Pantalla de pago
  if(planSel) {
    const info = planesInfo.find(p=>p.id===planSel);
    const precio = precios[planSel][duracion];
    return (
      <div style={{ background:"linear-gradient(135deg,#0F0C29,#1a1a3e)", padding:"40px 20px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <button onClick={()=>{ setPlanSel(null); setMetodo(null); setComprobante(null); setError(""); }}
            style={{ background:"none", border:"1px solid rgba(255,255,255,.3)", color:"rgba(255,255,255,.7)", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:13, marginBottom:20 }}>
            ← Volver a los planes
          </button>

          {/* Resumen plan */}
          <div style={{ background:"rgba(255,255,255,.06)", border:`1.5px solid ${info.color}`, borderRadius:16, padding:"20px 24px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{ fontSize:24 }}>{info.icon}</span>
              <span style={{ color:info.color, fontWeight:800, fontSize:18 }}>Tienda {info.id.charAt(0).toUpperCase()+info.id.slice(1)}</span>
            </div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:22 }}>${precio.toLocaleString("es-AR")}</div>
          </div>

          {/* Duración */}
          <div style={{ marginBottom:20 }}>
            <div style={{ color:"rgba(255,255,255,.7)", fontSize:13, fontWeight:600, marginBottom:10 }}>⏱ Duración del plan</div>
            <div style={{ display:"flex", gap:8 }}>
              {["30","90","180"].map(d=>(
                <button key={d} onClick={()=>setDuracion(d)}
                  style={{ flex:1, padding:"10px", borderRadius:10, border:`1.5px solid ${duracion===d?info.color:"rgba(255,255,255,.2)"}`,
                    background:duracion===d?"rgba(255,255,255,.1)":"transparent",
                    color:duracion===d?info.color:"rgba(255,255,255,.6)",
                    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  {d} días<br/>
                  {descActivo ? (
                    <>
                      <span style={{ fontSize:10, textDecoration:"line-through", opacity:.5 }}>${preciosBase[planSel][d].toLocaleString("es-AR")}</span>
                      <br/>
                      <span style={{ fontSize:12, fontWeight:800, color:"#FCA5A5" }}>${precios[planSel][d].toLocaleString("es-AR")}</span>
                    </>
                  ) : (
                    <span style={{ fontSize:11, fontWeight:400 }}>${precios[planSel][d].toLocaleString("es-AR")}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <Alert type="error">{error}</Alert>}

          {/* Selector método */}
          {!metodo && mpEnabled && transferEnabled && (
            <div>
              <div style={{ color:"rgba(255,255,255,.7)", fontWeight:700, fontSize:14, marginBottom:12 }}>¿Cómo querés pagar?</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button onClick={()=>setMetodo("mp")}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:12, border:"2px solid #009EE3", background:"rgba(0,158,227,.1)", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                  <span style={{ fontSize:26 }}>💳</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#38BDF8" }}>MercadoPago</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Tarjeta, débito o efectivo. Se activa automáticamente.</div>
                  </div>
                </button>
                <button onClick={()=>setMetodo("transferencia")}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:12, border:"2px solid #16A34A", background:"rgba(22,163,74,.1)", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                  <span style={{ fontSize:26 }}>🏦</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#4ADE80" }}>Transferencia bancaria</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Transferí y subí el comprobante. Se activa en 24hs.</div>
                  </div>
                </button>
              </div>
            </div>
          )}
          {!metodo && mpEnabled && !transferEnabled && (
            <Btn color="#009EE3" onClick={()=>setMetodo("mp")}>💳 Pagar con MercadoPago</Btn>
          )}
          {!metodo && !mpEnabled && transferEnabled && (
            <Btn color="#16A34A" onClick={()=>setMetodo("transferencia")}>🏦 Pagar por transferencia</Btn>
          )}

          {/* MercadoPago */}
          {metodo==="mp" && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>💳</div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:16, marginBottom:6 }}>Pagar con MercadoPago</div>
              <div style={{ color:"rgba(255,255,255,.5)", fontSize:13, marginBottom:20 }}>Serás redirigido al checkout seguro</div>
              <Btn color="#009EE3" onClick={handlePagarMP} disabled={loading==="mp"}>
                {loading==="mp" ? "Redirigiendo..." : "💳 Ir a MercadoPago"}
              </Btn>
            </div>
          )}

          {/* Transferencia */}
          {metodo==="transferencia" && (
            <div>
              <div style={{ background:"rgba(22,163,74,.1)", border:"1.5px solid #4ADE80", borderRadius:12, padding:"14px 18px", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#4ADE80", marginBottom:6 }}>🏦 Datos para transferir</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", whiteSpace:"pre-wrap", lineHeight:1.8 }}>{transferInfo}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ color:"rgba(255,255,255,.7)", fontWeight:600, fontSize:13, marginBottom:8 }}>📎 Subir comprobante</div>
                {comprobante ? (
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(22,163,74,.1)", border:"1.5px solid #4ADE80" }}>
                    <span style={{ fontSize:20 }}>✅</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#4ADE80" }}>Comprobante subido</div>
                      <a href={comprobante} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#86EFAC" }}>Ver imagen</a>
                    </div>
                    <button onClick={()=>setComprobante(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"rgba(255,255,255,.4)" }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:10, border:"1.5px dashed rgba(255,255,255,.2)", background:"rgba(255,255,255,.04)", cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>📷</span>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>{uploadingComp ? "Subiendo..." : "Seleccioná la foto del comprobante"}</span>
                    <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={handleSubirComprobante} disabled={uploadingComp}/>
                  </label>
                )}
              </div>
              <Btn onClick={handleEnviarTransferencia} disabled={!comprobante || loading==="transferencia"}>
                {loading==="transferencia" ? "Enviando..." : "📨 Enviar comprobante"}
              </Btn>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lista de planes
  return (
    <div style={{ background:"linear-gradient(135deg,#0F0C29,#1a1a3e)", padding:"56px 20px" }}>
      <div style={{ maxWidth:1000, margin:"0 auto", textAlign:"center" }}>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, fontWeight:700, letterSpacing:2, marginBottom:8 }}>PLANES PARA COMERCIOS</div>
        <h2 style={{ color:"#fff", fontFamily:"'Georgia',serif", fontSize:28, margin:"0 0 8px" }}>Elegí el plan de tu tienda</h2>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, margin:"0 0 36px" }}>Todos los planes incluyen presencia online en San Juan</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:18 }}>
          {planesInfo.map(p=>(
            <div key={p.id} style={{ background:p.highlight?"rgba(129,140,248,0.1)":"rgba(255,255,255,0.04)", border:`1.5px solid ${p.highlight?"#818CF8":"rgba(255,255,255,0.1)"}`, borderRadius:20, padding:"32px 24px", position:"relative", overflow:"hidden" }}>
              {p.highlight && <div style={{ position:"absolute", top:12, right:12, background:"#818CF8", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>MÁS ELEGIDO</div>}
              <div style={{ fontSize:36, marginBottom:10 }}>{p.icon}</div>
              <div style={{ color:p.color, fontWeight:800, fontSize:20, marginBottom:8 }}>{p.id.charAt(0).toUpperCase()+p.id.slice(1)}</div>
              {pricing && (
                <div style={{ marginBottom:16 }}>
                  {descActivo ? (
                    <>
                      <div style={{ color:"rgba(255,255,255,.4)", fontSize:12, textDecoration:"line-through" }}>
                        desde ${preciosBase[p.id]["30"].toLocaleString("es-AR")}/mes
                      </div>
                      <div style={{ color:"#FCA5A5", fontWeight:800, fontSize:15 }}>
                        desde ${precios[p.id]["30"].toLocaleString("es-AR")}/mes
                      </div>
                      <span style={{ display:"inline-block", background:"#DC2626", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20, marginTop:3 }}>🏷️ {descPct}% OFF</span>
                    </>
                  ) : (
                    <div style={{ color:"rgba(255,255,255,.5)", fontSize:13 }}>
                      desde ${precios[p.id]["30"].toLocaleString("es-AR")}/mes
                    </div>
                  )}
                </div>
              )}
              <ul style={{ listStyle:"none", padding:0, margin:"0 0 24px", textAlign:"left" }}>
                {p.features.map(f=>(
                  <li key={f} style={{ color:"rgba(255,255,255,0.7)", fontSize:13, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:8 }}>
                    <span style={{ color:p.color }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>{ if(!user){ alert("Iniciá sesión para contratar un plan."); return; } setPlanSel(p.id); setMetodo(mpEnabled&&transferEnabled?null:mpEnabled?"mp":"transferencia"); }}
                style={{ width:"100%", padding:"12px", borderRadius:10, border:`1.5px solid ${p.color}`, background:p.highlight?p.color:"transparent", color:p.highlight?"#fff":p.color, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                Contratar plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TIENDA DETALLE ───────────────────────────────────────────────
function TiendaDetalle({ tienda, onClose, onVerAnuncio, siteWhatsapp }) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    getDocs(query(
      collection(db,"anuncios"),
      where("uid","==",tienda.uid),
      where("status","==","activo"),
      orderBy("createdAt","desc")
    )).then(snap=>{
      setAnuncios(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[tienda.uid]);

  const isDiamante = tienda.plan === "diamante";
  const grad = isDiamante
    ? "linear-gradient(135deg, #1E0A3C 0%, #3B0F6E 40%, #6B21A8 70%, #C026D3 100%)"
    : "linear-gradient(135deg, #064E3B 0%, #065F46 35%, #0D9488 70%, #34D399 100%)";
  const accent = isDiamante ? "#E879F9" : "#34D399";

  const handleContacto = () => {
    const num = tienda.whatsapp ? `549${tienda.whatsapp}` : `549${siteWhatsapp}`;
    const msg = encodeURIComponent(`Hola ${tienda.nombre}! Te vi en Clasificados Chapa J y me interesa conocer más.`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:250,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",
      overflowY:"auto" }}>
      <div style={{ maxWidth:860,margin:"20px auto",borderRadius:20,overflow:"hidden",
        boxShadow:"0 24px 80px rgba(0,0,0,.4)" }} onClick={e=>e.stopPropagation()}>

        {/* Header tienda */}
        <div style={{ background:grad, padding:"32px 28px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",
            border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:18 }}>✕</button>
          <div style={{ display:"flex",alignItems:"center",gap:18 }}>
            <div style={{ width:80,height:80,borderRadius:16,overflow:"hidden",background:"rgba(255,255,255,.1)",
              flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {tienda.logo
                ? <img src={tienda.logo} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : <span style={{ fontSize:36 }}>🏪</span>
              }
            </div>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                <span style={{ color:"#fff",fontWeight:900,fontSize:22,fontFamily:"'Georgia',serif" }}>{tienda.nombre}</span>
                {tienda.verificado && <span style={{ fontSize:11,fontWeight:800,background:"rgba(255,255,255,.2)",color:"#fff",borderRadius:20,padding:"2px 8px" }}>✅ Verificada</span>}
              </div>
              <div style={{ color:"rgba(255,255,255,.6)",fontSize:13,marginBottom:8 }}>{tienda.categoria}</div>
              <button onClick={handleContacto}
                style={{ padding:"8px 20px",borderRadius:10,border:`1.5px solid ${accent}`,
                  background:"rgba(255,255,255,.1)",color:"#fff",fontWeight:700,fontSize:13,
                  cursor:"pointer",fontFamily:"inherit" }}>
                💬 Contactar tienda
              </button>
            </div>
          </div>
          {tienda.descripcion && (
            <div style={{ marginTop:16,color:"rgba(255,255,255,.7)",fontSize:13,lineHeight:1.7,
              background:"rgba(0,0,0,.2)",borderRadius:10,padding:"12px 16px" }}>
              {tienda.descripcion.length>200 ? tienda.descripcion.slice(0,200)+"..." : tienda.descripcion}
            </div>
          )}
          <div style={{ display:"flex",gap:8,marginTop:12,flexWrap:"wrap" }}>
            {tienda.direccion && <span style={{ color:"rgba(255,255,255,.6)",fontSize:12 }}>📍 {tienda.direccion}</span>}
            {tienda.web && <a href={tienda.web} target="_blank" rel="noopener noreferrer" style={{ color:accent,fontSize:12,fontWeight:600 }}>🌐 Web</a>}
            {tienda.instagram && <a href={tienda.instagram} target="_blank" rel="noopener noreferrer" style={{ color:accent,fontSize:12,fontWeight:600 }}>📷 Instagram</a>}
            {tienda.facebook && <a href={tienda.facebook} target="_blank" rel="noopener noreferrer" style={{ color:accent,fontSize:12,fontWeight:600 }}>👥 Facebook</a>}
          </div>
        </div>

        {/* Anuncios de la tienda */}
        <div style={{ background:BG,padding:"24px 20px",minHeight:200 }}>
          <div style={{ fontWeight:800,fontSize:16,color:AC,marginBottom:16 }}>
            📦 Productos y servicios ({anuncios.length})
          </div>
          {loading ? <Spinner/> : anuncios.length===0 ? (
            <div style={{ textAlign:"center",padding:40,color:TL }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
              <div>Esta tienda todavía no tiene productos publicados</div>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14 }}>
              {anuncios.map(a=>(
                <div key={a.id} onClick={()=>onVerAnuncio(a)}
                  style={{ background:SF,borderRadius:12,overflow:"hidden",cursor:"pointer",
                    border:`1px solid ${BR}`,transition:"all .2s" }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <div style={{ height:130,background:`linear-gradient(135deg,${BG},#e8e8f0)`,
                    display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
                    {a.fotoPortada
                      ? <img src={a.fotoPortada} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                      : <span style={{ fontSize:40 }}>📦</span>
                    }
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700,fontSize:13,color:TX,marginBottom:4,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.titulo}</div>
                    <div style={{ fontWeight:800,fontSize:15,color:AC }}>
                      {a.precio==="Consultar"?"Consultar precio":`$${Number(a.precio).toLocaleString("es-AR")}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FrontSite({ user, userData, onLogin, onPublicar, onMiCuenta, onLegal, onComoPublicar }) {
  const [recentAds, setRecentAds] = useState([]);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [search, setSearch] = useState("");
  const [selAnuncio, setSelAnuncio] = useState(null);
  const [selCat, setSelCat] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const anunciosRef = useRef(null);
  const [loadingAds, setLoadingAds] = useState(true);
  const [homeBanners, setHomeBanners] = useState([]);
  const [heroConfig, setHeroConfig] = useState({ heroImg:"", faviconUrl:"", heroTitle:"Clasificados Chapa J", heroSub:"Los clasificados con patente sanjuanina", heroBg:"#1A1A2E" });
  const [siteWhatsapp, setSiteWhatsapp] = useState("2645461073");
  const [tiendas, setTiendas] = useState([]);
  const [vistaActiva, setVistaActiva] = useState("inicio");
  const tiendasRef = useRef(null);
  const [cats, setCats] = useState(DEFAULT_CATS);
  const [showMensajes, setShowMensajes] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [selTienda, setSelTienda] = useState(null);
  const [securityNotice, setSecurityNotice] = useState({ show:true, msg:"Nuestro equipo nunca te llamará por teléfono. Solo podés recibir WhatsApp desde el número oficial" });
  const [systemAlert, setSystemAlert] = useState({ show:false, text:"", type:"warning" });
  const [maintenance, setMaintenance] = useState({ active:false, msg:"Sitio en mantenimiento. Volvemos pronto 🔧" });
  const [socialLinks, setSocialLinks] = useState({ fb:"", ig:"" });
  const [siteInfo, setSiteInfo] = useState({ name:"Clasificados Chapa J", tagline:"Los clasificados con patente sanjuanina", logo:"🚗", copyright:'© 2026 Clasificados Chapa "J" · Paulo Andrés Álvarez · San Juan, Argentina' });

  useEffect(()=>{
    // Cargar alerta del sistema
    getDoc(doc(db,"config","alerts")).then(snap=>{
      if(snap.exists()){ const d=snap.data(); setSystemAlert({ show:d.showAlert||false, text:d.alertText||"", type:d.alertType||"warning" }); }
    }).catch(()=>{});

    // Cargar categorías dinámicas desde Firestore
    getDoc(doc(db,"config","categories")).then(snap=>{
      if(snap.exists() && snap.data().cats && snap.data().cats.length > 0){
        const activeCats = snap.data().cats.filter(c=>c.active!==false);
        setCats(activeCats);
        window.__CATS__ = activeCats;
        // Guard: si la categoría seleccionada ya no está activa, resetear
        setSelCat(prev => prev && activeCats.find(c=>c.id===prev.id) ? prev : null);
        setSelSub(null);
      } else {
        window.__CATS__ = DEFAULT_CATS;
      }
    }).catch(()=>{ window.__CATS__ = DEFAULT_CATS; });

    // Contador de mensajes no leídos (solo si hay usuario)
    if (user?.uid) {
      const qConvs = query(
        collection(db,"conversaciones"),
        where("participantes","array-contains",user.uid)
      );
      const unsubMsgs = onSnapshot(qConvs, snap => {
        const total = snap.docs.reduce((acc,d) => acc + (d.data()[`unread_${user.uid}`]||0), 0);
        setUnreadMsgs(total);
      });
      // Store unsub for cleanup — attach to window temporarily
      window.__unsubMsgs__ = unsubMsgs;
    }

    getDocs(query(collection(db,"banners"),where("active","==",true)))
      .then(snap=>setHomeBanners(snap.docs.map(d=>({id:d.id,...d.data()}))));
    getDoc(doc(db,"config","site")).then(snap=>{
      if(snap.exists()){
        if(snap.data().design) {
          setHeroConfig(prev=>({...prev,...snap.data().design}));
          // Leer mantenimiento de design o de site (dos posibles ubicaciones del toggle)
          const mActive = snap.data().design.maintenance ?? snap.data().site?.maintenance ?? false;
          const mMsg = snap.data().design.maintenanceMsg || snap.data().site?.maintenanceMsg || "Sitio en mantenimiento. Volvemos pronto 🔧";
          setMaintenance({ active: mActive, msg: mMsg });
          // Aplicar favicon dinámico
          if(snap.data().design.faviconUrl){
            const url = snap.data().design.faviconUrl + "?t=" + Date.now();
            // Favicon estándar
            ["icon","shortcut icon"].forEach(rel=>{
              let el = document.querySelector(`link[rel="${rel}"]`);
              if(!el){ el=document.createElement("link"); el.rel=rel; document.head.appendChild(el); }
              el.type="image/png"; el.href=url;
            });
            // Apple Touch Icon (iPhone/iPad)
            let apple = document.querySelector("link[rel='apple-touch-icon']");
            if(!apple){ apple=document.createElement("link"); apple.rel="apple-touch-icon"; document.head.appendChild(apple); }
            apple.href=url;
            // Apple Touch Icon precomposed
            let apple2 = document.querySelector("link[rel='apple-touch-icon-precomposed']");
            if(!apple2){ apple2=document.createElement("link"); apple2.rel="apple-touch-icon-precomposed"; document.head.appendChild(apple2); }
            apple2.href=url;
          }
        }
        if(snap.data().whatsapp) setSiteWhatsapp(snap.data().whatsapp);
        if(snap.data().site){
          const s = snap.data().site;
          setSocialLinks({ fb: s.fbUrl||"", ig: s.igUrl||"" });
          setSiteInfo(prev=>({
            ...prev,
            name: s.name||prev.name,
            tagline: s.tagline||prev.tagline,
            logo: s.logo||prev.logo,
            copyright: s.copyright||prev.copyright,
          }));
        }
        if(snap.data().security){
          setSecurityNotice({
            show: snap.data().security.showSecurityNotice !== false,
            msg: snap.data().security.securityMsg || "Nuestro equipo nunca te llamará por teléfono. Solo podés recibir WhatsApp desde el número oficial"
          });
        }
        // ── SEO dinámico ──────────────────────────────────────────
        const seo = snap.data().seo || {};
        if(seo.homeTitle) document.title = seo.homeTitle;
        const setMeta = (name, content, prop=false) => {
          const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
          let el = document.querySelector(sel);
          if(!el){ el=document.createElement("meta"); prop?el.setAttribute("property",name):el.setAttribute("name",name); document.head.appendChild(el); }
          el.setAttribute("content", content);
        };
        if(seo.homeDesc)  { setMeta("description", seo.homeDesc); setMeta("og:description", seo.homeDesc, true); }
        if(seo.homeKeys)  setMeta("keywords", seo.homeKeys);
        if(seo.homeTitle) { setMeta("og:title", seo.homeTitle, true); setMeta("twitter:title", seo.homeTitle, true); }
        if(seo.ogImage)   { setMeta("og:image", seo.ogImage, true); setMeta("twitter:image", seo.ogImage, true); }
        setMeta("og:type", "website", true);
        setMeta("og:url", window.location.href, true);
        setMeta("og:site_name", siteInfo.name||"Clasificados Chapa J", true);
        setMeta("twitter:card", "summary_large_image", true);
        if(seo.gaCode && !document.querySelector(`script[data-ga="${seo.gaCode}"]`)){
          const s1=document.createElement("script"); s1.async=true; s1.setAttribute("data-ga",seo.gaCode);
          s1.src=`https://www.googletagmanager.com/gtag/js?id=${seo.gaCode}`; document.head.appendChild(s1);
          const s2=document.createElement("script");
          s2.text=`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.gaCode}');`;
          document.head.appendChild(s2);
        }
        if(seo.fbPixel && !document.querySelector(`script[data-fbq="${seo.fbPixel}"]`)){
          const s=document.createElement("script"); s.setAttribute("data-fbq",seo.fbPixel);
          s.text=`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.fbPixel}');fbq('track','PageView');`;
          document.head.appendChild(s);
        }
      }
    }).catch(()=>{});
    getDocs(query(collection(db,"tiendas"),where("activa","==",true)))
      .then(snap=>setTiendas(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(
      query(collection(db,"anuncios"),where("status","==","activo"),orderBy("createdAt","desc"),limit(50)),
      snap=>{
        const ads = snap.docs.map(d=>({id:d.id,...d.data()}));
        // Ordenar: Diamante primero, luego Esmeralda, luego Cuarzo, dentro de cada grupo por fecha
        const planOrder = {diamante:0, esmeralda:1, cuarzo:2};
        ads.sort((a,b)=>{
          const pa = planOrder[a.plan||"cuarzo"]??2;
          const pb = planOrder[b.plan||"cuarzo"]??2;
          if(pa!==pb) return pa-pb;
          // Mismo plan → más reciente primero
          const ta = a.updatedAt?.seconds||a.createdAt?.seconds||0;
          const tb = b.updatedAt?.seconds||b.createdAt?.seconds||0;
          return tb-ta;
        });
        setRecentAds(ads);
        setLoadingAds(false);
      }
    );
    getDocs(query(collection(db,"anuncios"),where("status","==","activo"),where("plan","in",["esmeralda","diamante"]),orderBy("updatedAt","desc"),limit(6)))
      .then(snap=>{
        const ads = snap.docs.map(d=>({id:d.id,...d.data()}));
        // Diamante primero en destacados
        ads.sort((a,b)=>(a.plan==="diamante"?0:1)-(b.plan==="diamante"?0:1));
        setFeaturedAds(ads);
      });
    return ()=>unsub();
  },[]);


  const [filtroPrecio, setFiltroPrecio] = React.useState(false);
  const [filtroFotos, setFiltroFotos] = React.useState(false);
  const [filtroTiendaUid, setFiltroTiendaUid] = React.useState(null);
  const [filtroTiendaNombre, setFiltroTiendaNombre] = React.useState("");
  const [orden, setOrden] = React.useState("recientes");

  const filteredAds = recentAds.filter(a=>{
    if(search && !(a.titulo?.toLowerCase().includes(search.toLowerCase()) || a.categoria?.toLowerCase().includes(search.toLowerCase()))) return false;
    if(!search){
      if(selCat && a.categoria !== selCat.name) return false;
      if(selSub && a.subcategoria !== selSub) return false;
    }
    if(filtroTiendaUid && a.uid !== filtroTiendaUid) return false;
    if(filtroPrecio && (!a.precio || a.precio==="Consultar")) return false;
    if(filtroFotos && !a.fotoPortada) return false;
    return true;
  });

  const sortedAds = [...filteredAds].sort((a,b)=>{
    if(orden==="precio_asc") return (Number(a.precio)||0)-(Number(b.precio)||0);
    if(orden==="precio_desc") return (Number(b.precio)||0)-(Number(a.precio)||0);
    if(orden==="vistos") return (b.vistas||0)-(a.vistas||0);
    // recientes (default)
    const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0);
    const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt||0);
    return tb-ta;
  });
  const ADS_PER_PAGE = 20;
  const [catSidebarOpen, setCatSidebarOpen] = React.useState(false);
  const [catSearch, setCatSearch] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [vistaLista, setVistaLista] = React.useState(false);
  const totalPaginas = Math.ceil(sortedAds.length / ADS_PER_PAGE);
  const adsPaginados = sortedAds.slice((pagina-1)*ADS_PER_PAGE, pagina*ADS_PER_PAGE);

  const handleSelCat = (cat) => {
    const isNew = selCat?.id !== cat.id;
    setSelCat(isNew ? cat : null);
    setSelSub(null);
    setPagina(1);
    if(isNew) setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150);
  };

  const handleSelSub = (sub) => {
    setSelSub(selSub===sub ? null : sub);
    setPagina(1);
    setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150);
  };

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif",background:BG,minHeight:"100vh",overflowX:"hidden" }}>
      <Navbar user={user} onLogin={onLogin} onPublicar={onPublicar} onMiCuenta={onMiCuenta}
        onMensajes={()=>setShowMensajes(true)} unreadMsgs={unreadMsgs}
        onLogout={async()=>{ await signOut(auth); }}
        siteInfo={siteInfo}
        searchQuery={search} setSearchQuery={v=>{ setSearch(v); if(v){setVistaActiva("inicio");setSelCat(null);setSelSub(null);} }}
        onSearch={()=>{ setVistaActiva("inicio"); setPagina(1); setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100); }}
        onNavClick={(item)=>{
          if(item==="Últimos Publicados"){setVistaActiva("inicio");setSelCat(null);setSelSub(null);setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);}
          else if(item==="Tiendas Virtuales"){setVistaActiva("tiendas");setTimeout(()=>tiendasRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);}
          else{
            const cat = cats.find(c=>c.name===item||c.name.startsWith(item));
            if(cat){setVistaActiva("inicio");handleSelCat(cat);}
          }
        }}/>

      {/* Modo mantenimiento — no se muestra al admin */}
      {maintenance.active && user?.uid !== "QbAM2F4oh6NPYy38ZD9DhRVId622" && (
        <div style={{ position:"fixed", inset:0, zIndex:9998, background:"linear-gradient(135deg,#1A1A2E,#16213E)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ textAlign:"center", maxWidth:480 }}>
            <div style={{ fontSize:72, marginBottom:24 }}>🔧</div>
            <h1 style={{ color:"#fff", fontFamily:"'Georgia',serif", fontSize:32, fontWeight:700, margin:"0 0 16px" }}>En mantenimiento</h1>
            <p style={{ color:"rgba(255,255,255,.6)", fontSize:16, lineHeight:1.7, margin:"0 0 32px" }}>{maintenance.msg}</p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.1)", borderRadius:20, padding:"8px 20px" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#FF6B2B", animation:"pulse 1.5s infinite" }}/>
              <span style={{ color:"rgba(255,255,255,.6)", fontSize:13 }}>Volvemos pronto</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerta del sistema */}
      {systemAlert.show && systemAlert.text && (
        <div style={{
          background: systemAlert.type==="danger"?"#FEF2F2":systemAlert.type==="info"?"#EFF6FF":systemAlert.type==="success"?"#F0FDF4":"#FFFBEB",
          borderBottom: `3px solid ${systemAlert.type==="danger"?"#EF4444":systemAlert.type==="info"?"#3B82F6":systemAlert.type==="success"?"#22C55E":"#F59E0B"}`,
          padding:"12px 20px", textAlign:"center"
        }}>
          <span style={{ fontSize:14, fontWeight:600, color: systemAlert.type==="danger"?"#991B1B":systemAlert.type==="info"?"#1E40AF":systemAlert.type==="success"?"#15803D":"#92400E" }}>
            {systemAlert.type==="danger"?"🔴":systemAlert.type==="info"?"ℹ️":systemAlert.type==="success"?"✅":"⚠️"} {systemAlert.text}
          </span>
        </div>
      )}

      {/* Hero */}
      <div style={{
        background: heroConfig.heroImg ? "transparent" : `linear-gradient(135deg,${AC},#2D2D4E)`,
        padding:"52px 20px",textAlign:"center",position:"relative",overflow:"hidden",width:"100%",boxSizing:"border-box"
      }}>
        {heroConfig.heroImg && (
          <img src={heroConfig.heroImg} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,pointerEvents:"none" }}/>
        )}
        {heroConfig.heroImg && <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.55)",zIndex:1 }}/>}
        <div style={{ position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.05)",pointerEvents:"none" }}/>
        <div style={{ position:"relative",zIndex:2,maxWidth:680,margin:"0 auto" }}>
          <div style={{ display:"inline-block",background:"rgba(255,255,255,.15)",color:"#fff",padding:"3px 14px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:14,border:"1px solid rgba(255,255,255,.2)" }}>
            🏷️ LOS CLASIFICADOS CON PATENTE SANJUANINA
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(26px,5vw,44px)",fontFamily:"'Georgia',serif",fontWeight:700,margin:"0 0 10px",lineHeight:1.2 }}>
            {heroConfig.heroTitle||siteInfo.name||"Clasificados Chapa J"}
          </h1>
          <p style={{ color:"rgba(255,255,255,.7)",fontSize:15,margin:"0 0 28px" }}>
            {heroConfig.heroSub||siteInfo.tagline||"Comprá, vendé y encontrá lo que buscás en San Juan 🏔️"}
          </p>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
            <button onClick={onPublicar} style={{ padding:"13px 30px",borderRadius:12,background:"#fff",color:P,border:"none",cursor:"pointer",fontWeight:700,fontSize:15,fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,.2)" }}>
              + Publicar GRATIS
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:AC,padding:"14px 20px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"center",gap:"clamp(20px,6vw,60px)",flexWrap:"wrap" }}>
          {[{icon:"📋",label:"Anuncios activos",value:`${recentAds.length}+`},{icon:"🗂️",label:"Categorías",value:"26"},{icon:"🏔️",label:"San Juan",value:"100%"},{icon:"💎",label:"Planes de anuncio",value:"3"}].map(s=>(
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ color:P,fontWeight:800,fontSize:20,lineHeight:1.2 }}>{s.value}</div>
              <div style={{ color:"rgba(255,255,255,.5)",fontSize:11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorías, destacados y anuncios — solo en vista inicio */}
      {vistaActiva === "inicio" && (
        <>
      {/* Banner home-cats */}
      <BannerZone banners={homeBanners} pos="home-cats"/>

      <section style={{ maxWidth:1200,margin:"0 auto",padding:"32px 20px 0" }}>

        {/* Botón abrir categorías + selección activa */}
        <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
          <button onClick={()=>setCatSidebarOpen(true)}
            style={{ display:"inline-flex",alignItems:"center",gap:10,padding:"11px 20px",
              borderRadius:14,border:`2px solid ${P}`,background:`linear-gradient(135deg,${P},${PD})`,
              color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:14,
              boxShadow:`0 4px 20px ${P}44`,transition:"all .2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <span style={{ fontSize:20 }}>≡</span>
            Explorar categorías
            <span style={{ background:"rgba(255,255,255,.25)",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700 }}>
              {cats.length}
            </span>
          </button>

          {/* Categoría activa como pill */}
          {selCat && (
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"8px 14px",
                borderRadius:12,background:selCat.color,color:"#fff",fontWeight:700,fontSize:13 }}>
                <span>{selCat.icon}</span>
                <span>{selCat.name}</span>
                <button onClick={()=>{setSelCat(null);setSelSub(null);}}
                  style={{ background:"rgba(255,255,255,.25)",border:"none",color:"#fff",borderRadius:"50%",
                    width:20,height:20,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>
              {/* Subcategorías inline */}
              {(selCat.sub||[]).map(s=>(
                <button key={s} onClick={()=>handleSelSub(s)}
                  style={{ padding:"6px 13px",borderRadius:20,border:`1.5px solid ${selCat.color}`,
                    background:selSub===s?selCat.color:"transparent",
                    color:selSub===s?"#fff":selCat.color,
                    cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,transition:"all .2s" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SIDEBAR CATEGORÍAS ── */}
      {catSidebarOpen && (
        <>
          {/* Overlay */}
          <div onClick={()=>setCatSidebarOpen(false)}
            style={{ position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.45)",backdropFilter:"blur(3px)" }}/>

          {/* Panel */}
          <div style={{ position:"fixed",top:0,left:0,bottom:0,zIndex:401,width:320,
            background:SF,boxShadow:"4px 0 40px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",
            animation:"slideInLeft .25s ease" }}>
            <style>{`@keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

            {/* Header sidebar */}
            <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`,padding:"20px 20px 16px",flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <div>
                  <div style={{ color:"#fff",fontWeight:800,fontSize:16 }}>🗂️ Categorías</div>
                  <div style={{ color:"rgba(255,255,255,.5)",fontSize:12 }}>{cats.length} categorías disponibles</div>
                </div>
                <button onClick={()=>setCatSidebarOpen(false)}
                  style={{ width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"none",
                    color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>
              {/* Buscador interno */}
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"rgba(255,255,255,.5)" }}>🔍</span>
                <input value={catSearch} onChange={e=>setCatSearch(e.target.value)}
                  placeholder="Buscar categoría..."
                  style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.2)",
                    background:"rgba(255,255,255,.1)",color:"#fff",fontFamily:"inherit",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
              </div>
            </div>

            {/* Lista categorías */}
            <div style={{ flex:1,overflowY:"auto",padding:"8px 0" }}>
              {cats.filter(c=>!catSearch||c.name.toLowerCase().includes(catSearch.toLowerCase())).map(cat=>(
                <div key={cat.id}>
                  <button onClick={()=>{ handleSelCat(cat); setCatSidebarOpen(false); setCatSearch(""); }}
                    style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 20px",
                      border:"none",background:selCat?.id===cat.id?`${cat.color}18`:"transparent",
                      cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                      borderLeft:`3px solid ${selCat?.id===cat.id?cat.color:"transparent"}`,
                      transition:"all .15s" }}
                    onMouseEnter={e=>{ if(selCat?.id!==cat.id){ e.currentTarget.style.background=`${cat.color}10`; e.currentTarget.style.borderLeftColor=cat.color; }}}
                    onMouseLeave={e=>{ if(selCat?.id!==cat.id){ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderLeftColor="transparent"; }}}>
                    <div style={{ width:38,height:38,borderRadius:10,background:selCat?.id===cat.id?cat.color:`${cat.color}22`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,transition:"all .15s" }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:13,color:selCat?.id===cat.id?cat.color:TX }}>{cat.name}</div>
                      <div style={{ fontSize:11,color:TL }}>{cat.sub?.length||0} subcategorías</div>
                    </div>
                    {selCat?.id===cat.id && <span style={{ fontSize:16,color:cat.color }}>✓</span>}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer sidebar */}
            <div style={{ padding:"12px 16px",borderTop:`1px solid ${BR}`,flexShrink:0 }}>
              <button onClick={()=>{ setSelCat(null);setSelSub(null);setCatSidebarOpen(false); }}
                style={{ width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${BR}`,
                  background:"transparent",color:TM,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13 }}>
                🔄 Ver todos los anuncios
              </button>
            </div>
          </div>
        </>
      )}

      {/* Destacados */}
      {featuredAds.length>0 && (
        <section style={{ maxWidth:1200,margin:"0 auto",padding:"44px 20px 0" }}>
          <h2 style={{ fontFamily:"'Georgia',serif",fontSize:24,fontWeight:700,color:TX,margin:"0 0 20px" }}>⭐ Anuncios Destacados</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14 }}>
            {featuredAds.map(ad=><AdCard key={ad.id} ad={ad} featured onClick={setSelAnuncio}/>)}
          </div>
        </section>
      )}

      {/* Banner home-top */}
      <BannerZone banners={homeBanners} pos="home-top"/>
      <div style={{ background:`linear-gradient(135deg,${P},${PD})`,margin:"44px auto",borderRadius:20,maxWidth:1160,padding:"40px 36px",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-40,top:-40,width:190,height:190,borderRadius:"50%",background:"rgba(255,255,255,.07)" }}/>
        <div style={{ position:"relative" }}>
          <h2 style={{ color:"#fff",fontSize:26,fontFamily:"'Georgia',serif",margin:"0 0 6px",fontWeight:700 }}>Publicá tu anuncio gratis ahora</h2>
          <p style={{ color:"rgba(255,255,255,.75)",fontSize:14,margin:0 }}>Miles de sanjuaninos te están esperando 🏔️</p>
        </div>
        <button onClick={onPublicar} style={{ padding:"14px 32px",borderRadius:12,background:"#fff",color:P,border:"none",cursor:"pointer",fontWeight:800,fontSize:15,fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,.15)",position:"relative",zIndex:1 }}>
          + Publicar GRATIS
        </button>
      </div>

      <BannerZone banners={homeBanners} pos="home-mid"/>
      {/* Banner home-ads */}
      <BannerZone banners={homeBanners} pos="home-ads"/>
      {/* Últimos publicados */}
      <section ref={anunciosRef} style={{ maxWidth:1200,margin:"0 auto",padding:"0 20px" }}>

        {/* Título + toggle vista */}
        <div style={{ display:"flex",alignItems:"center",gap:12,margin:"0 0 14px",flexWrap:"wrap" }}>
          <h2 style={{ fontFamily:"'Georgia',serif",fontSize:24,fontWeight:700,color:TX,margin:0 }}>
            {search ? `Resultados para "${search}"` : selCat ? `${selCat.icon} ${selCat.name}${selSub?` · ${selSub}`:""}` : "🕐 Últimos Publicados"}
          </h2>
          {selCat && (
            <button onClick={()=>{setSelCat(null);setSelSub(null);setPagina(1);}}
              style={{ padding:"4px 12px",borderRadius:20,background:selCat.color+"22",border:`1px solid ${selCat.color}`,
                color:selCat.color,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>
              ✕ Limpiar filtro
            </button>
          )}
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:13,color:TL }}>{sortedAds.length} anuncio{sortedAds.length!==1?"s":""}</span>
            <div style={{ display:"flex",borderRadius:8,border:`1.5px solid ${BR}`,overflow:"hidden" }}>
              <button onClick={()=>setVistaLista(false)} title="Vista grilla"
                style={{ padding:"5px 10px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,
                  background:!vistaLista?AC:"transparent", color:!vistaLista?"#fff":TL, transition:"all .15s" }}>⊞</button>
              <button onClick={()=>setVistaLista(true)} title="Vista lista"
                style={{ padding:"5px 10px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,
                  background:vistaLista?AC:"transparent", color:vistaLista?"#fff":TL, transition:"all .15s" }}>☰</button>
            </div>
          </div>
        </div>

        {/* ── Barra de filtros ── */}
        <div style={{ background:SF,border:`1.5px solid ${BR}`,borderRadius:12,padding:"12px 18px",
          marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
          {/* Checkboxes */}
          {[
            { label:"Con Precio", val:filtroPrecio, set:v=>{setFiltroPrecio(v);setPagina(1);} },
            { label:"Con Fotos",  val:filtroFotos,  set:v=>{setFiltroFotos(v);setPagina(1);}  },
          ].map(f=>(
            <label key={f.label} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:TX,userSelect:"none" }}>
              <input type="checkbox" checked={f.val} onChange={e=>f.set(e.target.checked)}
                style={{ width:15,height:15,accentColor:P,cursor:"pointer" }}/>
              {f.label}
            </label>
          ))}

          <div style={{ width:1,height:22,background:BR,flexShrink:0 }}/>

          {/* Orden */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto" }}>
            <span style={{ fontSize:13,color:TM,fontWeight:600 }}>Orden:</span>
            <select value={orden} onChange={e=>{setOrden(e.target.value);setPagina(1);}}
              style={{ padding:"5px 10px",borderRadius:8,border:`1.5px solid ${BR}`,fontSize:13,
                fontFamily:"inherit",color:TX,background:"#fff",cursor:"pointer",outline:"none" }}>
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="vistos">Más vistos</option>
            </select>
          </div>
        </div>
        {loadingAds ? <Spinner/> : sortedAds.length===0 ? (
          <div style={{ textAlign:"center",padding:40,color:TL }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🔍</div>
            <div>{search?"No se encontraron anuncios para esa búsqueda":selCat?`Todavía no hay anuncios en ${selCat.name}. ¡Sé el primero en publicar!`:(filtroPrecio||filtroFotos)?"No hay anuncios con esos filtros":"Todavía no hay anuncios. ¡Sé el primero en publicar!"}</div>
            {filtroTiendaUid && (
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"#EEF2FF", border:"1.5px solid #818CF8", borderRadius:14, padding:"10px 16px", marginBottom:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:16 }}>🏪</span>
                <span style={{ fontWeight:700, color:"#4F46E5", fontSize:14 }}>Mostrando anuncios de: {filtroTiendaNombre}</span>
                <button onClick={()=>{ setFiltroTiendaUid(null); setFiltroTiendaNombre(""); }} style={{ marginLeft:"auto", background:"#4F46E5", color:"#fff", border:"none", borderRadius:10, padding:"5px 14px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕ Quitar filtro</button>
              </div>
            )}
            {(selCat||filtroPrecio||filtroFotos) && <button onClick={()=>{setSelCat(null);setSelSub(null);setFiltroPrecio(false);setFiltroFotos(false);}} style={{ marginTop:14,padding:"8px 20px",borderRadius:20,background:P,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Limpiar filtros</button>}
          </div>
        ) : (
          <>
            {vistaLista ? (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {adsPaginados.map(ad=><AdCardList key={ad.id} ad={ad} onClick={setSelAnuncio}/>)}
              </div>
            ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:12 }}>
              {adsPaginados.map(ad=><AdCard key={ad.id} ad={ad} onClick={setSelAnuncio}/>)}
            </div>
            )}
            {totalPaginas>1 && (
              <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:28,flexWrap:"wrap" }}>
                <button onClick={()=>{setPagina(p=>Math.max(1,p-1));anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                  disabled={pagina===1}
                  style={{ padding:"8px 18px",borderRadius:20,border:`1.5px solid ${BR}`,background:pagina===1?"#f0f0f0":BG,color:pagina===1?TL:TX,cursor:pagina===1?"default":"pointer",fontWeight:600,fontFamily:"inherit",fontSize:14 }}>
                  ← Anterior
                </button>
                {Array.from({length:totalPaginas},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>{setPagina(n);anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                    style={{ width:36,height:36,borderRadius:"50%",border:`1.5px solid ${n===pagina?P:BR}`,background:n===pagina?P:BG,color:n===pagina?"#fff":TX,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:14 }}>
                    {n}
                  </button>
                ))}
                <button onClick={()=>{setPagina(p=>Math.min(totalPaginas,p+1));anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                  disabled={pagina===totalPaginas}
                  style={{ padding:"8px 18px",borderRadius:20,border:`1.5px solid ${BR}`,background:pagina===totalPaginas?"#f0f0f0":BG,color:pagina===totalPaginas?TL:TX,cursor:pagina===totalPaginas?"default":"pointer",fontWeight:600,fontFamily:"inherit",fontSize:14 }}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── FIN VISTA INICIO ─────────────────────────────────────── */}
        </>
      )}

      {/* ── TIENDAS VIRTUALES ─────────────────────────────────────── */}
      {vistaActiva==="tiendas" && (
        <div ref={tiendasRef} style={{ background:BG, minHeight:"60vh" }}>
          {/* Hero tiendas */}
          <div style={{ background:`linear-gradient(135deg, #0F0C29, #302B63, #24243E)`, padding:"56px 20px 44px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 20% 50%, rgba(255,107,43,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%)" }}/>
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,107,43,0.15)", border:"1px solid rgba(255,107,43,0.4)", borderRadius:20, padding:"6px 16px", marginBottom:16 }}>
                <span style={{ fontSize:14 }}>🏪</span>
                <span style={{ color:"#FF6B2B", fontSize:12, fontWeight:700, letterSpacing:1 }}>TIENDAS VIRTUALES</span>
              </div>
              <h1 style={{ color:"#fff", fontSize:"clamp(24px,5vw,42px)", fontFamily:"'Georgia',serif", fontWeight:700, margin:"0 0 12px", lineHeight:1.2 }}>
                Comercios sanjuaninos,<br/><span style={{ color:"#FF6B2B" }}>un solo lugar</span>
              </h1>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:15, margin:"0 auto 28px", maxWidth:520 }}>
                Descubrí las mejores tiendas de San Juan. Productos locales, atención personalizada.
              </p>
              <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
                {[{n:tiendas.filter(t=>t.plan==="diamante").length, label:"Tiendas Diamante", color:"#818CF8"},{n:tiendas.filter(t=>t.plan==="esmeralda").length, label:"Tiendas Esmeralda", color:"#34D399"},{n:tiendas.length, label:"Total activas", color:"#FF6B2B"}].map(s=>(
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ color:s.color, fontWeight:800, fontSize:26 }}>{s.n}</div>
                    <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA para comercios */}
          <div style={{ background:`linear-gradient(90deg, ${P}, #9333EA)`, padding:"18px 20px" }}>
            <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>¿Tenés un comercio en San Juan? </span>
                <span style={{ color:"rgba(255,255,255,0.75)", fontSize:14 }}>Sumá tu tienda virtual y llegá a miles de clientes</span>
              </div>
              <button onClick={()=>{const wa="549"+siteWhatsapp;window.open(`https://wa.me/${wa}?text=${encodeURIComponent("Hola! Me interesa tener una Tienda Virtual en Clasificados Chapa J. ¿Cómo funciona?")}`, "_blank");}}
                style={{ background:"#fff", color:P, border:"none", borderRadius:10, padding:"10px 24px", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                💬 Consultá ahora
              </button>
            </div>
          </div>

          {/* Grid de tiendas */}
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"44px 20px 60px" }}>
            {tiendas.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 20px" }}>
                <div style={{ fontSize:64, marginBottom:16 }}>🏪</div>
                <div style={{ fontSize:20, fontWeight:700, color:TX, marginBottom:8 }}>Próximamente</div>
                <div style={{ color:TL, fontSize:14, marginBottom:24 }}>Las primeras tiendas de San Juan están llegando</div>
                <button onClick={()=>{const wa="549"+siteWhatsapp;window.open(`https://wa.me/${wa}?text=${encodeURIComponent("Hola! Me interesa tener una Tienda Virtual en Clasificados Chapa J.")}`, "_blank");}}
                  style={{ background:P, color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                  🚀 Ser de los primeros
                </button>
              </div>
            ) : (
              <>
                {/* Tiendas Diamante */}
                {tiendas.filter(t=>t.plan==="diamante").length > 0 && (
                  <div style={{ marginBottom:48 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                      <div style={{ width:4, height:28, borderRadius:2, background:"linear-gradient(180deg,#818CF8,#4F46E5)" }}/>
                      <h2 style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:TX, margin:0 }}>💠 Tiendas Diamante</h2>
                      <div style={{ marginLeft:"auto", background:"#EEF2FF", color:"#4F46E5", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>PREMIUM</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                      {tiendas.filter(t=>t.plan==="diamante").map(t=>(
                        <TiendaCard key={t.id} tienda={t} siteWhatsapp={siteWhatsapp} onVerTienda={setSelTienda} onVerAnunciosTienda={t=>{ setFiltroTiendaUid(t.uid); setFiltroTiendaNombre(t.nombre); setVistaActiva("inicio"); setPagina(1); setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),200); }}/>
                      ))}
                    </div>
                  </div>
                )}
                {/* Tiendas Esmeralda */}
                {tiendas.filter(t=>t.plan==="esmeralda").length > 0 && (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                      <div style={{ width:4, height:28, borderRadius:2, background:"linear-gradient(180deg,#34D399,#059669)" }}/>
                      <h2 style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:TX, margin:0 }}>💚 Tiendas Esmeralda</h2>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                      {tiendas.filter(t=>t.plan==="esmeralda").map(t=>(
                        <TiendaCard key={t.id} tienda={t} siteWhatsapp={siteWhatsapp} onVerTienda={setSelTienda} onVerAnunciosTienda={t=>{ setFiltroTiendaUid(t.uid); setFiltroTiendaNombre(t.nombre); setVistaActiva("inicio"); setPagina(1); setTimeout(()=>anunciosRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),200); }}/>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Planes para comercios */}
          <TiendaPlanesSection user={user} userData={userData} siteWhatsapp={siteWhatsapp}/>

          {/* Botón volver */}
          <div style={{ textAlign:"center", padding:"28px 20px" }}>
            <button onClick={()=>setVistaActiva("inicio")} style={{ background:"none", border:`1.5px solid ${BR}`, color:TM, padding:"10px 24px", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:"inherit" }}>
              ← Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Banner home-bottom */}
      <BannerZone banners={homeBanners} pos="home-bottom"/>

      {/* Footer */}
      <footer style={{ background:AC,color:"#fff",marginTop:44 }}>
        <div style={{ maxWidth:1200,margin:"0 auto",padding:"44px 20px 22px" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:28,marginBottom:36 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${P},${PD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>🚗</div>
                <div><div style={{ fontFamily:"'Georgia',serif",fontWeight:700,fontSize:15 }}>{siteInfo.name||'Clasificados Chapa "J"'}</div><div style={{ color:"rgba(255,255,255,.4)",fontSize:10 }}>{siteInfo.tagline||"Los clasificados con patente sanjuanina"}</div></div>
              </div>
              <p style={{ color:"rgba(255,255,255,.5)",fontSize:12,lineHeight:1.6 }}>El clasificado con identidad sanjuanina. Comprá y vendé en San Juan.</p>
            </div>
            {[{title:"Categorías",links:["Vehículos","Inmuebles","Servicios","Artículos","Tiendas Virtuales"]},{title:"Mi Cuenta",links:["Registrarme","Ingresar","Mis Anuncios","Mis Alertas","Mis Favoritos"]},{title:"Ayuda",links:["Cómo publicar","Planes Cuarzo, Esmeralda y Diamante","Seguridad","Contacto"]}].map(col=>(
              <div key={col.title}>
                <div style={{ fontWeight:700,marginBottom:10 }}>{col.title}</div>
                {col.links.map(l=>(
                  <div key={l} style={{ marginBottom:7 }}>
                    <a href="#" onClick={e=>{
                      e.preventDefault();
                      if(col.title==="Categorías"){
                        if(l==="Tiendas Virtuales"){ setVistaActiva("tiendas"); return; }
                        const cat=cats.find(c=>c.name===l||c.name.startsWith(l));
                        if(cat) handleSelCat(cat);
                      } else if(col.title==="Mi Cuenta"){
                        if(l==="Registrarme"||l==="Ingresar") onLogin();
                        else if(l==="Mis Anuncios"||l==="Mi Perfil"||l==="Mi Plan"||l==="Mis Alertas"||l==="Mis Favoritos") user?onMiCuenta():onLogin();
                      } else if(col.title==="Ayuda"){
                        if(l==="Cómo publicar") onComoPublicar();
                        else if(l==="Planes Cuarzo, Esmeralda y Diamante") onMiCuenta("plan");
                        else if(l==="Contacto") {
                          const D = DATOS_LEGALES;
                          const overlay = document.createElement("div");
                          overlay.id = "contacto-modal";
                          overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Nunito,sans-serif";
                          overlay.innerHTML = `
                            <div style="background:#fff;border-radius:16px;padding:32px 28px;max-width:380px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);position:relative">
                              <button onclick="document.getElementById('contacto-modal').remove()" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#6B7280;line-height:1">✕</button>
                              <div style="text-align:center;margin-bottom:20px">
                                <div style="font-size:36px;margin-bottom:8px">📬</div>
                                <div style="font-weight:800;font-size:18px;color:#1E293B">Contacto</div>
                                <div style="font-size:13px;color:#64748B;margin-top:4px">Clasificados Chapa "J"</div>
                              </div>
                              <div style="display:flex;flex-direction:column;gap:12px">
                                <a href="mailto:${D.email}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:#FFF7ED;border:1.5px solid #FED7AA;text-decoration:none">
                                  <span style="font-size:22px">📧</span>
                                  <div>
                                    <div style="font-size:11px;font-weight:700;color:#EA580C;margin-bottom:2px">EMAIL</div>
                                    <div style="font-size:14px;font-weight:600;color:#1E293B">${D.email}</div>
                                  </div>
                                </a>
                                <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:#F0FDF4;border:1.5px solid #BBF7D0">
                                  <span style="font-size:22px">📞</span>
                                  <div>
                                    <div style="font-size:11px;font-weight:700;color:#16A34A;margin-bottom:2px">TELÉFONO / WHATSAPP</div>
                                    <div style="font-size:14px;font-weight:600;color:#1E293B">${D.whatsapp}</div>
                                  </div>
                                </div>
                              </div>
                              <div style="margin-top:16px;padding:10px 14px;background:#F8FAFC;border-radius:10px;font-size:12px;color:#64748B;text-align:center;line-height:1.6">
                                Horario de atención: Lunes a Viernes 9 a 18hs
                              </div>
                            </div>`;
                          document.body.appendChild(overlay);
                          overlay.addEventListener("click", e => { if(e.target===overlay) overlay.remove(); });
                        }
                        else if(l==="Seguridad") onLegal("seguridad");
                      }
                    }} style={{ color:"rgba(255,255,255,.5)",fontSize:12,textDecoration:"none" }}>{l}</a>
                  </div>
                ))}
                {col.title==="Ayuda" && <div style={{ marginBottom:7 }}><a href="#" onClick={e=>{e.preventDefault();onLegal();}} style={{ color:"rgba(255,255,255,.5)",fontSize:12,textDecoration:"none" }}>Términos y Privacidad</a></div>}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
            <div style={{ color:"rgba(255,255,255,.3)",fontSize:11 }}>{siteInfo.copyright||'© 2026 Clasificados Chapa "J" · Paulo Andrés Álvarez · San Juan, Argentina'}</div>
            <div style={{ display:"flex",gap:14 }}>
              {[
                { label:"📘 Facebook", href: socialLinks.fb },
                { label:"📸 Instagram", href: socialLinks.ig },
                { label:"💬 WhatsApp", href: siteWhatsapp ? `https://wa.me/549${siteWhatsapp}` : "#" },
              ].map(s=>(
                <a key={s.label} href={s.href||"#"} target={s.href&&s.href!=="#"?"_blank":"_self"} rel="noopener noreferrer"
                  style={{ color:s.href?"rgba(255,255,255,.6)":"rgba(255,255,255,.3)",fontSize:11,textDecoration:"none" }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:12,marginTop:12,textAlign:"center" }}>
            <div style={{ color:"rgba(255,255,255,.25)",fontSize:10,lineHeight:1.8 }}>
              Base de datos inscripta ante la AAIP · Ley 25.326 · Legajo RL-2026-46646399-APN-DNPDP#AAIP · Expediente EX-2026-46661004-APN-DNPDP#AAIP
            </div>
          </div>
        </div>
      </footer>

      {/* Aviso seguridad */}
      {securityNotice.show && (
        <div style={{ maxWidth:1200,margin:"-20px auto 44px",padding:"0 20px" }}>
          <div style={{ background:"#FFF8E1",border:"1.5px solid #F5A623",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12 }}>
            <div style={{ fontSize:20,flexShrink:0 }}>⚠️</div>
            <div style={{ fontSize:13,color:"#78350F",lineHeight:1.5 }}>
              <strong>Aviso de seguridad:</strong> {securityNotice.msg} <strong>{siteWhatsapp}</strong>.
            </div>
          </div>
        </div>
      )}

      {showMensajes && user && <MensajesModal user={user} onClose={()=>setShowMensajes(false)}/>}
      {selTienda && <TiendaDetalle tienda={selTienda} siteWhatsapp={siteWhatsapp} onClose={()=>setSelTienda(null)} onVerAnuncio={ad=>{ setSelTienda(null); setSelAnuncio(ad); }}/>}
      {selAnuncio && <AnuncioDetalle anuncio={selAnuncio} onClose={()=>setSelAnuncio(null)} user={user}/>}
    </div>
  );
}

const MOCK_ADS_ADMIN = [
  { id:2629688, title:"Zapatillas Hockey",       user:"mgarcia@gmail.com",    cat:"Deportes",  status:"activo",    price:"$50.000",      type:"cuarzo", date:"09/05/2026", reports:0 },
  { id:2629687, title:"Volkswagen High Up 2017", user:"autos.sj@gmail.com",   cat:"Vehículos", status:"activo",    price:"$14.000.000",  type:"diamante",    date:"09/05/2026", reports:0 },
  { id:2629686, title:"Camperas + Trajes",       user:"modajuan@gmail.com",   cat:"Ropa",      status:"pendiente", price:"Consultar",    type:"cuarzo", date:"09/05/2026", reports:1 },
  { id:2629682, title:"Moto G71 5G en Caja",     user:"celularessj@gmail.com",cat:"Celulares", status:"activo",    price:"$150.000",     type:"esmeralda",  date:"08/05/2026", reports:0 },
  { id:2629680, title:"Renault Sandero 2013",    user:"permutas.sj@gmail.com",cat:"Vehículos", status:"suspendido",price:"$11.000.000",  type:"cuarzo", date:"08/05/2026", reports:2 },
  { id:2629677, title:"Silla Escritorio",        user:"muebles99@gmail.com",  cat:"Hogar",     status:"activo",    price:"$60.000",      type:"cuarzo", date:"08/05/2026", reports:0 },
];

const MOCK_USERS = [
  { id:1001, name:"María García",  email:"mgarcia@gmail.com",    role:"usuario", ads:5,  date:"12/01/2024", status:"activo",    verified:true  },
  { id:1002, name:"Autos SJ",     email:"autos.sj@gmail.com",   role:"tienda",  ads:42, date:"03/08/2022", status:"activo",    verified:true  },
  { id:1003, name:"Moda Juan",    email:"modajuan@gmail.com",   role:"usuario", ads:12, date:"22/11/2023", status:"suspendido",verified:false },
  { id:1004, name:"Permutas SJ",  email:"permutas.sj@gmail.com",role:"tienda",  ads:18, date:"01/06/2021", status:"activo",    verified:true  },
  { id:1005, name:"Celulares SJ", email:"celularessj@gmail.com",role:"usuario", ads:7,  date:"18/04/2025", status:"activo",    verified:true  },
];

const MOCK_REPORTS = [
  { id:1, adId:2629686, title:"Camperas + Trajes",  reporter:"usuario123@gmail.com", reason:"Contenido engañoso",      date:"09/05/2026", status:"pendiente" },
  { id:2, adId:2629680, title:"Renault Sandero 2013",reporter:"otro@gmail.com",      reason:"Precio incorrecto / estafa",date:"08/05/2026", status:"revisando" },
  { id:3, adId:2629670, title:"iPhone 14 Pro",       reporter:"denuncias@gmail.com", reason:"Producto robado",          date:"07/05/2026", status:"resuelto"  },
];

const MOCK_CATEGORIES_ADMIN = [
  { id:1, name:"Vehículos",  icon:"🚗", ads:11401, active:true, order:1 },
  { id:2, name:"Inmuebles",  icon:"🏠", ads:12484, active:true, order:2 },
  { id:3, name:"Servicios",  icon:"🔧", ads:7736,  active:true, order:3 },
  { id:4, name:"Artículos",  icon:"📦", ads:56120, active:true, order:4 },
  { id:5, name:"Electrónica",icon:"📱", ads:4280,  active:true, order:5 },
  { id:6, name:"Ropa & Moda",icon:"👗", ads:4415,  active:true, order:6 },
];

const MOCK_BANNERS = [
  { id:1, name:"Banner Principal Home",  pos:"home-top",       active:true,  clicks:1240, views:45000 },
  { id:2, name:"Banner Lateral Cat.",    pos:"category-side",  active:true,  clicks:580,  views:22000 },
  { id:3, name:"Banner Footer",          pos:"footer",         active:false, clicks:90,   views:8000  },
];

const ADMIN_MENU = [
  { id:"dashboard",  icon:"📊", label:"Dashboard"           },
  { id:"site",       icon:"⚙️", label:"Config. del Sitio"   },
  { id:"design",     icon:"🎨", label:"Apariencia & Diseño" },
  { id:"ads",        icon:"📋", label:"Gestión de Anuncios" },
  { id:"users",      icon:"👥", label:"Usuarios"            },
  { id:"stores",     icon:"🏪", label:"Tiendas Virtuales"   },
  { id:"categories", icon:"🗂️", label:"Categorías"          },
  { id:"pricing",    icon:"💰", label:"Planes & Precios"    },
  { id:"banners",    icon:"📣", label:"Banners Publicitarios"},
  { id:"moderation", icon:"🚨", label:"Moderación"          },
  { id:"pagos",       icon:"💸", label:"Pagos & Comprobantes" },
  { id:"seo",        icon:"🔍", label:"SEO & Meta Tags"     },
  { id:"email",      icon:"📧", label:"Emails & Notif."     },
  { id:"alerts",     icon:"🔔", label:"Alertas del Sistema" },
  { id:"analytics",  icon:"📈", label:"Analíticas"          },
  { id:"pages",      icon:"📄", label:"Páginas Estáticas"   },
  { id:"security",   icon:"🔒", label:"Seguridad"           },
  { id:"backup",     icon:"💾", label:"Backup & Log"        },
];

const INIT_CFG = {
  site: {
    name:"Clasificados Chapa J", tagline:"Los clasificados con patente sanjuanina",
    logo:"🛒", url:"https://www.clasificadoschapaJ.com.ar", email:"info@clasificadoschapaJ.com",
    phone:"2645461073", whatsapp:"2645461073", address:"San Juan, Argentina",
    footerText:"Clasificados Chapa J - clasificadoschapaJ.com.ar",
    copyright:"© 2026 Clasificados Chapa J",
    fbUrl:"https://facebook.com/clasificadoschapaJ", igUrl:"https://instagram.com/clasificadoschapaJ",
    maintenance:false, maintenanceMsg:"Sitio en mantenimiento. Volvemos pronto.",
    registrationOpen:true, adsWithoutLogin:false,
    timezone:"America/Argentina/San_Juan", currency:"ARS", currencySymbol:"$",
    dateFormat:"DD/MM/YYYY", language:"es", resultsPerPage:"20", mapsProvider:"google", googleMapsKey:"",
  },
  design: {
    primaryColor:"#FF6B2B", secondaryColor:"#1A1A2E", accentColor:"#F5A623", bgColor:"#F7F7FA",
    fontFamily:"Nunito", layoutWidth:"1200", adCardStyle:"rounded",
    heroTitle:"Clasificados Chapa J",
    heroSub:"Los clasificados con patente sanjuanina",
    heroBg:"#1A1A2E",
    heroImg:"",
    showStats:true, showFeatured:true, showRecent:true, showStores:true, showBanner:true,
    featuredCount:"6", recentCount:"8", storesCount:"6", customCSS:"",
    maintenance:false, maintenanceMsg:"Sitio en mantenimiento. Volvemos pronto 🔧",
  },
  pricing: {
    normalFree:true,
    plataPrice:"4600", plataVigencia:"30",
    oroPrice:"9200", oroVigencia:"30",
    tiendaPlata30:"8600", tiendaPlata90:"23000", tiendaPlata180:"41000",
    tiendaOro30:"16000", tiendaOro90:"45000", tiendaOro180:"85000",
    descAnunciosActivo:false, descAnunciosPct:"10",
    descTiendaActivo:false, descTiendaPct:"10",
    bannerTop30:"15000", bannerTop90:"40000",
    bannerAds30:"10000", bannerAds90:"27000",
    bannerMid30:"8000",  bannerMid90:"22000",
    bannerCats30:"6000", bannerCats90:"16000",
    bannerBottom30:"4000", bannerBottom90:"11000",
    vigenciaArticulos:"30", vigenciaInmuebles:"60", vigenciaServicios:"90",
    maxFotos:"20", maxAlertasGratis:"10", alertasDestacado:"20",
    paypalEnabled:false, paypalEmail:"",
    mercadopagoEnabled:true, mercadopagoKey:"",
    transferEnabled:true, transferInstructions:"Transferir a CBU ...",
  },
  seo: {
    homeTitle:"Clasificados Chapa J - Clasificados gratuitos",
    homeDesc:"Los clasificados con patente sanjuanina. Comprá y vendé en San Juan.",
    homeKeys:"clasificados, san juan, argentina, compraventa, usados",
    ogImage:"", robotsTxt:"User-agent: *\nAllow: /",
    sitemapEnabled:true, canonicalEnabled:true, schemaEnabled:true,
    gaCode:"", fbPixel:"426177092711261", gtmCode:"",
  },
  email: {
    smtpHost:"smtp.gmail.com", smtpPort:"587",
    smtpUser:"info@clasificadoschapaJ.com", smtpPass:"",
    smtpFrom:"Clasificados Chapa J <info@clasificadoschapaJ.com>",
    welcomeSubject:"Bienvenido a Clasificados Chapa J!",
    welcomeBody:"Hola {nombre}, gracias por registrarte...",
    adApprovedSubject:"Tu anuncio fue aprobado",
    adExpiredSubject:"Tu anuncio está por vencer",
    adExpiredDays:"3", consultaSubject:"Recibiste una consulta",
    notifyAdminNewAd:true, notifyAdminNewUser:true, notifyAdminReport:true,
  },
  security: {
    recaptchaEnabled:true, recaptchaKey:"", recaptchaSecret:"",
    maxLoginAttempts:"5", loginLockMinutes:"30", sessionHours:"24",
    requireEmailVerify:true, requirePhoneVerify:false,
    ipBanEnabled:true, wordFilter:"estafa, fraude, phishing",
    spamKeywords:"http://, gana dinero, click aqui", twoFactorEnabled:false,
    // Admin access security
    adminUser:"admin",
    adminPass:"Admin2026!",
    adminHotkey:"KeyA",       // letter key (combined with Ctrl+Shift)
    adminHotkeyCtrl:true,
    adminHotkeyShift:true,
    adminHotkeyAlt:false,
    adminMaxAttempts:"3",
    adminLockMinutes:"15",
    adminSessionMinutes:"60",
    showSecurityNotice:true,
    securityMsg:"Nuestro equipo nunca te llamará por teléfono. Solo podés recibir WhatsApp desde el número oficial",
  },
};

// ════════════════════════════════════════════════════════════════
//  UI ATOMS (shared)
// ════════════════════════════════════════════════════════════════
const Pill = ({ label, color }) => (
  <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:color+"22", color }}>{label}</span>
);


const ColPick = ({ label, value, onChange }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:13, fontWeight:600, color:TEXT_MID, marginBottom:5 }}>{label}</label>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:42, height:42, borderRadius:8, border:`1px solid ${BORDER}`, cursor:"pointer", padding:2 }} />
      <input type="text" value={value} onChange={e=>onChange(e.target.value)}
        style={{ flex:1, padding:"9px 13px", borderRadius:8, border:`1.5px solid ${BORDER}`,
          fontSize:13, fontFamily:"monospace", outline:"none", color:TEXT }} />
    </div>
  </div>
);

const Tbl = ({ headers, rows }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
      <thead>
        <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
          {headers.map(h=><th key={h} style={{ padding:"9px 12px", textAlign:"left", fontWeight:700, color:TEXT_MID, whiteSpace:"nowrap" }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row,i)=>(
          <tr key={i} style={{ borderBottom:`1px solid ${BORDER}`, background:i%2===0?"#fff":"#FAFAFA" }}>
            {row.map((cell,j)=><td key={j} style={{ padding:"9px 12px", color:TEXT, verticalAlign:"middle" }}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{ background:SURFACE, borderRadius:14, border:`1px solid ${BORDER}`, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
    <div style={{ width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, background:color+"18", flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:TEXT }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, color:TEXT_MID }}>{label}</div>
      {sub && <div style={{ fontSize:11, color, marginTop:1 }}>{sub}</div>}
    </div>
  </div>
);

const SecTitle = ({ children, sub }) => (
  <div style={{ marginBottom:20 }}>
    <h2 style={{ fontSize:20, fontWeight:800, color:TEXT, margin:0 }}>{children}</h2>
    {sub && <p style={{ fontSize:13, color:TEXT_LIGHT, margin:"3px 0 0" }}>{sub}</p>}
  </div>
);

const Tog = ({ label, checked, onChange, hint }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:12 }}>
    <div>
      <div style={{ fontSize:14, fontWeight:500, color:TEXT }}>{label}</div>
      {hint && <div style={{ fontSize:12, color:TEXT_LIGHT }}>{hint}</div>}
    </div>
    <div onClick={()=>onChange(!checked)} style={{
      width:42, height:22, borderRadius:11, cursor:"pointer", flexShrink:0,
      background:checked?PRIMARY:BORDER, position:"relative", transition:"background .2s",
    }}>
      <div style={{ position:"absolute", top:2, left:checked?22:2, width:18, height:18,
        borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
//  ADMIN SECTIONS
// ════════════════════════════════════════════════════════════════
function ADashboard() {
  const [stats, setStats] = useState({ anunciosActivos:0, totalUsuarios:0, tiendasActivas:0, denunciasPendientes:0 });
  const [recentAds, setRecentAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchStats = async () => {
      try {
        const [anuncios, usuarios, tiendas, denuncias] = await Promise.all([
          getDocs(query(collection(db,"anuncios"),where("status","==","activo"))),
          getDocs(collection(db,"usuarios")),
          getDocs(query(collection(db,"tiendas"),where("activa","==",true))),
          getDocs(query(collection(db,"denuncias"),where("status","==","pendiente"))),
        ]);
        setStats({
          anunciosActivos: anuncios.size,
          totalUsuarios: usuarios.size,
          tiendasActivas: tiendas.size,
          denunciasPendientes: denuncias.size,
        });
        const q = query(collection(db,"anuncios"),orderBy("createdAt","desc"),limit(5));
        const snap = await getDocs(q);
        setRecentAds(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStats();
  },[]);

  const kpis=[
    {icon:"📋",label:"Anuncios activos",value:stats.anunciosActivos.toLocaleString(),sub:"En tiempo real",color:PRIMARY},
    {icon:"👥",label:"Usuarios registrados",value:stats.totalUsuarios.toLocaleString(),sub:"Total acumulado",color:INFO},
    {icon:"🏪",label:"Tiendas Virtuales",value:stats.tiendasActivas.toLocaleString(),sub:"Activas",color:SUCCESS},
    {icon:"🚨",label:"Denuncias pendientes",value:stats.denunciasPendientes.toLocaleString(),sub:"Requieren revisión",color:DANGER},
  ];

  return (
    <div>
      <SecTitle sub="Resumen del estado actual del portal">Dashboard General</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12, marginBottom:24 }}>
        {kpis.map(k=><StatCard key={k.label} {...k} />)}
      </div>
      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⚡ Últimos anuncios publicados</div>
        {loading ? <div style={{ textAlign:"center", padding:20, color:TEXT_LIGHT }}>Cargando...</div> :
          recentAds.length === 0 ? <div style={{ textAlign:"center", padding:20, color:TEXT_LIGHT }}>No hay anuncios aún</div> :
          <Tbl headers={["Título","Categoría","Usuario","Plan","Estado","Hace"]} rows={recentAds.map(a=>[
            <span style={{ fontWeight:600 }}>{a.titulo}</span>,
            a.categoria||"—",
            <span style={{ color:INFO, fontSize:12 }}>{a.nombreVendedor||"—"}</span>,
            <Pill label={(a.plan||"cuarzo").toUpperCase()} color={a.plan==="diamante"?"#1D4ED8":a.plan==="esmeralda"?"#16A34A":"#6B7280"}/>,
            <Pill label={a.status||"activo"} color={a.status==="activo"?SUCCESS:a.status==="pendiente"?WARNING:DANGER}/>,
            <span style={{ color:TEXT_LIGHT, fontSize:12 }}>{timeAgo(a.createdAt)}</span>,
          ])} />
        }
      </Card>
    </div>
  );
}

function ASiteConfig({cfg,set,onSave,onDiscard}) {
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{ await onSave?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div>
      <SecTitle sub="Configuración global del portal">⚙️ Configuración del Sitio</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🏷️ Identidad</div>
          <Inp label="Nombre del sitio" value={cfg.name} onChange={set("name")} />
          <Inp label="Slogan / Tagline" value={cfg.tagline} onChange={set("tagline")} />
          <Inp label="URL del sitio" value={cfg.url} onChange={set("url")} />
          <Inp label="Logo (emoji o URL)" value={cfg.logo} onChange={set("logo")} />
          <Inp label="Texto del footer" value={cfg.footerText} onChange={set("footerText")} />
          <Inp label="Copyright" value={cfg.copyright} onChange={set("copyright")} />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📞 Contacto & Redes</div>
          <Inp label="Email" value={cfg.email} onChange={set("email")} type="email" />
          <Inp label="Teléfono" value={cfg.phone} onChange={set("phone")} />
          <Inp label="WhatsApp oficial" value={cfg.whatsapp} onChange={set("whatsapp")} hint="Solo este número contacta en nombre del sitio" />
          <Inp label="Dirección" value={cfg.address} onChange={set("address")} />
          <Inp label="Facebook URL" value={cfg.fbUrl} onChange={set("fbUrl")} />
          <Inp label="Instagram URL" value={cfg.igUrl} onChange={set("igUrl")} />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🌐 Regional</div>
          <Sel label="Idioma" value={cfg.language} onChange={set("language")} options={[{value:"es",label:"Español"},{value:"en",label:"English"},{value:"pt",label:"Português"}]} />
          <Sel label="Zona horaria" value={cfg.timezone} onChange={set("timezone")} options={[{value:"America/Argentina/San_Juan",label:"Argentina/San Juan"},{value:"UTC",label:"UTC"}]} />
          <Sel label="Moneda" value={cfg.currency} onChange={set("currency")} options={[{value:"ARS",label:"Pesos (ARS)"},{value:"USD",label:"Dólares (USD)"}]} />
          <Inp label="Símbolo moneda" value={cfg.currencySymbol} onChange={set("currencySymbol")} />
          <Sel label="Formato de fecha" value={cfg.dateFormat} onChange={set("dateFormat")} options={[{value:"DD/MM/YYYY",label:"DD/MM/YYYY"},{value:"MM/DD/YYYY",label:"MM/DD/YYYY"}]} />
          <Sel label="Resultados por página" value={cfg.resultsPerPage} onChange={set("resultsPerPage")} options={["10","20","30","50"].map(v=>({value:v,label:v}))} />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🛠️ Funciones</div>
          <Sel label="Proveedor de mapas" value={cfg.mapsProvider} onChange={set("mapsProvider")} options={[{value:"google",label:"Google Maps"},{value:"osm",label:"OpenStreetMap"}]} />
          <Inp label="Google Maps API Key" value={cfg.googleMapsKey} onChange={set("googleMapsKey")} type="password" />
          <div style={{ marginTop:8 }} />
          <Tog label="Modo mantenimiento" checked={cfg.maintenance} onChange={set("maintenance")} hint="Muestra aviso a visitantes" />
          {cfg.maintenance && <Txta label="Mensaje de mantenimiento" value={cfg.maintenanceMsg} onChange={set("maintenanceMsg")} rows={2} />}
          <Tog label="Registro abierto" checked={cfg.registrationOpen} onChange={set("registrationOpen")} />
          <Tog label="Publicar sin registrarse" checked={cfg.adsWithoutLogin} onChange={set("adsWithoutLogin")} hint="No recomendado" />
        </Card>
      </div>
      <div style={{ marginTop:18, display:"flex", gap:10 }}>
        <Btn onClick={handleSave}>{saved?"✅ Guardado!":"💾 Guardar"}</Btn>
        <Btn outline color={TEXT_MID} onClick={()=>onDiscard?.()}>↩ Descartar</Btn>
      </div>
    </div>
  );
}

function ADesign({cfg,set,onSave}) {
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{ await onSave?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div>
      <SecTitle sub="Personalización visual completa">🎨 Apariencia & Diseño</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🎨 Colores</div>
          <ColPick label="Color primario" value={cfg.primaryColor} onChange={set("primaryColor")} />
          <ColPick label="Color secundario" value={cfg.secondaryColor} onChange={set("secondaryColor")} />
          <ColPick label="Color de acento" value={cfg.accentColor} onChange={set("accentColor")} />
          <ColPick label="Color de fondo" value={cfg.bgColor} onChange={set("bgColor")} />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>✏️ Tipografía & Layout</div>
          <Sel label="Fuente" value={cfg.fontFamily} onChange={set("fontFamily")} options={["Nunito","Inter","Poppins","Roboto","Open Sans"].map(v=>({value:v,label:v}))} />
          <Inp label="Ancho máximo (px)" value={cfg.layoutWidth} onChange={set("layoutWidth")} type="number" />
          <Sel label="Estilo de cards" value={cfg.adCardStyle} onChange={set("adCardStyle")} options={[{value:"rounded",label:"Redondeado"},{value:"sharp",label:"Cuadrado"},{value:"soft",label:"Suave"}]} />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🖼️ Hero / Portada</div>
          <Inp label="Título principal" value={cfg.heroTitle} onChange={set("heroTitle")} />
          <Inp label="Subtítulo" value={cfg.heroSub} onChange={set("heroSub")} />
          <ColPick label="Color de fondo del hero" value={cfg.heroBg} onChange={set("heroBg")} />
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:600,color:TX,marginBottom:6 }}>Imagen de fondo del hero</div>
            {cfg.heroImg && (
              <div style={{ position:"relative",marginBottom:10,borderRadius:10,overflow:"hidden",height:120 }}>
                <img src={cfg.heroImg} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <span style={{ color:"#fff",fontSize:12,fontWeight:600 }}>Vista previa</span>
                </div>
                <button onClick={()=>set("heroImg")("")} style={{ position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14 }}>✕</button>
              </div>
            )}
            <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:8,border:`1.5px dashed ${BR}`,background:BG }}>
              <span style={{ fontSize:18 }}>📷</span>
              <span style={{ fontSize:13,color:TL }}>{cfg.heroImg?"Cambiar imagen":"Subir imagen de fondo"}</span>
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e=>{
                const file = e.target.files[0];
                if(!file) return;
                try {
                  const sRef = ref(storage,`hero/portada_${Date.now()}.jpg`);
                  const task = uploadBytesResumable(sRef, file, { contentType: file.type });
                  task.on("state_changed", null, null, async()=>{
                    const url = await getDownloadURL(task.snapshot.ref);
                    set("heroImg")(url);
                  });
                } catch(err){ console.error(err); }
              }}/>
            </label>
            <div style={{ fontSize:11,color:TL,marginTop:6 }}>Recomendado: imagen horizontal 1400×500px. Si no hay imagen se usa el color de fondo.</div>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📐 Secciones visibles</div>
          <Tog label="Barra de estadísticas" checked={cfg.showStats} onChange={set("showStats")} />
          <Tog label="Anuncios destacados" checked={cfg.showFeatured} onChange={set("showFeatured")} />
          <Tog label="Últimos publicados" checked={cfg.showRecent} onChange={set("showRecent")} />
          <Tog label="Tiendas Virtuales" checked={cfg.showStores} onChange={set("showStores")} />
          <Tog label="Banner de publicación" checked={cfg.showBanner} onChange={set("showBanner")} />
          <Inp label="Cant. destacados en home" value={cfg.featuredCount} onChange={set("featuredCount")} type="number" />
          <Inp label="Cant. últimos publicados" value={cfg.recentCount} onChange={set("recentCount")} type="number" />
          <div style={{ marginTop:8, paddingTop:12, borderTop:`1px solid ${BORDER}` }}>
            <Tog label="🔧 Modo mantenimiento" checked={cfg.maintenance||false} onChange={set("maintenance")} hint="Muestra aviso a visitantes (vos seguís viendo el sitio normal)"/>
            {cfg.maintenance && <Txta label="Mensaje de mantenimiento" value={cfg.maintenanceMsg||""} onChange={set("maintenanceMsg")} rows={2}/>}
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🌐 Favicon (ícono de pestaña)</div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", background:BG, border:`1.5px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {cfg.faviconUrl
                ? <img src={cfg.faviconUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontSize:24 }}>🌐</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"9px 12px", borderRadius:8, border:`1.5px dashed ${BR}`, background:BG }}>
                <span style={{ fontSize:16 }}>📷</span>
                <span style={{ fontSize:13, color:TL }}>{cfg.faviconUrl ? "Cambiar favicon" : "Subir favicon"}</span>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e=>{
                  const file = e.target.files[0]; if(!file) return;
                  try {
                    const sRef = ref(storage, `favicon/favicon_${Date.now()}.png`);
                    const task = uploadBytesResumable(sRef, file, { contentType: file.type });
                    task.on("state_changed", null, null, async()=>{
                      const url = await getDownloadURL(task.snapshot.ref);
                      set("faviconUrl")(url);
                    });
                  } catch(err){ console.error(err); }
                }}/>
              </label>
              <div style={{ fontSize:11, color:TL, marginTop:5 }}>Recomendado: imagen cuadrada 512×512px PNG</div>
              {cfg.faviconUrl && <button onClick={()=>set("faviconUrl")("")} style={{ marginTop:6, background:"none", border:"none", color:DANGER, fontSize:12, cursor:"pointer", padding:0 }}>✕ Quitar favicon</button>}
            </div>
          </div>
        </Card>
        <Card style={{ gridColumn:"1 / -1" }}>
          <div style={{ fontWeight:700, marginBottom:10 }}>💻 CSS personalizado</div>
          <textarea value={cfg.customCSS} onChange={e=>set("customCSS")(e.target.value)}
            placeholder="/* Tu CSS acá */&#10;.navbar { background: red; }" rows={5}
            style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1.5px solid ${BORDER}`,
              fontSize:13, fontFamily:"monospace", outline:"none", color:TEXT, boxSizing:"border-box", resize:"vertical" }}
          />
        </Card>
      </div>
      <div style={{ marginTop:18, display:"flex", gap:10 }}>
        <Btn onClick={handleSave}>{saved?"✅ Guardado!":"💾 Guardar apariencia"}</Btn>
        <Btn outline color={TEXT_MID} onClick={()=>window.open("https://www.clasificadoschapaj.com.ar","_blank")}>👁️ Vista previa</Btn>
      </div>
    </div>
  );
}

function AAds() {
  const [filter,setFilter]=useState("todos");
  const [search,setSearch]=useState("");
  const [ads,setAds]=useState([]);
  const [loading,setLoading]=useState(true);
  const [planModal,setPlanModal]=useState(null); // {id, titulo, plan}
  const [planSel,setPlanSel]=useState("esmeralda");
  const [desde,setDesde]=useState("");
  const [hasta,setHasta]=useState("");
  const [saving,setSaving]=useState(false);
  const SC={activo:SUCCESS,pendiente:WARNING,suspendido:DANGER};

  useEffect(()=>{
    getDocs(query(collection(db,"anuncios"),orderBy("createdAt","desc"),limit(100)))
      .then(snap=>{ setAds(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const handleStatus = async (id, status) => {
    await updateDoc(doc(db,"anuncios",id),{status,updatedAt:serverTimestamp()});
    setAds(prev=>prev.map(a=>a.id===id?{...a,status}:a));
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Eliminar este anuncio?")) return;
    await deleteDoc(doc(db,"anuncios",id));
    setAds(prev=>prev.filter(a=>a.id!==id));
  };

  const openPlanModal = (ad) => {
    setPlanModal(ad);
    setPlanSel(ad.plan||"cuarzo");
    const hoy = new Date().toISOString().split("T")[0];
    setDesde(hoy);
    // Default 30 days
    const fin = new Date(); fin.setDate(fin.getDate()+30);
    setHasta(fin.toISOString().split("T")[0]);
  };

  const handleSavePlan = async () => {
    if(!planModal) return;
    setSaving(true);
    try {
      const data = {
        plan: planSel,
        planDesde: desde,
        planHasta: hasta,
        updatedAt: serverTimestamp(),
      };
      if(planSel==="cuarzo") { data.planDesde=""; data.planHasta=""; }
      await updateDoc(doc(db,"anuncios",planModal.id), data);
      setAds(prev=>prev.map(a=>a.id===planModal.id?{...a,...data}:a));
      setPlanModal(null);
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  };

  const diasRestantes = (hasta) => {
    if(!hasta) return null;
    const diff = Math.ceil((new Date(hasta)-new Date())/(1000*60*60*24));
    return diff;
  };

  const filtered = ads.filter(a=>
    (filter==="todos"||a.status===filter) &&
    (!search||a.titulo?.toLowerCase().includes(search.toLowerCase())||a.nombreVendedor?.includes(search))
  );

  return (
    <div>
      <SecTitle sub="Revisá, aprobá, destacá o eliminá anuncios">📋 Gestión de Anuncios</SecTitle>

      {/* Plan Modal */}
      {planModal && (
        <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
          <div style={{ background:SF,borderRadius:20,padding:32,width:"100%",maxWidth:440,
            boxShadow:"0 24px 80px rgba(0,0,0,.3)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:16,color:AC,marginBottom:4 }}>💎 Cambiar Plan</div>
            <div style={{ fontSize:13,color:TEXT_LIGHT,marginBottom:20 }}>"{planModal.titulo}"</div>

            {/* Plan selector */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20 }}>
              {[
                {id:"cuarzo",  icon:"🪨", label:"Cuarzo",  color:"#6B7280", bg:"#F9FAFB", desc:"Gratis",    border:"#D1D5DB"},
                {id:"esmeralda",  icon:"💚", label:"Esmeralda",  color:"#16A34A", bg:"#F0FDF4", desc:"Destacado", border:"#4ADE80"},
                {id:"diamante",icon:"💠", label:"Diamante",color:"#7C3AED", bg:"#F5F3FF", desc:"Premium",   border:"#8B5CF6"},
              ].map(p=>(
                <div key={p.id} onClick={()=>setPlanSel(p.id)} style={{
                  padding:"14px 8px",borderRadius:12,textAlign:"center",cursor:"pointer",
                  border:`2px solid ${planSel===p.id?p.color:BORDER}`,
                  background:planSel===p.id?p.bg:"transparent",
                  boxShadow:planSel===p.id?`0 4px 12px ${p.color}33`:"none",
                  transition:"all .2s"
                }}>
                  <div style={{ fontSize:28,marginBottom:4 }}>{p.icon}</div>
                  <div style={{ fontWeight:800,fontSize:14,color:planSel===p.id?p.color:TEXT,marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:11,color:TEXT_LIGHT,fontWeight:500 }}>{p.desc}</div>
                  {planSel===p.id && <div style={{ marginTop:6,width:6,height:6,borderRadius:"50%",background:p.color,margin:"6px auto 0" }}/>}
                </div>
              ))}
            </div>

            {/* Fechas - solo si no es Cuarzo */}
            {planSel!=="cuarzo" && (
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
                <div>
                  <label style={{ display:"block",fontSize:13,fontWeight:600,color:TEXT_MID,marginBottom:5 }}>📅 Desde</label>
                  <input type="date" value={desde} onChange={e=>{
                    setDesde(e.target.value);
                    // Auto-calcular hasta según plan
                    const dias = planSel==="diamante"?30:30;
                    const fin = new Date(e.target.value); fin.setDate(fin.getDate()+dias);
                    setHasta(fin.toISOString().split("T")[0]);
                  }} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${BORDER}`,fontSize:14,fontFamily:"inherit",outline:"none",color:TEXT,background:"#fff",boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ display:"block",fontSize:13,fontWeight:600,color:TEXT_MID,marginBottom:5 }}>📅 Hasta</label>
                  <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}
                    style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${BORDER}`,fontSize:14,fontFamily:"inherit",outline:"none",color:TEXT,background:"#fff",boxSizing:"border-box" }}/>
                </div>
              </div>
            )}

            {/* Resumen */}
            {planSel!=="cuarzo" && desde && hasta && (
              <div style={{ padding:"10px 14px",borderRadius:8,background:PRIMARY+"11",border:`1px solid ${PRIMARY}33`,fontSize:13,color:PRIMARY,fontWeight:600,marginBottom:16 }}>
                📋 Plan {planSel.toUpperCase()} · {Math.ceil((new Date(hasta)-new Date(desde))/(1000*60*60*24))} días · del {desde} al {hasta}
              </div>
            )}

            <div style={{ display:"flex",gap:10 }}>
              <Btn full color={PRIMARY} onClick={handleSavePlan} disabled={saving}>
                {saving?"Guardando...":"💾 Guardar plan"}
              </Btn>
              <Btn outline color={TEXT_MID} onClick={()=>setPlanModal(null)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por título o vendedor..."
            style={{ flex:1, minWidth:180, padding:"8px 13px", borderRadius:8, border:`1.5px solid ${BORDER}`, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fff", color:TEXT }} />
          {["todos","activo","pendiente","suspendido"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:"7px 15px", borderRadius:8, fontSize:12, fontWeight:600, fontFamily:"inherit",
              border:`1.5px solid ${filter===f?PRIMARY:BORDER}`,
              background:filter===f?PRIMARY:"transparent", color:filter===f?"#fff":TEXT_MID, cursor:"pointer",
            }}>{f}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando...</div> :
          filtered.length===0 ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>No hay anuncios</div> :
          <Tbl headers={["Título","Vendedor","Categoría","Plan","Vence","Estado","Acciones"]} rows={filtered.map(a=>{
            const dias = diasRestantes(a.planHasta);
            return [
              <span style={{ fontWeight:600,fontSize:13 }}>{a.titulo}</span>,
              <span style={{ color:INFO,fontSize:12 }}>{a.nombreVendedor||"—"}</span>,
              <span style={{ fontSize:12 }}>{a.categoria||"—"}</span>,
              <Pill label={(a.plan||"cuarzo").toUpperCase()} color={a.plan==="diamante"?"#1D4ED8":a.plan==="esmeralda"?"#16A34A":"#6B7280"}/>,
              a.planHasta ? (
                <span style={{ fontSize:11,color:dias!==null&&dias<=3?DANGER:dias!==null&&dias<=7?WARNING:TEXT_LIGHT }}>
                  {dias!==null&&dias>=0?`${dias}d`:dias!==null?"Vencido":a.planHasta}
                </span>
              ) : <span style={{ color:TEXT_LIGHT,fontSize:11 }}>—</span>,
              <Pill label={a.status||"activo"} color={SC[a.status||"activo"]}/>,
              <div style={{ display:"flex", gap:4 }}>
                {a.status==="activo"
                  ? <Btn size="sm" outline color={WARNING} onClick={()=>handleStatus(a.id,"suspendido")}>⏸</Btn>
                  : <Btn size="sm" outline color={SUCCESS} onClick={()=>handleStatus(a.id,"activo")}>▶</Btn>
                }
                <Btn size="sm" outline color={a.plan==="diamante"?"#7C3AED":a.plan==="esmeralda"?"#16A34A":"#6B7280"} onClick={()=>openPlanModal(a)}>
                {a.plan==="diamante"?"💠":a.plan==="esmeralda"?"💚":"🪨"} Plan
              </Btn>
                <Btn size="sm" outline color={DANGER} onClick={()=>handleDelete(a.id)}>🗑️</Btn>
              </div>
            ];
          })} />
        }
      </Card>
    </div>
  );
}

function AUsers() {
  const [search,setSearch]=useState("");
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    getDocs(collection(db,"usuarios"))
      .then(snap=>{ setUsers(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const handleSuspend = async (id, status) => {
    await updateDoc(doc(db,"usuarios",id),{status});
    setUsers(prev=>prev.map(u=>u.id===id?{...u,status}:u));
  };

  const handleVerificar = async (id, valor) => {
    await updateDoc(doc(db,"usuarios",id),{ verificado: valor });
    setUsers(prev=>prev.map(u=>u.id===id?{...u,verificado:valor}:u));
  };

  const handleCambiarPlan = async (id, plan) => {
    await updateDoc(doc(db,"usuarios",id),{ plan });
    setUsers(prev=>prev.map(u=>u.id===id?{...u,plan}:u));
  };

  const filtered = users.filter(u=>
    !search || u.nombre?.toLowerCase().includes(search.toLowerCase()) || u.email?.includes(search)
  );

  const exportCSV = () => {
    const rows = [["Nombre","Email","Rol","Estado","Desde"],...filtered.map(u=>[u.nombre,u.email,u.rol,u.status||"activo",u.createdAt?.toDate?.()?.toLocaleDateString("es-AR")||""])];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download = "usuarios.csv"; a.click();
  };

  return (
    <div>
      <SecTitle sub="Administrá todos los usuarios">👥 Gestión de Usuarios</SecTitle>
      <Card>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nombre o email..."
            style={{ flex:1, padding:"8px 13px", borderRadius:8, border:`1.5px solid ${BORDER}`, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fff", color:TEXT }} />
          <Btn size="sm" onClick={exportCSV}>📥 Exportar CSV</Btn>
        </div>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando usuarios...</div> :
          filtered.length===0 ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>No hay usuarios</div> :
          <Tbl headers={["Nombre","Email","Rol","Plan","Estado","Verificado","Desde","Acciones"]} rows={filtered.map(u=>[
            <span style={{ fontWeight:600 }}>{u.nombre||"—"}</span>,
            <span style={{ color:INFO, fontSize:12 }}>{u.email||"—"}</span>,
            <Pill label={u.rol||"usuario"} color={u.rol==="tienda"?PRIMARY:INFO}/>,
            <select value={u.plan||"cuarzo"} onChange={e=>handleCambiarPlan(u.id,e.target.value)}
              style={{padding:"4px 8px",borderRadius:6,border:"1.5px solid #E5E7EB",fontSize:12,
                fontFamily:"inherit",cursor:"pointer",fontWeight:700,
                background:u.plan==="diamante"?"#F5F3FF":u.plan==="esmeralda"?"#F0FDF4":"#F9FAFB",
                color:u.plan==="diamante"?"#7C3AED":u.plan==="esmeralda"?"#16A34A":"#6B7280"}}>
              <option value="cuarzo">🪨 Cuarzo</option>
              <option value="esmeralda">💚 Esmeralda</option>
              <option value="diamante">💠 Diamante</option>
            </select>,
            <Pill label={u.status||"activo"} color={(u.status||"activo")==="activo"?SUCCESS:DANGER}/>,
            <span style={{ cursor:"pointer" }} title={u.verificado?"Click para quitar verificación":"Click para verificar manualmente"}
              onClick={()=>handleVerificar(u.id,!u.verificado)}>
              {u.verificado ? "✅ Verificado" : "❌ Sin verificar"}
            </span>,
            u.createdAt?.toDate?.()?.toLocaleDateString("es-AR")||"—",
            <div style={{ display:"flex", gap:4 }}>
              {(u.status||"activo")==="activo"
                ? <Btn size="sm" outline color={DANGER} onClick={()=>handleSuspend(u.id,"suspendido")}>🚫</Btn>
                : <Btn size="sm" outline color={SUCCESS} onClick={()=>handleSuspend(u.id,"activo")}>✅</Btn>
              }
            </div>
          ])} />
        }
      </Card>
    </div>
  );
}

function AStores() {
  const EMPTY = { nombre:"", email:"", whatsapp:"", descripcion:"", categoria:"", direccion:"", horario:"", plan:"esmeralda", verificada:false, activa:true, logo:"", web:"", instagram:"", facebook:"", tiktok:"", userId:"" };
  const [stores, setStores]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [aiLoadingStore, setAiLoadingStore] = useState(false);
  const [aiStoreOk, setAiStoreOk] = useState(false);

  const handleIATienda = async () => {
    if (!form.nombre.trim()) return alert("Escribí el nombre del comercio primero");
    setAiLoadingStore(true); setAiStoreOk(false);
    try {
      const res = await fetch("https://claude-ia.paulo-andres-alvarez-1976.workers.dev", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-5", max_tokens:600,
          messages:[{ role:"user", content:`Sos un asistente para el portal "Clasificados Chapa J" de San Juan, Argentina.
El comercio se llama: "${form.nombre}"${form.categoria ? `\nRubro/categoría: "${form.categoria}"` : ""}

Generá una descripción atractiva para la tarjeta de tienda virtual y una categoría apropiada.
Respondé ÚNICAMENTE con JSON válido sin backticks:
{"descripcion":"descripción de 2-3 oraciones atractivas en español argentino informal que explique qué ofrece el comercio y por qué elegirlo","categoria":"categoría corta del rubro, ej: Ferretería, Ropa y Accesorios, Electrónica, Kiosco, etc"}` }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(c=>c.text||"").join("").trim();
      const json = JSON.parse(raw.replace(/```json|```/g,"").trim());
      if (json.descripcion) setForm(p=>({...p, descripcion:json.descripcion}));
      if (json.categoria && !form.categoria) setForm(p=>({...p, categoria:json.categoria}));
      setAiStoreOk(true); setTimeout(()=>setAiStoreOk(false), 3000);
    } catch(e){ alert("Error con la IA. Completá manualmente."); }
    setAiLoadingStore(false);
  };

  const cargar = () => {
    setLoading(true);
    getDocs(collection(db,"tiendas"))
      .then(snap=>{ setStores(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  };
  useEffect(()=>{ cargar(); },[]);

  const handleToggle = async (id, activa) => {
    await updateDoc(doc(db,"tiendas",id),{activa});
    setStores(prev=>prev.map(s=>s.id===id?{...s,activa}:s));
  };

  const handleNueva = () => { setForm(EMPTY); setEditando("new"); setSaved(false); };
  const handleEditar = (s) => { setForm({...EMPTY,...s}); setEditando(s.id); setSaved(false); };
  const handleCancelar = () => { setEditando(null); setForm(EMPTY); };

  const handleLogo = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploadingLogo(true);
    const sRef = ref(storage, `tiendas/logo_${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(sRef, file, { contentType: file.type });
    task.on("state_changed", null, ()=>setUploadingLogo(false), async()=>{
      const url = await getDownloadURL(task.snapshot.ref);
      setForm(prev=>({...prev, logo:url}));
      setUploadingLogo(false);
    });
  };

  const handleGuardar = async () => {
    if(!form.nombre.trim()) return alert("El nombre es obligatorio");
    setSaving(true);
    const data = { ...form, updatedAt: new Date() };
    let tiendaId = editando;
    if(editando==="new"){
      data.createdAt = new Date();
      const ref2 = await addDoc(collection(db,"tiendas"), data);
      tiendaId = ref2.id;
    } else {
      await updateDoc(doc(db,"tiendas", editando), data);
    }
    // Vincular tienda al usuario si se especificó userId o email
    if(form.userId || form.email){
      try {
        const uQuery = form.userId
          ? query(collection(db,"usuarios"),where("uid","==",form.userId))
          : query(collection(db,"usuarios"),where("email","==",form.email));
        const uSnap = await getDocs(uQuery);
        if(!uSnap.empty) {
          await updateDoc(uSnap.docs[0].ref, { tiendaId, rol:"tienda" });
        }
      } catch(e){ console.error("No se pudo vincular usuario:",e); }
    }
    setSaving(false); setSaved(true);
    setTimeout(()=>{ setSaved(false); setEditando(null); cargar(); }, 1200);
  };

  const handleEliminar = async (id) => {
    await deleteDoc(doc(db,"tiendas",id));
    setStores(prev=>prev.filter(s=>s.id!==id));
    setConfirmDel(null);
  };

  const planColor = (p) => p==="diamante"?"#4F46E5":p==="esmeralda"?"#16A34A":"#6B7280";

  // ── FORMULARIO ──────────────────────────────────────────────────
  if(editando !== null) {
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={handleCancelar} style={{ background:"none", border:`1.5px solid ${BORDER}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, color:TEXT_LIGHT, fontFamily:"inherit" }}>
            ← Volver
          </button>
          <div>
            <div style={{ fontWeight:700, fontSize:18, color:TEXT }}>{editando==="new"?"Nueva Tienda Virtual":"Editar Tienda"}</div>
            <div style={{ fontSize:12, color:TEXT_LIGHT }}>Completá los datos del comercio</div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          {/* Columna izquierda */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>📋 Información básica</div>
              <Inp label="Nombre del comercio *" value={form.nombre} onChange={v=>setForm(p=>({...p,nombre:v}))} placeholder="Ej: Ferretería El Tornillo"/>

              {/* Botón IA */}
              <div style={{ background:aiStoreOk?"#F0FDF4":`${P}0D`, border:`1px solid ${aiStoreOk?"#86EFAC":P+"33"}`, borderRadius:10, padding:"10px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}>{aiStoreOk?"✅":"🤖"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:aiStoreOk?"#16A34A":P }}>{aiStoreOk?"¡IA completó la descripción!":"Asistente IA"}</div>
                  <div style={{ fontSize:11, color:TEXT_MID }}>Escribí el nombre y la IA genera descripción y categoría</div>
                </div>
                <button onClick={handleIATienda} disabled={aiLoadingStore}
                  style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${P}`, background:aiStoreOk?"#16A34A":P, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", opacity:aiLoadingStore?.7:1 }}>
                  {aiLoadingStore?"Generando...":aiStoreOk?"Regenerar":"✨ Usar IA"}
                </button>
              </div>

              <Inp label="Email de contacto" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} placeholder="comercio@email.com"/>
              <Inp label="UID o email del usuario (para vincular panel)" value={form.userId} onChange={v=>setForm(p=>({...p,userId:v}))} placeholder="UID de Firebase o email registrado" hint="El usuario verá la tienda en 'Mi Cuenta'"/>
              <Inp label="WhatsApp (sin 0 ni 15)" value={form.whatsapp} onChange={v=>setForm(p=>({...p,whatsapp:v}))} placeholder="2645XXXXXX"/>
              <Txta label="Descripción" value={form.descripcion} onChange={v=>setForm(p=>({...p,descripcion:v}))} rows={3} placeholder="¿A qué se dedica el comercio?"/>
            </Card>

            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>📍 Ubicación y horario</div>
              <Inp label="Dirección" value={form.direccion} onChange={v=>setForm(p=>({...p,direccion:v}))} placeholder="Av. Libertador 1234, San Juan"/>
              <HorarioEditor value={form.horarioData||form.horario||[]} onChange={v=>setForm(p=>({...p,horarioData:v,horario:horarioDataToString(v)}))}/>
              <Inp label="Categoría" value={form.categoria} onChange={v=>setForm(p=>({...p,categoria:v}))} placeholder="Ej: Ferretería, Ropa, Electrónica"/>
            </Card>
            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>🔗 Links y redes sociales</div>
              <Inp label="🌐 Sitio web" value={form.web} onChange={v=>setForm(p=>({...p,web:v}))} placeholder="https://mitienda.com.ar"/>
              <Inp label="📸 Instagram" value={form.instagram} onChange={v=>setForm(p=>({...p,instagram:v}))} placeholder="https://instagram.com/mitienda"/>
              <Inp label="📘 Facebook" value={form.facebook} onChange={v=>setForm(p=>({...p,facebook:v}))} placeholder="https://facebook.com/mitienda"/>
              <Inp label="🎵 TikTok" value={form.tiktok} onChange={v=>setForm(p=>({...p,tiktok:v}))} placeholder="https://tiktok.com/@mitienda"/>
            </Card>
          </div>

          {/* Columna derecha */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>🖼️ Logo de la tienda</div>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                <div style={{ width:72, height:72, borderRadius:14, overflow:"hidden", background:`${P}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${BORDER}` }}>
                  {form.logo
                    ? <img src={form.logo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <span style={{ fontSize:28 }}>🏪</span>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", background:SURFACE, border:`1.5px dashed ${BORDER}`, borderRadius:10, padding:"10px 14px", cursor:"pointer", textAlign:"center", fontSize:13, color:TEXT_LIGHT }}>
                    {uploadingLogo ? "⏳ Subiendo..." : "📷 Subir logo"}
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogo} disabled={uploadingLogo}/>
                  </label>
                  <div style={{ fontSize:11, color:TEXT_LIGHT, marginTop:5 }}>Recomendado: imagen cuadrada 300×300px</div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>💎 Plan y estado</div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:TEXT_LIGHT, marginBottom:8 }}>Plan</div>
                <div style={{ display:"flex", gap:10 }}>
                  {["esmeralda","diamante"].map(p=>(
                    <button key={p} onClick={()=>setForm(prev=>({...prev,plan:p}))}
                      style={{ flex:1, padding:"10px", borderRadius:10, border:`2px solid ${form.plan===p?planColor(p):BORDER}`, background:form.plan===p?`${planColor(p)}15`:"transparent", cursor:"pointer", fontWeight:700, fontSize:13, color:form.plan===p?planColor(p):TEXT_LIGHT, fontFamily:"inherit", transition:"all .15s" }}>
                      {p==="diamante"?"💠 Diamante":"💚 Esmeralda"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.verificada} onChange={e=>setForm(p=>({...p,verificada:e.target.checked}))} style={{ width:16, height:16, accentColor:P }}/>
                  <span style={{ fontSize:13, color:TEXT }}>✅ Tienda verificada</span>
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.activa} onChange={e=>setForm(p=>({...p,activa:e.target.checked}))} style={{ width:16, height:16, accentColor:P }}/>
                  <span style={{ fontSize:13, color:TEXT }}>🟢 Tienda activa (visible en el sitio)</span>
                </label>
              </div>
            </Card>

            {/* Preview */}
            <Card>
              <div style={{ fontWeight:700, fontSize:14, color:TEXT, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${BORDER}` }}>👁️ Vista previa</div>
              <div style={{ background:`${planColor(form.plan)}10`, border:`1.5px solid ${planColor(form.plan)}40`, borderRadius:14, padding:"16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:50, height:50, borderRadius:10, overflow:"hidden", background:`${planColor(form.plan)}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {form.logo ? <img src={form.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:22 }}>🏪</span>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{form.nombre||"Nombre del comercio"}</div>
                  <div style={{ fontSize:11, color:TEXT_LIGHT }}>{form.categoria||"Categoría"}</div>
                  <div style={{ display:"inline-block", background:planColor(form.plan), color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, marginTop:4 }}>
                    {form.plan==="diamante"?"💠 DIAMANTE":"💚 ESMERALDA"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div style={{ marginTop:20, display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn outline onClick={handleCancelar}>Cancelar</Btn>
          <Btn onClick={handleGuardar} disabled={saving}>{saving?"Guardando...":saved?"✅ Guardado!":"💾 Guardar tienda"}</Btn>
        </div>
      </div>
    );
  }

  // ── LISTADO ─────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <SecTitle sub="Gestioná las Tiendas Virtuales">🏪 Tiendas Virtuales</SecTitle>
        <Btn onClick={handleNueva}>+ Nueva tienda</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
        <StatCard icon="🏪" label="Tiendas activas" value={stores.filter(s=>s.activa).length.toString()} color={SUCCESS}/>
        <StatCard icon="💠" label="Tiendas Diamante" value={stores.filter(s=>s.plan==="diamante").length.toString()} color={"#4F46E5"}/>
        <StatCard icon="💚" label="Tiendas Esmeralda" value={stores.filter(s=>s.plan==="esmeralda").length.toString()} color={"#16A34A"}/>
      </div>

      <Card>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando tiendas...</div> :
          stores.length===0 ? (
            <div style={{ textAlign:"center",padding:60,color:TEXT_LIGHT }}>
              <div style={{ fontSize:52,marginBottom:12 }}>🏪</div>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:8, color:TEXT }}>Todavía no hay tiendas</div>
              <div style={{ fontSize:13, marginBottom:20 }}>Agregá el primer comercio sanjuanino</div>
              <Btn onClick={handleNueva}>+ Agregar primera tienda</Btn>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {stores.map(s=>(
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", border:`1.5px solid ${BORDER}`, borderRadius:14, background:SURFACE, transition:"box-shadow .2s" }}>
                  {/* Logo */}
                  <div style={{ width:52, height:52, borderRadius:12, overflow:"hidden", background:`${planColor(s.plan)}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {s.logo ? <img src={s.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:24 }}>🏪</span>}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontWeight:700, fontSize:15, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.nombre||"Sin nombre"}</span>
                      <span style={{ background:planColor(s.plan), color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, flexShrink:0 }}>{(s.plan||"esmeralda").toUpperCase()}</span>
                      {s.verificada && <span style={{ fontSize:12 }}>✅</span>}
                    </div>
                    <div style={{ display:"flex", gap:12, fontSize:12, color:TEXT_LIGHT, flexWrap:"wrap" }}>
                      {s.categoria && <span>📂 {s.categoria}</span>}
                      {s.whatsapp && <span>📱 {s.whatsapp}</span>}
                      {s.direccion && <span>📍 {s.direccion}</span>}
                    </div>
                  </div>
                  {/* Estado + acciones */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <Pill label={s.activa?"activa":"inactiva"} color={s.activa?SUCCESS:DANGER}/>
                    <Btn size="sm" outline onClick={()=>handleEditar(s)}>✏️ Editar</Btn>
                    <Btn size="sm" outline color={s.activa?DANGER:SUCCESS} onClick={()=>handleToggle(s.id,!s.activa)}>
                      {s.activa?"🚫 Pausar":"✅ Activar"}
                    </Btn>
                    <Btn size="sm" outline color={DANGER} onClick={()=>setConfirmDel(s.id)}>🗑️</Btn>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Card>

      {/* Modal confirmación eliminar */}
      {confirmDel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:SURFACE, borderRadius:16, padding:"28px 32px", maxWidth:360, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ fontWeight:700, fontSize:16, color:TEXT, marginBottom:8 }}>¿Eliminar tienda?</div>
            <div style={{ fontSize:13, color:TEXT_LIGHT, marginBottom:20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn outline onClick={()=>setConfirmDel(null)}>Cancelar</Btn>
              <Btn color={DANGER} onClick={()=>handleEliminar(confirmDel)}>Eliminar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ACategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newColor, setNewColor] = useState("#6366F1");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(()=>{
    getDoc(doc(db,"config","categories")).then(snap=>{
      if(snap.exists() && snap.data().cats?.length > 0){
        setCats(snap.data().cats);
      } else {
        // Primera vez: cargar DEFAULT_CATS a Firestore
        const initial = DEFAULT_CATS.map((c,i)=>({...c,active:true,order:i+1}));
        setCats(initial);
        setDoc(doc(db,"config","categories"),{cats:initial},{merge:true}).catch(()=>{});
      }
      setLoading(false);
    }).catch(()=>{ setCats(DEFAULT_CATS.map((c,i)=>({...c,active:true,order:i+1}))); setLoading(false); });
  },[]);

  const guardar = async (updated) => {
    setSaving(true);
    try{ await setDoc(doc(db,"config","categories"),{cats:updated},{merge:true}); }catch(e){}
    setSaving(false);
  };

  const handleToggle = async (id, v) => {
    const updated = cats.map(c=>c.id===id?{...c,active:v}:c);
    setCats(updated);
    await guardar(updated);
  };

  const handleAdd = async () => {
    if(!newName.trim()) return;
    const newCat = { id:Date.now(), name:newName.trim(), icon:newIcon, color:newColor, active:true, order:cats.length+1, sub:[] };
    const updated = [...cats, newCat];
    setCats(updated);
    setNewName(""); setNewIcon("📦"); setNewColor("#6366F1");
    await guardar(updated);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const handleEliminar = async (id) => {
    const updated = cats.filter(c=>c.id!==id).map((c,i)=>({...c,order:i+1}));
    setCats(updated);
    await guardar(updated);
    setConfirmDel(null);
  };

  const COLORS = ["#FF6B2B","#0EA5E9","#10B981","#F59E0B","#64748B","#8B5CF6","#EC4899","#14B8A6","#3B82F6","#EF4444","#A855F7","#22C55E","#DB2777","#7C3AED","#1D4ED8","#DC2626","#6366F1","#F97316"];

  return (
    <div>
      <SecTitle sub="Activá, desactivá y creá categorías">🗂️ Categorías</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:18 }}>
        <Card>
          {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando...</div> : (
            <div style={{ maxHeight:560, overflowY:"auto" }}>
              <Tbl headers={["#","Icono","Nombre","Subcats","Activa","Eliminar"]} rows={cats.map((c)=>[
                <span style={{ color:TEXT_LIGHT,fontWeight:700 }}>#{c.order}</span>,
                <span style={{ fontSize:22 }}>{c.icon}</span>,
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:c.color||"#6366F1", flexShrink:0 }}/>
                  <span style={{ fontWeight:600 }}>{c.name}</span>
                </div>,
                <span style={{ fontSize:12,color:TEXT_LIGHT }}>{c.sub?.length||0} subcats</span>,
                <Tog label="" checked={c.active!==false} onChange={v=>handleToggle(c.id,v)}/>,
                <Btn size="sm" outline color={DANGER} onClick={()=>setConfirmDel(c.id)}>🗑️</Btn>,
              ])} />
            </div>
          )}
          {saving && <div style={{ textAlign:"center", padding:"8px", fontSize:12, color:TEXT_LIGHT }}>💾 Guardando...</div>}
        </Card>

        <Card>
          <div style={{ fontWeight:700, marginBottom:12 }}>➕ Nueva categoría</div>
          {saved && <div style={{ padding:"8px 12px",borderRadius:8,background:SUCCESS+"18",color:SUCCESS,fontSize:13,marginBottom:12 }}>✅ Categoría agregada!</div>}
          <Inp label="Nombre" value={newName} onChange={setNewName} placeholder="Ej: Bicicletas"/>
          <Inp label="Icono (emoji)" value={newIcon} onChange={setNewIcon}/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,fontWeight:600,color:TEXT_LIGHT,marginBottom:6 }}>Color</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setNewColor(c)} style={{ width:24, height:24, borderRadius:6, background:c, cursor:"pointer", border:`2px solid ${newColor===c?"#111":"transparent"}`, transition:"border .15s" }}/>
              ))}
            </div>
            <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:16, height:16, borderRadius:4, background:newColor }}/>
              <span style={{ fontSize:12, color:TEXT_LIGHT }}>{newColor}</span>
            </div>
          </div>
          <Btn onClick={handleAdd}>➕ Agregar categoría</Btn>
          <div style={{ marginTop:14,padding:"10px 12px",borderRadius:8,background:"#EFF6FF",border:"1px solid #BFDBFE",fontSize:12,color:"#1E40AF" }}>
            ℹ️ Los cambios se guardan automáticamente en Firestore y se aplican al recargar el sitio.
          </div>
        </Card>
      </div>

      {confirmDel && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:SURFACE,borderRadius:16,padding:"28px 32px",maxWidth:340,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>⚠️</div>
            <div style={{ fontWeight:700,fontSize:16,color:TEXT,marginBottom:8 }}>¿Eliminar categoría?</div>
            <div style={{ fontSize:13,color:TEXT_LIGHT,marginBottom:20 }}>Los anuncios existentes en esa categoría no se verán afectados.</div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <Btn outline onClick={()=>setConfirmDel(null)}>Cancelar</Btn>
              <Btn color={DANGER} onClick={()=>handleEliminar(confirmDel)}>Eliminar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DescuentoBox({ activo, pct, onToggle, onPct, label }) {
  return (
    <div style={{ marginTop:14, padding:"14px 16px", borderRadius:12,
      background: activo ? "linear-gradient(135deg,#FEF3C7,#FFFBEB)" : "#F9FAFB",
      border: `2px solid ${activo ? "#F59E0B" : "#E5E7EB"}`, transition:"all .2s" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: activo?12:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🏷️</span>
          <span style={{ fontWeight:700, fontSize:13, color: activo?"#92400E":"#6B7280" }}>
            {activo ? `Descuento activo: ${pct}% OFF` : "Activar descuento"}
          </span>
        </div>
        <button onClick={onToggle} style={{
          width:44, height:24, borderRadius:12, border:"none", cursor:"pointer",
          background: activo ? "#F59E0B" : "#D1D5DB", position:"relative", transition:"background .2s", flexShrink:0
        }}>
          <span style={{ position:"absolute", top:2, left: activo?22:2, width:20, height:20,
            borderRadius:"50%", background:"#fff", transition:"left .2s", display:"block",
            boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
        </button>
      </div>
      {activo && (
        <div>
          <div style={{ fontSize:12, color:"#92400E", marginBottom:8 }}>¿Cuánto % de descuento?</div>
          <div style={{ display:"flex", gap:8 }}>
            {["5","10","15","20","25","30"].map(p=>(
              <button key={p} onClick={()=>onPct(p)}
                style={{ flex:1, padding:"7px 4px", borderRadius:8, border:`1.5px solid ${pct===p?"#F59E0B":"#E5E7EB"}`,
                  background: pct===p?"#F59E0B":"#fff", color: pct===p?"#fff":"#374151",
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                {p}%
              </button>
            ))}
          </div>
          <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8, background:"#FEF9C3", fontSize:12, color:"#713F12" }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

function APricing({cfg,set,onSave}) {
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{ await onSave?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const precAnuncioEsm = Math.round(Number(cfg.plataPrice||4600) * (1 - Number(cfg.descAnunciosPct||10)/100));
  const precAnuncioDia = Math.round(Number(cfg.oroPrice||9200)   * (1 - Number(cfg.descAnunciosPct||10)/100));
  const precTiendaE30  = Math.round(Number(cfg.tiendaPlata30||8600)  * (1 - Number(cfg.descTiendaPct||10)/100));
  const precTiendaE90  = Math.round(Number(cfg.tiendaPlata90||23000) * (1 - Number(cfg.descTiendaPct||10)/100));
  const precTiendaE180 = Math.round(Number(cfg.tiendaPlata180||41000)* (1 - Number(cfg.descTiendaPct||10)/100));
  const precTiendaD30  = Math.round(Number(cfg.tiendaOro30||16000)   * (1 - Number(cfg.descTiendaPct||10)/100));
  const precTiendaD90  = Math.round(Number(cfg.tiendaOro90||45000)   * (1 - Number(cfg.descTiendaPct||10)/100));
  const precTiendaD180 = Math.round(Number(cfg.tiendaOro180||85000)  * (1 - Number(cfg.descTiendaPct||10)/100));

  return (
    <div>
      <SecTitle sub="Configurá precios, planes y métodos de pago">💰 Planes & Precios</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📋 Anuncios</div>
          <Tog label="Anuncio Cuarzo GRATIS" checked={cfg.normalFree} onChange={set("normalFree")} />
          <Inp label="💲 Destacado ESMERALDA (Inmuebles/Veh./Servicios)" value={cfg.plataPrice} onChange={set("plataPrice")} type="number" />
          <Inp label="⏳ Vigencia Esmeralda (días)" value={cfg.plataVigencia} onChange={set("plataVigencia")} type="number" />
          <Inp label="💲 Destacado DIAMANTE" value={cfg.oroPrice} onChange={set("oroPrice")} type="number" />
          <Inp label="⏳ Vigencia Diamante (días)" value={cfg.oroVigencia} onChange={set("oroVigencia")} type="number" />
          <DescuentoBox
            activo={cfg.descAnunciosActivo||false}
            pct={cfg.descAnunciosPct||"10"}
            onToggle={()=>set("descAnunciosActivo")(!cfg.descAnunciosActivo)}
            onPct={v=>set("descAnunciosPct")(v)}
            label={cfg.descAnunciosActivo ? `Esmeralda: $${Number(cfg.plataPrice||4600).toLocaleString("es-AR")} → $${precAnuncioEsm.toLocaleString("es-AR")} · Diamante: $${Number(cfg.oroPrice||9200).toLocaleString("es-AR")} → $${precAnuncioDia.toLocaleString("es-AR")}` : ""}
          />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🏪 Tiendas Virtuales</div>
          <Inp label="ESMERALDA 30 días" value={cfg.tiendaPlata30} onChange={set("tiendaPlata30")} type="number" />
          <Inp label="ESMERALDA 90 días" value={cfg.tiendaPlata90} onChange={set("tiendaPlata90")} type="number" />
          <Inp label="ESMERALDA 180 días" value={cfg.tiendaPlata180} onChange={set("tiendaPlata180")} type="number" />
          <Inp label="DIAMANTE 30 días" value={cfg.tiendaOro30} onChange={set("tiendaOro30")} type="number" />
          <Inp label="DIAMANTE 90 días" value={cfg.tiendaOro90} onChange={set("tiendaOro90")} type="number" />
          <Inp label="DIAMANTE 180 días" value={cfg.tiendaOro180} onChange={set("tiendaOro180")} type="number" />
          <DescuentoBox
            activo={cfg.descTiendaActivo||false}
            pct={cfg.descTiendaPct||"10"}
            onToggle={()=>set("descTiendaActivo")(!cfg.descTiendaActivo)}
            onPct={v=>set("descTiendaPct")(v)}
            label={cfg.descTiendaActivo ? `Esmeralda: $${Number(cfg.tiendaPlata30||8600).toLocaleString("es-AR")} → $${precTiendaE30.toLocaleString("es-AR")} (30d) · $${precTiendaE90.toLocaleString("es-AR")} (90d) · $${precTiendaE180.toLocaleString("es-AR")} (180d)` : ""}
          />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>⏳ Vigencias normales</div>
          <Inp label="Artículos (días)" value={cfg.vigenciaArticulos} onChange={set("vigenciaArticulos")} type="number" />
          <Inp label="Inmuebles (días)" value={cfg.vigenciaInmuebles} onChange={set("vigenciaInmuebles")} type="number" />
          <Inp label="Servicios (días)" value={cfg.vigenciaServicios} onChange={set("vigenciaServicios")} type="number" />
          <Inp label="Fotos máx. por anuncio" value={cfg.maxFotos} onChange={set("maxFotos")} type="number" />
          <Inp label="Alertas máx. (gratis)" value={cfg.maxAlertasGratis} onChange={set("maxAlertasGratis")} type="number" />
        </Card>
        <Card style={{ gridColumn:"1/-1" }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>🟠 Precios de Banners Publicitarios</div>
          <div style={{ fontSize:12, color:TEXT_LIGHT, marginBottom:16 }}>Precios por posición — ordenados por visibilidad e impacto</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
            {[
              { key:"Top",    label:"Home – Superior",          emoji:"🥇", hint:"Más vendida · máxima visibilidad" },
              { key:"Ads",    label:"Home – Entre anuncios",    emoji:"🥈", hint:"Alta intención de compra" },
              { key:"Mid",    label:"Home – Medio",             emoji:"🥉", hint:"Buena exposición general" },
              { key:"Cats",   label:"Home – Antes de categ.",   emoji:"4️⃣",  hint:"Complementaria" },
              { key:"Bottom", label:"Home – Inferior",          emoji:"5️⃣",  hint:"Económica · branding" },
            ].map(p=>(
              <div key={p.key} style={{ background:BG, borderRadius:12, padding:"12px 14px", border:`1px solid ${BORDER}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{p.emoji}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:TEXT }}>{p.label}</span>
                </div>
                <div style={{ fontSize:11, color:TEXT_LIGHT, marginBottom:10 }}>{p.hint}</div>
                <Inp label="30 días ($)" value={cfg[`banner${p.key}30`]} onChange={set(`banner${p.key}30`)} type="number"/>
                <Inp label="90 días ($)" value={cfg[`banner${p.key}90`]} onChange={set(`banner${p.key}90`)} type="number"/>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>💳 Métodos de pago</div>
          <Tog label="MercadoPago" checked={cfg.mercadopagoEnabled} onChange={set("mercadopagoEnabled")} />
          {cfg.mercadopagoEnabled && <Inp label="Access Token" value={cfg.mercadopagoKey} onChange={set("mercadopagoKey")} type="password" />}
          <Tog label="PayPal" checked={cfg.paypalEnabled} onChange={set("paypalEnabled")} />
          {cfg.paypalEnabled && <Inp label="Email PayPal" value={cfg.paypalEmail} onChange={set("paypalEmail")} />}
          <Tog label="Transferencia bancaria" checked={cfg.transferEnabled} onChange={set("transferEnabled")} />
          {cfg.transferEnabled && <Txta label="Instrucciones" value={cfg.transferInstructions} onChange={set("transferInstructions")} rows={2} />}
        </Card>
      </div>
      <div style={{ marginTop:18 }}>
        <Btn onClick={handleSave}>{saved?"✅ Guardado!":"💾 Guardar precios"}</Btn>
      </div>
    </div>
  );
}

function BannerZone({ banners, pos }) {
  const list = banners.filter(b=>b.pos===pos && b.active && b.img);
  if(!list.length) return null;
  return (
    <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 20px 24px" }}>
      {list.map(b=>(
        <a key={b.id} href={b.link||"#"} target="_blank" rel="noopener noreferrer"
          onClick={async()=>{ try{ await updateDoc(doc(db,"banners",b.id),{clicks:increment(1)}); }catch(e){} }}
          style={{ display:"block",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.1)",marginBottom:10 }}>
          <img src={b.img} alt={b.name} style={{ width:"100%",height:"auto",maxHeight:200,objectFit:"contain",display:"block",background:"#fff" }}/>
        </a>
      ))}
    </div>
  );
}

function ABanners() {
  const [banners,setBanners]=useState([]);
  const [loading,setLoading]=useState(true);
  const [newName,setNewName]=useState("");
  const [newPos,setNewPos]=useState("home-top");
  const [newLink,setNewLink]=useState("");
  const [newImg,setNewImg]=useState("");
  const [uploadingImg,setUploadingImg]=useState(false);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    getDocs(collection(db,"banners"))
      .then(snap=>{ setBanners(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const handleToggle = async (id,active) => {
    await updateDoc(doc(db,"banners",id),{active});
    setBanners(prev=>prev.map(b=>b.id===id?{...b,active}:b));
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Eliminar este banner?")) return;
    await deleteDoc(doc(db,"banners",id));
    setBanners(prev=>prev.filter(b=>b.id!==id));
  };

  const handleAdd = async () => {
    if(!newName) return;
    setSaving(true);
    const ref = await addDoc(collection(db,"banners"),{
      name:newName, pos:newPos, link:newLink, img:newImg,
      active:true, clicks:0, views:0, createdAt:serverTimestamp()
    });
    setBanners(prev=>[...prev,{id:ref.id,name:newName,pos:newPos,link:newLink,img:newImg,active:true,clicks:0,views:0}]);
    setNewName(""); setNewLink(""); setNewImg(""); setSaving(false);
  };

  return (
    <div>
      <SecTitle sub="Administrá los espacios publicitarios">📣 Banners Publicitarios</SecTitle>
      <Card style={{ marginBottom:18 }}>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando banners...</div> :
          banners.length===0 ? (
            <div style={{ textAlign:"center",padding:40,color:TEXT_LIGHT }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📣</div>
              <div>No hay banners creados todavía</div>
            </div>
          ) : (
            <Tbl headers={["Banner","Posición","Clicks","Vistas","Estado","Acciones"]} rows={banners.map(b=>[
              <span style={{ fontWeight:600 }}>{b.name}</span>,
              <Pill label={b.pos} color={INFO}/>,
              (b.clicks||0).toLocaleString(),
              (b.views||0).toLocaleString(),
              <Pill label={b.active?"activo":"inactivo"} color={b.active?SUCCESS:DANGER}/>,
              <div style={{ display:"flex",gap:4 }}>
                {b.active
                  ? <Btn size="sm" outline color={WARNING} onClick={()=>handleToggle(b.id,false)}>⏸</Btn>
                  : <Btn size="sm" outline color={SUCCESS} onClick={()=>handleToggle(b.id,true)}>▶</Btn>
                }
                <Btn size="sm" outline color={DANGER} onClick={()=>handleDelete(b.id)}>🗑️</Btn>
              </div>
            ])} />
          )
        }
      </Card>
      <Card>
        <div style={{ fontWeight:700, marginBottom:12 }}>➕ Nuevo banner</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Inp label="Nombre del banner" value={newName} onChange={setNewName} placeholder="Ej: Banner principal"/>
          <Sel label="Posición" value={newPos} onChange={setNewPos} options={[
            {value:"home-top",label:"Home – Superior (debajo del hero)"},
            {value:"home-cats",label:"Home – Antes de categorías"},
            {value:"home-mid",label:"Home – Medio (antes de anuncios)"},
            {value:"home-ads",label:"Home – Entre anuncios"},
            {value:"home-bottom",label:"Home – Inferior (antes del footer)"},
          ]}/>
          <Inp label="URL de destino" value={newLink} onChange={setNewLink} placeholder="https://..."/>
          <div>
            <div style={{ fontSize:13,fontWeight:600,color:TX,marginBottom:6 }}>Imagen del banner</div>
            {newImg && <img src={newImg} style={{ width:"100%",height:60,objectFit:"cover",borderRadius:8,marginBottom:8 }}/>}
            <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 12px",borderRadius:8,border:`1.5px dashed ${BR}`,background:BG }}>
              <span>📷</span>
              <span style={{ fontSize:12,color:TL }}>{uploadingImg?"Subiendo...":(newImg?"Cambiar imagen":"Subir imagen")}</span>
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e=>{
                const file=e.target.files[0]; if(!file) return;
                setUploadingImg(true);
                try{
                  const sRef=ref(storage,`banners/${Date.now()}_${file.name}`);
                  const task=uploadBytesResumable(sRef,file,{contentType:file.type});
                  task.on("state_changed",null,null,async()=>{ setNewImg(await getDownloadURL(task.snapshot.ref)); setUploadingImg(false); });
                }catch(e){ setUploadingImg(false); }
              }}/>
            </label>
            <div style={{ fontSize:11,color:TL,marginTop:4 }}>Recomendado: 1200×120px</div>
          </div>
        </div>
        <Btn onClick={handleAdd} disabled={saving||uploadingImg}>{saving?"Guardando...":"➕ Agregar banner"}</Btn>
      </Card>
    </div>
  );
}

function APagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(null);

  const cargar = () => {
    setLoading(true);
    getDocs(query(collection(db,"pagos"), orderBy("createdAt","desc")))
      .then(snap=>{ setPagos(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  };
  useEffect(()=>{ cargar(); },[]);

  const handleActivar = async (pago) => {
    setActivando(pago.id);
    try {
      const uSnap = await getDocs(query(collection(db,"usuarios"),where("uid","==",pago.userId)));
      if(pago.tipo === "tienda") {
        // Activar plan de tienda
        const tSnap = await getDocs(query(collection(db,"tiendas"),where("uid","==",pago.userId)));
        if(!tSnap.empty) await updateDoc(tSnap.docs[0].ref, { plan: pago.plan, planActivadoEn: serverTimestamp(), planDuracion: pago.duracion||"30" });
        if(!uSnap.empty) await updateDoc(uSnap.docs[0].ref, { tiendaPlan: pago.plan, tiendaPlanActivadoEn: serverTimestamp() });
      } else if(pago.tipo === "renovacion" && pago.anuncioId) {
        // Renovar anuncio pago específico
        const nuevaFecha = new Date(); nuevaFecha.setDate(nuevaFecha.getDate()+30);
        await updateDoc(doc(db,"anuncios",pago.anuncioId), { vencimientoAt: nuevaFecha, status:"activo", updatedAt: serverTimestamp() });
      } else {
        // Activar plan de anuncios
        if(!uSnap.empty) await updateDoc(uSnap.docs[0].ref, { plan: pago.plan, planActivadoEn: serverTimestamp() });
        const aSnap = await getDocs(query(collection(db,"anuncios"),where("uid","==",pago.userId),where("status","==","activo")));
        await Promise.all(aSnap.docs.map(d => updateDoc(d.ref, { plan: pago.plan })));
      }
      await updateDoc(doc(db,"pagos",pago.id), { status:"aprobado", aprobadoEn: serverTimestamp() });
      setPagos(prev=>prev.map(p=>p.id===pago.id?{...p,status:"aprobado"}:p));
    } catch(e){ console.error(e); }
    finally { setActivando(null); }
  };

  const handleRechazar = async (id) => {
    await updateDoc(doc(db,"pagos",id), { status:"rechazado" });
    setPagos(prev=>prev.map(p=>p.id===id?{...p,status:"rechazado"}:p));
  };

  const planColor = (p) => p==="diamante"?"#7C3AED":p==="esmeralda"?"#16A34A":"#6B7280";

  return (
    <div>
      <SecTitle sub="Revisá y aprobá pagos por transferencia">💸 Pagos & Comprobantes</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
        <StatCard icon="⏳" label="Pendientes" value={pagos.filter(p=>p.status==="pendiente").length.toString()} color={WARNING}/>
        <StatCard icon="✅" label="Aprobados" value={pagos.filter(p=>p.status==="aprobado").length.toString()} color={SUCCESS}/>
        <StatCard icon="❌" label="Rechazados" value={pagos.filter(p=>p.status==="rechazado").length.toString()} color={DANGER}/>
      </div>
      <Card>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando...</div> :
          pagos.length===0 ? (
            <div style={{ textAlign:"center",padding:50,color:TEXT_LIGHT }}>
              <div style={{ fontSize:48,marginBottom:12 }}>💸</div>
              <div>No hay pagos registrados todavía</div>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {pagos.map(p=>(
                <div key={p.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:`1.5px solid ${p.status==="pendiente"?WARNING:p.status==="aprobado"?SUCCESS:DANGER}22`,borderRadius:14,background:SURFACE }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,fontSize:14,color:TEXT }}>{p.nombre||p.email}</span>
                      <span style={{ background:planColor(p.plan),color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>{(p.plan||"").toUpperCase()}</span>
                      {p.tipo==="tienda"
                        ? <span style={{ background:"#1D4ED8",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>🏪 TIENDA</span>
                        : <span style={{ background:"#6B7280",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>📢 ANUNCIO</span>
                      }
                      {p.duracion && <span style={{ background:"#F3F4F6",color:"#374151",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20 }}>⏱ {p.duracion} días</span>}
                      {p.monto && <span style={{ background:"#FEF3C7",color:"#92400E",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>${Number(p.monto).toLocaleString("es-AR")}</span>}
                      <Pill label={p.status||"pendiente"} color={p.status==="pendiente"?WARNING:p.status==="aprobado"?SUCCESS:DANGER}/>
                    </div>
                    <div style={{ fontSize:12,color:TEXT_LIGHT }}>
                      {p.email} · {p.metodo==="transferencia"?"🏦 Transferencia":"💳 MercadoPago"} · {p.createdAt?.toDate?.()?.toLocaleDateString("es-AR")||"—"}
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                    {p.comprobante && (
                      <a href={p.comprobante} target="_blank" rel="noopener noreferrer"
                        style={{ background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none" }}>
                        📎 Ver comprobante
                      </a>
                    )}
                    {p.status==="pendiente" && <>
                      <Btn size="sm" color={SUCCESS} onClick={()=>handleActivar(p)} disabled={activando===p.id}>
                        {activando===p.id?"Activando...":"✅ Aprobar"}
                      </Btn>
                      <Btn size="sm" outline color={DANGER} onClick={()=>handleRechazar(p.id)}>❌ Rechazar</Btn>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Card>
    </div>
  );
}

function AModeration() {
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [words,setWords]=useState("estafa, fraude, phishing, hack");
  const [spam,setSpam]=useState("http://, gana dinero, click aqui");
  const [autoFilter,setAutoFilter]=useState(true);
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{
    try{ await setDoc(doc(db,"config","moderation"),{words,spam,autoFilter},{merge:true}); setSaved(true); setTimeout(()=>setSaved(false),2000); }catch(e){}
  };
  useEffect(()=>{
    getDoc(doc(db,"config","moderation")).then(snap=>{
      if(snap.exists()){
        setWords(snap.data().words||words);
        setSpam(snap.data().spam||spam);
        if(snap.data().autoFilter!==undefined) setAutoFilter(snap.data().autoFilter);
      }
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    getDocs(query(collection(db,"denuncias"),orderBy("createdAt","desc")))
      .then(snap=>{ setReports(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const handleResolve = async (id,status) => {
    await updateDoc(doc(db,"denuncias",id),{status});
    setReports(prev=>prev.map(r=>r.id===id?{...r,status}:r));
  };

  const handleDeleteAd = async (report) => {
    if(!window.confirm("¿Eliminar el anuncio denunciado?")) return;
    await deleteDoc(doc(db,"anuncios",report.anuncioId));
    await updateDoc(doc(db,"denuncias",report.id),{status:"resuelto"});
    setReports(prev=>prev.map(r=>r.id===report.id?{...r,status:"resuelto"}:r));
  };

  const pending = reports.filter(r=>r.status==="pendiente").length;

  return (
    <div>
      <SecTitle sub="Denuncias y moderación de contenido">🚨 Moderación</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
        <StatCard icon="⚠️" label="Denuncias pendientes" value={pending.toString()} color={DANGER}/>
        <StatCard icon="🔍" label="En revisión" value={reports.filter(r=>r.status==="revisando").length.toString()} color={WARNING}/>
        <StatCard icon="✅" label="Resueltas" value={reports.filter(r=>r.status==="resuelto").length.toString()} color={SUCCESS}/>
      </div>
      <Card style={{ marginBottom:18 }}>
        <div style={{ fontWeight:700, marginBottom:12 }}>📋 Denuncias recibidas</div>
        {loading ? <div style={{ textAlign:"center",padding:30,color:TEXT_LIGHT }}>Cargando...</div> :
          reports.length===0 ? (
            <div style={{ textAlign:"center",padding:40,color:TEXT_LIGHT }}>
              <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
              <div>No hay denuncias recibidas</div>
            </div>
          ) : (
            <Tbl headers={["Anuncio","Denunciante","Motivo","Fecha","Estado","Acciones"]} rows={reports.map(r=>[
              <span style={{ fontWeight:600,fontSize:13 }}>{r.tituloAnuncio||"Anuncio eliminado"}</span>,
              <span style={{ color:INFO,fontSize:12 }}>{r.denuncianteEmail||"—"}</span>,
              <span style={{ fontSize:12 }}>{r.motivo||"—"}</span>,
              <span style={{ fontSize:11,color:TEXT_LIGHT }}>{r.createdAt?.toDate?.()?.toLocaleDateString("es-AR")||"—"}</span>,
              <Pill label={r.status||"pendiente"} color={r.status==="pendiente"?WARNING:r.status==="revisando"?INFO:SUCCESS}/>,
              <div style={{ display:"flex",gap:4 }}>
                {r.status!=="resuelto" && <>
                  <Btn size="sm" outline color={SUCCESS} onClick={()=>handleResolve(r.id,"resuelto")}>✅</Btn>
                  <Btn size="sm" outline color={DANGER} onClick={()=>handleDeleteAd(r)}>🗑️</Btn>
                </>}
              </div>
            ])} />
          )
        }
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:12 }}>🚫 Palabras prohibidas</div>
          <Txta label="Lista (separar con coma)" value={words} onChange={setWords} rows={4}/>
          <Btn size="sm" onClick={handleSave}>{saved?"✅":"💾 Guardar"}</Btn>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:12 }}>🤖 Anti-spam</div>
          <Txta label="Frases de spam" value={spam} onChange={setSpam} rows={4}/>
          <Tog label="Filtro automático activo" checked={autoFilter} onChange={setAutoFilter} hint="Bloquea anuncios con frases de spam"/>
          <Btn size="sm" onClick={handleSave}>{saved?"✅":"💾 Guardar"}</Btn>
        </Card>
      </div>
    </div>
  );
}

function ASEO({cfg,set,onSave}) {
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{ await onSave?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div>
      <SecTitle sub="Optimizá el sitio para buscadores">🔍 SEO & Meta Tags</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📄 Página de inicio</div>
          <Inp label="Title tag" value={cfg.homeTitle} onChange={set("homeTitle")} hint="Máx. 60 caracteres" />
          <Txta label="Meta description" value={cfg.homeDesc} onChange={set("homeDesc")} rows={3}/>
          <Txta label="Meta keywords" value={cfg.homeKeys} onChange={set("homeKeys")} rows={2}/>
          <Inp label="Imagen OG" value={cfg.ogImage} onChange={set("ogImage")} hint="URL para redes sociales" />
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>⚙️ Técnico</div>
          <Tog label="Sitemap XML automático" checked={cfg.sitemapEnabled} onChange={set("sitemapEnabled")} hint="Actualizado cada 24hs"/>
          <Tog label="URLs canónicas" checked={cfg.canonicalEnabled} onChange={set("canonicalEnabled")}/>
          <Tog label="Schema.org / Rich Snippets" checked={cfg.schemaEnabled} onChange={set("schemaEnabled")} hint="Mejora visibilidad en Google"/>
          <Txta label="robots.txt" value={cfg.robotsTxt} onChange={set("robotsTxt")} rows={3}/>
        </Card>
        <Card style={{ gridColumn:"1 / -1" }}>
          <div style={{ fontWeight:700, marginBottom:14 }}>📊 Tracking</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Inp label="Google Analytics ID" value={cfg.gaCode} onChange={set("gaCode")} placeholder="G-XXXXXXXXXX"/>
            <Inp label="Facebook Pixel ID" value={cfg.fbPixel} onChange={set("fbPixel")} placeholder="123456789"/>
            <Inp label="Google Tag Manager" value={cfg.gtmCode} onChange={set("gtmCode")} placeholder="GTM-XXXXXXX"/>
          </div>
        </Card>
      </div>
      <div style={{ marginTop:18 }}><Btn onClick={handleSave}>{saved?"✅ Guardado!":"💾 Guardar SEO"}</Btn></div>
    </div>
  );
}

function AEmail({cfg,set,onSave}) {
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{ await onSave?.(); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div>
      <SecTitle sub="Servidor SMTP y plantillas de mensajes">📧 Emails & Notificaciones</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📮 SMTP</div>
          <Inp label="Host" value={cfg.smtpHost} onChange={set("smtpHost")}/>
          <Inp label="Puerto" value={cfg.smtpPort} onChange={set("smtpPort")}/>
          <Inp label="Usuario" value={cfg.smtpUser} onChange={set("smtpUser")}/>
          <Inp label="Contraseña" value={cfg.smtpPass} onChange={set("smtpPass")} type="password"/>
          <Inp label="From" value={cfg.smtpFrom} onChange={set("smtpFrom")}/>
          <Btn size="sm" outline color={INFO}>📨 Email de prueba</Btn>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🔔 Notificaciones al admin</div>
          <Tog label="Nuevo usuario" checked={cfg.notifyAdminNewUser} onChange={set("notifyAdminNewUser")}/>
          <Tog label="Nuevo anuncio" checked={cfg.notifyAdminNewAd} onChange={set("notifyAdminNewAd")}/>
          <Tog label="Nueva denuncia" checked={cfg.notifyAdminReport} onChange={set("notifyAdminReport")}/>
          <Inp label="Avisar X días antes de vencimiento" value={cfg.adExpiredDays} onChange={set("adExpiredDays")} type="number"/>
        </Card>
        <Card style={{ gridColumn:"1 / -1" }}>
          <div style={{ fontWeight:700, marginBottom:14 }}>✉️ Plantillas</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <Inp label="Asunto – Bienvenida" value={cfg.welcomeSubject} onChange={set("welcomeSubject")}/>
              <Txta label="Cuerpo – Bienvenida ({nombre}, {email})" value={cfg.welcomeBody} onChange={set("welcomeBody")} rows={3}/>
            </div>
            <div>
              <Inp label="Asunto – Anuncio aprobado" value={cfg.adApprovedSubject} onChange={set("adApprovedSubject")}/>
              <Inp label="Asunto – Anuncio por vencer" value={cfg.adExpiredSubject} onChange={set("adExpiredSubject")}/>
              <Inp label="Asunto – Nueva consulta" value={cfg.consultaSubject} onChange={set("consultaSubject")}/>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ marginTop:18 }}><Btn onClick={handleSave}>{saved?"✅ Guardado!":"💾 Guardar"}</Btn></div>
    </div>
  );
}

function AAlerts() {
  const [showAlert,setShowAlert]=useState(true);
  const [alertText,setAlertText]=useState("Si recibes un llamado en nuestro nombre, es un intento de estafa. Nuestro equipo NUNCA te llamará por teléfono.");
  const [alertType,setAlertType]=useState("warning");
  const [saved,setSaved]=useState(false);
  const handleSave = async()=>{
    try{ await setDoc(doc(db,"config","alerts"),{showAlert,alertText,alertType},{merge:true}); setSaved(true); setTimeout(()=>setSaved(false),2000); }catch(e){}
  };
  useEffect(()=>{
    getDoc(doc(db,"config","alerts")).then(snap=>{
      if(snap.exists()){
        const d=snap.data();
        if(d.showAlert!==undefined)setShowAlert(d.showAlert);
        if(d.alertText)setAlertText(d.alertText);
        if(d.alertType)setAlertType(d.alertType);
      }
    }).catch(()=>{});
  },[]);
  return (
    <div>
      <SecTitle sub="Mensajes de alerta visibles para todos los usuarios">🔔 Alertas del Sistema</SecTitle>
      <Card>
        <Tog label="Mostrar alerta de seguridad" checked={showAlert} onChange={setShowAlert}/>
        <Txta label="Texto de la alerta" value={alertText} onChange={setAlertText} rows={3}/>
        <Sel label="Tipo" value={alertType} onChange={setAlertType} options={[
          {value:"warning",label:"⚠️ Advertencia"},
          {value:"info",label:"ℹ️ Información"},
          {value:"danger",label:"🔴 Peligro"},
          {value:"success",label:"✅ Éxito"},
        ]}/>
        <Btn size="sm" onClick={handleSave}>{saved?"✅ Guardado":"💾 Guardar"}</Btn>
      </Card>
    </div>
  );
}

function AAnalytics() {
  const [stats,setStats]=useState({anuncios:0,usuarios:0,porCat:[]});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const fetch = async () => {
      try {
        const [anSnap,usSnap] = await Promise.all([
          getDocs(query(collection(db,"anuncios"),where("status","==","activo"))),
          getDocs(collection(db,"usuarios")),
        ]);
        const ads = anSnap.docs.map(d=>d.data());
        const catCount = {};
        ads.forEach(a=>{ if(a.categoria) catCount[a.categoria]=(catCount[a.categoria]||0)+1; });
        const total = ads.length||1;
        const porCat = Object.entries(catCount)
          .sort((a,b)=>b[1]-a[1]).slice(0,8)
          .map(([cat,count])=>({cat,count,pct:Math.round((count/total)*100)}));
        setStats({ anuncios:anSnap.size, usuarios:usSnap.size, porCat });
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  },[]);

  return (
    <div>
      <SecTitle sub="Estadísticas reales de uso del portal">📈 Analíticas</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
        <StatCard icon="📋" label="Anuncios activos" value={stats.anuncios.toLocaleString()} color={PRIMARY}/>
        <StatCard icon="👥" label="Usuarios registrados" value={stats.usuarios.toLocaleString()} color={SUCCESS}/>
        <StatCard icon="🗂️" label="Categorías activas" value={stats.porCat.length.toString()} color={INFO}/>
        <StatCard icon="📊" label="Datos en tiempo real" value="✅" color={SUCCESS}/>
      </div>
      <Card>
        <div style={{ fontWeight:700, marginBottom:14 }}>📊 Anuncios por categoría</div>
        {loading ? <div style={{ textAlign:"center",padding:20,color:TEXT_LIGHT }}>Cargando...</div> :
          stats.porCat.length===0 ? <div style={{ textAlign:"center",padding:20,color:TEXT_LIGHT }}>Sin datos todavía</div> :
          stats.porCat.map(b=>(
            <div key={b.cat} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{b.cat}</span>
                <span style={{ color:TEXT_LIGHT }}>{b.count} anuncios ({b.pct}%)</span>
              </div>
              <div style={{ height:8, borderRadius:4, background:BORDER }}>
                <div style={{ height:8, borderRadius:4, width:Math.max(b.pct,2)+"%", background:`linear-gradient(90deg,${PRIMARY},${PRIMARY_D})`, transition:"width 1s" }}/>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

function APages() {
  const DEFAULT_PAGES = [
    {id:"terminos",   name:"Términos y Condiciones", slug:"/terminos_condiciones", content:"", date: new Date().toLocaleDateString("es-AR")},
    {id:"privacidad", name:"Política de Privacidad",  slug:"/privacidad",           content:"", date: new Date().toLocaleDateString("es-AR")},
    {id:"consejos",   name:"Consejos de Seguridad",   slug:"/consejos",             content:"", date: new Date().toLocaleDateString("es-AR")},
    {id:"ayuda",      name:"Ayuda",                   slug:"/ayuda",                content:"", date: new Date().toLocaleDateString("es-AR")},
    {id:"nosotros",   name:"Acerca de nosotros",      slug:"/nosotros",             content:"", date: new Date().toLocaleDateString("es-AR")},
  ];
  const [pages, setPages]       = useState(DEFAULT_PAGES);
  const [editing, setEditing]   = useState(null); // null | page object
  const [newMode, setNewMode]   = useState(false);
  const [form, setForm]         = useState({ name:"", slug:"", content:"" });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(()=>{
    getDoc(doc(db,"config","pages")).then(snap=>{
      if(snap.exists() && snap.data().list?.length > 0) setPages(snap.data().list);
      else {
        setDoc(doc(db,"config","pages"),{ list: DEFAULT_PAGES },{ merge:true }).catch(()=>{});
      }
    }).catch(()=>{});
  },[]);

  const guardar = async (updated) => {
    setSaving(true);
    try { await setDoc(doc(db,"config","pages"),{ list: updated },{ merge:true }); } catch(e){}
    setSaving(false);
  };

  const handleEdit = (p) => { setForm({ name:p.name, slug:p.slug, content:p.content||"" }); setEditing(p); setNewMode(false); setSaved(false); };
  const handleNew  = () => { setForm({ name:"", slug:"", content:"" }); setEditing(null); setNewMode(true); setSaved(false); };
  const handleCancel = () => { setEditing(null); setNewMode(false); };

  const handleSave = async () => {
    if(!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    const date = new Date().toLocaleDateString("es-AR");
    let updated;
    if(newMode){
      const newPage = { id: Date.now().toString(), name:form.name.trim(), slug:form.slug.trim(), content:form.content, date };
      updated = [...pages, newPage];
    } else {
      updated = pages.map(p=>p.id===editing.id ? { ...p, name:form.name, slug:form.slug, content:form.content, date } : p);
    }
    setPages(updated);
    await guardar(updated);
    setSaving(false); setSaved(true);
    setTimeout(()=>{ setSaved(false); setEditing(null); setNewMode(false); }, 1200);
  };

  const handleDelete = async (id) => {
    const updated = pages.filter(p=>p.id!==id);
    setPages(updated);
    await guardar(updated);
    setConfirmDel(null);
  };

  // Editor
  if(editing || newMode) {
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={handleCancel} style={{ background:"none", border:`1.5px solid ${BORDER}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, color:TEXT_LIGHT, fontFamily:"inherit" }}>← Volver</button>
          <div style={{ fontWeight:700, fontSize:18, color:TEXT }}>{newMode ? "Nueva página" : `Editar: ${editing.name}`}</div>
        </div>
        <Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <Inp label="Nombre de la página" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Ej: Política de Privacidad"/>
            <Inp label="URL (slug)" value={form.slug} onChange={v=>setForm(p=>({...p,slug:v.startsWith("/")?v:"/"+v}))} placeholder="/mi-pagina"/>
          </div>
          <Txta label="Contenido (HTML o texto)" value={form.content} onChange={v=>setForm(p=>({...p,content:v}))} rows={12} placeholder="Escribí el contenido de la página..."/>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving?"Guardando...":saved?"✅ Guardado!":"💾 Guardar página"}</Btn>
            <Btn outline onClick={handleCancel}>Cancelar</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // Listado
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <SecTitle sub="Editá las páginas estáticas del portal">📄 Páginas Estáticas</SecTitle>
        <Btn size="sm" onClick={handleNew}>+ Nueva página</Btn>
      </div>
      <Card>
        <Tbl headers={["Página","URL","Última edición","Acciones"]} rows={pages.map(p=>[
          <span style={{ fontWeight:600 }}>{p.name}</span>,
          <span style={{ fontFamily:"monospace", fontSize:12, color:INFO }}>{p.slug}</span>,
          <span style={{ fontSize:12, color:TEXT_LIGHT }}>{p.date||"—"}</span>,
          <div style={{ display:"flex", gap:4 }}>
            <Btn size="sm" outline color={INFO} onClick={()=>handleEdit(p)}>✏️ Editar</Btn>
            <Btn size="sm" outline color={DANGER} onClick={()=>setConfirmDel(p.id)}>🗑️</Btn>
          </div>
        ])} />
        {saving && <div style={{ textAlign:"center", padding:8, fontSize:12, color:TEXT_LIGHT }}>💾 Guardando...</div>}
      </Card>

      {confirmDel && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:SURFACE,borderRadius:16,padding:"28px 32px",maxWidth:340,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>⚠️</div>
            <div style={{ fontWeight:700,fontSize:16,color:TEXT,marginBottom:8 }}>¿Eliminar página?</div>
            <div style={{ fontSize:13,color:TEXT_LIGHT,marginBottom:20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <Btn outline onClick={()=>setConfirmDel(null)}>Cancelar</Btn>
              <Btn color={DANGER} onClick={()=>handleDelete(confirmDel)}>Eliminar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ASecurity({cfg,set,onSave}) {
  const [savedSec,setSavedSec]=useState(false);
  const handleSaveSec = async()=>{ await onSave?.(); setSavedSec(true); setTimeout(()=>setSavedSec(false),2000); };
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleChangePass = async () => {
    if (!currentPass||!newPass||!confirmPass) return setPassMsg("error:Completá todos los campos");
    if (newPass!==confirmPass) return setPassMsg("error:Las contraseñas no coinciden");
    if (newPass.length<6) return setPassMsg("error:Mín. 6 caracteres");
    setSavingPass(true); setPassMsg("");
    try {
      const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth");
      const u = auth.currentUser;
      const cred = EmailAuthProvider.credential(u.email, currentPass);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, newPass);
      setPassMsg("success:✅ Contraseña actualizada correctamente");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch(e) {
      setPassMsg("error:"+(e.code==="auth/wrong-password"?"Contraseña actual incorrecta":"Error al cambiar la contraseña"));
    } finally { setSavingPass(false); }
  };

  return (
    <div>
      <SecTitle sub="Seguridad del panel de administración">🔒 Seguridad</SecTitle>

      {/* Cambiar contraseña */}
      <Card style={{ marginBottom:18, border:`2px solid ${PRIMARY}33` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ fontSize:20 }}>🔑</span>
          <div style={{ fontWeight:800, fontSize:15, color:TEXT }}>Cambiar contraseña del Admin</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Inp label="Contraseña actual" value={currentPass} onChange={setCurrentPass} type="password" placeholder="••••••••"/>
          <div/>
          <Inp label="Nueva contraseña" value={newPass} onChange={setNewPass} type="password" placeholder="••••••••" hint="Mín. 6 caracteres"/>
          <Inp label="Confirmar nueva contraseña" value={confirmPass} onChange={setConfirmPass} type="password" placeholder="••••••••"/>
        </div>
        {passMsg && <Alert type={passMsg.startsWith("error:")?"error":"success"}>{passMsg.replace("error:","").replace("success:","")}</Alert>}
        <Btn onClick={handleChangePass} disabled={savingPass}>{savingPass?"Guardando...":"🔑 Cambiar contraseña"}</Btn>
        <div style={{ marginTop:12, padding:"10px 14px", borderRadius:8, background:INFO+"11", border:`1px solid ${INFO}33`, fontSize:12, color:INFO }}>
          ℹ️ Admin: <strong>clasificadoschapaj@gmail.com</strong> · Protegido por Firebase Authentication
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🔐 Usuarios del sitio</div>
          <Inp label="Máx. intentos de login" value={cfg.maxLoginAttempts} onChange={set("maxLoginAttempts")} type="number"/>
          <Inp label="Bloqueo tras fallos (min)" value={cfg.loginLockMinutes} onChange={set("loginLockMinutes")} type="number"/>
          <Inp label="Duración de sesión (h)" value={cfg.sessionHours} onChange={set("sessionHours")} type="number"/>
          <Tog label="Verificación de email obligatoria" checked={cfg.requireEmailVerify} onChange={set("requireEmailVerify")}/>
          <Tog label="Verificación de teléfono" checked={cfg.requirePhoneVerify} onChange={set("requirePhoneVerify")}/>
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📋 Log de actividad reciente</div>
          {[
            {icon:"✅",txt:"Login admin exitoso",time:"hace 2min"},
            {icon:"🚫",txt:"IP bloqueada: 181.23.44.100",time:"hace 18min"},
            {icon:"⚠️",txt:"3 intentos fallidos de login",time:"hace 35min"},
            {icon:"🗑️",txt:"Anuncio eliminado #2629670",time:"hace 1h"},
          ].map((l,i)=>(
            <div key={i} style={{ display:"flex", gap:10, marginBottom:10, fontSize:13 }}>
              <span>{l.icon}</span>
              <div>
                <div style={{ color:TEXT }}>{l.txt}</div>
                <div style={{ color:TEXT_LIGHT,fontSize:11 }}>{l.time}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ marginTop:18 }}>
        <div style={{ fontWeight:700, marginBottom:14 }}>⚠️ Aviso de seguridad (footer)</div>
        <Tog label="Mostrar aviso en el sitio" checked={cfg.showSecurityNotice!==false} onChange={set("showSecurityNotice")}/>
        <Txta label="Texto del aviso" value={cfg.securityMsg||""} onChange={set("securityMsg")} rows={2} placeholder="Nuestro equipo nunca te llamará por teléfono..."/>
        <div style={{ fontSize:12, color:TEXT_LIGHT, marginTop:4 }}>El número de WhatsApp oficial se agrega automáticamente al final.</div>
      </Card>
      <div style={{ marginTop:18 }}><Btn onClick={handleSaveSec}>{savedSec?"✅ Guardado!":"💾 Guardar configuración"}</Btn></div>
    </div>
  );
}

function ABackup() {
  const [exporting,setExporting]=useState(false);
  const [exportMsg,setExportMsg]=useState("");

  const exportData = async (colName) => {
    setExporting(true); setExportMsg("");
    try {
      const snap = await getDocs(collection(db,colName));
      const data = snap.docs.map(d=>({id:d.id,...d.data()}));
      // Convertir Timestamps a strings
      const clean = JSON.parse(JSON.stringify(data, (k,v)=>{
        if(v && typeof v === "object" && v.seconds) return new Date(v.seconds*1000).toISOString();
        return v;
      }));
      const blob = new Blob([JSON.stringify(clean,null,2)],{type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${colName}_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      setExportMsg(`✅ ${colName} exportado (${clean.length} registros)`);
    } catch(e){ setExportMsg("❌ Error al exportar"); }
    finally { setExporting(false); }
  };

  return (
    <div>
      <SecTitle sub="Backups y herramientas de mantenimiento">💾 Backup & Log</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>📦 Exportar datos</div>
          {exportMsg && <div style={{ padding:"8px 12px",borderRadius:8,background:exportMsg.startsWith("✅")?SUCCESS+"18":DANGER+"18",color:exportMsg.startsWith("✅")?SUCCESS:DANGER,fontSize:13,marginBottom:12 }}>{exportMsg}</div>}
          {[
            {col:"anuncios",icon:"📋",label:"Exportar Anuncios"},
            {col:"usuarios",icon:"👥",label:"Exportar Usuarios"},
            {col:"tiendas",icon:"🏪",label:"Exportar Tiendas"},
            {col:"denuncias",icon:"🚨",label:"Exportar Denuncias"},
            {col:"banners",icon:"📣",label:"Exportar Banners"},
          ].map(t=>(
            <div key={t.col} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:13 }}>{t.icon} {t.label}</div>
              <Btn size="sm" outline color={INFO} onClick={()=>exportData(t.col)} disabled={exporting}>⬇ Exportar JSON</Btn>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🛠️ Herramientas</div>
          {[
            {icon:"🗑️",label:"Limpiar caché del navegador",color:WARNING,action:()=>{localStorage.clear();sessionStorage.clear();alert("Caché limpiado");}},
            {icon:"🔄",label:"Recargar configuración",color:INFO,action:()=>window.location.reload()},
            {icon:"📊",label:"Ver estadísticas Firebase",color:SUCCESS,action:()=>window.open("https://console.firebase.google.com/project/clasificados-chapa-j","_blank")},
            {icon:"🌐",label:"Ver sitio en vivo",color:PRIMARY,action:()=>window.open("https://www.clasificadoschapaj.com.ar","_blank")},
            {icon:"📣",label:"Panel Netlify",color:TEXT_MID,action:()=>window.open("https://app.netlify.com","_blank")},
          ].map(t=>(
            <div key={t.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:13 }}>{t.icon} {t.label}</div>
              <Btn size="sm" outline color={t.color} onClick={t.action}>Ejecutar</Btn>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ADMIN PANEL WRAPPER
// ════════════════════════════════════════════════════════════════

function AdminPanel({ onExit, globalCfg, setGlobalCfg, combo }) {
  const [active,setActive]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [cfg,setCfg]=useState(globalCfg || INIT_CFG);
  const [cfgLoaded,setCfgLoaded]=useState(false);
  const isMobile = window.innerWidth < 768;

  // Cargar cfg desde Firestore al montar
  useEffect(()=>{
    getDoc(doc(db,"config","site")).then(snap=>{
      if(snap.exists()) setCfg(prev=>({...prev,...snap.data()}));
      setCfgLoaded(true);
    }).catch(()=>setCfgLoaded(true));
  },[]);

  const setter = section => key => val => setCfg(p=>({ ...p, [section]:{ ...p[section], [key]:val } }));

  // Función para guardar cfg en Firestore
  const cfgRef = useRef(cfg);
  useEffect(()=>{ cfgRef.current = cfg; }, [cfg]);
  const reloadCfg = async () => {
    try{
      const snap = await getDoc(doc(db,"config","site"));
      if(snap.exists()) setCfg(prev=>({...prev,...snap.data()}));
    } catch(e){}
  };

  const saveCfg = async (section) => {
    try{
      const data = { [section]: cfgRef.current[section] };
      // Si se guarda el diseño y tiene heroImg, sincronizar con og:image del SEO
      if(section === "design" && cfgRef.current.design?.heroImg){
        data.seo = { ...cfgRef.current.seo, ogImage: cfgRef.current.design.heroImg };
        setCfg(prev=>({ ...prev, seo: { ...prev.seo, ogImage: cfgRef.current.design.heroImg } }));
      }
      await setDoc(doc(db,"config","site"), data, { merge:true });
    } catch(e){ console.error("Error guardando config:",e); }
  };

  const PAGE = {
    dashboard:  <ADashboard/>,
    site:       <ASiteConfig cfg={cfg.site}     set={setter("site")}     onSave={()=>saveCfg("site")} onDiscard={reloadCfg}/>,
    design:     <ADesign     cfg={cfg.design}   set={setter("design")} onSave={()=>saveCfg("design")}/>,
    ads:        <AAds/>,
    users:      <AUsers/>,
    stores:     <AStores/>,
    categories: <ACategories/>,
    pricing:    <APricing    cfg={cfg.pricing}  set={setter("pricing")} onSave={()=>saveCfg("pricing")}/>,
    banners:    <ABanners/>,
    moderation: <AModeration/>,
    pagos:      <APagos/>,
    seo:        <ASEO        cfg={cfg.seo}      set={setter("seo")}      onSave={()=>saveCfg("seo")}/>,
    email:      <AEmail      cfg={cfg.email}    set={setter("email")}    onSave={()=>saveCfg("email")}/>,
    alerts:     <AAlerts/>,
    analytics:  <AAnalytics/>,
    pages:      <APages/>,
    security:   <ASecurity   cfg={cfg.security} set={setter("security")} onSave={()=>saveCfg("security")}/>,
    backup:     <ABackup/>,
  };

  const sidebarW = isMobile ? 0 : collapsed ? 58 : 224;

  const SidebarContent = () => (
    <>
      <div style={{ padding:"16px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${PRIMARY},${PRIMARY_D})`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>🚗</div>
        {(!collapsed||isMobile) && <div style={{ color:"#fff",fontWeight:800,fontSize:12,lineHeight:1.3 }}>Panel Admin<br/><span style={{ color:PRIMARY,fontWeight:600 }}>Chapa "J"</span></div>}
        {!isMobile && <button onClick={()=>setCollapsed(o=>!o)} style={{ marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:16,flexShrink:0 }}>
          {collapsed?"▶":"◀"}
        </button>}
        {isMobile && <button onClick={()=>setMobileOpen(false)} style={{ marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:20 }}>✕</button>}
      </div>
      <nav style={{ flex:1, padding:"10px 0", overflowY:"auto" }}>
        {ADMIN_MENU.map(item=>{
          const isA=active===item.id;
          return (
            <button key={item.id} onClick={()=>{ setActive(item.id); if(isMobile) setMobileOpen(false); }} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"11px 14px", background:isA?PRIMARY:"transparent",
              border:"none", cursor:"pointer",
              color:isA?"#fff":"rgba(255,255,255,0.65)",
              fontFamily:"inherit", fontSize:13, fontWeight:isA?700:500,
              textAlign:"left", transition:"all .2s",
            }}
              onMouseEnter={e=>{if(!isA)e.currentTarget.style.background="rgba(255,107,43,0.12)";}}
              onMouseLeave={e=>{if(!isA)e.currentTarget.style.background="transparent";}}
            >
              <span style={{ fontSize:18,flexShrink:0 }}>{item.icon}</span>
              {(!collapsed||isMobile) && <span style={{ whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onExit} style={{
          width:"100%", padding:"10px", borderRadius:8, border:"none",
          background:"rgba(255,107,43,0.2)", color:PRIMARY, cursor:"pointer",
          fontFamily:"inherit", fontWeight:700, fontSize:12, display:"flex",
          alignItems:"center", gap:8, justifyContent:collapsed&&!isMobile?"center":"flex-start",
        }}>
          <span>🌐</span>{(!collapsed||isMobile) && "Ver sitio"}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Nunito','Segoe UI',sans-serif", background:"#F0F2F7", position:"relative" }}>
      <style>{`@media(max-width:768px){.admin-grid-2{grid-template-columns:1fr!important}.admin-grid-3{grid-template-columns:1fr!important}.admin-grid-4{grid-template-columns:1fr 1fr!important}}`}</style>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div onClick={()=>setMobileOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:150 }}/>
      )}

      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside style={{ width:sidebarW, background:ACCENT, display:"flex", flexDirection:"column",
          position:"sticky", top:0, height:"100vh", overflowY:"auto", overflowX:"hidden",
          transition:"width .25s", flexShrink:0 }}>
          <SidebarContent/>
        </aside>
      )}

      {/* Sidebar - Mobile drawer */}
      {isMobile && (
        <aside style={{
          position:"fixed", top:0, left:0, height:"100vh", width:280,
          background:ACCENT, display:"flex", flexDirection:"column",
          zIndex:200, transform:mobileOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform .25s", overflowY:"auto",
        }}>
          <SidebarContent/>
        </aside>
      )}

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, width:"100%" }}>
        {/* Top bar */}
        <header style={{ background:"#fff", borderBottom:`1px solid ${BORDER}`, padding:"0 20px",
          height:58, display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:10, gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {isMobile && (
              <button onClick={()=>setMobileOpen(true)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:22,color:ACCENT,padding:4 }}>☰</button>
            )}
            <div style={{ fontWeight:800, fontSize:14, color:TEXT }}>
              {ADMIN_MENU.find(m=>m.id===active)?.icon} {ADMIN_MENU.find(m=>m.id===active)?.label}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div onClick={()=>setActive("moderation")} style={{
              padding:"5px 10px", borderRadius:20, background:DANGER+"18",
              color:DANGER, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"
            }}>🚨 7 pend.</div>
            <div style={{ width:34,height:34,borderRadius:"50%",background:PRIMARY,color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,cursor:"pointer",flexShrink:0 }}>A</div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex:1, padding:"20px", overflowY:"auto", overflowX:"hidden" }}>
          {PAGE[active]}
        </div>
      </main>
    </div>
  );
}

// ── ADMIN LOGIN ──────────────────────────────────────────────────
// UID del usuario admin en Firebase Auth
const ADMIN_UID = "QbAM2F4oh6NPYy38ZD9DhRVId622";
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_LOCK_MINS = 15;

function AdminLogin({ onSuccess, onCancel }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(()=>{
    if (!locked) return;
    let s = ADMIN_LOCK_MINS*60; setTimer(s);
    const t = setInterval(()=>{ s--; setTimer(s); if(s<=0){setLocked(false);setAttempts(0);clearInterval(t);}},1000);
    return()=>clearInterval(t);
  },[locked]);

  const handle = async () => {
    if (!email||!pass) return setError("Completá los campos");
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      // Verificar que sea el usuario admin
      if (cred.user.uid !== ADMIN_UID) {
        await signOut(auth);
        throw new Error("No autorizado");
      }
      onSuccess();
    } catch(e) {
      const n = attempts+1; setAttempts(n);
      setShake(true); setTimeout(()=>setShake(false),400);
      setError(`❌ Credenciales incorrectas · ${ADMIN_MAX_ATTEMPTS-n} intento${ADMIN_MAX_ATTEMPTS-n!==1?"s":""} restante${ADMIN_MAX_ATTEMPTS-n!==1?"s":""}`);
      if(n>=ADMIN_MAX_ATTEMPTS) setLocked(true);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
      <div style={{ background:SF,borderRadius:20,padding:36,width:"100%",maxWidth:360,boxShadow:"0 32px 80px rgba(0,0,0,.4)",animation:shake?"shake .4s":"none" }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${AC},#2D2D4E)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px" }}>🛡️</div>
          <h2 style={{ fontFamily:"'Georgia',serif",fontSize:20,margin:"0 0 4px",color:AC }}>Acceso Restringido</h2>
          <p style={{ color:TL,fontSize:13,margin:0 }}>Panel de Administración · Chapa "J"</p>
        </div>
        {locked ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🔒</div>
            <div style={{ fontWeight:700,color:ER,marginBottom:8 }}>Bloqueado temporalmente</div>
            <div style={{ fontFamily:"monospace",fontSize:32,fontWeight:800,color:P }}>{String(Math.floor(timer/60)).padStart(2,"0")}:{String(timer%60).padStart(2,"0")}</div>
          </div>
        ) : (
          <>
            {error && <Alert type="error">{error}</Alert>}
            <Inp label="Email admin" value={email} onChange={setEmail} type="email" placeholder="clasificadoschapaj@gmail.com"/>
            <div style={{ position:"relative" }}>
              <Inp label="Contraseña" value={pass} onChange={setPass} type={showPass?"text":"password"} placeholder="••••••••"/>
              <button onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute",right:10,top:32,background:"none",border:"none",cursor:"pointer",fontSize:18,color:TL,padding:4 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
            <Btn full color={AC} onClick={handle} disabled={loading}>
              {loading?"Verificando...":"Ingresar al Admin"}
            </Btn>
          </>
        )}
        <button onClick={onCancel} style={{ width:"100%",marginTop:10,padding:"8px",borderRadius:8,background:"transparent",border:`1px solid ${BR}`,color:TL,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── LEGAL ────────────────────────────────────────────────────────
const DATOS_LEGALES = {
  sitio: 'Clasificados Chapa "J"',
  url: "www.clasificadoschapaj.com.ar",
  responsable: "Paulo Andrés Álvarez",
  domicilio: "Joaquín V. González 341 (Sur), Desamparados, San Juan, CP 5400, Argentina",
  email: "clasificadoschapaj@gmail.com",
  whatsapp: "2645461073",
  fecha: "Mayo 2026",
  aaip: {
    legajo: "RL-2026-46646399-APN-DNPDP#AAIP",
    expedientePaso1: "EX-2026-46646391-APN-DNPDP#AAIP",
    expedientePaso2: "EX-2026-46661004-APN-DNPDP#AAIP",
    baseDatos: "Clasificados Chapa J - Base de Usuarios",
  },
};

function LegalSection({ titulo, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize:18, fontWeight:800, color:AC, borderLeft:`4px solid ${P}`, paddingLeft:14, marginBottom:14, lineHeight:1.3 }}>{titulo}</h2>
      <div style={{ color:TM, fontSize:14, lineHeight:1.8 }}>{children}</div>
    </div>
  );
}

function LegalItem({ children }) {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
      <span style={{ color:P, fontWeight:700, flexShrink:0, marginTop:2 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

function Terminos() {
  const D = DATOS_LEGALES;
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`, borderRadius:16, padding:"32px 36px", marginBottom:36, color:"#fff" }}>
        <div style={{ fontSize:12, color:P, fontWeight:700, letterSpacing:1, marginBottom:8 }}>DOCUMENTO LEGAL</div>
        <h1 style={{ fontSize:28, fontFamily:"'Georgia',serif", fontWeight:700, margin:"0 0 10px" }}>Términos y Condiciones de Uso</h1>
        <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, margin:0 }}>{D.sitio} · Vigente desde {D.fecha} · Última actualización: {D.fecha}</p>
      </div>
      <LegalSection titulo="1. Aceptación de los Términos">
        <p style={{ marginBottom:12 }}>Al acceder y utilizar <strong>{D.url}</strong>, el usuario acepta en forma expresa e incondicional los presentes Términos y Condiciones. Si no está de acuerdo, deberá abstenerse de utilizar el Sitio.</p>
        <p>El Sitio es operado por <strong>{D.responsable}</strong>, con domicilio en {D.domicilio}, República Argentina.</p>
      </LegalSection>
      <LegalSection titulo="2. Descripción del Servicio">
        <p style={{ marginBottom:12 }}><strong>{D.sitio}</strong> es un portal de clasificados que permite publicar, buscar y contactar anuncios de compraventa en San Juan, Argentina. El Sitio actúa como intermediario sin intervenir en las transacciones.</p>
        <LegalItem>El Operador no es parte de las transacciones entre usuarios.</LegalItem>
        <LegalItem>El Operador no garantiza la veracidad ni legalidad de los anuncios.</LegalItem>
        <LegalItem>El Operador no asume responsabilidad por los bienes o servicios ofrecidos.</LegalItem>
      </LegalSection>
      <LegalSection titulo="3. Registro de Usuarios">
        <LegalItem>El registro es gratuito y requiere un email válido y contraseña.</LegalItem>
        <LegalItem>El usuario debe ser mayor de 18 años para registrarse.</LegalItem>
        <LegalItem>El usuario es responsable de mantener la confidencialidad de sus credenciales.</LegalItem>
        <LegalItem>Está prohibido crear cuentas falsas, duplicadas o con datos de terceros.</LegalItem>
        <LegalItem>La baja de cuenta puede solicitarse enviando un email a {D.email}.</LegalItem>
      </LegalSection>
      <LegalSection titulo="4. Planes y Tipos de Anuncios">
        <p style={{ marginBottom:12 }}>El Sitio ofrece los siguientes planes de publicación:</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
          {[
            { plan:"🪨 Cuarzo", desc:"Publicación gratuita con todas las funciones básicas. Sin vigencia.", color:"#6B7280" },
            { plan:"💚 Esmeralda", desc:"Anuncio destacado con mayor visibilidad. $5.000/mes.", color:"#16A34A" },
            { plan:"💠 Diamante", desc:"Máxima visibilidad y posicionamiento prioritario. $9.000/mes.", color:"#7C3AED" },
          ].map(p=>(
            <div key={p.plan} style={{ padding:14, borderRadius:10, border:`1.5px solid ${p.color}33`, background:p.color+"08" }}>
              <div style={{ fontWeight:700, color:p.color, marginBottom:6 }}>{p.plan}</div>
              <div style={{ fontSize:12, color:TM, lineHeight:1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
        <LegalItem>Los precios de los planes pagos están sujetos a cambios sin previo aviso.</LegalItem>
        <LegalItem>Los pagos realizados no son reembolsables salvo error imputable al Operador.</LegalItem>
      </LegalSection>
      <LegalSection titulo="5. Contenido Prohibido">
        <LegalItem>Bienes o servicios ilegales, robados o de procedencia dudosa.</LegalItem>
        <LegalItem>Contenido engañoso, falso o fraudulento.</LegalItem>
        <LegalItem>Material pornográfico, violento o discriminatorio.</LegalItem>
        <LegalItem>Armas, drogas, medicamentos sin receta o sustancias controladas.</LegalItem>
        <LegalItem>Múltiples anuncios del mismo artículo (spam).</LegalItem>
      </LegalSection>
      <LegalSection titulo="6. Seguridad y Prevención de Estafas">
        <p style={{ marginBottom:12 }}>El equipo de <strong>{D.sitio}</strong> nunca solicitará datos bancarios, contraseñas ni pagos anticipados. Nuestro único WhatsApp oficial es <strong>{D.whatsapp}</strong>.</p>
        <LegalItem>El Operador no se hace responsable por estafas entre usuarios.</LegalItem>
        <LegalItem>Recomendamos realizar transacciones en persona y en lugares públicos.</LegalItem>
      </LegalSection>
      <LegalSection titulo="7. Ley Aplicable y Jurisdicción">
        <p>Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad de San Juan.</p>
      </LegalSection>
      <div style={{ background:BG, borderRadius:12, padding:"16px 20px", border:`1px solid ${BR}`, fontSize:13, color:TL }}>
        <strong style={{ color:TM }}>Contacto legal:</strong> {D.responsable} · {D.domicilio} · {D.email}
      </div>
    </div>
  );
}

function Privacidad() {
  const D = DATOS_LEGALES;
  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#166534,#15803D)", borderRadius:16, padding:"32px 36px", marginBottom:36, color:"#fff" }}>
        <div style={{ fontSize:12, color:"#86EFAC", fontWeight:700, letterSpacing:1, marginBottom:8 }}>DOCUMENTO LEGAL</div>
        <h1 style={{ fontSize:28, fontFamily:"'Georgia',serif", fontWeight:700, margin:"0 0 10px" }}>Política de Privacidad</h1>
        <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, margin:0 }}>{D.sitio} · Vigente desde {D.fecha} · Ley 25.326</p>
      </div>
      <LegalSection titulo="1. Responsable del Tratamiento">
        <div style={{ background:BG, borderRadius:10, padding:"14px 18px", margin:"12px 0", fontSize:14 }}>
          <div><strong>Nombre:</strong> {D.responsable}</div>
          <div><strong>Domicilio:</strong> {D.domicilio}</div>
          <div><strong>Email:</strong> {D.email}</div>
          <div><strong>WhatsApp:</strong> {D.whatsapp}</div>
        </div>
      </LegalSection>
      <LegalSection titulo="2. Datos que Recolectamos">
        <LegalItem>Datos de registro: nombre, email, contraseña (encriptada), teléfono.</LegalItem>
        <LegalItem>Datos de anuncios: título, descripción, fotos, precio, categoría, localidad.</LegalItem>
        <LegalItem>Datos técnicos: dirección IP, navegador, dispositivo, páginas visitadas.</LegalItem>
      </LegalSection>
      <LegalSection titulo="3. Finalidad del Tratamiento">
        <LegalItem>Gestionar tu cuenta y permitirte publicar anuncios.</LegalItem>
        <LegalItem>Facilitar la comunicación entre compradores y vendedores.</LegalItem>
        <LegalItem>Mejorar el funcionamiento y la seguridad del Sitio.</LegalItem>
        <LegalItem>Prevenir fraudes y conductas abusivas.</LegalItem>
        <LegalItem>Cumplir con obligaciones legales.</LegalItem>
      </LegalSection>
      <LegalSection titulo="4. Compartición de Datos">
        <p style={{ marginBottom:10 }}><strong>No vendemos ni alquilamos tus datos a terceros.</strong> Solo los compartimos con:</p>
        <LegalItem><strong>Otros usuarios:</strong> datos de contacto que elegís hacer públicos.</LegalItem>
        <LegalItem><strong>Firebase (Google):</strong> almacenamiento de datos.</LegalItem>
        <LegalItem><strong>MercadoPago:</strong> procesamiento de pagos.</LegalItem>
        <LegalItem><strong>Autoridades:</strong> cuando sea requerido por ley o por orden judicial.</LegalItem>
      </LegalSection>
      <LegalSection titulo="5. Tus Derechos (ARCO)">
        <p style={{ marginBottom:10 }}>De acuerdo con la Ley 25.326, tenés derecho a Acceso, Rectificación, Cancelación y Oposición de tus datos.</p>
        <p>Para ejercerlos, enviá un email a <strong>{D.email}</strong> indicando tu nombre y el derecho que deseás ejercer. Responderemos en un plazo máximo de <strong>30 días hábiles</strong>.</p>
      </LegalSection>
      <LegalSection titulo="6. Seguridad">
        <LegalItem>Contraseñas almacenadas con encriptación.</LegalItem>
        <LegalItem>Comunicaciones protegidas mediante HTTPS/SSL.</LegalItem>
        <LegalItem>Acceso restringido a datos solo al personal autorizado.</LegalItem>
      </LegalSection>
      <LegalSection titulo="7. Autoridad de Control">
        <p style={{ marginBottom:10 }}>La autoridad de control es la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>. Sitio web: <strong>www.argentina.gob.ar/aaip</strong></p>
        <p style={{ marginBottom:6 }}>Esta base de datos se encuentra debidamente inscripta en el <strong>Registro Nacional de Bases de Datos Personales</strong> conforme a la Ley 25.326:</p>
        <LegalItem><strong>Responsable:</strong> {D.responsable} · Legajo {D.aaip.legajo}</LegalItem>
        <LegalItem><strong>Base de datos:</strong> {D.aaip.baseDatos} · Expediente {D.aaip.expedientePaso2}</LegalItem>
        <LegalItem><strong>Fecha de inscripción:</strong> 10/05/2026</LegalItem>
      </LegalSection>
      <div style={{ background:BG, borderRadius:12, padding:"16px 20px", border:`1px solid ${BR}`, fontSize:13, color:TL }}>
        <strong style={{ color:TM }}>Contacto privacidad:</strong> {D.responsable} · {D.domicilio} · {D.email}
      </div>
    </div>
  );
}

function Seguridad() {
  const D = DATOS_LEGALES;
  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,#DC2626,#991B1B)`, borderRadius:16, padding:"32px 36px", marginBottom:36, color:"#fff" }}>
        <div style={{ fontSize:12, color:"#FCA5A5", fontWeight:700, letterSpacing:1, marginBottom:8 }}>CONSEJOS IMPORTANTES</div>
        <h1 style={{ fontSize:28, fontFamily:"'Georgia',serif", fontWeight:700, margin:"0 0 10px" }}>🛡️ Seguridad en tus transacciones</h1>
        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, margin:0 }}>Leé estos consejos antes de comprar o vender en {D.sitio}</p>
      </div>

      <LegalSection titulo="🛒 Si vas a COMPRAR, desconfiá cuando el vendedor...">
        <LegalItem>Te pide un <strong>adelanto del pago</strong> del producto o del valor del envío antes de que lo recibas.</LegalItem>
        <LegalItem>Te informa una <strong>ubicación distinta</strong> a la que aparece en su anuncio.</LegalItem>
        <LegalItem>Ofrece <strong>promociones muy llamativas o precios sospechosamente bajos</strong> para el producto.</LegalItem>
        <LegalItem>Ofrece precios muy bajos <strong>y además el vendedor es nuevo</strong> en el sitio (registrado en los últimos días).</LegalItem>
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 16px", marginTop:12, fontSize:13, color:"#991B1B" }}>
          💡 Si un anuncio te resulta sospechoso, usá el botón <strong>"Denunciar este anuncio"</strong> que encontrás en cada publicación. Tu alerta nos ayuda a verificar el anuncio y su anunciante.
        </div>
      </LegalSection>

      <LegalSection titulo="💰 Si vas a VENDER, desconfiá cuando el comprador...">
        <LegalItem>Quiere abonarte a través de <strong>Western Union, PayPal, MoneyGram</strong> u otros medios de pago electrónicos no habituales.</LegalItem>
        <LegalItem>Quiere abonarte con <strong>moneda extranjera</strong>. Si aceptás, realizá la transacción en un banco o casa de cambio para verificar la autenticidad.</LegalItem>
        <LegalItem>Quiere abonarte con <strong>cheques</strong>. Si aceptás, corroborá con tu banco si tiene fondos o esperá la acreditación antes de enviar el producto.</LegalItem>
        <LegalItem>Te ofrece una seña vía transferencia bancaria pero en realidad te está enviando una <strong>solicitud de transferencia desde tu cuenta a la suya</strong>.</LegalItem>
        <LegalItem>Te envía un <strong>comprobante falso por un monto mayor</strong> al acordado exigiéndote la devolución de la diferencia.</LegalItem>
        <LegalItem>Quiere <strong>recibir el producto antes de pagar</strong> por él.</LegalItem>
      </LegalSection>

      <LegalSection titulo="✅ Consejos generales">
        <LegalItem>En lo posible <strong>realizá la transacción en persona y en lugar seguro</strong>. Tenés especial precaución con usuarios fuera del país.</LegalItem>
        <LegalItem><strong>Nunca envíes información personal</strong>: datos bancarios, dirección de correo, número de tarjeta, contraseñas, etc.</LegalItem>
        <LegalItem>Corroborá los datos del comprador <strong>antes de enviar el producto</strong>.</LegalItem>
      </LegalSection>

      <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`, borderRadius:14, padding:"24px 28px", color:"#fff", marginTop:8 }}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>📞 Medios de contacto oficiales</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:14 }}>
          <div>📱 <strong>WhatsApp:</strong> {D.whatsapp}</div>
          <div>📧 <strong>Email:</strong> {D.email}</div>
        </div>
        <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(255,255,255,0.1)", borderRadius:10, fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.7 }}>
          ⚠️ <strong>ATENCIÓN:</strong> Nuestro equipo <strong>nunca te llamará por teléfono</strong>. Eventualmente podés recibir un WhatsApp desde nuestro único número oficial para brindarte un consejo o verificar un anuncio. Si recibís cualquier comunicación desde un número privado u otro canal haciéndose pasar por {D.sitio}, <strong>ignoralo o denuncialo</strong>.
        </div>
      </div>
    </div>
  );
}

// ── CÓMO PUBLICAR ────────────────────────────────────────────────
function ComoPublicarView({ onVolver, onPublicar }) {
  const D = DATOS_LEGALES;
  const pasos = [
    {
      num:1, icon:"👤", color:"#3B82F6", titulo:"Registrate o iniciá sesión",
      desc:"Hacé clic en el botón naranja \"+ Publicar GRATIS\" en la parte superior de la página. Si ya tenés cuenta, ingresá con tu email y contraseña. Si es tu primera vez, crear una cuenta es gratis y tarda menos de un minuto.",
      tips:["Tu cuenta te permite gestionar todos tus anuncios desde un solo lugar","Podés iniciar sesión con email y contraseña","Tus datos están protegidos según nuestra política de privacidad"]
    },
    {
      num:2, icon:"✏️", color:"#F59E0B", titulo:"Completá los datos del anuncio",
      desc:"Llenás el formulario con la información de lo que querés vender o ofrecer. Cuanto más detallado sea tu anuncio, más posibilidades tenés de vender rápido.",
      tips:["Título claro y descriptivo — ej: \"Heladera Gafa 350L con freezer, blanca\"","Descripción con estado, medidas, detalles importantes","Precio en pesos o dólares, o marcalo como \"Consultar\"","Elegí la categoría y subcategoría correcta","Indicá si es nuevo o usado y en qué localidad está","💡 Si tenés plan Esmeralda o Diamante podés usar el Asistente IA para completar todo automáticamente"]
    },
    {
      num:3, icon:"📷", color:"#8B5CF6", titulo:"Agregá fotos",
      desc:"Las fotos son lo más importante de tu anuncio. Los anuncios con fotos reciben hasta 5 veces más consultas. Podés subir hasta 20 fotos por anuncio.",
      tips:["La primera foto es la que aparece como portada en el listado","Usá buena iluminación y fondo limpio","Mostrá el artículo desde varios ángulos","Las fotos se comprimen automáticamente sin perder calidad","Podés agregar o cambiar fotos después desde Mis Anuncios"]
    },
    {
      num:4, icon:"📞", color:"#10B981", titulo:"Configurá tu contacto",
      desc:"Decidís si querés que los compradores te contacten directamente por WhatsApp o a través del sistema de mensajes interno del sitio. Ambas opciones son gratuitas.",
      tips:["Podés activar tu número de WhatsApp para contacto directo","Si no mostrás WhatsApp, los compradores usan el chat interno","El número de WhatsApp solo lo ven usuarios registrados"]
    },
    {
      num:5, icon:"✅", color:"#16A34A", titulo:"¡Publicá gratis!",
      desc:"Revisá todo y hacé clic en \"Publicar gratis\". Tu anuncio aparece en el sitio en segundos y lo podés ver en \"Mis Anuncios\" dentro de tu cuenta.",
      tips:["El anuncio Cuarzo es 100% gratis y sin vencimiento","Podés editarlo, pausarlo o borrarlo en cualquier momento","Para más visibilidad, destacalo con plan Esmeralda o Diamante","Desde Mis Anuncios podés editar título, precio y fotos cuando quieras"]
    },
  ];

  const planes = [
    { icon:"🪨", nombre:"Cuarzo", color:"#6B7280", bg:"#F9FAFB", precio:"Gratis", desc:"Publicación básica en el listado general. Sin límite de tiempo." },
    { icon:"💚", nombre:"Esmeralda", color:"#16A34A", bg:"#F0FDF4", precio:"Pago mensual", desc:"Badge verde, mayor visibilidad, aparecés antes que Cuarzo y acceso al Asistente IA." },
    { icon:"💠", nombre:"Diamante", color:"#7C3AED", bg:"#F5F3FF", precio:"Pago mensual", desc:"Badge violeta, primero en todos los listados y buscador, máxima exposición + IA." },
  ];

  return (
    <div style={{ fontFamily:"Nunito,sans-serif",background:BG,minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${P},#E05520)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🚗</div>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:15 }}>Clasificados Chapa "J"</div>
            <div style={{ color:"rgba(255,255,255,0.4)",fontSize:11 }}>Guía de publicación</div>
          </div>
        </div>
        <button onClick={onVolver} style={{ background:"none",border:`1px solid rgba(255,255,255,0.3)`,color:"rgba(255,255,255,0.7)",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>← Volver al sitio</button>
      </div>

      <div style={{ maxWidth:860,margin:"0 auto",padding:"40px 20px 60px" }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg,${P},${PD})`,borderRadius:16,padding:"32px 36px",marginBottom:40,color:"#fff",textAlign:"center" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>📢</div>
          <h1 style={{ fontFamily:"'Georgia',serif",fontSize:28,fontWeight:700,margin:"0 0 10px" }}>¿Cómo publicar un anuncio?</h1>
          <p style={{ color:"rgba(255,255,255,0.8)",fontSize:15,margin:"0 0 20px",lineHeight:1.6 }}>
            Publicar en Clasificados Chapa "J" es <strong>gratis, rápido y fácil</strong>.<br/>En menos de 5 minutos tu anuncio está visible para toda la provincia de San Juan.
          </p>
          <button onClick={onPublicar}
            style={{ padding:"12px 32px",borderRadius:12,background:"#fff",color:P,border:"none",
              cursor:"pointer",fontWeight:800,fontSize:15,fontFamily:"inherit",
              boxShadow:"0 4px 16px rgba(0,0,0,.2)" }}>
            ✏️ Publicar mi anuncio ahora
          </button>
        </div>

        {/* Pasos */}
        <h2 style={{ fontFamily:"'Georgia',serif",fontSize:22,fontWeight:700,color:TX,marginBottom:20 }}>Paso a paso</h2>
        <div style={{ display:"flex",flexDirection:"column",gap:16,marginBottom:40 }}>
          {pasos.map((p,idx)=>(
            <div key={p.num} style={{ background:SF,border:`1.5px solid ${BR}`,borderRadius:16,overflow:"hidden" }}>
              <div style={{ display:"flex",alignItems:"center",gap:16,padding:"18px 20px",borderBottom:`1px solid ${BR}`,background:`${p.color}08` }}>
                <div style={{ width:48,height:48,borderRadius:14,background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:p.color,letterSpacing:1,marginBottom:2 }}>PASO {p.num}</div>
                  <div style={{ fontWeight:800,fontSize:16,color:TX }}>{p.titulo}</div>
                </div>
                <div style={{ marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0 }}>{p.num}</div>
              </div>
              <div style={{ padding:"16px 20px" }}>
                <p style={{ fontSize:14,color:TM,lineHeight:1.7,margin:"0 0 14px" }}>{p.desc}</p>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {p.tips.map(t=>(
                    <div key={t} style={{ display:"flex",alignItems:"flex-start",gap:8,fontSize:13,color:TX }}>
                      <span style={{ width:18,height:18,borderRadius:"50%",background:`${p.color}22`,color:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0,marginTop:1,fontWeight:700 }}>✓</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Planes */}
        <h2 style={{ fontFamily:"'Georgia',serif",fontSize:22,fontWeight:700,color:TX,marginBottom:8 }}>Tipos de publicación</h2>
        <p style={{ fontSize:14,color:TM,marginBottom:20,lineHeight:1.6 }}>Todos pueden publicar gratis. Si querés más visibilidad, podés destacar tu anuncio con un plan pago:</p>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:40 }}>
          {planes.map(pl=>(
            <div key={pl.nombre} style={{ background:pl.bg,border:`1.5px solid ${pl.color}44`,borderRadius:14,padding:"18px 20px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                <span style={{ fontSize:24 }}>{pl.icon}</span>
                <div>
                  <div style={{ fontWeight:800,fontSize:15,color:pl.color }}>{pl.nombre}</div>
                  <div style={{ fontSize:11,color:TL,fontWeight:600 }}>{pl.precio}</div>
                </div>
              </div>
              <p style={{ fontSize:13,color:TM,margin:0,lineHeight:1.6 }}>{pl.desc}</p>
            </div>
          ))}
        </div>

        {/* Preguntas frecuentes */}
        <h2 style={{ fontFamily:"'Georgia',serif",fontSize:22,fontWeight:700,color:TX,marginBottom:16 }}>Preguntas frecuentes</h2>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:40 }}>
          {[
            { q:"¿Cuánto cuesta publicar?", a:"Publicar en plan Cuarzo es completamente gratis, sin límite de tiempo ni cantidad de anuncios." },
            { q:"¿Puedo editar mi anuncio después de publicarlo?", a:"Sí. Desde Mis Anuncios podés editar el título, precio, descripción y fotos en cualquier momento." },
            { q:"¿Cuándo aparece mi anuncio en el sitio?", a:"Inmediatamente después de publicar, tu anuncio ya es visible para todos los usuarios." },
            { q:"¿Cómo me contactan los compradores?", a:"Pueden escribirte por WhatsApp (si lo activaste) o por el sistema de mensajes interno del sitio." },
            { q:"¿Qué pasa si mi anuncio vence?", a:"Los anuncios Cuarzo no vencen. Los planes pagos tienen vigencia de 30 días y podés renovarlos desde Mis Anuncios." },
          ].map(faq=>(
            <div key={faq.q} style={{ background:SF,border:`1.5px solid ${BR}`,borderRadius:12,padding:"14px 18px" }}>
              <div style={{ fontWeight:700,fontSize:14,color:TX,marginBottom:6 }}>❓ {faq.q}</div>
              <div style={{ fontSize:13,color:TM,lineHeight:1.6 }}>💬 {faq.a}</div>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div style={{ background:`linear-gradient(135deg,${AC},#2D2D4E)`,borderRadius:16,padding:"28px 32px",textAlign:"center",color:"#fff" }}>
          <div style={{ fontSize:36,marginBottom:10 }}>🚀</div>
          <h3 style={{ fontFamily:"'Georgia',serif",fontSize:20,margin:"0 0 8px" }}>¿Listo para publicar?</h3>
          <p style={{ color:"rgba(255,255,255,0.7)",fontSize:14,margin:"0 0 18px" }}>Es gratis, tarda 5 minutos y tu anuncio llega a toda San Juan.</p>
          <button onClick={onPublicar}
            style={{ padding:"12px 32px",borderRadius:12,background:P,color:"#fff",border:"none",
              cursor:"pointer",fontWeight:800,fontSize:15,fontFamily:"inherit",
              boxShadow:`0 4px 16px ${P}55` }}>
            ✏️ Publicar mi anuncio gratis
          </button>
          <div style={{ marginTop:14,fontSize:12,color:"rgba(255,255,255,0.5)" }}>
            ¿Tenés dudas? Contactanos: {D.email} · {D.whatsapp}
          </div>
        </div>

      </div>

      <div style={{ background:AC,padding:"20px",textAlign:"center",color:"rgba(255,255,255,0.4)",fontSize:12 }}>
        © 2026 Clasificados Chapa "J" · {D.responsable} · {D.domicilio}
      </div>
    </div>
  );
}

function LegalView({ onVolver, initialTab="terminos" }) {
  const [pagina, setPagina] = useState(initialTab);
  return (
    <div style={{ fontFamily:"Nunito,sans-serif", background:BG, minHeight:"100vh" }}>
      <div style={{ background:AC, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${P},#E05520)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🚗</div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Clasificados Chapa "J"</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>Documentos Legales</div>
          </div>
        </div>
        <button onClick={onVolver} style={{ background:"none", border:`1px solid rgba(255,255,255,0.3)`, color:"rgba(255,255,255,0.7)", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>← Volver al sitio</button>
      </div>
      <div style={{ background:SF, borderBottom:`1px solid ${BR}`, padding:"0 20px", display:"flex", overflowX:"auto" }}>
        {[
          { id:"terminos",   label:"📄 Términos y Condiciones" },
          { id:"privacidad", label:"🔒 Política de Privacidad" },
          { id:"seguridad",  label:"🛡️ Seguridad" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setPagina(t.id)} style={{ padding:"14px 20px", border:"none", background:"transparent", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", color:pagina===t.id?P:TM, borderBottom:`3px solid ${pagina===t.id?P:"transparent"}` }}>{t.label}</button>
        ))}
      </div>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"40px 20px 60px" }}>
        {pagina==="terminos" ? <Terminos/> : pagina==="privacidad" ? <Privacidad/> : <Seguridad/>}
      </div>
      <div style={{ background:AC, padding:"20px", textAlign:"center", color:"rgba(255,255,255,0.4)", fontSize:12 }}>
        © 2026 Clasificados Chapa "J" · {DATOS_LEGALES.responsable} · {DATOS_LEGALES.domicilio}
      </div>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("front");
  const [legalTab, setLegalTab] = useState("terminos");
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPublicar, setShowPublicar] = useState(false);
  const [showMiCuenta, setShowMiCuenta] = useState(false);
  const [miCuentaTab, setMiCuentaTab] = useState("anuncios");
  const [showSuccess, setShowSuccess] = useState(false);
  const keysHeld = useState(new Set())[0];

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async u=>{
      setUser(u);
      if (u) {
        const q = query(collection(db,"usuarios"),where("uid","==",u.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setUserData({id:snap.docs[0].id,...snap.docs[0].data()});
      } else { setUserData(null); }
    });
    return ()=>unsub();
  },[]);

  // Hotkey for admin
  useEffect(()=>{
    const down = e => {
      keysHeld.add(e.code);
      const ctrl  = !ADMIN_CFG.ctrl  || e.ctrlKey;
      const shift = !ADMIN_CFG.shift || e.shiftKey;
      const alt   = !ADMIN_CFG.alt   || e.altKey;
      if (ctrl&&shift&&alt&&e.code===ADMIN_CFG.hotkey&&view==="front") { e.preventDefault(); setView("adminLogin"); }
    };
    const up = e => keysHeld.delete(e.code);
    window.addEventListener("keydown",down);
    window.addEventListener("keyup",up);
    return()=>{ window.removeEventListener("keydown",down); window.removeEventListener("keyup",up); };
  },[view]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:10px;height:8px;}
        ::-webkit-scrollbar-track{background:#F1F1F1;border-radius:10px;}
        ::-webkit-scrollbar-thumb{background:#B0B0B0;border-radius:10px;border:2px solid #F1F1F1;}
        ::-webkit-scrollbar-thumb:hover{background:#888;}
        ::-webkit-scrollbar-thumb:active{background:#FF6B2B;}
        html{scrollbar-width:thin;scrollbar-color:#B0B0B0 #F1F1F1;}
      `}</style>

      {view==="front" && (
        <FrontSite user={user} userData={userData}
          onLogin={()=>setShowAuth(true)}
          onPublicar={()=>user?setShowPublicar(true):setShowAuth(true)}
          onMiCuenta={(tab)=>{ if(user){ setMiCuentaTab(tab||"anuncios"); setShowMiCuenta(true); } else { setShowAuth(true); } }}
          onLegal={(tab)=>{ setLegalTab(tab||"terminos"); setView("legal"); }}
          onComoPublicar={()=>setView("comoPublicar")}
        />
      )}

      {view==="comoPublicar" && (
        <ComoPublicarView onVolver={()=>setView("front")} onPublicar={()=>{ setView("front"); user?setShowPublicar(true):setShowAuth(true); }}/>
      )}

      {view==="legal" && (
        <LegalView initialTab={legalTab} onVolver={()=>setView("front")}/>
      )}

      {view==="adminLogin" && (
        <AdminLogin onSuccess={()=>setView("admin")} onCancel={()=>setView("front")}/>
      )}

      {view==="admin" && (
        <AdminPanel onExit={()=>setView("front")} combo="Ctrl+Shift+A"/>
      )}

      {showAuth && (
        <AuthModal onClose={()=>setShowAuth(false)} onSuccess={()=>{ setShowAuth(false); setShowSuccess(true); setTimeout(()=>setShowSuccess(false),3000); }}/>
      )}

      {showPublicar && user && (
        <PublicarModal user={user} userData={userData}
          onClose={()=>setShowPublicar(false)}
          onSuccess={()=>{ setShowPublicar(false); setShowSuccess(true); setTimeout(()=>setShowSuccess(false),3000); }}
        />
      )}

      {showMiCuenta && user && (
        <MiCuenta user={user} userData={userData} onClose={()=>setShowMiCuenta(false)} onPublicar={()=>user?setShowPublicar(true):setShowAuth(true)} initialTab={miCuentaTab}/>
      )}

      {showSuccess && (
        <div style={{ position:"fixed",bottom:24,right:24,zIndex:500,background:OK,color:"#fff",padding:"14px 20px",borderRadius:12,fontWeight:700,fontSize:14,boxShadow:"0 8px 24px rgba(0,0,0,.2)",fontFamily:"Nunito,sans-serif" }}>
          ✅ ¡Listo! Todo guardado correctamente
        </div>
      )}

      {/* Invisible combo hint */}
      {view==="front" && (
        <div style={{ position:"fixed",bottom:6,right:8,fontSize:9,color:"rgba(0,0,0,.06)",userSelect:"none",pointerEvents:"none",fontFamily:"monospace" }}>
          Ctrl+Shift+A
        </div>
      )}
    </>
  );
}
