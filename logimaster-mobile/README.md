# LogiMaster Mobile

![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

Aplicativo mobile do LogiMaster para equipe de expedição e motoristas. Permite conferência de romaneios, recebimento de matéria prima, inventário e rastreamento de entregas com GPS.

![Login](../docs/screenshots/mobile-login.png)
![Romaneios](../docs/screenshots/mobile-home.png)
![Conferência](../docs/screenshots/mobile-conference.png)

---

## Stack

- Expo 54 / React Native 0.81 / TypeScript 5
- React Navigation (Native Stack)
- Expo Location (GPS para rastreamento do motorista)
- Expo Camera + Barcode Scanner (leitura de códigos)
- AsyncStorage (armazenamento local do token e dados do usuário)
- React Native Signature Canvas (assinatura digital de canhoto)
- React Native WebView

---

## Instalação

```bash
npm install
```

Crie `.env` na raiz do projeto com o IP da máquina que roda a API (não use `localhost` — o celular precisa alcançar o servidor via rede):

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:5000
```

Para descobrir o IP da sua máquina:
- Windows: `ipconfig`
- Linux/macOS: `ip a` ou `ifconfig`

---

## Como rodar

### Expo Go (recomendado para desenvolvimento)

```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go** (disponível na App Store e Google Play). O celular precisa estar na mesma rede Wi-Fi que a máquina.

### Android (emulador)

```bash
npx expo start --android
```

Requer Android Studio com um emulador configurado.

### iOS (simulador)

```bash
npx expo start --ios
```

Requer macOS com Xcode instalado.

### Web (desenvolvimento)

```bash
npx expo start --web
```

> Atenção: no modo web, erros de CORS podem ocorrer se a API não estiver configurada para aceitar a origem do Expo web.

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL base da API LogiMaster | `http://192.168.0.10:5000` |

O arquivo `.env` não é versionado (está no `.gitignore`). Use `.env.example` como referência.

---

## Telas

### Login
- Autenticação com e-mail e senha
- Decodificação do JWT para extração do bitmask de permissões
- Redirecionamento: motoristas vão para a tela de entregas, demais para romaneios

### Romaneios (`Home`)
- Lista de romaneios com status e cliente
- Filtro por status (Pendente, Separando, Conferência)
- Acesso ao fluxo de conferência por romaneio

### Conferência (`Conference`)
- Listagem dos itens do romaneio
- Conferência item a item com scanner ou entrada manual
- Registro de lote por item
- Conclusão da conferência

### Scanner (`Scanner`)
- Leitura de código de barras via câmera
- Integrado ao fluxo de conferência

### Minhas Entregas (`DeliveryList`)
- Exclusivo para motoristas (role `Driver`)
- Lista de romaneios faturados disponíveis para entrega
- Rastreamento GPS automático durante a entrega
- Upload de foto e assinatura digital do canhoto

### Assinatura (`Signature`)
- Coleta de assinatura digital do destinatário
- Envio do canhoto assinado para a API

### Recebimento MP (`Recebimento`)
- Registro de recebimento de matéria prima
- Disponível para usuários com permissão de Estoque

### Inventário (`Inventory`)
- Contagem e ajuste de inventário
- Disponível para usuários com permissão de Estoque

---

## Permissões e visibilidade

A sidebar filtra os itens de menu conforme as permissões do usuário decodificadas do JWT:

| Tela | Condição |
|---|---|
| Romaneios | bit 0 (Romaneios View) |
| Minhas Entregas | role = Driver |
| Recebimento MP | bit 20 (Estoque View) |
| Inventário | bit 20 (Estoque View) |

O role `Administrator` tem acesso a todas as telas.
