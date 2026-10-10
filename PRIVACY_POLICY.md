# Política de Privacidad de COM Argentina

**Última actualización:** 10 de octubre de 2026  
**Aplicación:** COM Argentina  
**Desarrollador / Organización:** Club de Observadores de Mariposas de Argentina (comargentina)  
**Sitio web:** [https://com-com-f83a.vercel.app](https://com-com-f83a.vercel.app)  
**Repositorio oficial:** [https://github.com/comargentina/com](https://github.com/comargentina/com)  

---

## 1. Introducción y Compromiso de Privacidad

La aplicación **COM Argentina** es un proyecto de ciencia ciudadana y conservación desarrollado por el **Club de Observadores de Mariposas de Argentina**. Nuestra misión es fomentar el registro, la identificación y el estudio de mariposas y de la biodiversidad en Argentina.

Creemos firmemente que participar en la observación comunitaria de la naturaleza no debe implicar la renuncia a la privacidad ni la explotación de los datos personales. Esta Política de Privacidad describe de manera clara y transparente qué datos recopilamos, cómo los utilizamos, dónde se almacenan y qué derechos tienen los usuarios sobre su información personal.

---

## 2. Datos que Recopilamos

Cuando utilizas **COM Argentina**, podemos recopilar y procesar los siguientes tipos de datos:

1. **Información de la Cuenta y Autenticación:**
   - **Correo electrónico:** Solicitado únicamente si decides registrarte o iniciar sesión mediante enlace mágico (Magic Link) o autenticación segura. *(El uso en modo invitado no requiere crear una cuenta ni ingresar un correo electrónico).*
   - **Perfil de usuario:** Nombre de usuario (@usuario), nombre visible, biografía opcional y foto de perfil o avatar.

2. **Datos de Observaciones de Biodiversidad:**
   - **Fotografías y grabaciones de audio:** Imágenes de mariposas, flora o fauna, así como grabaciones de audio de campo que adjuntes a tus observaciones.
   - **Coordenadas de Ubicación (GPS):** Coordenadas geográficas capturadas mediante el sensor GPS de tu dispositivo o extraídas de los metadatos EXIF de las fotografías, utilizadas para geolocalizar la observación en mapas de distribución.
   - **Metadatos de la observación:** Fecha y hora, notas de campo, tipo de hábitat, condiciones meteorológicas y sugerencias de identificación de especies.

3. **Información Técnica y de Diagnóstico:**
   - **Registros técnicos estándar:** Dirección IP, agente de usuario (user agent) y registros de acceso generados automáticamente por los servidores de autenticación (Supabase) y la red de distribución de contenido (Cloudflare R2) para garantizar la seguridad del servicio.
   - **Almacenamiento local del dispositivo:** Uso de `localStorage` e IndexedDB en el dispositivo para mantener la sesión abierta y almacenar observaciones pendientes de sincronización cuando no hay conexión a internet (modo offline).

---

## 3. Uso de la Información y Permisos Solicitados

Los datos recopilados se utilizan exclusivamente para las siguientes finalidades:

- **Funcionamiento de la aplicación:** Permitir el registro, sincronización y consulta de observaciones de mariposas.
- **Identificación con Inteligencia Artificial:** Procesar imágenes y audios para sugerir especies de lepidópteros. Cuando es posible, estos modelos se ejecutan directamente en tu dispositivo para que los archivos no salgan de tu teléfono.
- **Protección de Especies Sensibles (Oscurecimiento de Coordenadas):** Si registras una especie amenazada, en peligro o protegida legalmente, el sistema aplica automáticamente un oscurecimiento de coordenadas a una cuadrícula de aproximadamente 10×10 km en las vistas públicas para proteger a las poblaciones silvestres contra el furtivismo o la perturbación de hábitats.
- **Ciencia Ciudadana y Licenciamiento Abierto:** Las observaciones biológicas (sin datos personales) se publican bajo licencias abiertas (como Creative Commons CC-BY, CC-BY-NC o CC0) para contribuir al monitoreo de la biodiversidad y la investigación científica.

**No vendemos, no alquilamos ni compartimos datos personales con anunciantes, redes publicitarias ni intermediarios de datos.** La aplicación no contiene píxeles de seguimiento publicitario ni herramientas de grabación de sesión de terceros.

---

## 4. Almacenamiento y Seguridad de los Datos

- **Base de datos y Autenticación:** Alojados en Supabase Postgres con cifrado en tránsito (HTTPS/TLS) y en reposo, respaldados por políticas de seguridad a nivel de fila (Row Level Security - RLS).
- **Archivos Multimedia:** Fotos y audios almacenados de forma segura en Cloudflare R2 con redundancia geográfica.
- **Datos en el dispositivo:** Las observaciones tomadas en el campo sin conexión a internet se resguardan de forma segura en la base de datos local (IndexedDB) de tu dispositivo hasta que recuperes la conectividad y se completen las sincronizaciones.

---

<a name="eliminacion-cuenta"></a>
<a name="eliminacion-datos"></a>
## 5. Solicitud de Eliminación de Cuenta y Eliminación de Datos

En cumplimiento de las políticas de Google Play y las normativas internacionales de protección de datos personales, los usuarios de **COM Argentina** tienen derecho a solicitar en cualquier momento la eliminación total de su cuenta y de sus datos personales asociados.

### Pasos para solicitar la eliminación de tu cuenta y datos:

Los usuarios pueden solicitar la eliminación a través de cualquiera de los siguientes dos métodos:

#### Método A: Directamente desde la aplicación o sitio web
1. Inicia sesión en **COM Argentina** con tu correo electrónico.
2. Ingresa a la sección **Perfil** y haz clic en **Editar perfil** (o accede a `https://com-com-f83a.vercel.app/es/perfil/editar/`).
3. Desplázate hasta la sección de gestión de cuenta y pulsa el botón **"Eliminar cuenta"**.
4. Confirma la acción en el mensaje de seguridad para proceder con el borrado definitivo.

#### Método B: Sin necesidad de instalar la aplicación (Vía Correo Electrónico)
Si no tienes la aplicación instalada o no puedes acceder a tu cuenta:
1. Envía un correo electrónico a nuestro equipo de soporte:  
   📧 **comargentina.app@gmail.com** (o a través del repositorio oficial de GitHub [https://github.com/comargentina/com/issues](https://github.com/comargentina/com/issues)).
2. Utiliza como asunto: `Solicitud de Eliminación de Cuenta y Datos - COM Argentina`.
3. Indica en el mensaje la dirección de correo electrónico asociada a la cuenta que deseas eliminar.
4. Tu solicitud será verificada y procesada en un plazo máximo de **30 días corridos**.

---

### Tipos de datos que se eliminan y tipos de datos que se conservan

#### 1. Datos que se eliminan definitivamente:
- **Identidad de acceso:** El registro completo de tu cuenta en la base de autenticación (`auth.users`) y tu dirección de correo electrónico.
- **Perfil de usuario:** Nombre de usuario (@usuario), nombre visible, biografía, avatar e historial de sesiones.
- **Datos locales:** Se instruye la limpieza de tokens de autenticación y preferencias personales.
- **Archivos multimedia personales:** Las fotos subidas a Cloudflare R2 se ponen en cola de depuración para su borrado definitivo en un plazo máximo de 30 días. Los clips de audio personales se eliminan inmediatamente.

#### 2. Datos que se conservan de forma anonimizada (y razones de retención):
- **Observaciones de biodiversidad:** Las observaciones de especies de mariposas (nombre taxonómico, fecha y coordenadas de cuadrícula) forman parte del patrimonio de ciencia ciudadana y monitoreo biológico y han sido puestas a disposición de la comunidad científica bajo licencias abiertas (Creative Commons). Al eliminar tu cuenta, **estas observaciones no se borran, sino que se anonimizan de manera irreversible**: el enlace identificador entre tu cuenta y los registros se destruye, quedando la observación desvinculada para siempre de tu identidad.
- **Registros técnicos de seguridad (Logs):** Los registros de solicitudes de red y seguridad del servidor se purgan de forma automática tras un período estándar de retención operativa de 30 a 90 días con fines exclusivos de prevención de fraude e integridad del sistema.

---

## 6. Privacidad de Menores de Edad

**COM Argentina** no recopila conscientemente información de identificación personal de niños menores de 13 años. Si un padre, madre o tutor legal toma conocimiento de que un menor de 13 años ha creado una cuenta o nos ha proporcionado información sin consentimiento previo, puede contactarnos a través de los canales indicados para proceder a la eliminación inmediata de la cuenta y sus datos asociados.

---

## 7. Cambios en esta Política de Privacidad

Podemos actualizar nuestra Política de Privacidad periódicamente para reflejar mejoras en la aplicación o adecuaciones normativas. Cualquier modificación será publicada en esta misma página y en el repositorio público de GitHub, actualizando la fecha de "Última actualización" en el encabezado.

---

## 8. Contacto y Soporte

Si tienes dudas, consultas o requerimientos vinculados con esta Política de Privacidad o con el tratamiento de tus datos personales, puedes contactar al desarrollador:

- **Organización / Desarrollador:** Club de Observadores de Mariposas de Argentina (COM Argentina)
- **Correo de soporte:** `comargentina.app@gmail.com`
- **Repositorio de soporte y código:** [https://github.com/comargentina/com](https://github.com/comargentina/com)
- **URL pública de Política de Privacidad:** [https://github.com/comargentina/com/blob/main/PRIVACY_POLICY.md](https://github.com/comargentina/com/blob/main/PRIVACY_POLICY.md)
- **URL pública de Eliminación de Cuenta y Datos:** [https://github.com/comargentina/com/blob/main/ACCOUNT_DELETION.md](https://github.com/comargentina/com/blob/main/ACCOUNT_DELETION.md)
