// 0. INICIALIZAÇÃO DOS ÍCONES
if (window.lucide) lucide.createIcons();

const WHATSAPP_RESTAURANTE = "5585981322120"; 

// --- ELEMENTOS DO DOM ---
const dateInput = document.getElementById("orderDate");
const timeSelect = document.getElementById("orderTime");
const typeSelect = document.getElementById("orderType");
const sizeSelect = document.getElementById("orderSize");
const shrimpSelect = document.getElementById("orderShrimp");
const qtyInput = document.getElementById("orderQty");
const clientPhoneInput = document.getElementById("clientPhone");
const form = document.getElementById("orderForm");
const btnAddBarca = document.getElementById("btnAddBarca");
const cartContainer = document.getElementById("cartContainer");
const cartList = document.getElementById("cartList");

// Elementos da modalidade de entrega/retirada
const deliveryTypeSelect = document.getElementById("deliveryType");
const addressFieldsContainer = document.getElementById("addressFieldsContainer");
const clientAddressInput = document.getElementById("clientAddress");
const pickupNotice = document.getElementById("pickupNotice");

// Array temporário do Carrinho de Barcas
let cartItems = [];

// --- CONTROLE DE ENTREGA / RETIRADA ---
if (deliveryTypeSelect) {
  deliveryTypeSelect.addEventListener("change", (e) => {
    const isPickup = e.target.value === "Retirada";
    if (isPickup) {
      addressFieldsContainer.style.display = "none";
      pickupNotice.style.display = "block";
      clientAddressInput.removeAttribute("required");
      clientAddressInput.value = "";
    } else {
      addressFieldsContainer.style.display = "block";
      pickupNotice.style.display = "none";
      clientAddressInput.setAttribute("required", "required");
    }
  });
}

// --- 1. CONFIGURAÇÃO DE DATA MÍNIMA PARA HOJE ---
const todayDate = new Date();
const localISO = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
if (dateInput) {
  dateInput.min = localISO;
  dateInput.value = localISO;
}

// --- 2. CATÁLOGO DINÂMICO VINDO DO LOCALSTORAGE ---
const DEFAULT_CLIENT_CATALOG = {
  "Tradicional": [
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 190,00 (2 pessoas)", price: 190 },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 280,00 (3 a 4 pessoas)", price: 280 },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 360,00 (4 a 5 pessoas)", price: 360 },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 600,00 (7 a 8 pessoas)", price: 600 },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 690,00 (11 a 12 pessoas)", price: 690 }
  ],
  "Especial": [
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 280,00 (2 pessoas)", price: 280 },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 370,00 (3 a 4 pessoas)", price: 370 },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 450,00 (4 a 5 pessoas)", price: 450 },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 750,00 (7 a 8 pessoas)", price: 750 },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 985,00 (11 a 12 pessoas)", price: 985 }
  ]
};

function getClientCatalog() {
  const saved = localStorage.getItem("sushiProductsCatalog");
  return saved ? JSON.parse(saved) : DEFAULT_CLIENT_CATALOG;
}

function updateSizeOptions() {
  if (!typeSelect || !sizeSelect) return;
  const catalog = getClientCatalog();
  const availableTypes = Object.keys(catalog);

  if (availableTypes.length === 0) return;

  // Mantém o tipo selecionado válido
  let currentSelectedType = typeSelect.value;
  if (!availableTypes.includes(currentSelectedType)) {
    currentSelectedType = availableTypes[0];
  }

  typeSelect.innerHTML = "";
  availableTypes.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    if (t === currentSelectedType) opt.selected = true;
    typeSelect.appendChild(opt);
  });

  const selectedType = typeSelect.value;
  sizeSelect.innerHTML = ""; 
  
  const options = catalog[selectedType] || [];
  options.forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value;

    // Converte e formata o preço se existir numericamente
    let priceFormatted = "";
    if (typeof optionData.price === "number" && !isNaN(optionData.price)) {
      priceFormatted = optionData.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    // Se o texto não contiver "R$", anexa o valor em Real
    let label = optionData.text || optionData.value;
    if (priceFormatted && !label.includes("R$")) {
      label = `${label} - ${priceFormatted}`;
    }

    option.textContent = label;

    // Salva o preço direto no dataset para o cálculo não quebrar
    if (typeof optionData.price === "number" && !isNaN(optionData.price)) {
      option.dataset.price = optionData.price;
    }

    sizeSelect.appendChild(option);
  });
}

if (typeSelect) {
  typeSelect.addEventListener("change", updateSizeOptions);
}

// Escuta alterações feitas no Admin em tempo real
window.addEventListener("storage", (e) => {
  if (e.key === "sushiProductsCatalog") {
    updateSizeOptions();
  }
});

// --- 3. GERAÇÃO DINÂMICA DE HORÁRIOS (BLOQUEIA APENAS HORÁRIOS EXATOS JÁ AGENDADOS) ---
function generateTimeSlots() {
  if (!timeSelect) return;
  timeSelect.innerHTML = "";
  
  if (!dateInput || !dateInput.value) {
    timeSelect.innerHTML = '<option value="" disabled selected>Selecione a data primeiro</option>';
    return;
  }

  const selectedDateString = dateInput.value;
  const selectedDate = new Date(selectedDateString + "T00:00:00");
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  const openHour = 15; 
  const closeHour = 23;

  let minHour = openHour;
  let minMinute = 0;

  if (isToday) {
    minHour = now.getHours();
    minMinute = now.getMinutes();
  }

  const existingOrders = JSON.parse(localStorage.getItem("sushiOrdersDatabase")) || [];
  const ordersOnDate = existingOrders.filter(o => o.date === selectedDateString && o.status !== "Cancelado");
  const bookedTimes = ordersOnDate.map(o => o.time);

  let hasAvailableSlots = false;
  timeSelect.innerHTML = '<option value="" disabled selected>Escolha o horário</option>';

  for (let h = openHour; h <= closeHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (isToday) {
        if (h < minHour) continue;
        if (h === minHour && m < minMinute) continue;
      }

      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const option = document.createElement("option");
      option.value = timeString;
      
      if (bookedTimes.includes(timeString)) {
        option.textContent = `${timeString} (Esgotado)`;
        option.disabled = true;
        option.style.color = "#ef4444";
      } else {
        option.textContent = timeString;
        hasAvailableSlots = true;
      }
      
      timeSelect.appendChild(option);
    }
  }

  if (!hasAvailableSlots) {
    timeSelect.innerHTML = '<option value="" disabled selected>Horários encerrados para hoje</option>';
  }
}

if (dateInput) {
  dateInput.addEventListener("change", generateTimeSlots);
}

// --- 4. MÁSCARA DE TELEFONE ---
if (clientPhoneInput) {
  clientPhoneInput.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, ""); 
    if (v.length > 11) v = v.slice(0, 11);     
    let formatted = v;
    if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    e.target.value = formatted;
  });
}

// --- 5. INICIALIZAÇÃO IMEDIATA DAS LISTAS ---
updateSizeOptions();
generateTimeSlots();

// --- 6. LÓGICA DO CARRINHO (COM CONTROLE DE QUANTIDADE +/-) ---
function renderCart() {
  if (!cartList || !cartContainer) return;
  
  if (cartItems.length === 0) {
    cartContainer.style.display = "none";
    cartList.innerHTML = "";
    return;
  }

  cartContainer.style.display = "flex";
  cartList.innerHTML = "";

  let totalSubtotal = 0;

  cartItems.forEach((item, index) => {
    const itemTotal = item.unitPriceNumeric * item.quantity;
    totalSubtotal += itemTotal;

    const formattedItemTotal = itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedUnitPrice = item.unitPriceNumeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const itemDiv = document.createElement("div");
    itemDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: var(--input-bg, #f1f5f9); padding: 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid var(--c-700, #e2e8f0);";
    
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-weight: 800; color: #0f172a; display: block; font-size: 0.95rem;">Barca ${item.type} - ${item.sizeText}</span>
          <span style="font-size: 0.8rem; color: #64748b; display: block; margin-top: 2px;">Camarão: <strong>${item.shrimp}</strong></span>
          <span style="font-size: 0.8rem; color: #64748b;">Unitário: ${formattedUnitPrice}</span>
        </div>
        <button type="button" class="btn-remove-item" data-index="${index}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Remover item">
          <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--c-700, #e2e8f0); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Qtd:</span>
          <button type="button" class="btn-qty-minus" data-index="${index}" style="background: #ffffff; border: 1px solid var(--c-700, #e2e8f0); color: #0f172a; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">-</button>
          <span style="font-weight: 800; color: #0f172a; min-width: 22px; text-align: center;">${item.quantity}</span>
          <button type="button" class="btn-qty-plus" data-index="${index}" style="background: #ffffff; border: 1px solid var(--c-700, #e2e8f0); color: #0f172a; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">+</button>
        </div>
        <span style="font-size: 1rem; font-weight: 800; color: #16a34a;">${formattedItemTotal}</span>
      </div>
    `;
    cartList.appendChild(itemDiv);
  });

  const subtotalFormatted = totalSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const subtotalEl = document.getElementById("cartSubtotalValue");
  
  if (subtotalEl) {
    subtotalEl.textContent = subtotalFormatted;
    subtotalEl.style.color = "#16a34a";
    
    const cartTotalBox = document.getElementById("cartTotalBox");
    if (cartTotalBox) {
      cartTotalBox.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: var(--input-bg, #f1f5f9); padding: 12px 14px; border-radius: 8px; margin-top: 6px; border: 1px solid var(--c-700, #e2e8f0);";
      
      const labelSpan = cartTotalBox.querySelector("span");
      if (labelSpan) {
        labelSpan.style.cssText = "font-size: 0.95rem; font-weight: 800; color: var(--text-main, #0f172a);";
      }
    }
  }

  if (window.lucide) lucide.createIcons();

  // Ações de Remover
  document.querySelectorAll(".btn-remove-item").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      cartItems.splice(idx, 1);
      renderCart();
    };
  });

  // Ações de Diminuir Quantidade (-)
  document.querySelectorAll(".btn-qty-minus").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      if (cartItems[idx].quantity > 1) {
        cartItems[idx].quantity -= 1;
      } else {
        cartItems.splice(idx, 1);
      }
      renderCart();
    };
  });

  // Ações de Aumentar Quantidade (+)
  document.querySelectorAll(".btn-qty-plus").forEach(btn => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      cartItems[idx].quantity += 1;
      renderCart();
    };
  });
}

// Botão Adicionar ao Pedido
if (btnAddBarca) {
  btnAddBarca.onclick = (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const shrimp = shrimpSelect.value;
    const sizeVal = sizeSelect.value;
    
    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    if (!selectedOption) return;
    
    const selectedText = selectedOption.textContent;

    // Prioriza dataset.price vindo do catálogo dinâmico
    let unitPriceNumeric = parseFloat(selectedOption.dataset.price);
    if (isNaN(unitPriceNumeric)) {
      const priceMatch = selectedText.match(/R\$\s?([\d.,]+)/);
      if (priceMatch) {
        unitPriceNumeric = parseFloat(priceMatch[1].replace(/\./g, "").replace(",", ".")) || 0;
      } else {
        unitPriceNumeric = 0;
      }
    }

    const parts = selectedText.split(" - ");
    const sizeDescription = parts.length > 1 ? `${parts[0]} - ${parts[1]}` : selectedText;

    const existingIndex = cartItems.findIndex(i => i.type === type && i.rawSize === sizeVal && i.shrimp === shrimp);

    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += 1;
    } else {
      cartItems.push({
        type: type,
        shrimp: shrimp,
        rawSize: sizeVal,
        sizeText: sizeDescription,
        quantity: 1,
        unitPriceNumeric: unitPriceNumeric
      });
    }

    renderCart();
  };
}

// --- 7. SALVAMENTO E ENVIO DO PEDIDO ---
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Por favor, adicione pelo menos uma barca ao pedido antes de enviar.");
      return;
    }

    const timeValue = timeSelect.value;
    if (!timeValue) {
      alert("Por favor, selecione um horário válido.");
      return;
    }

    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const newId = `BC-${randomId}`;

    const combinedSizes = cartItems.map(i => `${i.quantity}x ${i.type} (${i.sizeText})`).join(" + ");
    const primaryType = cartItems[0].type;
    const primarySize = cartItems[0].rawSize;

    const deliveryType = deliveryTypeSelect ? deliveryTypeSelect.value : "Entrega";
    const addressVal = deliveryType === "Retirada" ? "Retirada no Balcão" : document.getElementById("clientAddress").value;
    const complementVal = deliveryType === "Retirada" ? "N/A" : (document.getElementById("clientComplement").value || "Nenhum");

    const newOrder = {
      id: newId,
      customerName: document.getElementById("clientName").value,
      phone: clientPhoneInput.value,
      time: timeValue,
      date: dateInput.value,
      createdAt: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rawType: primaryType,
      rawSize: primarySize,
      size: combinedSizes,
      items: cartItems,
      allowShrimp: cartItems.map(i => `${i.quantity}x ${i.shrimp}`).join(" | "),
      paymentMethod: document.getElementById("orderPayment").value,
      obs: document.getElementById("orderObs").value || "Nenhuma observação informada.",
      
      deliveryType: deliveryType,
      address: addressVal,
      complement: complementVal,
      freight: deliveryType === "Retirada" ? "0,00" : "", 
      
      status: deliveryType === "Retirada" ? "Pendente" : "Aguardando Frete", 
      isManual: false
    };

    const existingOrders = JSON.parse(localStorage.getItem("sushiOrdersDatabase")) || [];
    existingOrders.push(newOrder);
    localStorage.setItem("sushiOrdersDatabase", JSON.stringify(existingOrders));

    let barcasMessageList = "";
    let totalAcumulado = 0;
    
    cartItems.forEach((item, idx) => {
      const itemSubtotal = item.unitPriceNumeric * item.quantity;
      totalAcumulado += itemSubtotal;
      const formattedSubtotal = itemSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      barcasMessageList += `\n*${idx + 1}. ${item.quantity}x Barca ${item.type}* - ${item.sizeText}\n   Camarão: ${item.shrimp}\n   *Subtotal:* ${formattedSubtotal}\n`;
    });

    const totalFormatado = totalAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const deliverySectionText = deliveryType === "Retirada"
      ? `*📍 RETIRADA*\nAgendado para retirada no balcão.`
      : `*📍 ENTREGA*\nEndereço: ${newOrder.address}\nComplemento: ${newOrder.complement}`;

    const confirmationQuestion = deliveryType === "Retirada"
      ? "o agendamento"
      : "o valor do frete";

    const message = `
🍣 *NOVO PEDIDO: ${newOrder.id}* 🍣
Olá! Acabei de gerar meu pedido. Poderiam me confirmar ${confirmationQuestion}?

*Tipo de Recebimento:* ${deliveryType}
${deliverySectionText}

*🍱 ITENS DO PEDIDO:*
${barcasMessageList}
*Total dos itens:* ${totalFormatado}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    
    form.reset();
    cartItems = [];
    renderCart();
    updateSizeOptions(); 
    generateTimeSlots(); 
    
    if (addressFieldsContainer) addressFieldsContainer.style.display = "block";
    if (pickupNotice) pickupNotice.style.display = "none";
    if (clientAddressInput) clientAddressInput.setAttribute("required", "required");
    
    alert("Pedido gerado! Vamos te redirecionar para o WhatsApp.");
    window.open(`https://wa.me/${WHATSAPP_RESTAURANTE}?text=${encodedMessage}`, "_blank");
  });
}

// --- VERIFICAÇÃO DE LOTAÇÃO / CONGELAMENTO DE PEDIDOS ---
function checkFreezeState() {
  const overlay = document.getElementById("freezeOverlay");
  if (!overlay) return;
  
  const isFrozen = localStorage.getItem("sushiFreezeState") === "true";
  
  if (isFrozen) {
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  } else {
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

checkFreezeState();

window.addEventListener('storage', (e) => {
  if (e.key === 'sushiFreezeState') {
    checkFreezeState();
  }
});