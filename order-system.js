// =============================================
// CONFIGURACIÓN SUPABASE
// =============================================
const SUPABASE_URL = 'https://qvaaistunotxgpyqebya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWFpc3R1bm90eGdweXFlYnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTk2MzMsImV4cCI6MjA4OTY5NTYzM30.eG62aFEYEtigW7Vb9wJ2VCDK4HVzKCxEredHmVNZXjU';

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
// SUBMIT DEL FORMULARIO → SUPABASE
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
        estado: 'pendiente'
    };

    // Deshabilitar botón mientras se guarda
    const btn = document.querySelector('.payment-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.querySelector('.submit-btn-text').textContent = 'Guardando...';
    }

    try {
        const result = await guardarPedidoEnSupabase(pedido);

        // Limpiar carrito y localStorage completamente
        cart = [];
        window._lastRemovedGiftId = null;
        try {
            localStorage.removeItem('tienda_cart');
            localStorage.removeItem('tienda_last_removed_gift');
        } catch(e) {}
        updateCartDisplay();
        updateCartIcon();

        // Cerrar modal
        closeReservationModal();

        // Limpiar formulario
        document.getElementById('reservation-form').reset();

        // Mostrar modal de éxito con link a mis pedidos
        window._ultimoPedido = { ...pedido, id: result[0].id, created_at: result[0].created_at };
        mostrarExito(email);

    } catch (error) {
        console.error('Error al guardar pedido:', error);
        showNotification('❌ Error al guardar el pedido. Intenta de nuevo.');
    } finally {
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
// MODAL DE ÉXITO CON LINK A MIS PEDIDOS
// =============================================
function mostrarExito(email) {
    const existing = document.getElementById('exito-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'exito-modal';
    modal.innerHTML = `
        <div style="
            position:fixed; inset:0; background:rgba(0,0,0,0.8);
            backdrop-filter:blur(4px); z-index:99999;
            display:flex; align-items:center; justify-content:center;">
            <div style="
                background:#111; border:1px solid #222; border-radius:20px;
                padding:40px 32px; max-width:380px; width:90%; text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="font-size:52px; margin-bottom:16px;">✅</div>
                <h2 style="font-size:22px; font-weight:800; margin-bottom:8px; color:#f0f0f0;">¡Pedido realizado!</h2>
                <p style="color:#666; font-size:14px; line-height:1.6; margin-bottom:28px;">
                    Tu pedido fue registrado con éxito.<br>Te contactaremos pronto para coordinar la entrega.
                </p>
                <a href="https://cxr10s.github.io/tienda/mis-pedidos.html?email=${encodeURIComponent(email)}"
                    style="
                        display:block; width:100%; padding:14px;
                        background:#c8ff00; color:#000; border-radius:12px;
                        font-family:'Syne',sans-serif; font-size:15px; font-weight:700;
                        text-decoration:none; margin-bottom:10px; box-sizing:border-box;">
                    📦 Ver mi pedido
                </a>
                <button onclick="generarFacturaPDF(window._ultimoPedido)" style="
                        display:block; width:100%; padding:13px;
                        background:transparent; color:#f0f0f0; border-radius:12px;
                        border:1px solid #333;
                        font-family:'Syne',sans-serif; font-size:14px; font-weight:700;
                        cursor:pointer; margin-bottom:10px; box-sizing:border-box;">
                    📄 Descargar Factura
                </button>
                <button onclick="document.getElementById('exito-modal').remove()" style="
                    width:100%; padding:12px; background:transparent;
                    border:1px solid #222; border-radius:12px; color:#666;
                    font-family:'Syne',sans-serif; font-size:14px; cursor:pointer;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
