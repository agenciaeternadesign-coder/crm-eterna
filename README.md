# CRM Eterna Design

Sistema CRM completo e personalizável para pequenos negócios. Desenvolvido para a **Alayane (Eterna Design)** entregar para suas clientes com a identidade visual de cada uma.

---

## ✨ Funcionalidades

- **Dashboard** com métricas, gráficos e agenda
- **Clientes** — cadastro completo com segmentos e status
- **Projetos/Tarefas** — agrupados por status com controle de prazo
- **Financeiro** — entradas e saídas com gráficos mensais
- **Agenda/Calendário** — visualização mensal com eventos
- **Pipeline de Vendas** — kanban arrastável com valor por etapa
- **Personalização da Marca** — logo, cores, dados da empresa, dark mode

---

## 🚀 Como colocar o sistema no ar (Deploy na Vercel)

### PARTE 1 — Criar conta na Vercel (só na primeira vez)

1. Acesse **vercel.com** e clique em "Sign Up"
2. Escolha "Continue with GitHub" (crie uma conta no GitHub se não tiver)
3. Autorize a Vercel a acessar seu GitHub

---

### PARTE 2 — Subir o projeto no GitHub (só na primeira vez)

> Faça isso uma vez. Para cada nova cliente, você vai **duplicar** esse projeto (veja Parte 4).

1. Acesse **github.com** e clique em **"New repository"** (botão verde)
2. Dê um nome: `crm-eterna` (ou qualquer nome)
3. Deixe como **Public** e clique em **"Create repository"**
4. No seu computador, abra o terminal na pasta do projeto e rode:

```bash
git init
git add .
git commit -m "CRM inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/crm-eterna.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu usuário do GitHub.

---

### PARTE 3 — Fazer o deploy na Vercel

1. No painel da Vercel, clique em **"Add New Project"**
2. Clique em **"Import"** ao lado do repositório `crm-eterna`
3. Na tela de configuração:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Clique em **"Deploy"**
5. Aguarde ~1 minuto ✅
6. Pronto! Você vai receber um link tipo: `crm-eterna.vercel.app`

---

### PARTE 4 — Criar um CRM para uma nova cliente

Para cada nova cliente, você precisa de um projeto separado:

**Opção A — Pelo GitHub (recomendado):**

1. No GitHub, abra o repositório `crm-eterna`
2. Clique em **"Use this template"** → **"Create a new repository"**
   - *(Se não aparecer, clique em Fork)*
3. Dê um nome: `crm-[nome-da-cliente]` (ex: `crm-bella-estetica`)
4. Volte na Vercel → **"Add New Project"** → importe o novo repositório
5. Repita o passo 3 do deploy acima

**Após o deploy:**

6. Acesse o link do sistema da cliente
7. Vá em **"Personalizar Marca"** (no menu lateral)
8. Configure:
   - Logo da cliente
   - Cores da marca
   - Dados da empresa
   - Nome do sistema e mensagem de boas-vindas
9. Clique em **"Salvar Tudo"** ✅

> O sistema já vai abrir com todas as configurações salvas automaticamente.

---

### PARTE 5 — Dar domínio personalizado para a cliente (opcional)

Se a cliente quiser usar um domínio próprio (ex: `crm.bellastetica.com.br`):

1. No painel da Vercel, abra o projeto da cliente
2. Vá em **Settings → Domains**
3. Clique em **"Add Domain"** e digite o domínio dela
4. A Vercel vai mostrar as configurações de DNS para adicionar no registro do domínio da cliente
5. Após propagar (~24h), o sistema já funciona no domínio personalizado ✅

---

## 💻 Rodar localmente (para desenvolvimento)

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Gerar versão para produção
npm run build

# Testar a versão de produção
npm run preview
```

---

## 🎨 Personalização rápida

Toda a personalização é feita **dentro do próprio sistema**, sem precisar tocar no código:

| O que personalizar | Onde |
|---|---|
| Logo, cores primária/secundária | Personalizar Marca → Identidade Visual |
| Nome da empresa, CNPJ, endereço | Personalizar Marca → Dados da Empresa |
| Nome do sistema, mensagem inicial | Personalizar Marca → Interface do Sistema |
| Tema claro/escuro | Personalizar Marca → Interface do Sistema |

---

## 🛠️ Stack técnica

- **React 18** + **Vite**
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **@hello-pangea/dnd** para o kanban arrastável
- **Recharts** para gráficos financeiros
- **Lucide React** para ícones
- **localStorage** para persistência dos dados (sem backend)

---

## 📦 Estrutura do projeto

```
crm-eterna/
├── src/
│   ├── components/
│   │   ├── Layout/        # Sidebar e Header
│   │   └── UI/            # Modal, Badge
│   ├── context/           # Estado global (AppContext)
│   ├── data/              # Dados de exemplo
│   ├── hooks/             # useLocalStorage
│   └── pages/             # Dashboard, Clients, Projects, etc.
├── vercel.json            # Configuração do deploy
└── README.md
```

---

Desenvolvido com 💜 para a **Eterna Design**
