# Uno Online - Real-Time Multiplayer Game Engine

A full-stack, real-time multiplayer Uno application. Designed with an authoritative server architecture to ensure game integrity, low-latency event synchronization via WebSockets, and a modern, responsive React frontend.

## 🎯 Project Overview

This project was built to explore real-time, event-driven architectures and complex state management. It features both a competitive Player vs Player mode and a Player vs Bot mode with automated decision-making logic.

## 🏗️ System Architecture

### Authoritative Backend (NestJS & WebSockets)

- **Event-Driven Communication**: Utilizes `@nestjs/platform-socket.io` for bi-directional, low-latency data flow. The server acts as the single source of truth, managing all game states to prevent client-side manipulation.
- **Custom Game Engine**: The core game logic is implemented natively in TypeScript, featuring modularized components (`Card`, `GameBoard`, `GameRoom`, `Player`). It handles turn progression, complex card effects (Skips, Reverses, +2, +4, Wilds), and win condition evaluations.
- **WebSocket Payload Validation**: Leverages `class-validator` and custom DTOs mapped to WebSocket events. Custom WebSocket exception filters (`ws-game.filter.ts`, `ws-validation.filter.ts`) gracefully catch and emit structured error responses back to the client.
- **Dependency Injection**: Takes full advantage of NestJS's IoC container to cleanly separate gateway controllers from business logic services (`game-player.service.ts`, `game-bot.service.ts`).

### Frontend Presentation (React 19 & Vite)

- **Component-Driven UI**: Built with React and structured by domains (`components/game`, `components/player-vs-bot`, etc.) for high reusability.
- **Custom Animation Orchestrator**: Implements a highly synchronized custom React Hook (`useAnimationsOrchestrator`) that evaluates the game state and turn events to procedurally dictate three phases of animation: _idle_, _showcase_, and _stacking_. This coordinates staggered delays, mock hand pops, and clean-up functions natively within the React rendering cycle to ensure seamless transitions without desyncing from the server truth.
- **Dynamic Math & Layout Engine**: The UI features an advanced layout engine utilizing `ResizeObserver` to calculate dynamic card dimensions, container bounds, and fanning step sizes. It calculates the exact `left` positioning and handles complex `Z-Index` algorithms (e.g., in-flight global round-robin indexing vs. landed resting states) to ensure cards physically "fly" and land correctly on different viewport sizes.
- **Turn Carousel**: Employs a cyclic offset formula \`((otherIndex - currentTurnIndex + totalPlayers) % totalPlayers)\` to dynamically rotate opponent avatars around the board relative to the active player's turn, utilizing Framer Motion for smooth spatial displacement.
- **Optimized Tooling**: Bundled with Vite for rapid Hot Module Replacement (HMR) during development and highly optimized static assets for production. Styled with Tailwind CSS v4 using utility-first design principles.

### Infrastructure & DevOps

- **Containerization**: Fully containerized using Docker and Docker Compose, ensuring environment parity across local development, CI, and production.
- **Secure Tunneling**: Integrates Cloudflare Tunnels (`cloudflared`) to securely expose the application without modifying local firewalls or NAT configurations.
- **Self-Hosted CI/CD**: Includes a custom Docker-out-of-Docker GitHub Actions runner configured within the `docker-compose.yml`, enabling automated, isolated pipeline executions directly on the host machine.

## 🛠️ Technical Stack

| Category           | Technologies                                                          |
| ------------------ | --------------------------------------------------------------------- |
| **Frontend**       | React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Socket.io-client |
| **Backend**        | NestJS, TypeScript, Socket.io, Class-Validator, Jest                  |
| **DevOps & Infra** | Docker, Docker Compose, Cloudflare Tunnels, GitHub Actions            |

## 📂 Architecture Deep Dive

```text
.
├── backend/src/
│   ├── game/
│   │   ├── engine/          # Core ruleset, turn evaluation, and game state mutation
│   │   ├── model/           # OOP models (Card, GameBoard, Player, GameRoom)
│   │   ├── gateway-dto/     # Strict typing/validation for incoming Socket payloads
│   │   ├── gateway-filter/  # Custom error boundaries for WS exceptions
│   │   ├── bot-vs-player/   # PvE orchestrator and Bot decision logic
│   │   └── player-vs-player/# PvP orchestrator and room management
├── frontend/src/
│   ├── api/                 # WebSocket event emitters and listeners
│   └── components/          # Domain-driven React components
└── docker-compose.yml       # Stack orchestration & CI/CD runner setup
```

## 🚀 Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) (For full infrastructure orchestration)

### Running the Microservices Locally

**1. Backend (Game Server):**

```bash
cd backend
npm install
npm run start:dev # Runs on localhost:3000
```

**2. Frontend (Client):**

```bash
cd frontend
npm install
npm run dev # Runs on localhost:5173
```

### Infrastructure Automation (Docker Compose)

To launch the entire suite—including the backend, frontend, Cloudflare ingress tunnel, and the self-hosted GitHub runner:

1. Provide your environment variables (e.g., via a `.env` file):
   - `FRONTEND_URL`
   - `VITE_API_URL`
   - `CLOUDFLARE_TOKEN`
   - `ACCESS_TOKEN` (GitHub PAT for Runner)
2. Deploy the stack:
   ```bash
   docker-compose up -d --build
   ```

## 🧪 Testing

The backend includes a comprehensive Jest test suite to guarantee the deterministic behavior of the game engine.

```bash
cd backend
npm run test
```

## 📜 License

This project is open-source under the MIT License.
