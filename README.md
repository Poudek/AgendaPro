# 🍣 Dedé Sushi - Agenda Pro

Sistema web para agendamento, precificação dinâmica e gestão operacional de barcas especiais de sushi. O projeto resolve gargalos de pedidos feitos manualmente via papel/caneta e WhatsApp, organizando a esteira de produção e o cálculo flexível de entregas.

---

## 📌 Funcionalidades

### 📱 Interface do Cliente (`cliente.html`)
* **Catálogo & Precificação Dinâmica:** Alternância automática de valores e descrições ao selecionar barcas **Tradicionais** ou **Especiais**.
* **Agendamento Inteligente:** Seleção de data e grade de horários disponíveis.
* **Coleta de Restrições:** Informações de alergias/preferências (ex: camarão), dados de entrega e forma de pagamento.
* **Integração WhatsApp:** Envio pré-formatado do pedido com status inicial `Aguardando Frete`.

### 🔐 Autenticação (`index.html`)
* **Página de Login:** Ponto de entrada padrão da aplicação com validação de credenciais para acesso restrito.
* **Proteção de Rota:** Redirecionamento automático caso um usuário não autenticado tente acessar o painel administrativo.

### 🖥️ Painel Administrativo (`admin.html`)
* **Dashboard em Tempo Real:** Linha do tempo de agendamentos e métricas diárias atualizadas instantaneamente.
* **Filtro Diário com Flatpickr:** Calendário interativo no tema Dark Mode com marcações visuais (*dots*) nos dias com pedidos agendados.
* **Gestão de Status:** Esteira operacional (`Aguardando Frete` ➔ `Pendente` ➔ `Em Preparo` ➔ `Pronto` ➔ `Entregue` ➔ `Cancelado`).
* **Precificação de Frete:** Inserção do frete com máscara monetária e cálculo do Total do Pedido em tempo real.
* **Notificações em Tempo Real:** Alerta sonoro de alto alcance para ambiente de cozinha e pop-ups visuais via `storage event`.
* **Disparos Semi-Automáticos:** Mensagens rápidas no WhatsApp para envio do orçamento de frete e avisos de evolução de status.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 & CSS3:** Interface responsiva em Dark Theme (`Plus Jakarta Sans`).
* **JavaScript (ES6+):** Manipulação de DOM, cálculos de precificação e persistência de dados.
* **LocalStorage API:** Simulação de banco de dados no client-side para o protótipo.
* **Flatpickr:** Calendário customizado com suporte a localização PT-BR.
* **Lucide Icons:** Conjunto de ícones vetoriais.

---

## 📁 Estrutura de Arquivos

```text
front code/
├── assets/             # Arquivos de mídia, sons e imagens
├── css/
│   ├── admin.css       # Estilização do painel administrativo
│   └── cliente.css     # Estilização da interface de pedidos
├── js/
│   ├── admin.js        # Lógica de gestão, métricas e notificações
│   └── cliente.js      # Lógica de precificação e envio do cliente
├── admin.html          # Dashboard principal do administrador (protegido)
├── cliente.html        # Tela pública de pedidos do cliente
└── index.html          # Tela de Login / Porta de entrada do sistema
