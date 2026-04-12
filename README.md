<div align="center">

# `STORE `
### Tienda Deportiva — Colombia

*Comercio deportivo moderno con autenticacion Google, pagos reales con Wompi y carrito sincronizado en la nube.*

![Estado](https://img.shields.io/badge/●_Estado-Activo-adff2f?style=flat-square&labelColor=0a0a0a)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Wompi](https://img.shields.io/badge/Wompi-6D28D9?style=flat-square&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222?style=flat-square&logo=github&logoColor=white)

**[→ Ver tienda en vivo](https://cxr10s.github.io/tienda/)**

</div>

---

## ✨ Características

| | Función | Descripción |
|---|---|---|
| 🛒 | **Carrito en la nube** | Sincronizado con la cuenta de Google via Firestore. Se restaura en cualquier dispositivo. |
| 🔐 | **Autenticación Google** | Firebase Auth. El modal se actualiza en tiempo real sin recargar la pagina. |
| 💳 | **Pagos con Wompi** | Integracion completa con firma de integridad y redireccion de resultado. |
| 🧾 | **Facturas PDF** | Generacion automatica con PDF antes de redirigir al pago. |
| 📦 | **Consulta de pedidos** | Búsqueda por correo o ID de factura con historial completo del estado. |
| 🎁 | **Descuentos y regalos** | Descuentos progresivos por cantidad y regalo gratis desde $150.000 COP. |
| 📱 | **Responsive** | Barra de Navegacion en laptop, carrito flotante en telefono. |
| 🟢 | **Navegacion** | El item resaltado cambia automaticamente según la seccion visible. |

---

## 🗂️ Estructura del proyecto

```
tienda/
├── index.html           # Pagina principal — productos, Navegacion, carrito
├── mis-pedidos.html     # Consulta de pedidos por correo o ID
├── pago-resultado.html  # Resultado del pago Wompi
├── admin.html           # Panel de administracion de pedidos
├── script.js            # Logica del carrito, Interfaz de usuario, sincronizacion Firestore
├── order-system.js      # Submit del pedido → Supabase → Wompi
├── factura.js           # Generador de PDF con jsPDF
└── styles.css           # Estilos globales
```

---

## ⚙️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Autenticación | Firebase Auth (Google) |
| Base de datos pedidos | Supabase (SQL) |
| Carrito en la nube | Firestore (Firebase) |
| Pagos | Wompi (Colombia) |
| Facturas PDF | jsPDF |
| Hosting | GitHub Pages |

---

## 🚀 Demo

```
https://cxr10s.github.io/tienda/
```

> Para correrlo localmente abre `el link` en un navegador o usa Live Server en VS Code. No requiere build ni servidor.

---

<div align="center">

**Jhon Carlos Meneses Peinado**

[@cxr10s](https://github.com/cxr10s) · Colombia 🇨🇴

*"Primero haz que funcione. Luego haz que sea bueno."*

</div>
