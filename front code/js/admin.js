const defaultFakeData = [
  { id: "BC-1041", customerName: "Rodrigo Alencar", phone: "(85) 99123-4567", time: "18:30", date: "2026-08-28", createdAt: "Hoje, 10:15", rawType: "Especial", rawSize: "G - 150 Peças", size: "Barca Especial - G - 150 Peças", allowShrimp: "Sim, liberado", paymentMethod: "Pix", obs: "Caprichar no salmão", address: "Rua Barbosa, 1420", complement: "Apto 802", status: "Pronto", isManual: true }
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

    const dateSplit = order.date.split("-");
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}`;
    const isToday = order.date === todayISO;
    const dateColor = isToday ? "var(--text-muted)" : "var(--warning)";
    const dateWeight = isToday ? "500" : "800";

    let cardSizePreview = order.size;
    if (order.items && order.items.length > 1) {
      cardSizePreview = `${order.items.length} itens no pedido`;
    }

    card.className = `timeline-card ${order.id === activeOrderId ? "selected" : ""}`;
    card.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; line-height: 1.1;">
        <span class="card-time">${order.time}</span>
        <span style="font-size: 0.75rem; color: ${dateColor}; font-weight: ${dateWeight}; margin-top: 4px;">${formattedDate}</span>
      </div>
      <div class="card-meta">
        <div class="card-client">${order.customerName}</div>
        <div class="card-details">${cardSizePreview}</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        ${manualTag}
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
  document.getElementById("detCreatedAt").innerHTML = `<i data-lucide="clock-3" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Agendado em: ${order.createdAt}`;
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
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 0.9rem; color: #fff; line-height: 1.3;">
            <strong>${item.quantity}x</strong> Barca ${item.type} - ${item.sizeText} 
            <span style="color: #aaa; margin-left: 4px;">(Camarão: ${item.shrimp})</span>
          </span>
          <strong style="font-size: 0.95rem; color: #22c55e; white-space: nowrap; margin-left: 10px;">${itemTotalFormatted}</strong>
        </div>
      `;
    });
  } else {
    const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
    totalItemsValue = parseFloat(barcaPriceRaw.replace("R$ ", "").replace(",", ".")) || 0;

    detItemsList.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
        <span style="font-size: 0.9rem; color: #fff; line-height: 1.3;">
          <strong>1x</strong> ${order.size} 
          <span style="color: #aaa; margin-left: 4px;">(Camarão: ${order.allowShrimp || "Sim"})</span>
        </span>
        <strong style="font-size: 0.95rem; color: #22c55e; white-space: nowrap; margin-left: 10px;">${barcaPriceRaw}</strong>
      </div>
    `;
  }

  document.getElementById("detPrice").textContent = totalItemsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
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
  
  // Destrava áudio de forma mais agressiva (Click, Toque ou Teclado)
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
    // Remove os eventos após destravar na primeira vez
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
    itemDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid rgba(255, 255, 255, 0.1);";
    
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-weight: 700; color: #fff; display: block;">Barca ${item.type} - ${item.sizeText}</span>
          <span style="font-size: 0.75rem; color: #aaa; display: block; margin-top: 2px;">Camarão: ${item.shrimp}</span>
          <span style="font-size: 0.75rem; color: #888;">Unitário: ${formattedUnitPrice}</span>
        </div>
        <button type="button" class="btn-remove-admin-item" data-index="${index}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Remover item">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; color: #aaa;">Qtd:</span>
          <button type="button" class="btn-qty-minus-admin" data-index="${index}" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
          <span style="font-weight: bold; color: #fff; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="btn-qty-plus-admin" data-index="${index}" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
        </div>
        <span style="font-size: 0.95rem; font-weight: 700; color: #22c55e;">${formattedTotal}</span>
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
    document.getElementById("addAddress").value = order.address;
    document.getElementById("addComplement").value = order.complement !== "Nenhum" ? order.complement : "";
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

  if (isEditing) {
    const orderIndex = ordersDatabase.findIndex(o => o.id === activeOrderId);
    if (orderIndex > -1) {
      ordersDatabase[orderIndex].customerName = document.getElementById("addName").value;
      ordersDatabase[orderIndex].phone = document.getElementById("addPhone").value;
      ordersDatabase[orderIndex].date = dateValue; 
      ordersDatabase[orderIndex].time = document.getElementById("addTime").value;
      ordersDatabase[orderIndex].paymentMethod = document.getElementById("addPayment").value;
      ordersDatabase[orderIndex].obs = document.getElementById("addObs").value || "Nenhuma observação informada.";
      ordersDatabase[orderIndex].address = document.getElementById("addAddress").value;
      ordersDatabase[orderIndex].complement = document.getElementById("addComplement").value || "Nenhum";
      ordersDatabase[orderIndex].freight = document.getElementById("addFreight").value;
      
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
      createdAt: `Hoje, ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      rawType: primaryType,     
      rawSize: primarySize,     
      size: combinedSizes,
      items: adminCartItems,
      allowShrimp: allowShrimpStr,
      paymentMethod: document.getElementById("addPayment").value,
      obs: document.getElementById("addObs").value || "Nenhuma observação informada.",
      address: document.getElementById("addAddress").value,
      complement: document.getElementById("addComplement").value || "Nenhum",
      status: "Pendente",
      isManual: true,
      freight: document.getElementById("addFreight").value 
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

  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="bell" style="width: 24px; height: 24px; stroke-width: 2.5;"></i>
    </div>
    <div class="toast-content">
      <h4>Novo Pedido Recebido!</h4>
      <p>${order.customerName} • ${order.time}</p>
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
    
    // Se o array novo for maior que o atual, significa que chegou pedido novo!
    if (newData.length > ordersDatabase.length) {
      const newOrder = newData[newData.length - 1]; 
      ordersDatabase = newData; 
      
      const currentFilter = document.getElementById("dateFilter").value;
      
      // Se o pedido novo for para a mesma data que o admin está visualizando, atualiza a lista
      if (newOrder.date === currentFilter) {
        renderTimeline();         
      }
      
      // Dispara o alerta sonoro e visual
      showNotification(newOrder); 
    } else {
      // Se não for maior, foi apenas uma edição ou exclusão
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
      window.location.href = "login.html";
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
  let totalRevenue = 0;
  let totalOrders = filtered.length;

  filtered.forEach(order => {
    const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
    totalRevenue += freightValue;

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const itemKey = `Barca ${item.type} - ${item.sizeText} <br><small style="color:#555;">Camarão: ${item.shrimp}</small>`;
        if (!prepList[itemKey]) prepList[itemKey] = { qtd: 0, subtotal: 0 };
        prepList[itemKey].qtd += item.quantity;
        const itemTotal = item.unitPriceNumeric * item.quantity;
        prepList[itemKey].subtotal += itemTotal;
        totalRevenue += itemTotal;
      });
    } else {
      const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
      const unitPriceNumeric = parseFloat(barcaPriceRaw.replace("R$ ", "").replace(".", "").replace(",", ".")) || 0;
      const itemKey = `Barca ${order.rawType} - ${order.rawSize} <br><small style="color:#555;">Camarão: ${order.allowShrimp || "Sim"}</small>`;
      if (!prepList[itemKey]) prepList[itemKey] = { qtd: 0, subtotal: 0 };
      prepList[itemKey].qtd += 1;
      prepList[itemKey].subtotal += unitPriceNumeric;
      totalRevenue += unitPriceNumeric;
    }
  });

  const printWindow = window.open('', '_blank');
  let itemsHtml = '';

  const sortedItems = Object.entries(prepList).sort((a, b) => b[1].qtd - a[1].qtd);

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
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f0f0f0; border-bottom: 2px solid #000; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
        th:first-child { text-align: center; width: 60px; }
        th:last-child { text-align: right; width: 120px; }
        .summary { background: #fafafa; border: 2px dashed #ccc; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; color: #333; }
        .summary-row.total { font-weight: 900; font-size: 20px; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 5px; color: #000; }
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
        <h1>Dedé Sushi</h1>
        <h2>Relatório de Produção e Fechamento</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold;">Período: ${periodLabel}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #888;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <h3 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Consolidado para a Cozinha (Itens a Produzir)</h3>
      <table>
        <thead>
          <tr>
            <th>Qtd</th>
            <th>Descrição do Item</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Total de Pedidos Validados:</span>
          <strong>${totalOrders} pedidos</strong>
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

// Chama a função ao iniciar para ajustar a cor do botão se já estiver pausado
document.addEventListener("DOMContentLoaded", () => {
  updateFreezeButtonUI();
});