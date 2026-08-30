// 0. INICIALIZAÇÃO DOS ÍCONES
if (window.lucide) lucide.createIcons();

const WHATSAPP_RESTAURANTE = "5585999999999"; 

// --- ELEMENTOS DO DOM ---
const dateInput = document.getElementById("orderDate");
const timeSelect = document.getElementById("orderTime");
const typeSelect = document.getElementById("orderType");
const sizeSelect = document.getElementById("orderSize");
const clientPhoneInput = document.getElementById("clientPhone");
const form = document.getElementById("orderForm");

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
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 190 (2 pessoas)" },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 280 (3 a 4 pessoas)" },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 360 (4 a 5 pessoas)" },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 600 (7 a 8 pessoas)" },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 690 (11 a 12 pessoas)" }
  ],
  "Especial": [
    { value: "Express descartável - 50 peças", text: "Express (50 peças) - R$ 280 (2 pessoas)" },
    { value: "P - 70 Peças", text: "Tamanho P (70 Peças) - R$ 370 (3 a 4 pessoas)" },
    { value: "M - 90 Peças", text: "Tamanho M (90 Peças) - R$ 450 (4 a 5 pessoas)" },
    { value: "G - 150 Peças", text: "Tamanho G (150 Peças) - R$ 750 (7 a 8 pessoas)" },
    { value: "GG - 200 Peças", text: "Tamanho GG (200 Peças) - R$ 985 (11 a 12 pessoas)" }
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

// --- 6. SALVAMENTO E ENVIO DO PEDIDO ---
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const timeValue = timeSelect.value;
    if (!timeValue) {
      alert("Por favor, selecione um horário válido.");
      return;
    }

    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const newId = `BC-${randomId}`;

    const type = typeSelect.value;
    const size = sizeSelect.value;
    const fullSizeName = `Barca ${type} - ${size}`;

    const newOrder = {
      id: newId,
      customerName: document.getElementById("clientName").value,
      phone: clientPhoneInput.value,
      time: timeValue,
      date: dateInput.value,
      createdAt: `Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      rawType: type,
      rawSize: size,
      size: fullSizeName,
      allowShrimp: document.getElementById("orderShrimp").value,
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

    // Extraindo o preço direto do texto selecionado
    const selectedText = sizeSelect.options[sizeSelect.selectedIndex].textContent; 
    const priceMatch = selectedText.match(/R\$ \d+/);
    const priceValue = priceMatch ? priceMatch[0] : "A confirmar";

    const message = `
🍣 *NOVO PEDIDO: ${newOrder.id}* 🍣
Olá! Acabei de gerar meu pedido. Poderiam me confirmar o valor do frete?

*📍 ENTREGA*
Endereço: ${newOrder.address}
Complemento: ${newOrder.complement}

*🍱 A BARCA*
Barca: ${newOrder.size}
*Valor:* ${priceValue}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    
    form.reset();
    updateSizeOptions(); 
    generateTimeSlots(); 
    
    alert("Pedido gerado! Vamos te redirecionar para o WhatsApp para confirmar o frete.");
    window.open(`https://wa.me/${WHATSAPP_RESTAURANTE}?text=${encodedMessage}`, "_blank");
  });
}