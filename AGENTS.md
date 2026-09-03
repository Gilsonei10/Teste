# REGRAS DE OURO (GOLDEN RULES)

Este arquivo define as diretrizes fundamentais e inegociáveis para a atuação do agente no desenvolvimento deste projeto.

---

### 1. COMPONENTIZAÇÃO
- Dividir a interface e a lógica em componentes reutilizáveis, coesos e bem delimitados.
- Cada componente deve possuir responsabilidade única e interfaces claras (props/inputs bem definidos).

### 2. MODULARIZAÇÃO
- Organizar a arquitetura e a base de código em módulos independentes, isolados e desacoplados.
- Facilitar a manutenção, testabilidade e reutilização de código entre diferentes partes do sistema.

### 3. ÀS VEZES MENOS É MAIS
- Evitar *over-engineering*, abstrações prematuras e complexidade desnecessária.
- Priorizar soluções simples, diretas, limpas, performáticas e fáceis de entender.

### 4. ATENHA-SE UNICAMENTE AO MEU COMANDO (SEM ABSTRAÇÕES)
- Executar rigorosa e estritamente o que foi solicitado, sem ficar abstraindo ou enrolando.
- Não introduzir alterações fora de escopo, dependências supérfluas, arquivos não solicitados ou recursos extras sem instrução explícita.

### 5. PERGUNTAS vs EXECUÇÃO
- Se o usuário fizer uma pergunta ou solicitar esclarecimento, apenas responda textualmente. NÃO execute alterações nem comandos.

### 6. ESCOPO CIRÚRGICO DE ALTERAÇÃO
- Quando solicitado para mexer em uma tela ou elemento específico, atente-se e altere exclusivamente aquele alvo.
- Não mexa em absolutamente nada além do que foi expressamente indicado.

### 7. ESQUEMA DE VERSIONAMENTO E REGRA DO ARQUIVO VERSION (N.N.N)
- **Formato:** `[Produção].[Beta].[Commit/Dev]` (atualmente em desenvolvimento: `0.0.N`).
- **Arquivos sincronizados de versão:**
  - `VERSION` (na raiz do projeto, contendo unicamente a string da versão `N.N.N`).
  - `package.json` (`"version": "N.N.N"`).
  - `src/version.ts` (`export const APP_VERSION = 'N.N.N';`).
- **REGRA DE OURO INEGOCIÁVEL:** **NUNCA COMITAR SEM VERSIONAR.**
- Toda vez que for solicitado comitar (`add, commit, push` ou similar), obrigatoriamente incrementar em **+1** o último N (`V atual =+ 1`) nos 3 arquivos (`VERSION`, `package.json`, `src/version.ts`) ANTES de executar o `git add` e o `git commit`.
- A versão é visível ao usuário no rodapé da interface (`vN.N.N`).
