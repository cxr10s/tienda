// =============================================
// CONFIGURACIÓN SUPABASE
// =============================================
const SUPABASE_URL = 'https://qvaaistunotxgpyqebya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWFpc3R1bm90eGdweXFlYnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTk2MzMsImV4cCI6MjA4OTY5NTYzM30.eG62aFEYEtigW7Vb9wJ2VCDK4HVzKCxEredHmVNZXjU';

// =============================================
// ⚠️ PON AQUÍ TU LLAVE PÚBLICA DE WOMPI
// La encuentras en: https://comercios.wompi.co → Desarrolladores → Llaves
// =============================================
const WOMPI_PUBLIC_KEY = 'pub_test_9kFqdndu07A4r7WelX97pzJgjA7aBpGV'; // 👈 reemplaza esto
const WOMPI_INTEGRITY_SECRET = 'test_integrity_itRExQlNZCY87qnVRdvNrXqXX7TEmPEr';

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
    const referencia = pedido.id;
    const urlRetorno = 'https://cxr10s.github.io/tienda/pago-resultado.html';

    // Generar firma de integridad SHA-256
    const cadena = `${referencia}${totalCentavos}COP${WOMPI_INTEGRITY_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(cadena);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const params = new URLSearchParams({
        'public-key':              WOMPI_PUBLIC_KEY,
        'currency':                'COP',
        'amount-in-cents':         totalCentavos,
        'reference':               referencia,
        'redirect-url':            urlRetorno,
        'signature:integrity':     signature,
        'customer-data:email':     pedido.email,
        'customer-data:full-name': pedido.nombre,
        'customer-data:phone-number': pedido.telefono,
    });

    window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
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

    // Construir objeto pedido (ahora incluye estado_pago)
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
        estado: 'pendiente',
        estado_pago: 'pendiente'   // 👈 nuevo campo
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
            id: Array.isArray(result) && result[0] ? result[0].id : ('local-' + Date.now()),
            created_at: Array.isArray(result) && result[0] ? result[0].created_at : new Date().toISOString()
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

        // ✅ Redirigir a Wompi con el ID real del pedido
        redirigirAWompi(pedidoGuardado);

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
