lucide.createIcons();

const WHATSAPP_RESTAURANTE = "5585999999999"; 
const dateInput = document.getElementById("orderDate");
const timeSelect = document.getElementById("orderTime");

// 1. LIMITA A DATA MÍNIMA PARA HOJE
const todayDate = new Date();
// Ajuste de fuso horário local para evitar bugs na virada da noite
const localISO = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
dateInput.min = localISO;
dateInput.value = localISO;

// 2. GERAÇÃO DINÂMICA DE HORÁRIOS (Intervalos de 30 min com trava de 2h)
function generateTimeSlots() {
  timeSelect.innerHTML = "";
  
  if (!dateInput.value) {
    timeSelect.innerHTML = '<option value="" disabled selected>Selecione a data primeiro</option>';
    return;
  }

  const selectedDate = new Date(dateInput.value + "T00:00:00");
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  // Defina aqui o horário de funcionamento (ex: das 18h às 23h30)
  const openHour = 18; 
  const closeHour = 23;

  let minHour = openHour;
  let minMinute = 0;

  // --- PRECIFICAÇÃO DINÂMICA (TRADICIONAL VS ESPECIAL) ---
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

const typeSelect = document.getElementById("orderType");
const sizeSelect = document.getElementById("orderSize");
    const selectedText = sizeSelect.options[sizeSelect.selectedIndex].textContent;
const priceMatch = selectedText.match(/R\$ \d+/);
    const priceValue = priceMatch ? priceMatch[0] : "A confirmar";

function updateSizeOptions() {
  const selectedType = typeSelect.value;
  sizeSelect.innerHTML = ""; // Limpa as opções antigas
  
  sizesData[selectedType].forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value; // Mantém o valor limpo para o banco de dados (ex: "P - 70 Peças")
    option.textContent = optionData.text; // Mostra o preço e capacidade para o cliente
    sizeSelect.appendChild(option);
  });
}

// Escuta quando o cliente muda entre Tradicional e Especial
typeSelect.addEventListener("change", updateSizeOptions);

// Roda uma vez na inicialização para preencher a primeira lista
updateSizeOptions();

  // Se for hoje, adiciona trava de 2 horas a partir de AGORA
  if (isToday) {
    const minTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    minHour = minTime.getHours();
    minMinute = minTime.getMinutes();
  }

  let hasAvailableSlots = false;

  for (let h = openHour; h <= closeHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      
      // Validação: Pula horários que já passaram ou que estão dentro do bloqueio de 2h
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

// Atualiza os horários sempre que a data mudar, e também na inicialização
dateInput.addEventListener("change", generateTimeSlots);
generateTimeSlots();

// --- MÁSCARA DE TELEFONE ---
const phoneInput = document.getElementById("clientPhone");
phoneInput.addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  let formatted = v;
  if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  e.target.value = formatted;
});

// --- SALVAMENTO E ENVIO DO PEDIDO ---
const form = document.getElementById("orderForm");

// --- SALVAMENTO E ENVIO DO PEDIDO ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const timeValue = document.getElementById("orderTime").value;
  if (!timeValue) {
    alert("Por favor, selecione um horário válido.");
    return;
  }

  const randomId = Math.floor(Math.random() * 9000) + 1000;
  const newId = `BC-${randomId}`;

  const type = document.getElementById("orderType").value;
  const size = document.getElementById("orderSize").value;
  const fullSizeName = `Barca ${type} - ${size}`;

  const newOrder = {
    id: newId,
    customerName: document.getElementById("clientName").value,
    phone: document.getElementById("clientPhone").value,
    time: timeValue,
    date: document.getElementById("orderDate").value,
    createdAt: `Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    rawType: type,
    rawSize: size,
    size: fullSizeName,
    allowShrimp: document.getElementById("orderShrimp").value,
    paymentMethod: document.getElementById("orderPayment").value,
    obs: document.getElementById("orderObs").value || "Nenhuma observação informada.",
    address: document.getElementById("clientAddress").value,
    complement: document.getElementById("clientComplement").value || "Nenhum",
    status: "Aguardando Frete", // <--- MUDANÇA AQUI
    isManual: false,
    freight: "" // <--- NOVO CAMPO VAZIO
  };

  const existingOrders = JSON.parse(localStorage.getItem("sushiOrdersDatabase")) || [];
  existingOrders.push(newOrder);
  localStorage.setItem("sushiOrdersDatabase", JSON.stringify(existingOrders));

  const dateSplit = newOrder.date.split("-");
  const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;

  // Pegando o valor da barca
  const sizeSelect = document.getElementById("orderSize");
  const selectedText = sizeSelect.options[sizeSelect.selectedIndex].textContent; 
  const priceMatch = selectedText.match(/R\$ \d+/);
  const priceValue = priceMatch ? priceMatch[0] : "A confirmar";

  // Nova mensagem focada em pedir o frete
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
  generateTimeSlots(); 
  
  alert("Pedido gerado! Vamos te redirecionar para o WhatsApp para confirmar o frete.");
  window.open(`https://wa.me/${WHATSAPP_RESTAURANTE}?text=${encodedMessage}`, "_blank");
});