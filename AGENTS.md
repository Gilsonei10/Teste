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
