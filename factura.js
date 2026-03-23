// =============================================
// FACTURA.JS — Generador de facturas PDF
// Usa jsPDF (cargado desde CDN)
// =============================================

function fmt(n) {
    return Math.round(Number(n)).toLocaleString('es-CO');
}

async function generarFacturaPDF(pedido) {
    // Cargar jsPDF dinámicamente si no está cargado
    if (!window.jspdf) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W = 210; // ancho A4
    const margin = 20;
    let y = 20;

    // ── Colores ──────────────────────────────
    const negro   = [10, 10, 10];
    const gris    = [100, 100, 100];
    const grisClaro = [230, 230, 230];
    const verde   = [34, 197, 94];
    const blanco  = [255, 255, 255];

    // ── Fondo header ─────────────────────────
    doc.setFillColor(...negro);
    doc.rect(0, 0, W, 45, 'F');

    // Logo / nombre tienda
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('STORE.', margin, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('Tienda Deportiva', margin, y + 16);
    doc.text('cxr10s.github.io/tienda', margin, y + 22);

    // FACTURA label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(200, 255, 0);
    doc.text('FACTURA', W - margin, y + 8, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const idCorto = pedido.id.substring(0, 8).toUpperCase();
    doc.text(`#${idCorto}`, W - margin, y + 15, { align: 'right' });

    const fecha = new Date(pedido.created_at).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(fecha, W - margin, y + 21, { align: 'right' });

    y = 55;

    // ── Info cliente ─────────────────────────
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, W - margin * 2, 42, 3, 3, 'F');

    doc.setTextColor(...gris);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 6, y + 7);

    doc.setTextColor(...negro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(pedido.nombre, margin + 6, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    doc.text(`Email: ${pedido.email}`, margin + 6, y + 23);
    doc.text(`Tel: ${pedido.telefono}`, margin + 6, y + 30);
    doc.text(`Dir: ${pedido.direccion}`, margin + 6, y + 37);

    if (pedido.notas) {
        doc.text(`Nota: ${pedido.notas}`, margin + 6, y + 44);
        y += 8;
    }

    y += 52;

    // ── Estado ───────────────────────────────
    const estadoColors = {
        pendiente: [245, 158, 11],
        enviado:   [59, 130, 246],
        entregado: [34, 197, 94],
        cancelado: [239, 68, 68],
    };
    const estadoColor = estadoColors[pedido.estado] || negro;

    doc.setFillColor(...estadoColor);
    doc.roundedRect(margin, y - 6, 40, 10, 2, 2, 'F');
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(pedido.estado.toUpperCase(), margin + 20, y + 1, { align: 'center' });

    y += 12;

    // ── Tabla productos ───────────────────────
    doc.setTextColor(...gris);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('PRODUCTOS', margin, y);
    y += 5;

    // Header tabla
    doc.setFillColor(...negro);
    doc.rect(margin, y, W - margin * 2, 8, 'F');
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PRODUCTO', margin + 4, y + 5.5);
    doc.text('CANT.', W - 65, y + 5.5, { align: 'right' });
    doc.text('PRECIO UNIT.', W - 42, y + 5.5, { align: 'right' });
    doc.text('TOTAL', W - margin - 2, y + 5.5, { align: 'right' });
    y += 8;

    const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
    productos.forEach((prod, i) => {
        const bg = i % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
        doc.setFillColor(...bg);
        doc.rect(margin, y, W - margin * 2, 9, 'F');

        doc.setTextColor(...negro);
        doc.setFont('helvetica', prod.isGift ? 'italic' : 'normal');
        doc.setFontSize(8.5);

        const nombre = prod.name + (prod.isGift ? ' (REGALO)' : '');
        doc.text(nombre, margin + 4, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.text(String(prod.quantity), W - 65, y + 6, { align: 'right' });

        if (prod.isGift) {
            doc.setTextColor(...verde);
            doc.text('GRATIS', W - 42, y + 6, { align: 'right' });
            doc.text('GRATIS', W - margin - 2, y + 6, { align: 'right' });
        } else {
            doc.setTextColor(...negro);
            doc.text(`$${fmt(prod.price)} COP`, W - 42, y + 6, { align: 'right' });
            doc.text(`$${fmt(prod.price * prod.quantity)} COP`, W - margin - 2, y + 6, { align: 'right' });
        }

        y += 9;
    });

    // ── Totales ───────────────────────────────
    y += 4;
    doc.setDrawColor(...grisClaro);
    doc.line(margin, y, W - margin, y);
    y += 6;

    const totales = [
        { label: 'Subtotal', value: `$${fmt(pedido.subtotal)} COP` },
    ];
    if (pedido.descuento > 0) {
        totales.push({ label: `Descuento`, value: `-$${fmt(pedido.descuento)} COP`, color: verde });
    }
    totales.push({
        label: 'Envío',
        value: pedido.envio > 0 ? `$${fmt(pedido.envio)} COP` : '¡Gratis!'
    });

    totales.forEach(t => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...(t.color || gris));
        doc.text(t.label, W - 80, y);
        doc.text(t.value, W - margin - 2, y, { align: 'right' });
        y += 7;
    });

    // Total final
    y += 2;
    doc.setFillColor(...negro);
    doc.roundedRect(W - 90, y - 6, 70, 12, 2, 2, 'F');
    doc.setTextColor(...blanco);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('TOTAL', W - 86, y + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(200, 255, 0);
    doc.text(`$${fmt(pedido.total)} COP`, W - margin - 2, y + 2.5, { align: 'right' });

    y += 20;

    // ── ID del pedido ─────────────────────────
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, W - margin * 2, 18, 3, 3, 'F');
    doc.setTextColor(...gris);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Guarda este ID para consultar tu pedido en cualquier momento:', margin + 6, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...negro);
    doc.text(`ID: ${idCorto}`, margin + 6, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gris);
    doc.text('cxr10s.github.io/tienda/mis-pedidos.html', W - margin - 2, y + 14, { align: 'right' });

    y += 26;

    // ── Footer ────────────────────────────────
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Gracias por tu compra - STORE. Tienda Deportiva', W / 2, y, { align: 'center' });
    doc.text('Este documento es tu comprobante de pedido.', W / 2, y + 5, { align: 'center' });

    // ── Descargar ─────────────────────────────
    doc.save(`Factura-${idCorto}.pdf`);
}
