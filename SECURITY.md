# Security Policy
 
## Proyecto
 
**Shop — Tienda Deportiva** es una tienda web estática hospedada en GitHub Pages, con autenticación Firebase y base de datos Supabase.
 
## Versiones soportadas
 
Este proyecto no maneja versiones numeradas. Siempre se mantiene actualizada la rama principal (`main`).
 
| Rama / Estado     | Soporte activo     |
| ----------------- | ------------------ |
| `main` (producción) | ✅ Sí            |
| Ramas antiguas    | ❌ No              |
 
## Reportar una vulnerabilidad
 
Si encuentras una vulnerabilidad de seguridad en este proyecto, por favor **no la publiques abiertamente** en Issues.
 
Repórtala de forma privada a través de:
 
- 📧 **Email:** [tu correo aquí]
- 🔒 **GitHub:** usa la opción *"Report a vulnerability"* en la pestaña Security de este repositorio
 
### ¿Qué esperar?
 
- Recibirás una respuesta en un plazo de **72 horas**
- Si la vulnerabilidad es válida, se trabajará en un fix y se te notificará cuando esté resuelto
- Se te dará crédito por el reporte si así lo deseas
 
## Alcance
 
Son relevantes vulnerabilidades relacionadas con:
 
- Exposición de datos de clientes (pedidos, emails, teléfonos)
- Bypass de autenticación Firebase
- Acceso no autorizado a la base de datos Supabase
- Inyección de scripts (XSS) en el sitio
 
No son relevantes:
 
- Vulnerabilidades en servicios de terceros (Firebase, Supabase, GitHub Pages)
- Ataques que requieran acceso físico al dispositivo del usuario
