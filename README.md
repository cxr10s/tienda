# - Tienda Deportiva - 🏪

> comercio deportivo moderno con autenticación Google, pagos reales con Wompi y carrito sincronizado en la nube.

![Estado](https://img.shields.io/badge/Estado-Activo-brightgreen) ![Stack](https://img.shields.io/badge/Scripts-HTML%20%7C%20CSS%20%7C%20JS-yellow) ![Firebase](https://img.shields.io/badge/Auth-Firebase-orange) ![Supabase](https://img.shields.io/badge/BD-Supabase-3ecf8e) ![Wompi](https://img.shields.io/badge/Pagos-Wompi-blueviolet)

---

## ✨ Características

- 🛒 **Carrito persistente en la nube** — sincronizado con la cuenta de Google del usuario vía Firestore. El carrito se restaura en cualquier dispositivo.
- 🔐 **Autenticación Google** — inicio de sesión con Firebase Auth. El modal se actualiza en tiempo real sin recargar la página.
- 💳 **Pagos con Wompi** — integración completa con firma de integridad SHA-256 y redirección de resultado.
- 🧾 **Generación de facturas PDF** — descarga automática con jsPDF antes de redirigir al pago.
- 📦 **Consulta de pedidos** — búsqueda por correo o por ID de factura, con historial completo del estado.
- 🎁 **Sistema de regalos y descuentos progresivos** — descuentos automáticos por volumen de compra y regalo gratis desde $150.000 COP.
- 📱 **Diseño responsive** — navbar en desktop, navegación móvil optimizada con carrito flotante.
- 🟢 **Navegacion activo dinamico** — el ítem resaltado cambia automáticamente según la sección visible.

---

## 🗂️ Estructura del proyecto

```
tienda/
├── index.html          # Página principal — productos, barra de navegacion, carrito
├── mis-pedidos.html    # Consulta de pedidos por correo o ID
├── pago-resultado.html # Resultado del pago Wompi
├── admin.html          # Panel de administración de pedidos
├── script.js           # Lógica del carrito, UI, sincronización Firestore
├── order-system.js     # Submit del pedido → Supabase → Wompi
├── factura.js          # Generador de PDF con jsPDF
└── styles.css          # Estilos globales
```

---

## ⚙️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Autenticación | Firebase Auth (Google Sign-In) |
| Base de datos pedidos | Supabase (PostgreSQL) |
| Carrito en la nube | Firestore (Firebase) |
| Pagos | Wompi (Colombia) |
| Facturas PDF | jsPDF |
| Hosting | GitHub Pages |

---

## 🚀 Despliegue

El proyecto se sirve directamente desde **GitHub Pages** sin necesidad de build ni servidor.

```
https://cxr10s.github.io/tienda/
```

Para correrlo localmente, simplemente abre el link en un navegador o usa Live Server en VS Code.


---

## 👤 Autor

**Jhon Carlos Meneses Peinado**  
**Perfil** [@cxr10s](https://github.com/cxr10s) — Colombia

---
