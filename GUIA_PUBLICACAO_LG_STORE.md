# 🚀 Kit Completo de Publicação na Loja LG (LG Seller Lounge)

Este documento contém todas as informações prontas para você apenas **copiar e colar** no portal [LG Seller Lounge](https://seller.lgappstv.com/) durante o cadastro do aplicativo.

---

## 📋 1. Informações Básicas do Aplicativo (App Information)

| Campo | Valor Recomendado |
|---|---|
| **App Title (Nome)** | `Web IPTV Player` (ou o nome comercial que preferir) |
| **App ID** | `com.antigravity.webiptv` |
| **Versão** | `1.0.0` |
| **Plataforma** | `webOS TV` |
| **Categoria Principal** | `Entertainment` (Entretenimento) |
| **Categoria Secundária** | `Photo & Video` |
| **Tipo de Preço (Service Type)** | `Free` (Gratuito) |
| **Classificação Indicativa (Age Rating)** | `All / Everyone` (Livre para todos os públicos) |
| **Países de Distribuição** | `Brazil` (Brasil) ou `Worldwide` (Mundial) |

---

## 📝 2. Textos Prontos para a Loja (Descrições)

### Português (Brasil)

#### Descrição Curta (Short Description - até 250 caracteres):
```text
Reprodutor de mídia moderno e rápido para Smart TVs LG. Assista aos seus canais, filmes e séries favoritos através de listas M3U ou conexão Xtream com navegação otimizada pelo controle remoto.
```

#### Descrição Detalhada (Detailed Description):
```text
O Web IPTV Player é um reprodutor de mídia completo, fluido e intuitivo, desenvolvido especialmente para proporcionar a melhor experiência na sua Smart TV LG (webOS).

Principais Recursos:
• Navegação Otimizada: Controle total usando apenas as setas e botões coloridos do controle remoto da TV.
• Suporte Completo a Listas: Compatível com listas M3U e API Xtream Codes.
• Organização Inteligente: Separação automática em Canais Ao Vivo, Filmes e Séries com navegação por categorias.
• Atalho Rápido de Favoritos: Pressione o botão Vermelho do controle para salvar ou remover qualquer canal, filme ou série dos seus favoritos instantaneamente.
• Player de Alta Performance: Suporte a streaming HLS (.m3u8), TS e MP4 com carregamento rápido e controle de proporção de tela.
• Modo Escuro & Interface Moderna: Design pensado para salas de estar com ótima legibilidade em telas grandes.

AVISO LEGAL / DISCLAIMER:
- O Web IPTV Player é estritamente um aplicativo reprodutor de mídia.
- O aplicativo NÃO contém, NÃO hospeda e NÃO fornece nenhuma lista, canal, filme ou série pré-instalada.
- O usuário é o único responsável por fornecer e utilizar conteúdos legalmente autorizados.
```

---

### Inglês (Global / Recomendado para aprovação na LG)

#### Short Description:
```text
Fast and modern media player designed for LG Smart TVs. Easily play your personal M3U playlists and Xtream streams with seamless remote control navigation.
```

#### Detailed Description:
```text
Web IPTV Player is an intuitive and high-performance media player built specifically for LG Smart TVs running webOS.

Key Features:
• Remote Control Optimized: Full navigation support using TV D-pad and colored buttons.
• Broad Format Compatibility: Works seamlessly with M3U playlists and Xtream Codes API.
• Smart Organization: Live TV, Movies, and Series neatly organized into searchable categories.
• One-Click Favorites: Press the Red button on your remote to instantly bookmark your preferred channels or movies.
• High-Performance Playback: Fast HLS/TS streaming engine with audio and subtitle support.
• TV-First User Interface: Sleek dark-mode interface designed for comfortable viewing on big screens.

DISCLAIMER:
- Web IPTV Player does NOT supply, host, or include any media content or playlists.
- Users must provide their own content from legally authorized sources.
```

---

## 🔒 3. Política de Privacidade & Termos (Privacy Policy)

A LG exige um link público para a Política de Privacidade.
Nós criamos o arquivo pronto em:
📁 `public/privacy-policy.html`

### Como hospedar gratuitamente em 2 minutos:
1. **Opção A (GitHub Pages)**: Se o seu repositório estiver no GitHub, ative o *GitHub Pages* na aba *Settings > Pages*. A URL ficará: `https://seusuario.github.io/repositorio/privacy-policy.html`.
2. **Opção B (Vercel / Netlify / Render)**: Ao subir o projeto ou a pasta `public`, o link será gerado automaticamente.
3. **Opção C (Notion ou Google Docs)**: Você também pode copiar o texto de `public/privacy-policy.html` para um documento público do Google Docs ou página do Notion e colar o link no portal da LG.

---

## 🧪 4. Informações de Teste para o Revisor da LG (QA Review Notes)

*⚠️ Este campo é fundamental para a LG não reprovar o aplicativo.*
No campo **Test Information / Reviewer Notes** do LG Seller Lounge, cole o texto abaixo:

```text
Dear LG Review Team,

This application is a generic media player (M3U / Xtream player) that allows users to play their own legal streams. It does not include any pre-loaded content.

To test the application functionality, please use the following free, public, and legal test playlist containing legal public domain/open broadcast streams:

Test M3U Playlist URL:
https://iptv-org.github.io/iptv/countries/br.m3u

Remote Control Shortcuts:
- D-Pad (Up/Down/Left/Right): Navigate cards and menus
- OK/Enter: Play selected channel or open details
- Back/Return: Return to previous screen or exit app from Home
- Red Button: Toggle favorite for currently highlighted item
- Green Button: Jump to Live TV
- Yellow Button: Jump to Movies
- Blue Button: Jump to Series
```

---

## 🖼️ 5. Imagens e Ícones Exigidos

| Imagem | Tamanho | Status no Projeto |
|---|---|---|
| **App Icon** | 80x80 px | ✅ Pronto em `webos/icon.png` |
| **Large Icon** | 130x130 px (ou 160x160) | ✅ Pronto em `webos/largeIcon.png` |
| **Screenshots (3 a 5)** | 1920x1080 px | 📸 Tirar capturas da tela do app em 1080p |

---

## 📦 6. Pacote para Upload
* Arquivo para enviar no LG Seller Lounge:
  `release-webos/com.antigravity.webiptv_1.0.0_all.ipk`
