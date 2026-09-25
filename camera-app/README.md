# 📷 Dual Camera Mobile App (Android & Web)

Aplicativo para celulares Android que ativa a **câmera frontal e traseira simultaneamente** na mesma tela para capturar **fotos** e gravar **vídeos com áudio**.

---

## 🚀 Funcionalidades

1. **Ativação Simultânea das Câmeras:**
   - Câmera traseira e câmera frontal ativas em tempo real no mesmo visor.
   - Detecção automática de dispositivos de vídeo frontal e traseiro.
   - Suporte inteligente para dispositivos com concorrência de hardware e fallback assistido.

2. **Modos de Exibição / Layout:**
   - 🖼️ **Picture-in-Picture (PiP):** Câmera principal em tela cheia e câmera secundária em miniatura flutuante.
   - ↕️ **Split Vertical:** Divisão superior e inferior (50% / 50%).
   - ↔️ **Split Horizontal:** Divisão lado a lado (50% / 50%).
   - 🔄 **Troca Rápida de Posição:** Botão e toque na miniatura para inverter câmera principal e secundária.

3. **Captura de Fotos:**
   - Composição em tempo real das duas câmeras em um Canvas de alta resolução (1080x1920).
   - Efeito visual de flash de obturador.
   - Exportação e download em formato JPG.

4. **Gravação de Vídeos com Áudio:**
   - Gravação contínua do fluxo combinado das duas câmeras em tempo real via `MediaRecorder`.
   - Captura integrada do microfone do celular.
   - Indicador de tempo e status de gravação pulsante.
   - Exportação em formato WebM/MP4 compatível com Android.

5. **Galeria e Compartilhamento:**
   - Miniatura da última mídia capturada.
   - Modal com player de vídeo e visualizador de fotos em tela cheia.
   - Compartilhamento nativo via Web Share API (`navigator.share`) para WhatsApp, Instagram, Telegram, etc.
   - Download direto para a memória do celular.

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript + Vite**
- **Tailwind CSS** para interface mobile moderna
- **Capacitor 8** com plataforma nativa **Android**
- **HTML5 Canvas & WebRTC / MediaStream API**
- **Lucide Icons**

---

## 📱 Como Rodar e Testar

### 1. Testar diretamente no Navegador / Celular via Wi-Fi:
No diretório `camera-app`:
```bash
npm run dev
```
O Vite iniciará com a flag `--host`. Acesse o IP exibido pelo terminal no navegador do seu celular (ex: `https://192.168.x.x:5173`) e permita o acesso à câmera e microfone.

### 2. Sincronizar e Abrir no Android Studio:
```bash
# Compila o projeto e sincroniza com o Android nativo
npm run cap:sync

# Abre o projeto no Android Studio para gerar o APK ou rodar no celular via cabo USB
npm run cap:open
```

### 3. Gerar o APK pelo Android Studio:
1. No Android Studio, aguarde o Gradle sincronizar.
2. Vá no menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. O APK gerado estará disponível na pasta `camera-app/android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Permissões Android Configuradas (`AndroidManifest.xml`)
- `android.permission.CAMERA`
- `android.permission.RECORD_AUDIO`
- `android.permission.MODIFY_AUDIO_SETTINGS`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.hardware.camera.concurrent` (ativação dupla simultânea)
