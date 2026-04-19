// =============================================
// FACTURA.JS
// =============================================

function fmt(n) {
    return Math.round(Number(n)).toLocaleString('es-CO');
}

async function generarFacturaPDF(pedido) {
    // Cargar jsPDF dinámicamente
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

    const W = 210; 
    const margin = 20;
    let y = 0;

    // ── Paleta de Colores ────────────────────────
    const accent     = [63, 81, 181]; // Indigo
    const dark       = [30, 30, 30];
    const lightGray  = [245, 247, 250];
    const textGray   = [100, 100, 100];
    const white      = [255, 255, 255];

    // ── Header Moderno ───────────────────────────
    doc.setFillColor(...dark);
    doc.rect(0, 0, W, 60, 'F'); 

    y = 25;
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('STORE.', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('EQUIPAMIENTO DE ALTO RENDIMIENTO', margin, y + 8);

    // Badge de ID de Factura
    doc.setFillColor(...accent);
    doc.roundedRect(W - margin - 50, y - 10, 50, 25, 3, 3, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(9);
    doc.text('DETALLE DEL PEDIDO', W - margin - 25, y - 2, { align: 'center' });
    doc.setFontSize(12);
    const idCorto = pedido.id.substring(0, 8).toUpperCase();
    doc.text(`#${idCorto}`, W - margin - 25, y + 6, { align: 'center' });

    y = 75;

    // ── Bloque de Información ────────────────────
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ENVIAR A:', margin, y);
    doc.text('FECHA Y HORA:', W/2 + 10, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textGray);
    doc.setFontSize(9);
    
    // Datos cliente
    const infoCliente = [
        pedido.nombre,
        pedido.direccion,
        `Tel: ${pedido.telefono}`,
        pedido.email
    ];
    doc.text(infoCliente, margin, y + 2);

    // Formateo de Fecha y Hora
    const fechaObj = new Date(pedido.created_at);
    const fecha = fechaObj.toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const hora = fechaObj.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    
    doc.text(`${fecha}`, W/2 + 10, y + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hora: ${hora}`, W/2 + 10, y + 7);

    y += 35;

    // ── Tabla de Productos ────────────────────────
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, W - (margin * 2), 10, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text('PRODUCTO', margin + 5, y + 6.5);
    doc.text('CANT.', W - 70, y + 6.5, { align: 'right' });
    doc.text('TOTAL', W - margin - 5, y + 6.5, { align: 'right' });

    y += 15;

    const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
    productos.forEach((prod) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...dark);
        doc.text(prod.name.toUpperCase(), margin + 5, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textGray);
        doc.text(`${prod.quantity} x $${fmt(prod.price)}`, margin + 5, y + 5);

        doc.setTextColor(...dark);
        const totalProd = prod.isGift ? 'GRATIS' : `$${fmt(prod.price * prod.quantity)}`;
        doc.text(totalProd, W - margin - 5, y + 2.5, { align: 'right' });

        y += 12;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin + 5, y - 2, W - margin - 5, y - 2);
        y += 5;
    });

    // ── Resumen de Totales ────────────────────────
    y += 5;
    const boxW = 80;
    const boxX = W - margin - boxW;
    
    doc.setFillColor(...lightGray);
    doc.roundedRect(boxX, y, boxW, 35, 3, 3, 'F');

    let rowY = y + 8;
    const drawRow = (label, value, isTotal = false) => {
        doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
        doc.setFontSize(isTotal ? 12 : 9);
        doc.setTextColor(...(isTotal ? accent : textGray));
        
        doc.text(label, boxX + 5, rowY);
        doc.text(value, W - margin - 5, rowY, { align: 'right' });
        rowY += 8;
    };

    drawRow('Subtotal', `$${fmt(pedido.subtotal)}`);
    drawRow('Envío', pedido.envio > 0 ? `$${fmt(pedido.envio)}` : 'Bonificado');
    doc.setDrawColor(200, 200, 200);
    doc.line(boxX + 5, rowY - 4, W - margin - 5, rowY - 4);
    drawRow('TOTAL COP', `$${fmt(pedido.total)}`, true);

    // ── Pie de página ─────────────────────────────
    y += 50;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text('¡Gracias por elegirnos!', W / 2, y, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.text('Si te gusta lo que recibes, etiquétanos en Instagram: @tienda_deportiva912', W / 2, y + 6, { align: 'center' });

    doc.setFillColor(...accent);
    doc.rect(0, 287, W, 10, 'F'); 

    doc.save(`Factura-${idCorto}-Shop.pdf`);
}
