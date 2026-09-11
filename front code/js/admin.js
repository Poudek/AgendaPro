const defaultFakeData = [
  { id: "BC-1041", customerName: "Rodrigo Alencar", phone: "(85) 99123-4567", time: "18:30", date: "2026-08-28", createdAt: "Hoje, 10:15", rawType: "Especial", rawSize: "G - 150 Peças", size: "Barca Especial - G - 150 Peças", allowShrimp: "Sim, liberado", paymentMethod: "Pix", obs: "Caprichar no salmão", address: "Rua Barbosa, 1420", complement: "Apto 802", status: "Pronto", isManual: true, deliveryType: "Entrega" },
  { id: "BC-1042", customerName: "Jefferson Feitosa", phone: "(85) 99197-9773", time: "20:30", date: "2026-09-03", createdAt: "Hoje, 10:15", rawType: "Especial", rawSize: "G - 150 Peças", size: "Barca Especial - G - 150 Peças", allowShrimp: "Sim, liberado", paymentMethod: "Pix", obs: "Caprichar no salmão", address: "Rua Barbosa, 1420", complement: "Apto 802", status: "Pronto", isManual: true, deliveryType: "Entrega" }
];

let ordersDatabase = JSON.parse(localStorage.getItem("sushiOrdersDatabase"));

if (!ordersDatabase || ordersDatabase.length === 0) {
  ordersDatabase = defaultFakeData;
  localStorage.setItem("sushiOrdersDatabase", JSON.stringify(ordersDatabase));
}

function saveDatabase() {
  localStorage.setItem("sushiOrdersDatabase", JSON.stringify(ordersDatabase));
}

let activeOrderId = null;

function getOrderPrice(type, size) {
  if (!type || !size) return "--";
  if (type === "Tradicional") {
    if (size.includes("50")) return "R$ 190,00";
    if (size.includes("70")) return "R$ 280,00";
    if (size.includes("90")) return "R$ 360,00";
    if (size.includes("150")) return "R$ 600,00";
    if (size.includes("200")) return "R$ 690,00";
  } 
  if (type === "Especial") {
    if (size.includes("50")) return "R$ 280,00";
    if (size.includes("70")) return "R$ 370,00";
    if (size.includes("90")) return "R$ 450,00";
    if (size.includes("150")) return "R$ 750,00";
    if (size.includes("200")) return "R$ 985,00";
  }
  return "A conferir";
}

const ordersList = document.getElementById("ordersList");
const emptyDetails = document.getElementById("emptyDetails");
const activeDetails = document.getElementById("activeDetails");
const btnCancelOrder = document.getElementById("btnCancelOrder");
const btnAdvanceStatus = document.getElementById("btnAdvanceStatus");
const btnDeleteOrder = document.getElementById("btnDeleteOrder");

function updateMetrics(dailyOrders) {
  document.getElementById("metricTotal").textContent = dailyOrders.length;
  document.getElementById("metricPending").textContent = dailyOrders.filter(o => o.status === "Pendente").length;
  document.getElementById("metricPreparing").textContent = dailyOrders.filter(o => o.status === "Em Preparo").length;
  document.getElementById("metricReady").textContent = dailyOrders.filter(o => o.status === "Pronto").length;
  document.getElementById("metricDelivered").textContent = dailyOrders.filter(o => o.status === "Entregue").length;
  document.getElementById("metricCanceled").textContent = dailyOrders.filter(o => o.status === "Cancelado").length;
}

function renderTimeline() {
  ordersList.innerHTML = "";
  const selectedDate = document.getElementById("dateFilter").value;
  const filteredOrders = ordersDatabase.filter(order => order.date === selectedDate);
  
  updateMetrics(filteredOrders);

  if (filteredOrders.length === 0) {
    ordersList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i data-lucide="calendar-x-2" style="width: 48px; height: 48px; opacity: 0.2; margin-bottom: 12px;"></i>
        <p>Nenhum pedido agendado para este dia.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    if (datePickerInstance) datePickerInstance.redraw();
    return;
  }

  const todayISO = new Date().toISOString().split("T")[0];

  filteredOrders.sort((a, b) => a.time.localeCompare(b.time)).forEach(order => {
    const card = document.createElement("div");
    
    let statusClass = "status-pendente";
    if (order.status === "Aguardando Frete") statusClass = "status-aguardando";
    if (order.status === "Em Preparo") statusClass = "status-preparo";
    if (order.status === "Pronto") statusClass = "status-pronto";
    if (order.status === "Entregue") statusClass = "status-entregue"; 
    if (order.status === "Cancelado") statusClass = "status-cancelado";

    const manualTag = order.isManual 
      ? `<span class="manual-badge" title="Adicionado Manualmente pelo Painel"><i data-lucide="edit-3" class="icon-xs"></i> Manual</span>` 
      : "";

    // Adiciona a TAG de Retirada
    const pickupBadge = order.deliveryType === "Retirada"
      ? `<span style="font-size: 0.65rem; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">Retirada</span>`
      : "";

    const dateSplit = order.date.split("-");
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}`;
    const isToday = order.date === todayISO;
    
    // Cria um visual de "etiqueta" (badge) para datas que não são hoje
    const dateStyles = isToday 
      ? `color: var(--text-muted); font-weight: 500;` 
      : `color: #854d0e; background: #fef08a; font-weight: 700; padding: 2px 6px; border-radius: 4px;`;

    let cardSizePreview = order.size;
    if (order.items && order.items.length > 1) {
      cardSizePreview = `${order.items.length} itens no pedido`;
    }

    card.className = `timeline-card ${order.id === activeOrderId ? "selected" : ""}`;
    card.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; line-height: 1.1;">
        <span class="card-time">${order.time}</span>
        <span style="font-size: 0.75rem; margin-top: 6px; ${dateStyles}">${formattedDate}</span>
      </div>
      <div class="card-meta">
        <div class="card-client">${order.customerName}</div>
        <div class="card-details">${cardSizePreview}</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        ${manualTag}
        ${pickupBadge}
        <span class="status-tag ${statusClass}">${order.status}</span>
      </div>
    `;

    card.addEventListener("click", () => selectOrder(order.id));
    ordersList.appendChild(card);
  });
  
  if (window.lucide) lucide.createIcons();
}

function selectOrder(orderId) {
  activeOrderId = orderId;
  const order = ordersDatabase.find(o => o.id === orderId);
  if (!order) return;

  emptyDetails.style.display = "none";
  activeDetails.classList.remove("hidden");

  document.getElementById("detId").textContent = `#${order.id}`;
  document.getElementById("detCreatedAt").innerHTML = `<i data-lucide="clock-3" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Criado em: ${order.createdAt}`;
  document.getElementById("detCustomerName").textContent = order.customerName;
  document.getElementById("detTime").textContent = order.time;
  document.getElementById("detPaymentMethod").textContent = order.paymentMethod || "--";
  
  const detItemsList = document.getElementById("detItemsList");
  detItemsList.innerHTML = "";
  let totalItemsValue = 0;

  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const itemTotal = item.unitPriceNumeric * item.quantity;
      totalItemsValue += itemTotal;
      const itemTotalFormatted = itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      detItemsList.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--c-900); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--c-700);">
          <span style="font-size: 0.9rem; color: var(--text-main); line-height: 1.3;">
            <strong>${item.quantity}x</strong> Barca ${item.type} - ${item.sizeText} 
            <span style="color: var(--text-muted); margin-left: 4px;">(Camarão: ${item.shrimp})</span>
          </span>
          <strong style="font-size: 0.95rem; color: var(--success); white-space: nowrap; margin-left: 10px;">${itemTotalFormatted}</strong>
        </div>
      `;
    });
  } else {
    const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
    totalItemsValue = parseFloat(barcaPriceRaw.replace("R$ ", "").replace(",", ".")) || 0;

    detItemsList.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--c-900); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--c-700);">
        <span style="font-size: 0.9rem; color: var(--text-main); line-height: 1.3;">
          <strong>1x</strong> ${order.size} 
          <span style="color: var(--text-muted); margin-left: 4px;">(Camarão: ${order.allowShrimp || "Sim"})</span>
        </span>
        <strong style="font-size: 0.95rem; color: var(--success); white-space: nowrap; margin-left: 10px;">${barcaPriceRaw}</strong>
      </div>
    `;
  }

  document.getElementById("detPrice").textContent = totalItemsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // LOGICA PARA ZERAR FRETE SE FOR RETIRADA
  if (order.deliveryType === "Retirada") {
    document.getElementById("detFreight").textContent = "Grátis (Retirada)";
    document.getElementById("detTotal").textContent = totalItemsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("btnSendFreight").style.display = "none";
  } else {
    const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
    document.getElementById("detFreight").textContent = freightValue > 0 ? `R$ ${freightValue.toFixed(2).replace('.', ',')}` : "Aguardando cálculo";

    if (freightValue > 0 && totalItemsValue > 0) {
      const total = totalItemsValue + freightValue;
      document.getElementById("detTotal").textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      document.getElementById("btnSendFreight").style.display = "flex";
    } else {
      document.getElementById("detTotal").textContent = "--";
      document.getElementById("btnSendFreight").style.display = "none";
    }
  }
  
  document.getElementById("detObs").textContent = order.obs;
  document.getElementById("detPhone").textContent = order.phone;
  document.getElementById("detAddress").textContent = order.address;
  document.getElementById("detComplement").textContent = order.complement;

  const badge = document.getElementById("detStatusBadge");
  badge.textContent = order.status;
  badge.className = "status-tag";
  
  if (order.status === "Pendente") badge.classList.add("status-pendente");
  if (order.status === "Em Preparo") badge.classList.add("status-preparo");
  if (order.status === "Pronto") badge.classList.add("status-pronto");
  if (order.status === "Entregue") badge.classList.add("status-entregue");
  if (order.status === "Cancelado") badge.classList.add("status-cancelado");
  if (order.status === "Aguardando Frete") badge.classList.add("status-aguardando");
  
  if (order.status === "Cancelado") {
    btnCancelOrder.classList.add("active");
    btnCancelOrder.textContent = "Pedido Cancelado";
    btnAdvanceStatus.disabled = true;
  } else {
    btnCancelOrder.classList.remove("active");
    btnCancelOrder.textContent = "Cancelar Pedido";
    btnAdvanceStatus.disabled = false;
  }

  if (window.lucide) lucide.createIcons();
  renderTimeline();
}

document.getElementById("btnWhatsapp").addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (order) window.open(`https://wa.me/55${order.phone.replace(/\D/g, "")}`, "_blank");
});

btnCancelOrder.addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (order) {
    order.status = order.status === "Cancelado" ? "Pendente" : "Cancelado";
    saveDatabase(); 
    selectOrder(order.id);
  }
});

if (btnDeleteOrder) {
  btnDeleteOrder.addEventListener("click", () => {
    const order = ordersDatabase.find(o => o.id === activeOrderId);
    if (!order) return;
    const confirmDelete = confirm(`ATENÇÃO: Tem certeza que deseja excluir PERMANENTEMENTE o pedido ${order.id} de ${order.customerName}?`);
    
    if (confirmDelete) {
      ordersDatabase = ordersDatabase.filter(o => o.id !== activeOrderId);
      saveDatabase(); 
      activeOrderId = null;
      activeDetails.classList.add("hidden");
      emptyDetails.style.display = "flex";
      renderTimeline();
    }
  });
}

btnAdvanceStatus.addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (!order || order.status === "Cancelado") return;
  
  let newStatus = "";
  let statusMessage = "";

  if (order.status === "Aguardando Frete") newStatus = "Pendente";
  else if (order.status === "Pendente") {
    newStatus = "Em Preparo";
    statusMessage = `🍣 Olá, ${order.customerName.split(' ')[0]}! O seu pedido *#${order.id}* acaba de entrar *Em Preparo* na nossa cozinha. Caprichando por aqui! 🔪✨`;
  } 
  else if (order.status === "Em Preparo") {
    newStatus = "Pronto";
    statusMessage = `✅ Olá, ${order.customerName.split(' ')[0]}! Seu pedido *#${order.id}* está *Pronto*! Já estamos embalando e organizando a sua entrega. 🛵💨`;
  } 
  else if (order.status === "Pronto") {
    newStatus = "Entregue";
    statusMessage = `🛵 O seu pedido *#${order.id}* acabou de sair para entrega (ou foi retirado)! Muito obrigado por escolher o Dedé Sushi. Bom apetite! 🍣🥢`;
  } 
  else if (order.status === "Entregue") newStatus = "Aguardando Frete";

  order.status = newStatus;
  saveDatabase(); 
  selectOrder(order.id);

  if (statusMessage) {
    setTimeout(() => {
      const wantToSend = confirm(`O status mudou para "${newStatus}". Deseja enviar um aviso automático no WhatsApp do cliente?`);
      if (wantToSend) {
        const encodedMessage = encodeURIComponent(statusMessage);
        window.open(`https://wa.me/55${order.phone.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank");
      }
    }, 100);
  }
});

let datePickerInstance;
function initDatePicker() {
  datePickerInstance = flatpickr("#dateFilter", {
    locale: "pt",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
      activeOrderId = null;
      activeDetails.classList.add("hidden");
      emptyDetails.style.display = "flex";
      renderTimeline();
    },
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const dateStrFormat = flatpickr.formatDate(dayElem.dateObj, "Y-m-d");
      const hasOrder = ordersDatabase.some(order => order.date === dateStrFormat);
      if (hasOrder) {
        dayElem.innerHTML += '<span class="has-order-dot"></span>';
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initDatePicker();
  const today = new Date().toISOString().split("T")[0];
  datePickerInstance.setDate(today);
  renderTimeline();
  activeOrderId = null;
  activeDetails.classList.add("hidden");
  emptyDetails.style.display = "flex";
  
  const unlockAudio = () => {
    const audio = document.getElementById("notificationSound");
    if (audio) {
      audio.volume = 1.0;
      audio.muted = false;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.removeEventListener(evt, unlockAudio);
    });
  };

  ['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { once: true });
  });
});

// --- LÓGICA DO MODAL (CARRINHO ADMIN COM QUANTIDADES) ---
let adminCartItems = [];
const modalOverlay = document.getElementById("newOrderModal");
const btnNewOrder = document.getElementById("btnNewOrder");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const newOrderForm = document.getElementById("newOrderForm");
const btnEditOrder = document.getElementById("btnEditOrder"); 

const modalTitle = document.querySelector("#newOrderModal .modal-header h2");
const modalSubmitBtn = document.querySelector("#newOrderForm button[type='submit']");
let isEditing = false;

// Lógica de exibição condicional (Retirada vs Entrega) no modal
const addDeliveryType = document.getElementById("addDeliveryType");
if (addDeliveryType) {
  addDeliveryType.addEventListener("change", (e) => {
    const isPickup = e.target.value === "Retirada";
    
    const addAddress = document.getElementById("addAddress");
    const addComplement = document.getElementById("addComplement");
    const addFreight = document.getElementById("addFreight");

    // Localiza os contêineres e oculta/mostra conforme a modalidade
    if (addAddress) addAddress.parentElement.style.display = isPickup ? "none" : "block";
    if (addComplement) addComplement.parentElement.style.display = isPickup ? "none" : "block";
    if (addFreight) addFreight.parentElement.style.display = isPickup ? "none" : "block";
  });
}

function renderAdminCart() {
  const cartContainer = document.getElementById("adminCartContainer");
  const cartList = document.getElementById("adminCartList");
  const subtotalEl = document.getElementById("adminCartSubtotal");
  
  if (!cartList || !cartContainer) return;
  
  if (adminCartItems.length === 0) {
    cartContainer.style.display = "none";
    cartList.innerHTML = "";
    if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
    return;
  }

  cartContainer.style.display = "flex";
  cartList.innerHTML = "";
  let totalSubtotal = 0;

  adminCartItems.forEach((item, index) => {
    const itemTotal = item.unitPriceNumeric * item.quantity;
    totalSubtotal += itemTotal;
    const formattedTotal = itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedUnitPrice = item.unitPriceNumeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const itemDiv = document.createElement("div");
    itemDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: var(--c-900); padding: 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid var(--c-700);";
    
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-weight: 700; color: var(--text-main); display: block;">Barca ${item.type} - ${item.sizeText}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">Camarão: ${item.shrimp}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Unitário: ${formattedUnitPrice}</span>
        </div>
        <button type="button" class="btn-remove-admin-item" data-index="${index}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Remover item">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--c-700); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Qtd:</span>
          <button type="button" class="btn-qty-minus-admin" data-index="${index}" style="background: var(--c-800); border: 1px solid var(--c-700); color: var(--text-main); width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
          <span style="font-weight: bold; color: var(--text-main); min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="btn-qty-plus-admin" data-index="${index}" style="background: var(--c-800); border: 1px solid var(--c-700); color: var(--text-main); width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
        </div>
        <span style="font-size: 0.95rem; font-weight: 700; color: var(--success);">${formattedTotal}</span>
      </div>
    `;
    cartList.appendChild(itemDiv);
  });

  if (subtotalEl) subtotalEl.textContent = totalSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (window.lucide) lucide.createIcons();

  document.querySelectorAll(".btn-remove-admin-item").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      adminCartItems.splice(idx, 1);
      renderAdminCart();
    };
  });

  document.querySelectorAll(".btn-qty-minus-admin").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      if (adminCartItems[idx].quantity > 1) {
        adminCartItems[idx].quantity -= 1;
      } else {
        adminCartItems.splice(idx, 1);
      }
      renderAdminCart();
    };
  });

  document.querySelectorAll(".btn-qty-plus-admin").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      adminCartItems[idx].quantity += 1;
      renderAdminCart();
    };
  });
}

const btnAddBarcaAdmin = document.getElementById("btnAddBarcaAdmin");
if (btnAddBarcaAdmin) {
  btnAddBarcaAdmin.onclick = () => {
    const type = document.getElementById("addType").value;
    const sizeVal = document.getElementById("addSize").value;
    const shrimp = document.getElementById("addShrimp").value;
    
    const priceStr = getOrderPrice(type, sizeVal);
    const unitPriceNumeric = parseFloat(priceStr.replace("R$ ", "").replace(".", "").replace(",", ".")) || 0;

    const existingIndex = adminCartItems.findIndex(i => i.type === type && i.rawSize === sizeVal && i.shrimp === shrimp);
    if (existingIndex > -1) {
      adminCartItems[existingIndex].quantity += 1;
    } else {
      adminCartItems.push({
        type: type,
        shrimp: shrimp,
        rawSize: sizeVal,
        sizeText: sizeVal, 
        quantity: 1,
        unitPriceNumeric: unitPriceNumeric
      });
    }
    renderAdminCart();
  };
}

function openModal() { modalOverlay.classList.remove("hidden"); }
function closeModal() { 
  modalOverlay.classList.add("hidden"); 
  newOrderForm.reset(); 
  adminCartItems = []; 
  renderAdminCart(); 
}

if (btnNewOrder) {
  btnNewOrder.addEventListener("click", () => {
    isEditing = false;
    modalTitle.innerHTML = `<i data-lucide="plus-circle" class="icon-sm text-primary"></i> Adicionar Pedido Manual`;
    modalSubmitBtn.textContent = "Salvar Pedido";
    document.getElementById("addDate").value = document.getElementById("dateFilter").value;
    
    if (addDeliveryType) {
      addDeliveryType.value = "Entrega";
      addDeliveryType.dispatchEvent(new Event("change"));
    }

    openModal();
    if (window.lucide) lucide.createIcons();
  });
}

if (btnEditOrder) {
  btnEditOrder.addEventListener("click", () => {
    const order = ordersDatabase.find(o => o.id === activeOrderId);
    if (!order) return;
    isEditing = true;
    modalTitle.innerHTML = `<i data-lucide="edit" class="icon-sm text-primary"></i> Editar Pedido ${order.id}`;
    modalSubmitBtn.textContent = "Salvar Alterações";
    
    document.getElementById("addName").value = order.customerName;
    document.getElementById("addPhone").value = order.phone;
    document.getElementById("addAddress").value = order.address === "Retirada no Balcão" ? "" : order.address;
    document.getElementById("addComplement").value = order.complement === "N/A" || order.complement === "Nenhum" ? "" : order.complement;
    document.getElementById("addDate").value = order.date; 
    document.getElementById("addTime").value = order.time;
    document.getElementById("addObs").value = order.obs !== "Nenhuma observação informada." ? order.obs : "";
    document.getElementById("addFreight").value = order.freight || "";
    if (order.paymentMethod) {
      let pm = order.paymentMethod;
      if (pm === "Pix") pm = "Pix (Aguardando)";
      const paymentSelect = document.getElementById("addPayment");
      if (!Array.from(paymentSelect.options).some(opt => opt.value === pm)) paymentSelect.add(new Option(pm, pm));
      paymentSelect.value = pm;
    }

    if (addDeliveryType) {
      addDeliveryType.value = order.deliveryType || "Entrega";
      addDeliveryType.dispatchEvent(new Event("change"));
    }

    if (order.items && order.items.length > 0) {
      adminCartItems = JSON.parse(JSON.stringify(order.items));
    } else {
      const priceStr = getOrderPrice(order.rawType, order.rawSize);
      const unitPriceNumeric = parseFloat(priceStr.replace("R$ ", "").replace(".", "").replace(",", ".")) || 0;
      adminCartItems = [{
        type: order.rawType,
        shrimp: order.allowShrimp || "Sim, liberado",
        rawSize: order.rawSize,
        sizeText: order.rawSize,
        quantity: 1,
        unitPriceNumeric: unitPriceNumeric
      }];
    }
    renderAdminCart();

    openModal();
    if (window.lucide) lucide.createIcons();
  });
}

btnCloseModal.addEventListener("click", closeModal);
btnCancelModal.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });

newOrderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (adminCartItems.length === 0) {
    alert("Adicione pelo menos um item ao pedido!");
    return;
  }

  const dateValue = document.getElementById("addDate").value; 
  const combinedSizes = adminCartItems.map(i => `${i.quantity}x ${i.type} (${i.sizeText})`).join(" + ");
  const primaryType = adminCartItems[0].type;
  const primarySize = adminCartItems[0].rawSize;
  const allowShrimpStr = adminCartItems.map(i => `${i.quantity}x ${i.shrimp}`).join(" | ");

  const dtEl = document.getElementById("addDeliveryType");
  const deliveryTypeVal = dtEl ? dtEl.value : "Entrega";
  const addressVal = deliveryTypeVal === "Retirada" ? "Retirada no Balcão" : document.getElementById("addAddress").value;
  const complementVal = deliveryTypeVal === "Retirada" ? "N/A" : (document.getElementById("addComplement").value || "Nenhum");
  const freightVal = deliveryTypeVal === "Retirada" ? "0,00" : document.getElementById("addFreight").value;

  if (isEditing) {
    const orderIndex = ordersDatabase.findIndex(o => o.id === activeOrderId);
    if (orderIndex > -1) {
      ordersDatabase[orderIndex].customerName = document.getElementById("addName").value;
      ordersDatabase[orderIndex].phone = document.getElementById("addPhone").value;
      ordersDatabase[orderIndex].date = dateValue; 
      ordersDatabase[orderIndex].time = document.getElementById("addTime").value;
      ordersDatabase[orderIndex].paymentMethod = document.getElementById("addPayment").value;
      ordersDatabase[orderIndex].obs = document.getElementById("addObs").value || "Nenhuma observação informada.";
      ordersDatabase[orderIndex].address = addressVal;
      ordersDatabase[orderIndex].complement = complementVal;
      ordersDatabase[orderIndex].freight = freightVal;
      ordersDatabase[orderIndex].deliveryType = deliveryTypeVal;
      
      ordersDatabase[orderIndex].items = adminCartItems;
      ordersDatabase[orderIndex].rawType = primaryType; 
      ordersDatabase[orderIndex].rawSize = primarySize; 
      ordersDatabase[orderIndex].size = combinedSizes;
      ordersDatabase[orderIndex].allowShrimp = allowShrimpStr;
    }
    saveDatabase(); 
    closeModal();
    document.getElementById("dateFilter").value = dateValue; 
    renderTimeline();
    selectOrder(activeOrderId);
  } else {
    const newId = `BC-${Math.floor(Math.random() * 9000) + 1000}`;
    const now = new Date();
    
    const newOrder = {
      id: newId,
      customerName: document.getElementById("addName").value,
      phone: document.getElementById("addPhone").value,
      time: document.getElementById("addTime").value,
      date: dateValue, 
      createdAt: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rawType: primaryType,     
      rawSize: primarySize,     
      size: combinedSizes,
      items: adminCartItems,
      allowShrimp: allowShrimpStr,
      paymentMethod: document.getElementById("addPayment").value,
      obs: document.getElementById("addObs").value || "Nenhuma observação informada.",
      address: addressVal,
      complement: complementVal,
      status: deliveryTypeVal === "Retirada" ? "Pendente" : "Aguardando Frete",
      isManual: true,
      deliveryType: deliveryTypeVal,
      freight: freightVal 
    };
    ordersDatabase.push(newOrder);
    saveDatabase(); 
    closeModal();
    document.getElementById("dateFilter").value = dateValue; 
    renderTimeline();
    selectOrder(newId);
  }
});

const phoneInput = document.getElementById("addPhone");
if (phoneInput) {
  phoneInput.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    let formatted = v;
    if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    e.target.value = formatted;
  });
}

const freightInput = document.getElementById("addFreight");
if (freightInput) {
  freightInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") { e.target.value = ""; return; }
    value = (parseInt(value, 10) / 100).toFixed(2);
    e.target.value = value.replace(".", ",");
  });
}

function showNotification(order) {
  const audio = document.getElementById("notificationSound");
  if (audio) {
    audio.volume = 1.0;
    audio.muted = false;
    audio.currentTime = 0; 
    audio.play().catch(err => console.log("Áudio bloqueado pelo navegador. O usuário precisa interagir com a tela primeiro."));
  }
  
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  // Lógica para descobrir se o pedido é para hoje ou outro dia
  const today = new Date();
  const todayISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  
  let scheduleText = "";
  if (order.date === todayISO) {
    scheduleText = `Hoje às ${order.time}`;
  } else {
    // Quebra a data "YYYY-MM-DD" para formatar
    const [year, month, day] = order.date.split("-");
    const orderDateObj = new Date(year, month - 1, day);
    
    // Pega o nome do dia da semana (segunda-feira, terça-feira...)
    let weekDay = orderDateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    // Deixa a primeira letra maiúscula (ex: "Quinta-feira")
    weekDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    
    scheduleText = `${weekDay} (${day}/${month}) às ${order.time}`;
  }

  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="bell" style="width: 24px; height: 24px; stroke-width: 2.5;"></i>
    </div>
    <div class="toast-content">
      <h4>Novo Pedido Recebido!</h4>
      <p style="margin: 0;"><strong>${order.customerName}</strong></p>
      <p style="margin: 2px 0 0 0; font-size: 0.85rem; opacity: 0.85;">Para: ${scheduleText}</p>
    </div>
  `;
  toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add("hiding");
    toast.addEventListener("animationend", () => toast.remove());
  }, 8000);
}

// --- ESCUTADOR DE NOVOS PEDIDOS EM TEMPO REAL ---
window.addEventListener('storage', (e) => {
  if (e.key === 'sushiOrdersDatabase') {
    const newData = JSON.parse(e.newValue) || [];
    
    if (newData.length > ordersDatabase.length) {
      const newOrder = newData[newData.length - 1]; 
      ordersDatabase = newData; 
      const currentFilter = document.getElementById("dateFilter").value;
      if (newOrder.date === currentFilter) {
        renderTimeline();         
      }
      showNotification(newOrder); 
    } else {
      ordersDatabase = newData;
      renderTimeline();
    }
  }
});

document.getElementById("btnSendFreight").addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (!order) return;

  let totalItemsValue = 0;
  let barcasListMsg = "";

  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const itemTotal = item.unitPriceNumeric * item.quantity;
      totalItemsValue += itemTotal;
      barcasListMsg += `▪ ${item.quantity}x Barca ${item.type} (${item.sizeText})\n`;
    });
  } else {
    const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
    totalItemsValue = parseFloat(barcaPriceRaw.replace("R$ ", "").replace(",", ".")) || 0;
    barcasListMsg = `▪ 1x ${order.size}\n`;
  }

  const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
  const total = totalItemsValue + freightValue;

  const today = new Date();
  const todayISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  
  let scheduleText = "";
  if (order.date === todayISO) {
    scheduleText = `hoje às ${order.time}`;
  } else {
    const [year, month, day] = order.date.split("-");
    const orderDateObj = new Date(year, month - 1, day);
    const weekDay = orderDateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    scheduleText = `${weekDay} (${day}/${month}) às ${order.time}`;
  }

  const msg = `
✅ *O Frete do seu pedido foi calculado!*
Pedido: #${order.id}

*Itens:*
${barcasListMsg}
*Valor dos Itens:* R$ ${totalItemsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
*Taxa de Entrega:* R$ ${freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
*TOTAL:* R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Forma de pagamento escolhida: *${order.paymentMethod}*

Podemos confirmar o seu agendamento para *${scheduleText}*? 
👉 *Responda SIM ou NÃO*
  `.trim();

  window.open(`https://wa.me/55${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
});

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    if (confirm("Deseja realmente sair do painel?")) {
      localStorage.removeItem("sushiAdminLoggedIn");
      window.location.href = "index.html";
    }
  });
}

// =======================================================
// --- MÓDULO DE RELATÓRIOS (PDF / IMPRESSÃO COZINHA) ---
// =======================================================

const reportsModal = document.getElementById("reportsModal");
const btnOpenReports = document.getElementById("btnOpenReports");
const btnCloseReports = document.getElementById("btnCloseReports");

if (btnOpenReports) {
  btnOpenReports.addEventListener("click", () => {
    reportsModal.classList.remove("hidden");
  });
}

if (btnCloseReports) {
  btnCloseReports.addEventListener("click", () => {
    reportsModal.classList.add("hidden");
  });
}

reportsModal.addEventListener("click", (e) => {
  if (e.target === reportsModal) reportsModal.classList.add("hidden");
});

document.querySelectorAll(".btn-generate-report").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const period = e.currentTarget.getAttribute("data-period");
    generateReportHTML(period);
    reportsModal.classList.add("hidden");
  });
});

function generateReportHTML(period) {
  const now = new Date();
  const todayISO = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

  let startDate = "";
  let endDate = "";
  let periodLabel = "";

  if (period === 'hoje') {
    startDate = todayISO;
    endDate = todayISO;
    periodLabel = `Resumo de Hoje (${todayISO.split('-').reverse().join('/')})`;
  } else if (period === 'amanha') {
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowISO = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    startDate = tomorrowISO;
    endDate = tomorrowISO;
    periodLabel = `Previsão de Amanhã (${tomorrowISO.split('-').reverse().join('/')})`;
  } else if (period === 'semana') {
    const currentDay = now.getDay(); 
    const daysSinceWednesday = (currentDay + 7 - 3) % 7; 
    
    const startOfWeek = new Date(now.getTime() - (daysSinceWednesday * 86400000));
    const endOfWeek = new Date(startOfWeek.getTime() + (5 * 86400000));
    
    startDate = new Date(startOfWeek.getTime() - (startOfWeek.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    endDate = new Date(endOfWeek.getTime() - (endOfWeek.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    periodLabel = `Fechamento Semanal (${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')})`;
  } else if (period === 'mes') {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    endDate = new Date(lastDay.getTime() - (lastDay.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    periodLabel = `Fechamento Mensal (${monthNames[now.getMonth()]} de ${year})`;
  }

  const filtered = ordersDatabase.filter(o => o.date >= startDate && o.date <= endDate && o.status !== "Cancelado");

  const prepList = {};
  const paymentStats = {};
  let totalRevenue = 0;
  let totalBarcasAll = 0;
  let totalBarcasDelivery = 0; // Novo contador para Delivery
  let totalBarcasRetirada = 0; // Novo contador para Retirada
  let totalOrders = filtered.length;

  filtered.forEach(order => {
    const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
    totalRevenue += freightValue;

    const isPickup = order.deliveryType === "Retirada";

    // Normaliza método de pagamento
    let pm = order.paymentMethod || "Não Informado";
    if (pm.includes("Pix")) pm = "Pix";
    
    if (!paymentStats[pm]) {
      paymentStats[pm] = { orders: 0, barcas: 0, total: 0 };
    }
    paymentStats[pm].orders += 1;
    paymentStats[pm].total += freightValue;

    let orderItemsTotal = 0;

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const itemKey = `Barca ${item.type} - ${item.sizeText} <br><small style="color:#555;">Camarão: ${item.shrimp}</small>`;
        if (!prepList[itemKey]) prepList[itemKey] = { qtd: 0, subtotal: 0 };
        prepList[itemKey].qtd += item.quantity;
        const itemTotal = item.unitPriceNumeric * item.quantity;
        prepList[itemKey].subtotal += itemTotal;
        
        orderItemsTotal += itemTotal;
        totalRevenue += itemTotal;
        
        totalBarcasAll += item.quantity;
        paymentStats[pm].barcas += item.quantity;
        
        // Separa contagem de modalidade
        if (isPickup) totalBarcasRetirada += item.quantity;
        else totalBarcasDelivery += item.quantity;
      });
    } else {
      const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
      const unitPriceNumeric = parseFloat(barcaPriceRaw.replace("R$ ", "").replace(".", "").replace(",", ".")) || 0;
      const itemKey = `Barca ${order.rawType} - ${order.rawSize} <br><small style="color:#555;">Camarão: ${order.allowShrimp || "Sim"}</small>`;
      if (!prepList[itemKey]) prepList[itemKey] = { qtd: 0, subtotal: 0 };
      prepList[itemKey].qtd += 1;
      prepList[itemKey].subtotal += unitPriceNumeric;
      
      orderItemsTotal += unitPriceNumeric;
      totalRevenue += unitPriceNumeric;
      
      totalBarcasAll += 1;
      paymentStats[pm].barcas += 1;
      
      // Separa contagem de modalidade
      if (isPickup) totalBarcasRetirada += 1;
      else totalBarcasDelivery += 1;
    }

    paymentStats[pm].total += orderItemsTotal;
  });

  const sortedItems = Object.entries(prepList).sort((a, b) => b[1].qtd - a[1].qtd);
  let itemsHtml = '';
  sortedItems.forEach(([name, data]) => {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; font-weight: bold; text-align: center; font-size: 16px;">${data.qtd}x</td>
        <td style="padding: 12px; font-size: 14px;">${name}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold;">${data.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>
    `;
  });

  if (sortedItems.length === 0) {
    itemsHtml = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #666;">Nenhum pedido agendado para este período.</td></tr>`;
  }

  // Tabela de Métodos de Pagamento
  let paymentHtml = '';
  const sortedPayments = Object.entries(paymentStats).sort((a, b) => b[1].total - a[1].total);
  sortedPayments.forEach(([method, data]) => {
    paymentHtml += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px 12px; font-weight: 600; font-size: 14px;">${method}</td>
        <td style="padding: 10px 12px; text-align: center; font-size: 14px;">${data.orders} pedido(s)</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: bold; font-size: 14px;">${data.barcas} barca(s)</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 14px;">${data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>
    `;
  });

  if (sortedPayments.length === 0) {
    paymentHtml = `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #666;">Sem dados de pagamento.</td></tr>`;
  }

  const printWindow = window.open('', '_blank');
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório - ${periodLabel}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000; background: #fff; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { margin: 0 0 5px 0; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
        h2 { margin: 0; font-size: 16px; color: #444; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f0f0f0; border-bottom: 2px solid #000; padding: 10px 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
        th.center { text-align: center; }
        th.right { text-align: right; }
        .section-title { font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .summary { background: #fafafa; border: 2px dashed #ccc; padding: 15px; border-radius: 8px; page-break-inside: avoid; margin-top: 15px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; color: #333; }
        .summary-row.total { font-weight: 900; font-size: 19px; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 5px; color: #000; }
        
        /* Estilo da divisão de Delivery vs Retirada */
        .delivery-split { display: flex; font-size: 13px; color: #555; margin-top: -5px; margin-bottom: 15px; gap: 20px; }
        
        @media print {
          body { padding: 0; margin: 0; }
          .print-btn { display: none !important; }
        }
        .print-btn { display: block; width: 100%; padding: 15px; background: #22c55e; color: #fff; text-align: center; font-size: 16px; font-weight: bold; text-decoration: none; border: none; cursor: pointer; margin-bottom: 20px; border-radius: 8px; }
        .print-btn:hover { background: #16a34a; }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
      
      <div class="header">
        <img src="./assets/logo.png" alt="Dedé Sushi" style="width: 200px; height: auto; object-fit: contain; margin-bottom: 15px; display: inline-block;">
        <h2 style="margin: -6px 0 4px 0; font-size: 16px; color: #444; font-weight: normal;">Relatório de Produção e Fechamento</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">Período: ${periodLabel}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #888;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <h3 class="section-title">Consolidado para a Cozinha (Itens a Produzir)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 60px; text-align: center;">Qtd</th>
            <th>Descrição do Item</th>
            <th class="right" style="width: 120px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 class="section-title">Distribuição por Forma de Pagamento</h3>
      <table>
        <thead>
          <tr>
            <th>Método</th>
            <th class="center" style="width: 110px;">Pedidos</th>
            <th class="center" style="width: 110px;">Barcas</th>
            <th class="right" style="width: 130px;">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${paymentHtml}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Total de Pedidos Validados:</span>
          <strong>${totalOrders} pedidos</strong>
        </div>
        
        <div class="summary-row">
          <span>Volume Total de Barcas:</span>
          <strong>${totalBarcasAll} barcas</strong>
        </div>
        
        <!-- Detalhamento de Delivery vs Retirada -->
        <div class="delivery-split">
          <span>↳ 🛵 Delivery: <strong>${totalBarcasDelivery}</strong> un</span>
          <span>↳ 🏪 Retirada: <strong>${totalBarcasRetirada}</strong> un</span>
        </div>

        <div class="summary-row total">
          <span>Valor Bruto Apurado (Itens + Frete):</span>
          <span>${totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">* Este relatório não contabiliza pedidos marcados como "Cancelados".</p>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// --- SISTEMA DE CONGELAMENTO DE PEDIDOS ---
const btnToggleFreeze = document.getElementById("btnToggleFreeze");

function updateFreezeButtonUI() {
  if (!btnToggleFreeze) return;
  const isFrozen = localStorage.getItem("sushiFreezeState") === "true";
  
  if (isFrozen) {
    btnToggleFreeze.innerHTML = `<i data-lucide="play-circle" class="icon-sm"></i> Liberar Pedidos`;
    btnToggleFreeze.style.backgroundColor = "var(--success)";
    btnToggleFreeze.style.color = "#fff";
  } else {
    btnToggleFreeze.innerHTML = `<i data-lucide="pause-circle" class="icon-sm"></i> Pausar Pedidos`;
    btnToggleFreeze.style.backgroundColor = "var(--warning)";
    btnToggleFreeze.style.color = "#121212";
  }
  if (window.lucide) lucide.createIcons();
}

if (btnToggleFreeze) {
  btnToggleFreeze.addEventListener("click", () => {
    const isFrozen = localStorage.getItem("sushiFreezeState") === "true";
    localStorage.setItem("sushiFreezeState", !isFrozen);
    updateFreezeButtonUI();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateFreezeButtonUI();
});

// ==========================================================
// GERENCIADOR DE CARDÁPIO DINÂMICO (PRODUTOS & PREÇOS)
// ==========================================================

const DEFAULT_CATALOG = {
  "Tradicional": [
    { id: "trad-exp", value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 190,00 (2 pessoas)", price: 190.00 },
    { id: "trad-p", value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 280,00 (3 a 4 pessoas)", price: 280.00 },
    { id: "trad-m", value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 360,00 (4 a 5 pessoas)", price: 360.00 },
    { id: "trad-g", value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 600,00 (7 a 8 pessoas)", price: 600.00 },
    { id: "trad-gg", value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 690,00 (11 a 12 pessoas)", price: 690.00 }
  ],
  "Especial": [
    { id: "esp-exp", value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 280,00 (2 pessoas)", price: 280.00 },
    { id: "esp-p", value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 370,00 (3 a 4 pessoas)", price: 370.00 },
    { id: "esp-m", value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 450,00 (4 a 5 pessoas)", price: 450.00 },
    { id: "esp-g", value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 750,00 (7 a 8 pessoas)", price: 750.00 },
    { id: "esp-gg", value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 985,00 (11 a 12 pessoas)", price: 985.00 }
  ]
};

// Carrega ou inicializa o catálogo
function getCatalog() {
  const saved = localStorage.getItem("sushiProductsCatalog");
  if (!saved) {
    localStorage.setItem("sushiProductsCatalog", JSON.stringify(DEFAULT_CATALOG));
    return DEFAULT_CATALOG;
  }
  return JSON.parse(saved);
}

function saveCatalog(catalog) {
  localStorage.setItem("sushiProductsCatalog", JSON.stringify(catalog));
  // Dispara evento para sincronizar se houver outras abas
  window.dispatchEvent(new Event("storage"));
  renderCatalogAdmin();
  populateAdminModalDropdowns();
}

// Renderiza a listagem no Modal do Admin
function renderCatalogAdmin() {
  const catalog = getCatalog();
  const container = document.getElementById("catalogListContainer");
  const datalist = document.getElementById("catalogTypesList");
  if (!container) return;

  container.innerHTML = "";
  if (datalist) datalist.innerHTML = "";

  const types = Object.keys(catalog);

  types.forEach(type => {
    if (datalist) {
      const opt = document.createElement("option");
      opt.value = type;
      datalist.appendChild(opt);
    }

    const section = document.createElement("div");
    section.style.cssText = "background: var(--c-800); border: 1px solid var(--c-700); border-radius: 8px; padding: 12px;";

    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--c-700); padding-bottom: 6px; margin-bottom: 8px;";
    header.innerHTML = `
      <strong style="color: var(--c-500); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">${type}</strong>
      <span style="font-size: 0.75rem; color: var(--text-muted);">${catalog[type].length} opções</span>
    `;
    section.appendChild(header);

    const list = document.createElement("div");
    list.style.cssText = "display: flex; flex-direction: column; gap: 6px;";

    catalog[type].forEach(item => {
      const itemRow = document.createElement("div");
      itemRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--c-900); border-radius: 6px; font-size: 0.85rem;";
      
      itemRow.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; color: var(--text-main);">${item.value}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${item.text}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <strong style="color: var(--success); font-size: 0.95rem;">${item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          <button type="button" class="btn-edit-catalog" data-id="${item.id}" data-type="${type}" style="background: transparent; border: none; color: var(--c-500); cursor: pointer; padding: 4px;" title="Editar">
            <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
          </button>
          <button type="button" class="btn-del-catalog" data-id="${item.id}" data-type="${type}" style="background: transparent; border: none; color: var(--danger); cursor: pointer; padding: 4px;" title="Remover">
            <i data-lucide="trash" style="width: 15px; height: 15px;"></i>
          </button>
        </div>
      `;
      list.appendChild(itemRow);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  if (window.lucide) lucide.createIcons();

  // Eventos de exclusão
  document.querySelectorAll(".btn-del-catalog").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const type = btn.getAttribute("data-type");
      if (confirm(`Remover esta opção de ${type}?`)) {
        const cat = getCatalog();
        cat[type] = cat[type].filter(i => i.id !== id);
        if (cat[type].length === 0) delete cat[type];
        saveCatalog(cat);
      }
    };
  });

  // Eventos de edição
  document.querySelectorAll(".btn-edit-catalog").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const type = btn.getAttribute("data-type");
      const cat = getCatalog();
      const item = (cat[type] || []).find(i => i.id === id);
      if (!item) return;

      document.getElementById("catEditId").value = item.id;
      document.getElementById("catType").value = type;
      document.getElementById("catValue").value = item.value;
      document.getElementById("catText").value = item.text;
      document.getElementById("catPrice").value = item.price;

      document.getElementById("catalogFormTitle").textContent = "Editar Item do Cardápio";
      document.getElementById("btnSaveCatalogItem").textContent = "Atualizar Item";
      document.getElementById("btnCancelCatalogEdit").style.display = "inline-block";
    };
  });
}

// Preenche os selects (#addType e #addSize) do Modal de Novo Pedido Manual
function populateAdminModalDropdowns() {
  const catalog = getCatalog();
  const addType = document.getElementById("addType");
  const addSize = document.getElementById("addSize");
  if (!addType || !addSize) return;

  const currentType = addType.value || Object.keys(catalog)[0];
  addType.innerHTML = "";

  Object.keys(catalog).forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    if (type === currentType) opt.selected = true;
    addType.appendChild(opt);
  });

  function updateSizes() {
    const selected = addType.value;
    addSize.innerHTML = "";
    const items = catalog[selected] || [];
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.value;
      opt.textContent = `${item.value} - R$ ${item.price.toFixed(2).replace('.', ',')}`;
      addSize.appendChild(opt);
    });
  }

  addType.onchange = updateSizes;
  updateSizes();
}

// Controle do Modal de Cardápio
const catalogModal = document.getElementById("catalogModal");
const btnOpenCatalog = document.getElementById("btnOpenCatalog");
const btnCloseCatalog = document.getElementById("btnCloseCatalog");
const catalogItemForm = document.getElementById("catalogItemForm");
const btnCancelCatalogEdit = document.getElementById("btnCancelCatalogEdit");
const btnResetCatalog = document.getElementById("btnResetCatalog");

if (btnOpenCatalog && catalogModal) {
  btnOpenCatalog.onclick = () => {
    renderCatalogAdmin();
    catalogModal.classList.remove("hidden");
  };
}
if (btnCloseCatalog && catalogModal) {
  btnCloseCatalog.onclick = () => catalogModal.classList.add("hidden");
}

function resetCatalogForm() {
  catalogItemForm.reset();
  document.getElementById("catEditId").value = "";
  document.getElementById("catalogFormTitle").textContent = "Adicionar Novo Item ao Cardápio";
  document.getElementById("btnSaveCatalogItem").textContent = "Salvar no Cardápio";
  btnCancelCatalogEdit.style.display = "none";
}

if (btnCancelCatalogEdit) {
  btnCancelCatalogEdit.onclick = resetCatalogForm;
}

if (btnResetCatalog) {
  btnResetCatalog.onclick = () => {
    if (confirm("Deseja restaurar as opções padrões do cardápio? Todas as alterações manuais serão perdidas.")) {
      localStorage.setItem("sushiProductsCatalog", JSON.stringify(DEFAULT_CATALOG));
      renderCatalogAdmin();
      populateAdminModalDropdowns();
    }
  };
}

if (catalogItemForm) {
  catalogItemForm.onsubmit = (e) => {
    e.preventDefault();
    const editId = document.getElementById("catEditId").value;
    const type = document.getElementById("catType").value.trim();
    const value = document.getElementById("catValue").value.trim();
    const text = document.getElementById("catText").value.trim();
    // Converte a string "R$ 280,00" para número decimal 280.00
    const rawPrice = document.getElementById("catPrice").value.replace(/\D/g, "");
    const price = rawPrice ? parseFloat(rawPrice) / 100 : 0;

    const catalog = getCatalog();
    if (!catalog[type]) catalog[type] = [];

    if (editId) {
      // Remove da categoria antiga caso tenha mudado de categoria
      Object.keys(catalog).forEach(t => {
        catalog[t] = catalog[t].filter(i => i.id !== editId);
        if (catalog[t].length === 0 && t !== type) delete catalog[t];
      });
      if (!catalog[type]) catalog[type] = [];
      catalog[type].push({ id: editId, value, text, price });
    } else {
      const newId = `item-${Date.now()}`;
      catalog[type].push({ id: newId, value, text, price });
    }

    saveCatalog(catalog);
    resetCatalogForm();
  };
}

// Inicializa os selects do modal assim que carrega
populateAdminModalDropdowns();

// --- MÁSCARA MONETÁRIA (R$) PARA O PREÇO DO CARDÁPIO ---
const catPriceInput = document.getElementById("catPrice");

if (catPriceInput) {
  catPriceInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) {
      e.target.value = "";
      return;
    }
    const numericValue = (parseInt(value, 10) / 100).toFixed(2);
    e.target.value = Number(numericValue).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  });
}