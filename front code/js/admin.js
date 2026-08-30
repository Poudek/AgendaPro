// Constante com dados iniciais de teste (caso o banco esteja vazio)
const defaultFakeData = [
  { id: "BC-1041", customerName: "Rodrigo Alencar", phone: "(85) 99123-4567", time: "18:30", date: "2026-08-28", createdAt: "Hoje, 10:15", rawType: "Especial", rawSize: "G - 150 Peças", size: "Barca Especial - G - 150 Peças", allowShrimp: "Sim, liberado", paymentMethod: "Pix", obs: "Caprichar no salmão", address: "Rua Barbosa, 1420", complement: "Apto 802", status: "Pronto", isManual: true }
];

// Carrega do localStorage OU usa os falsos se estiver vazio
let ordersDatabase = JSON.parse(localStorage.getItem("sushiOrdersDatabase"));

if (!ordersDatabase || ordersDatabase.length === 0) {
  ordersDatabase = defaultFakeData;
  localStorage.setItem("sushiOrdersDatabase", JSON.stringify(ordersDatabase));
}

// Função utilitária para salvar qualquer alteração de volta no banco
function saveDatabase() {
  localStorage.setItem("sushiOrdersDatabase", JSON.stringify(ordersDatabase));
}

let activeOrderId = null;

// Calcula o preço baseado no tipo e tamanho
function getOrderPrice(type, size) {
  if (!type || !size) return "--";
  
  if (type === "Tradicional") {
    if (size.includes("50")) return "R$ 190";
    if (size.includes("70")) return "R$ 280";
    if (size.includes("90")) return "R$ 360";
    if (size.includes("150")) return "R$ 600";
    if (size.includes("200")) return "R$ 690";
  } 
  
  if (type === "Especial") {
    if (size.includes("50")) return "R$ 280";
    if (size.includes("70")) return "R$ 370";
    if (size.includes("90")) return "R$ 450";
    if (size.includes("150")) return "R$ 750";
    if (size.includes("200")) return "R$ 985";
  }
  
  return "A conferir";
}

// Elementos DOM
const ordersList = document.getElementById("ordersList");
const emptyDetails = document.getElementById("emptyDetails");
const activeDetails = document.getElementById("activeDetails");
const btnCancelOrder = document.getElementById("btnCancelOrder");
const btnAdvanceStatus = document.getElementById("btnAdvanceStatus");

// A função de métricas agora recebe a lista filtrada do dia
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
  
  // Pega a data selecionada no topo da tela
  const selectedDate = document.getElementById("dateFilter").value;
  
  // Filtra o banco de dados para mostrar APENAS os pedidos dessa data
  const filteredOrders = ordersDatabase.filter(order => order.date === selectedDate);
  
  // Atualiza as métricas no topo apenas com os dados do dia
  updateMetrics(filteredOrders);

  // Se não houver pedidos no dia selecionado
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

  // Pegando a data de hoje para comparar
  const todayISO = new Date().toISOString().split("T")[0];

  // Renderiza os cards filtrados
  filteredOrders.sort((a, b) => a.time.localeCompare(b.time)).forEach(order => {
    const card = document.createElement("div");
    
    let statusClass = "status-pendente";
    // Adicione nas verificações de if (order.status === ...)
    if (order.status === "Aguardando Frete") statusClass = "status-aguardando";
    if (order.status === "Em Preparo") statusClass = "status-preparo";
    if (order.status === "Pronto") statusClass = "status-pronto";
    if (order.status === "Entregue") statusClass = "status-entregue"; 
    if (order.status === "Cancelado") statusClass = "status-cancelado";

    const manualTag = order.isManual 
      ? `<span class="manual-badge" title="Adicionado Manualmente pelo Painel"><i data-lucide="edit-3" class="icon-xs"></i> Manual</span>` 
      : "";

    // LÓGICA DA DATA NO CARD
    const dateSplit = order.date.split("-");
    const formattedDate = `${dateSplit[2]}/${dateSplit[1]}`;
    const isToday = order.date === todayISO;
    
    // Se for de outro dia, fica amarelo/laranja. Se for hoje, fica cinza neutro.
    const dateColor = isToday ? "var(--text-muted)" : "var(--warning)";
    const dateWeight = isToday ? "500" : "800";

    card.className = `timeline-card ${order.id === activeOrderId ? "selected" : ""}`;
    card.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; line-height: 1.1;">
        <span class="card-time">${order.time}</span>
        <span style="font-size: 0.75rem; color: ${dateColor}; font-weight: ${dateWeight}; margin-top: 4px;">${formattedDate}</span>
      </div>
      
      <div class="card-meta">
        <div class="card-client">${order.customerName}</div>
        <div class="card-details">${order.size}</div>
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

  // Preenchendo os dados de texto
  document.getElementById("detId").textContent = `#${order.id}`;
  document.getElementById("detCreatedAt").innerHTML = `<i data-lucide="clock-3" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Agendado em: ${order.createdAt}`;
  document.getElementById("detCustomerName").textContent = order.customerName;
  document.getElementById("detTime").textContent = order.time;
  document.getElementById("detSize").textContent = order.size;
  document.getElementById("detShrimp").textContent = order.allowShrimp;
  document.getElementById("detPaymentMethod").textContent = order.paymentMethod || "--";
  document.getElementById("detPrice").textContent = getOrderPrice(order.rawType, order.rawSize);
  // Lógica de Preço, Frete e Total
  const barcaPriceRaw = getOrderPrice(order.rawType, order.rawSize);
  document.getElementById("detPrice").textContent = barcaPriceRaw;
  
  const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
  document.getElementById("detFreight").textContent = freightValue > 0 ? `R$ ${freightValue.toFixed(2).replace('.', ',')}` : "Aguardando cálculo";

  // Extrai o número do valor da barca (ex: de "R$ 190" tira "190")
  const barcaNumber = parseFloat(barcaPriceRaw.replace(/[^\d]/g, "")) || 0;
  
  if (freightValue > 0 && barcaNumber > 0) {
    const total = barcaNumber + freightValue;
    document.getElementById("detTotal").textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById("btnSendFreight").style.display = "flex"; // Mostra o botão
  } else {
    document.getElementById("detTotal").textContent = "--";
    document.getElementById("btnSendFreight").style.display = "none"; // Esconde se não tiver frete ainda
  }
  document.getElementById("detObs").textContent = order.obs;
  document.getElementById("detPhone").textContent = order.phone;
  document.getElementById("detAddress").textContent = order.address;
  document.getElementById("detComplement").textContent = order.complement;

  // Atualizando as cores e estados visuais do Badge e dos Botões
  const badge = document.getElementById("detStatusBadge");
  badge.textContent = order.status;
  badge.className = "status-tag"; // Reseta classes
  
  if (order.status === "Pendente") badge.classList.add("status-pendente");
  if (order.status === "Em Preparo") badge.classList.add("status-preparo");
  if (order.status === "Pronto") badge.classList.add("status-pronto");
  if (order.status === "Entregue") badge.classList.add("status-entregue");
  if (order.status === "Cancelado") badge.classList.add("status-cancelado");
  if (order.status === "Aguardando Frete") badge.classList.add("status-aguardando");
  // Regras visuais para Cancelamento
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

// --- Event Listeners (Fora da função selectOrder) ---

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

btnAdvanceStatus.addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (!order || order.status === "Cancelado") return;
  
  let newStatus = "";
  let statusMessage = "";

  // Define o novo status e a mensagem correspondente
  if (order.status === "Aguardando Frete") {
    newStatus = "Pendente";
  } 
  else if (order.status === "Pendente") {
    newStatus = "Em Preparo";
    statusMessage = `🍣 Olá, ${order.customerName.split(' ')[0]}! O seu pedido *#${order.id}* acaba de entrar *Em Preparo* na nossa cozinha. Caprichando por aqui! 🔪✨`;
  } 
  else if (order.status === "Em Preparo") {
    newStatus = "Pronto";
    statusMessage = `✅ Olá, ${order.customerName.split(' ')[0]}! Sua barca (Pedido *#${order.id}*) está *Pronta*! Já estamos embalando e organizando a sua entrega. 🛵💨`;
  } 
  else if (order.status === "Pronto") {
    newStatus = "Entregue";
    statusMessage = `🛵 O seu pedido *#${order.id}* acabou de sair para entrega (ou foi retirado)! Muito obrigado por escolher o Dedé Sushi. Bom apetite! 🍣🥢`;
  } 
  else if (order.status === "Entregue") {
    newStatus = "Aguardando Frete"; // Reinicia o ciclo (opcional)
  }

  // Atualiza o banco de dados
  order.status = newStatus;
  saveDatabase(); 
  selectOrder(order.id);

  // Se houver uma mensagem configurada para esse status, cria o pop-up de confirmação
  if (statusMessage) {
    // Timeout pequeno apenas para garantir que a tela atualize o visual antes do alerta aparecer
    setTimeout(() => {
      const wantToSend = confirm(`O status mudou para "${newStatus}". Deseja enviar um aviso automático no WhatsApp do cliente?`);
      
      if (wantToSend) {
        const encodedMessage = encodeURIComponent(statusMessage);
        window.open(`https://wa.me/55${order.phone.replace(/\D/g, "")}?text=${encodedMessage}`, "_blank");
      }
    }, 100);
  }
});

// Inicialização da página
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o calendário novo primeiro
  initDatePicker();
  
  // Define a data de hoje no calendário
  const today = new Date().toISOString().split("T")[0];
  datePickerInstance.setDate(today);
  
  renderTimeline();
  if (ordersDatabase.length > 0) selectOrder(ordersDatabase[0].id);
});

// --- INICIALIZAÇÃO DO CALENDÁRIO CUSTOMIZADO ---
let datePickerInstance;

function initDatePicker() {
  datePickerInstance = flatpickr("#dateFilter", {
    locale: "pt",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
      // Quando o usuário escolhe uma data, atualiza a tela
      activeOrderId = null;
      activeDetails.classList.add("hidden");
      emptyDetails.style.display = "flex";
      renderTimeline();
    },
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      // Pega a data desenhada no calendário no formato YYYY-MM-DD
      const dateStrFormat = flatpickr.formatDate(dayElem.dateObj, "Y-m-d");
      
      // Verifica se existe algum pedido nessa data
      const hasOrder = ordersDatabase.some(order => order.date === dateStrFormat);
      
      // Se tiver pedido, injeta o dot vermelho
      if (hasOrder) {
        dayElem.innerHTML += '<span class="has-order-dot"></span>';
      }
    }
  });
}

// --- LÓGICA DO MODAL (NOVO / EDITAR PEDIDO) ---

const modalOverlay = document.getElementById("newOrderModal");
const btnNewOrder = document.getElementById("btnNewOrder");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const newOrderForm = document.getElementById("newOrderForm");
const btnEditOrder = document.getElementById("btnEditOrder"); 

const modalTitle = document.querySelector("#newOrderModal .modal-header h2");
const modalSubmitBtn = document.querySelector("#newOrderForm button[type='submit']");
let isEditing = false;

function openModal() {
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  newOrderForm.reset();
}

// 1. ABRIR MODAL: NOVO PEDIDO (Vazio)
if (btnNewOrder) {
  btnNewOrder.addEventListener("click", () => {
    isEditing = false;
    modalTitle.innerHTML = `<i data-lucide="plus-circle" class="icon-sm text-primary"></i> Adicionar Pedido Manual`;
    modalSubmitBtn.textContent = "Salvar Pedido";
    
    // Já preenche o input de data com a data atual do filtro para facilitar
    document.getElementById("addDate").value = document.getElementById("dateFilter").value;
    
    openModal();
    if (window.lucide) lucide.createIcons();
  });
}

// 2. ABRIR MODAL: EDITAR PEDIDO (Preenchido)
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
    document.getElementById("addDate").value = order.date; // <--- Puxa a data do pedido
    document.getElementById("addTime").value = order.time;
    document.getElementById("addObs").value = order.obs !== "Nenhuma observação informada." ? order.obs : "";
    document.getElementById("addFreight").value = order.freight || "";
    
    if (order.paymentMethod) document.getElementById("addPayment").value = order.paymentMethod;
    if (order.allowShrimp) document.getElementById("addShrimp").value = order.allowShrimp;
    if (order.rawType) document.getElementById("addType").value = order.rawType;
    if (order.rawSize) document.getElementById("addSize").value = order.rawSize;

    openModal();
    if (window.lucide) lucide.createIcons();
  });
}

// Fechar Modal
btnCloseModal.addEventListener("click", closeModal);
btnCancelModal.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// 3. SUBMETER FORMULÁRIO (CRIAR OU ATUALIZAR)
newOrderForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("addType").value;
  const size = document.getElementById("addSize").value;
  const fullSizeName = `Barca ${type} - ${size}`;
  const dateValue = document.getElementById("addDate").value; // <--- Pega a nova data digitada

  if (isEditing) {
    // ATUALIZAR PEDIDO EXISTENTE
    const orderIndex = ordersDatabase.findIndex(o => o.id === activeOrderId);
    if (orderIndex > -1) {
      ordersDatabase[orderIndex].customerName = document.getElementById("addName").value;
      ordersDatabase[orderIndex].phone = document.getElementById("addPhone").value;
      ordersDatabase[orderIndex].date = dateValue; // <--- Atualiza a data
      ordersDatabase[orderIndex].time = document.getElementById("addTime").value;
      ordersDatabase[orderIndex].rawType = type; 
      ordersDatabase[orderIndex].rawSize = size; 
      ordersDatabase[orderIndex].size = fullSizeName;
      ordersDatabase[orderIndex].allowShrimp = document.getElementById("addShrimp").value;
      ordersDatabase[orderIndex].paymentMethod = document.getElementById("addPayment").value;
      ordersDatabase[orderIndex].obs = document.getElementById("addObs").value || "Nenhuma observação informada.";
      ordersDatabase[orderIndex].address = document.getElementById("addAddress").value;
      ordersDatabase[orderIndex].complement = document.getElementById("addComplement").value || "Nenhum";
      ordersDatabase[orderIndex].freight = document.getElementById("addFreight").value;
    }
    
    saveDatabase(); 
    closeModal();
    
    // Muda a visualização para o dia que foi selecionado na edição
    document.getElementById("dateFilter").value = dateValue; 
    
    renderTimeline();
    selectOrder(activeOrderId);

  } else {
    // CRIAR NOVO PEDIDO
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const newId = `BC-${randomId}`;
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: newId,
      customerName: document.getElementById("addName").value,
      phone: document.getElementById("addPhone").value,
      time: document.getElementById("addTime").value,
      date: dateValue, // <--- Usa a data digitada
      createdAt: `Hoje, ${timeString}`,
      rawType: type,     
      rawSize: size,     
      size: fullSizeName,
      allowShrimp: document.getElementById("addShrimp").value,
      paymentMethod: document.getElementById("addPayment").value,
      obs: document.getElementById("addObs").value || "Nenhuma observação informada.",
      address: document.getElementById("addAddress").value,
      complement: document.getElementById("addComplement").value || "Nenhum",
      status: "Pendente",
      isManual: true
    };

    ordersDatabase.push(newOrder);
    saveDatabase(); 
    closeModal();
    
    // Muda a visualização para o dia em que o pedido foi criado
    document.getElementById("dateFilter").value = dateValue; 
    
    renderTimeline();
    selectOrder(newId);
  }
});

// --- MÁSCARA DE TELEFONE ---
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

// --- MÁSCARA DE MOEDA (FRETE) ---
const freightInput = document.getElementById("addFreight");
if (freightInput) {
  freightInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    
    if (value === "") {
      e.target.value = "";
      return;
    }
    
    // Converte para decimal (ex: 1500 vira 15.00) e troca o ponto por vírgula
    value = (parseInt(value, 10) / 100).toFixed(2);
    e.target.value = value.replace(".", ",");
  });
}

// --- SISTEMA DE NOTIFICAÇÃO EM TEMPO REAL ---

// Função que cria e exibe o pop-up na tela
function showNotification(order) {
  // 1. Tocar Áudio
  const audio = document.getElementById("notificationSound");
  if (audio) {
    audio.currentTime = 0; // Reseta o áudio caso toque duas vezes rápido
    audio.play().catch(err => console.log("Áudio bloqueado pelo navegador até o usuário clicar na tela."));
  }

  // 2. Criar Pop-up Visual
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

  // Faz o pop-up sumir automaticamente após 6 segundos
  setTimeout(() => {
    toast.classList.add("hiding");
    toast.addEventListener("animationend", () => toast.remove());
  }, 6000);
}

// 3. O "Ouvinte" que percebe quando o cliente salva um pedido lá no localStorage
window.addEventListener('storage', (e) => {
  if (e.key === 'sushiOrdersDatabase') {
    const newData = JSON.parse(e.newValue) || [];
    
    // Verifica se a lista nova é maior que a atual (ou seja, um pedido novo chegou)
    if (newData.length > ordersDatabase.length) {
      const newOrder = newData[newData.length - 1]; 
      
      ordersDatabase = newData; 
      
      // Checa se o novo pedido é para o dia atual do filtro. Se não for, não muda o foco, apenas notifica.
      const currentFilter = document.getElementById("dateFilter").value;
      if(newOrder.date === currentFilter) {
          renderTimeline();         
      }
      
      showNotification(newOrder); 
    } else {
      // Se só houve uma edição (sem aumentar o número de pedidos), apenas atualiza a tela
      ordersDatabase = newData;
      renderTimeline();
    }
  }
});

document.getElementById("btnSendFreight").addEventListener("click", () => {
  const order = ordersDatabase.find(o => o.id === activeOrderId);
  if (!order) return;

  const barcaPrice = getOrderPrice(order.rawType, order.rawSize);
  const freightValue = parseFloat(String(order.freight).replace(',', '.')) || 0;
  const barcaNumber = parseFloat(barcaPrice.replace(/[^\d]/g, "")) || 0;
  const total = barcaNumber + freightValue;

  const msg = `
✅ *O Frete do seu pedido foi calculado!*
Pedido: #${order.id}

*Valor da Barca:* ${barcaPrice}
*Taxa de Entrega:* R$ ${freightValue.toFixed(2).replace('.', ',')}
*TOTAL:* R$ ${total.toFixed(2).replace('.', ',')}

Forma de pagamento escolhida: *${order.paymentMethod}*

Podemos confirmar o seu agendamento para as *${order.time}*? 
👉 *Responda SIM ou NÃO*
  `.trim();

  window.open(`https://wa.me/55${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
});

// --- LÓGICA DE LOGOUT ---
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    const confirmLogout = confirm("Deseja realmente sair do painel?");
    if (confirmLogout) {
      localStorage.removeItem("sushiAdminLoggedIn"); // Apaga a chave de acesso
      window.location.href = "login.html"; // Redireciona pro login
    }
  });
}