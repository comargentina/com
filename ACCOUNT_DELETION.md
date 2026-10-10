# Solicitud de Eliminación de Cuenta y Datos - COM Argentina

**Aplicación:** COM Argentina  
**Desarrollador / Organización:** Club de Observadores de Mariposas de Argentina (comargentina)  
**Fecha de vigencia:** 10 de octubre de 2026  
**Repositorio oficial:** [https://github.com/comargentina/com](https://github.com/comargentina/com)  
**Sitio web:** [https://com-com-f83a.vercel.app](https://com-com-f83a.vercel.app)  

---

Esta página detalla el procedimiento oficial para que los usuarios de la aplicación **COM Argentina**, desarrollada por el **Club de Observadores de Mariposas de Argentina**, puedan solicitar el borrado definitivo de su cuenta y de todos los datos personales asociados, en conformidad con los requisitos de seguridad y transparencia de Google Play Store.

---

## 1. Pasos para Solicitar el Borrado de tu Cuenta y Datos

Puedes solicitar la eliminación de tu cuenta y datos a través de cualquiera de las siguientes opciones:

### Opción 1: Directamente desde la aplicación o versión web
1. Inicia sesión en **COM Argentina** con tu correo electrónico o credenciales habituales.
2. Accede a tu **Perfil** tocando el ícono de usuario en la barra de navegación.
3. Selecciona la opción **"Editar perfil"** (o ingresa directamente a [https://com-com-f83a.vercel.app/es/perfil/editar/](https://com-com-f83a.vercel.app/es/perfil/editar/)).
4. Desplázate hasta la sección final y haz clic en el botón rojo **"Eliminar cuenta"**.
5. Lee las advertencias y confirma la eliminación definitiva.

### Opción 2: Sin la aplicación instalada (Vía Correo Electrónico)
Si has desinstalado la aplicación, no tienes acceso a tu dispositivo o prefieres gestionar la baja de forma externa:
1. Envía un correo electrónico a nuestro equipo de atención:  
   📧 **comargentina.app@gmail.com**
2. **Asunto del correo:** `Solicitud de Eliminación de Cuenta y Datos - COM Argentina`
3. **Cuerpo del mensaje:** Indica la dirección de correo electrónico vinculada a la cuenta de COM Argentina que deseas dar de baja.
4. Un administrador confirmará la recepción de tu pedido y completará la eliminación de tus datos en un plazo no mayor a **30 días corridos**.

---

## 2. Tipos de Datos que se Borran

Al procesar la eliminación de la cuenta, se eliminan permanentemente los siguientes datos:
- **Datos de autenticación y credenciales:** Dirección de correo electrónico y registros de inicio de sesión en Supabase (`auth.users`).
- **Información del perfil:** Nombre visible, nombre de usuario (@usuario), biografía, avatar y configuración de la cuenta.
- **Datos y tokens locales:** Sesiones activas, credenciales de almacenamiento local (`localStorage`) e historial de navegación local.
- **Archivos multimedia personales:** Las fotografías y archivos subidos a nuestro almacenamiento en la nube (Cloudflare R2) entran en una cola de depuración automatizada y se eliminan por completo en un plazo de hasta 30 días. Los clips de audio se borran de inmediato.

---

## 3. Tipos de Datos que se Conservan y Período de Retención

Con el fin de preservar la validez científica y el rigor de los proyectos de ciencia ciudadana y monitoreo de lepidópteros en Argentina:

- **Observaciones de Biodiversidad Anonimizadas:**  
  Los registros biológicos aportados a la comunidad (fecha del avistamiento, especie de mariposa observada, hábitat y coordenadas aproximadas/protegidas) han sido licenciados bajo términos abiertos de ciencia ciudadana (licencias Creative Commons como CC-BY o CC0). Al eliminar tu cuenta, **estas observaciones no se destruyen, sino que se anonimizan de forma irreversible**. El enlace de propiedad que conectaba tu identidad personal o usuario con los registros se elimina definitivamente, quedando la observación registrada como anónima para fines de investigación y conservación ecológica.
- **Registros técnicos de seguridad (Server Logs):**  
  Los registros de tráfico web (dirección IP y encabezados técnicos de red) se almacenan de forma temporal por un período rotativo de 30 a 90 días con el único objetivo de auditoría técnica, prevención de ciberataques y cumplimiento de normativas de seguridad de infraestructura.

---

## 4. Contacto de Soporte y Privacidad

Para cualquier consulta adicional respecto al tratamiento o supresión de tus datos personales, puedes contactar al desarrollador:

- **Responsable:** Club de Observadores de Mariposas de Argentina (COM Argentina)
- **Email:** `comargentina.app@gmail.com`
- **Política de Privacidad completa:** [https://github.com/comargentina/com/blob/main/PRIVACY_POLICY.md](https://github.com/comargentina/com/blob/main/PRIVACY_POLICY.md)
