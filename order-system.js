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

        // Limpiar carrito ANTES de redirigir
        cart = [];
        window._lastRemovedGiftId = null;
        try {
            localStorage.removeItem('tienda_cart');
            localStorage.removeItem('tienda_last_removed_gift');
        } catch(e) {}
        updateCartDisplay();
        updateCartIcon();

        // Cerrar modal del formulario
        closeReservationModal();

        // Redirigir a Wompi con el ID real del pedido
        await mostrarAlertaFactura(pedidoGuardado);

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
            background: rgba(10, 10, 15, 0.9);
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
            animation: facturaFadeIn 0.3s ease;
            backdrop-filter: blur(4px);
        `;

        const idCorto = pedido.id.substring(0, 8).toUpperCase();
        const total = Math.round(pedido.total).toLocaleString('es-CO');

        overlay.innerHTML = `
            <style>
            @keyframes facturaFadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
            #factura-alert-box { 
                background:#1e1e26; 
                border:1px solid rgba(255,255,255,0.05); 
                border-radius:24px; 
                max-width:420px; 
                width:100%; 
                padding:2.5rem 2rem; 
                text-align:center; 
                box-shadow:0 30px 70px rgba(0,0,0,0.5); 
            }
            #factura-alert-box .fa-icon { font-size:3.5rem; margin-bottom:1rem; filter: drop-shadow(0 0 10px rgba(63, 81, 181, 0.3)); }
            #factura-alert-box h2 { color:#fff; font-size:1.5rem; margin:0 0 0.8rem; font-family: 'helvetica', sans-serif; }
            #factura-alert-box p { color:#94a3b8; font-size:0.95rem; margin:0 0 1.8rem; line-height:1.6; }
            #factura-alert-box .order-id { 
                display:inline-block; 
                background:rgba(63, 81, 181, 0.15); 
                border:1px solid rgba(63, 81, 181, 0.3); 
                border-radius:100px; 
                padding:0.4rem 1.2rem; 
                font-family:monospace; 
                font-size:1rem; 
                color:#818cf8; 
                margin-bottom:1.8rem; 
                font-weight: bold;
            }
            #factura-alert-box .btn-download { 
                display:flex; align-items:center; justify-content:center; gap:8px;
                width:100%; padding:1rem; 
                background:#3f51b5; 
                color:#fff; 
                font-weight:700; font-size:1rem; 
                border:none; border-radius:12px; 
                cursor:pointer; margin-bottom:0.75rem; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(63, 81, 181, 0.4);
            }
            #factura-alert-box .btn-download:hover { background:#303f9f; transform: translateY(-2px); }
            #factura-alert-box .btn-skip { 
                display:block; width:100%; padding:0.7rem; 
                background:transparent; color:#64748b; 
                font-size:0.88rem; border:none; 
                cursor:pointer; text-decoration: underline;
            }
            #factura-alert-box .btn-skip:hover { color:#94a3b8; }
            </style>
            <div id="factura-alert-box">
                <div class="fa-icon">🛡️</div>
                <h2>¡Pedido Asegurado!</h2>
                <p>Hemos registrado tu solicitud por <strong style="color:#fff">$${total} COP</strong>. 
                Recomendamos descargar tu comprobante antes de realizar el pago.</p>
                <div class="order-id">ORDEN: #${idCorto}</div>
                <button class="btn-download" id="btn-dl-factura">
                    <span style="font-size:1.2rem">⬇</span> Descargar Factura Premium
                </button>
                <button class="btn-skip" id="btn-skip-factura">Omitir y pagar ahora</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Evento Descargar
        document.getElementById('btn-dl-factura').addEventListener('click', async () => {
            const btn = document.getElementById('btn-dl-factura');
            btn.innerText = "Generando...";
            btn.style.opacity = "0.7";
            
            try {
                // Llama a la función mejorada que hicimos antes
                await generarFacturaPDF(pedido);
            } catch(e) {
                console.error('Error generando factura:', e);
            }
            
            document.body.removeChild(overlay);
            resolve();
            if (typeof redirigirAWompi === 'function') await redirigirAWompi(pedido);
        });

        // Evento Omitir
        document.getElementById('btn-skip-factura').addEventListener('click', async () => {
            document.body.removeChild(overlay);
            resolve();
            if (typeof redirigirAWompi === 'function') await redirigirAWompi(pedido);
        });
    });
}
