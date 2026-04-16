// =============================================
// CONFIGURACIÓN SUPABASE
// =============================================
const SUPABASE_URL = 'https://qvaaistunotxgpyqebya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWFpc3R1bm90eGdweXFlYnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTk2MzMsImV4cCI6MjA4OTY5NTYzM30.eG62aFEYEtigW7Vb9wJ2VCDK4HVzKCxEredHmVNZXjU';

// =============================================
// CONFIGURACIÓN WOMPI
//
// SANDBOX (activo ahora — solo para pruebas):
//   Checkout: https://checkout.wompi.co/p/
//   Llave pública: pub_test_...
//   Llave integridad: test_integrity_...
//
// PRODUCCIÓN (cuando Wompi te habilite):
//   1. Comenta las líneas de SANDBOX
//   2. Descomenta las líneas de PRODUCCIÓN
//   3. Haz lo mismo en pago-resultado.html (wompiIntegritySecret)
// =============================================

// — SANDBOX —
const WOMPI_PUBLIC_KEY       = 'pub_test_9kFqdnduO7A4r7WelX97pzJgjA7aBpGV';
const WOMPI_INTEGRITY_SECRET = 'test_integrity_itRExQlNZCY87qnVRdvNrXqXX7TEmPEr';
const WOMPI_CHECKOUT_URL     = 'https://checkout.wompi.co/p/';

// — PRODUCCIÓN (descomenta cuando llegue el momento) —
// const WOMPI_PUBLIC_KEY       = 'pub_prod_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
// const WOMPI_INTEGRITY_SECRET = 'prod_integrity_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
// const WOMPI_CHECKOUT_URL     = 'https://checkout.wompi.co/p/';  // La URL es la misma en producción


// =============================================
// GUARDAR PEDIDO EN SUPABASE
// =============================================
async function guardarPedidoEnSupabase(pedido) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(pedido)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar el pedido');
    }

    return await response.json();
}

// =============================================
// REDIRIGIR A WOMPI
// =============================================
async function redirigirAWompi(pedido) {
    const totalCentavos = Math.round(pedido.total * 100);
    const referencia    = pedido.id;
    const urlRetorno    = 'https://cxr10s.github.io/pago-resultado.html';

    // Generar firma de integridad SHA-256
    // Cadena: referencia + monto + moneda + secret
    const cadena = `${referencia}${totalCentavos}COP${WOMPI_INTEGRITY_SECRET}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(cadena));
    const signature = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    const params = new URLSearchParams({
        'public-key':                 WOMPI_PUBLIC_KEY,
        'currency':                   'COP',
        'amount-in-cents':            totalCentavos,
        'reference':                  referencia,
        'redirect-url':               urlRetorno,
        'signature:integrity':        signature,
        'customer-data:email':        pedido.email,
        'customer-data:full-name':    pedido.nombre,
        'customer-data:phone-number': pedido.telefono,
    });

    window.location.href = `${WOMPI_CHECKOUT_URL}?${params.toString()}`;
}

// =============================================
// SUBMIT DEL FORMULARIO → SUPABASE → WOMPI
// =============================================
async function submitReservation(event) {
    event.preventDefault();

    if (cart.length === 0) {
        showNotification('Tu carrito está vacío');
        return;
    }

    // Obtener datos del formulario
    let nombre = document.getElementById('reservation-name').value.trim();
    nombre = nombre.split(' ').filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    const telefono  = document.getElementById('reservation-phone').value.trim();
    const email     = document.getElementById('reservation-email').value.trim();
    const direccion = document.getElementById('reservation-address').value.trim();
    const notas     = document.getElementById('reservation-notes').value.trim();

    // Validaciones
    if (!nombre || !telefono || !email || !direccion) {
        showNotification('Por favor completa todos los campos obligatorios');
        return;
    }
    if (!validateName(nombre.replace(/\s+/g, ''))) {
        showNotification('El nombre solo puede contener letras y espacios.');
        return;
    }
    if (!validateEmail(email)) {
        showNotification('Solo se aceptan correos @gmail.com, @hotmail.com o @outlook.com');
        return;
    }
    if (!validatePhone(telefono)) {
        showNotification('El teléfono debe tener exactamente 10 dígitos.');
        return;
    }

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { amount: descuento } = calcDiscount(subtotal);
    const envio = subtotal > 0 && subtotal < 150000 ? 25000 : 0;
    const total = subtotal - descuento + envio;

    // Construir objeto pedido
    const pedido = {
        nombre,
        telefono,
        email,
        direccion,
        notas: notas || null,
        productos: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isGift: item.isGift || false
        })),
        subtotal,
        descuento,
        envio,
        total,
        estado:      'pendiente',
        estado_pago: 'pendiente'
    };

    // Deshabilitar botón mientras se guarda
    const btn = document.querySelector('.payment-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.querySelector('.submit-btn-text').textContent = 'Procesando...';
    }

    try {
        const result = await guardarPedidoEnSupabase(pedido);

        // Obtener el ID real que asignó Supabase
        const pedidoGuardado = {
            ...pedido,
            id: Array.isArray(result) && result[0]
                ? result[0].id
                : ('local-' + Date.now()),
            created_at: Array.isArray(result) && result[0]
                ? result[0].created_at
                : new Date().toISOString()
        };

        // Guardar datos para la página de pago
        sessionStorage.setItem('pago_pedido', JSON.stringify({
            nombre:    pedido.nombre,
            email:     pedido.email,
            telefono:  pedido.telefono,
            direccion: pedido.direccion,
            notas:     pedido.notas,
            documento: pedido.documento
        }));

        // Limpiar carrito
        cart = [];
        window._lastRemovedGiftId = null;
        try {
            localStorage.removeItem('tienda_cart');
            localStorage.removeItem('tienda_last_removed_gift');
        } catch(e) {}
        updateCartDisplay();
        updateCartIcon();

        // Cerrar modal y redirigir a pago
        closeReservationModal();
        window.location.href = 'https://cxr10s.github.io/tienda/pago.html';

    } catch (error) {
        console.error('Error al guardar pedido:', error);
        showNotification('❌ Error al guardar el pedido. Intenta de nuevo.');
        if (btn) {
            btn.disabled = false;
            btn.querySelector('.submit-btn-text').textContent = 'Realizar Pedido';
        }
    }
}

// Vincular formulario al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', submitReservation);
    }
});

// =============================================
// ALERTA DE DESCARGA DE FACTURA
// =============================================
function mostrarAlertaFactura(pedido) {
    return new Promise((resolve) => {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'factura-alert-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.82);
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
            animation: facturaFadeIn 0.3s ease;
        `;

        const idCorto = pedido.id.substring(0, 8).toUpperCase();
        const total = Math.round(pedido.total).toLocaleString('es-CO');

        overlay.innerHTML = `
            <style>
                @keyframes facturaFadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
                #factura-alert-box { background:#111; border:1px solid rgba(255,255,255,0.1); border-radius:18px; max-width:420px; width:100%; padding:2rem 1.8rem; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.7); }
                #factura-alert-box .fa-icon { font-size:3rem; margin-bottom:1rem; }
                #factura-alert-box h2 { color:#fff; font-size:1.3rem; margin:0 0 0.5rem; }
                #factura-alert-box p { color:#aaa; font-size:0.92rem; margin:0 0 1.4rem; line-height:1.6; }
                #factura-alert-box .order-id { display:inline-block; background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:0.35rem 1rem; font-family:monospace; font-size:1rem; color:#adff2f; margin-bottom:1.4rem; letter-spacing:1px; }
                #factura-alert-box .btn-download { display:block; width:100%; padding:0.85rem; background:#adff2f; color:#000; font-weight:700; font-size:1rem; border:none; border-radius:10px; cursor:pointer; margin-bottom:0.75rem; transition:opacity 0.2s; }
                #factura-alert-box .btn-download:hover { opacity:0.85; }
                #factura-alert-box .btn-skip { display:block; width:100%; padding:0.7rem; background:transparent; color:#666; font-size:0.88rem; border:none; cursor:pointer; }
                #factura-alert-box .btn-skip:hover { color:#999; }
            </style>
            <div id="factura-alert-box">
                <div class="fa-icon">🧾</div>
                <h2>¡Pedido registrado!</h2>
                <p>Tu pedido por <strong style="color:#fff">$${total} COP</strong> fue guardado correctamente.<br>Descarga tu factura antes de continuar al pago.</p>
                <div class="order-id">ID: ${idCorto}</div>
                <button class="btn-download" id="btn-dl-factura">⬇ Descargar Factura PDF</button>
                <button class="btn-skip" id="btn-skip-factura">Continuar sin descargar</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-dl-factura').addEventListener('click', async () => {
            try {
                await generarFacturaPDF(pedido);
            } catch(e) {
                console.error('Error generando factura:', e);
            }
            document.body.removeChild(overlay);
            resolve();
            await redirigirAWompi(pedido);
        });

        document.getElementById('btn-skip-factura').addEventListener('click', async () => {
            document.body.removeChild(overlay);
            resolve();
            await redirigirAWompi(pedido);
        });
    });
}
