# Minimal Finance

Controle financeiro pessoal ultra minimalista. Um PWA (Progressive Web App) para gerenciar suas finanças de forma simples e intuitiva.

## 🚀 Funcionalidades

### 📊 Dashboard
- Saldo total consolidado
- Total em bancos (Pessoal e PJ)
- Total em cartões de crédito (fatura atual)
- Receitas e despesas do mês
- Projeção financeira
- Gastos por categoria

### 🏦 Bancos
- Adicionar/editar/excluir bancos
- Saldo atual
- Tipo: Pessoal ou PJ
- Visualização do total em cada banco

### 💳 Cartões de Crédito
- Adicionar/editar/excluir cartões
- Limite total e disponível
- Valor da fatura atual
- Dia de fechamento e vencimento
- Barra de progresso de uso do limite
- Total a pagar no mês

### 💰 Transações
- Receitas e despesas
- Categorização
- Forma de pagamento (Banco ou Cartão)
- Descrição opcional
- Transações recorrentes
- Atualização automática de saldos

### 🏷️ Categorias
- Categorias personalizadas
- Cores personalizadas
- Tipos: Receita ou Despesa
- Categorias padrão incluídas:
  - Despesas: Alimentação, Moradia, Transporte, Lazer, Assinaturas, Investimentos
  - Receitas: Salário, Freelance

### 📈 Resumo Mensal
- Receita total do mês
- Despesa total do mês
- Resultado (lucro/prejuízo)
- Total a pagar em cartões
- Saldo disponível em bancos
- Categoria que mais gastou
- Saúde financeira

### ⚙️ Configurações
- Nome do usuário
- Tema claro/escuro
- Exportar dados (JSON)
- Importar dados
- Resetar todos os dados

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **next-themes** - Tema claro/escuro
- **LocalStorage** - Persistência de dados

## 📱 PWA

- Instalável no celular
- Funciona offline
- Ícones em múltiplas resoluções
- Tema adaptativo

## 🚀 Como usar

### Desenvolvimento
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   └── PageWrapper.tsx
│   ├── ThemeProvider.tsx
│   └── ui/           # Componentes shadcn/ui
├── lib/
│   ├── utils.ts
│   └── financial-calculations.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Bancos.tsx
│   ├── Cartoes.tsx
│   ├── Transacoes.tsx
│   ├── Categorias.tsx
│   ├── Resumo.tsx
│   └── Config.tsx
├── store/
│   └── finance-store.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
└── main.tsx

public/
├── manifest.json
└── icon-*.png
```

## 🔮 Futuro

- Integração com Supabase
- Multiusuário
- Sincronização em nuvem
- Relatórios avançados
- Metas financeiras

## 📝 Licença

MIT
