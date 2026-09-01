// 0. INICIALIZAÇÃO DOS ÍCONES
if (window.lucide) lucide.createIcons();

const WHATSAPP_RESTAURANTE = "5585999999999"; 

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

// Array temporário do Carrinho de Barcas
let cartItems = [];

// --- 1. CONFIGURAÇÃO DE DATA MÍNIMA PARA HOJE ---
const todayDate = new Date();
const localISO = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
if (dateInput) {
  dateInput.min = localISO;
  dateInput.value = localISO;
}

// --- 2. PRECIFICAÇÃO DINÂMICA (TRADICIONAL VS ESPECIAL) ---
const sizesData = {
  "Tradicional": [
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 190,00 (2 pessoas)" },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 280,00 (3 a 4 pessoas)" },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 360,00 (4 a 5 pessoas)" },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 600,00 (7 a 8 pessoas)" },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 690,00 (11 a 12 pessoas)" }
  ],
  "Especial": [
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 280,00 (2 pessoas)" },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 370,00 (3 a 4 pessoas)" },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 450,00 (4 a 5 pessoas)" },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 750,00 (7 a 8 pessoas)" },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 985,00 (11 a 12 pessoas)" }
  ]
};

function updateSizeOptions() {
  if (!typeSelect || !sizeSelect) return;
  const selectedType = typeSelect.value;
  sizeSelect.innerHTML = ""; 
  
  sizesData[selectedType].forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value; 
    option.textContent = optionData.text; 
    sizeSelect.appendChild(option);
  });
}

if (typeSelect) {
  typeSelect.addEventListener("change", updateSizeOptions);
}

// --- 3. GERAÇÃO DINÂMICA DE HORÁRIOS ---
function generateTimeSlots() {
  if (!timeSelect) return;
  timeSelect.innerHTML = "";
  
  if (!dateInput || !dateInput.value) {
    timeSelect.innerHTML = '<option value="" disabled selected>Selecione a data primeiro</option>';
    return;
  }

  const selectedDate = new Date(dateInput.value + "T00:00:00");
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  const openHour = 18; 
  const closeHour = 23;

  let minHour = openHour;
  let minMinute = 0;

  if (isToday) {
    const minTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    minHour = minTime.getHours();
    minMinute = minTime.getMinutes();
  }

  let hasAvailableSlots = false;

  for (let h = openHour; h <= closeHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (isToday) {
        if (h < minHour) continue;
        if (h === minHour && m < minMinute) continue;
      }

      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const option = document.createElement("option");
      option.value = timeString;
      option.textContent = timeString;
      timeSelect.appendChild(option);
      hasAvailableSlots = true;
    }
  }

  if (!hasAvailableSlots) {
    timeSelect.innerHTML = '<option value="" disabled selected>Indisponível hoje (Min. 2h antecedência)</option>';
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
    itemDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid rgba(255, 255, 255, 0.1);";
    
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-weight: 700; color: #fff; display: block;">Barca ${item.type} - ${item.sizeText}</span>
          <span style="font-size: 0.75rem; color: #aaa; display: block; margin-top: 2px;">Camarão: ${item.shrimp}</span>
          <span style="font-size: 0.75rem; color: #888;">Unitário: ${formattedUnitPrice}</span>
        </div>
        <button type="button" class="btn-remove-item" data-index="${index}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Remover item">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; color: #aaa;">Qtd:</span>
          <button type="button" class="btn-qty-minus" data-index="${index}" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
          <span style="font-weight: bold; color: #fff; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="btn-qty-plus" data-index="${index}" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
        </div>
        <span style="font-size: 0.95rem; font-weight: 700; color: #22c55e;">${formattedItemTotal}</span>
      </div>
    `;
    cartList.appendChild(itemDiv);
  });

  const subtotalFormatted = totalSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const subtotalEl = document.getElementById("cartSubtotalValue");
  if (subtotalEl) {
    subtotalEl.textContent = subtotalFormatted;
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
        cartItems.splice(idx, 1); // Se chegar a 0, remove o item
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

// Botão Adicionar ao Pedido (Adiciona sempre 1 unidade da configuração escolhida)
if (btnAddBarca) {
  btnAddBarca.onclick = (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const shrimp = shrimpSelect.value;
    const sizeVal = sizeSelect.value;
    
    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    if (!selectedOption) return;
    
    const selectedText = selectedOption.textContent;

    const priceMatch = selectedText.match(/R\$\s?([\d.,]+)/);
    let unitPriceNumeric = 0;
    if (priceMatch) {
      unitPriceNumeric = parseFloat(priceMatch[1].replace(".", "").replace(",", ".")) || 0;
    }

    const parts = selectedText.split(" - ");
    const sizeDescription = parts.length > 1 ? `${parts[0]} - ${parts[1]}` : selectedText;

    // Verifica se já existe um item com a MESMA configuração exata
    const existingIndex = cartItems.findIndex(i => i.type === type && i.rawSize === sizeVal && i.shrimp === shrimp);

    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += 1; // Se já existe, aumenta +1
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

    const newOrder = {
      id: newId,
      customerName: document.getElementById("clientName").value,
      phone: clientPhoneInput.value,
      time: timeValue,
      date: dateInput.value,
      createdAt: `Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      rawType: primaryType,
      rawSize: primarySize,
      size: combinedSizes,
      items: cartItems,
      allowShrimp: cartItems.map(i => `${i.quantity}x ${i.shrimp}`).join(" | "),
      paymentMethod: document.getElementById("orderPayment").value,
      obs: document.getElementById("orderObs").value || "Nenhuma observação informada.",
      address: document.getElementById("clientAddress").value,
      complement: document.getElementById("clientComplement").value || "Nenhum",
      status: "Aguardando Frete", 
      isManual: false,
      freight: "" 
    };

    const existingOrders = JSON.parse(localStorage.getItem("sushiOrdersDatabase")) || [];
    existingOrders.push(newOrder);
    localStorage.setItem("sushiOrdersDatabase", JSON.stringify(existingOrders));

    // Monta a mensagem detalhada para o WhatsApp
    let barcasMessageList = "";
    let totalAcumulado = 0;
    
    cartItems.forEach((item, idx) => {
      const itemSubtotal = item.unitPriceNumeric * item.quantity;
      totalAcumulado += itemSubtotal;
      const formattedSubtotal = itemSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      barcasMessageList += `\n*${idx + 1}. ${item.quantity}x Barca ${item.type}* - ${item.sizeText}\n   Camarão: ${item.shrimp}\n   *Subtotal:* ${formattedSubtotal}\n`;
    });

    const totalFormatado = totalAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const message = `
🍣 *NOVO PEDIDO: ${newOrder.id}* 🍣
Olá! Acabei de gerar meu pedido. Poderiam me confirmar o valor do frete?

*📍 ENTREGA*
Endereço: ${newOrder.address}
Complemento: ${newOrder.complement}

*🍱 ITENS DO PEDIDO:*
${barcasMessageList}
*Total dos itens:* ${totalFormatado}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    
    // Reseta o formulário
    form.reset();
    cartItems = [];
    renderCart();
    updateSizeOptions(); 
    generateTimeSlots(); 
    
    alert("Pedido gerado! Vamos te redirecionar para o WhatsApp para confirmar o frete.");
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
    document.body.style.overflow = "hidden"; // Trava a rolagem da página
  } else {
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Checa a lotação logo que o site do cliente carrega
checkFreezeState();

// Escuta mudanças em tempo real caso o Admin aperte o botão enquanto o cliente está no site
window.addEventListener('storage', (e) => {
  if (e.key === 'sushiFreezeState') {
    checkFreezeState();
  }
});