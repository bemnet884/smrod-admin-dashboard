# SM-ROD Admin Dashboard 🚛🛡️

The **SM-ROD Admin Dashboard** is a high-performance IoT fleet management and vehicle security platform. It provides real-time visibility and remote control capabilities over vehicles equipped with Pass Key, Tracking, and Speed Governor hardware modules.

## 🚀 Key Features

*   **Secure Authentication:** JWT-based login with persistent sessions and server-side route protection (Middleware).
*   **Fleet Management:** A searchable and sortable dashboard to monitor vehicle health, connectivity status, and hardware modules.
*   **Vehicle Registration Wizard:** A multi-step process to onboard new vehicles and activate specific hardware modules.
*   **Live GPS Tracking:** Interactive map visualizing real-time telemetry, vehicle heading (rotation), and speed using Leaflet.
*   **Alert Center:** Real-time monitoring of critical incidents (Crashes, Tampering, Overspeeding) with an acknowledgment workflow.
*   **Driver Assignment:** Reactive system to link authorized drivers to specific vehicles in the fleet.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **State Management:** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) (Persistent)
*   **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
*   **Maps:** [Leaflet](https://leafletjs.org/) & [React-Leaflet](https://react-leaflet.js.org/)
*   **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **Icons:** [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
├── app/              # Next.js App Router (Pages & Layouts)
├── components/       # UI Components
│   ├── shared/       # Business-specific components (Modals, Sidebar)
│   ├── ui/           # Shadcn base components
│   └── maps/         # Leaflet map implementations
├── services/         # API Service Layer (Axios calls & Mock Data)
├── store/            # Global State (Zustand)
├── types/            # TypeScript Interfaces & API Schemas
├── lib/              # Utils & Axios configurations
├── hooks/            # Custom React Hooks
└── middleware.ts     # Server-side Route Protection
```

## 🚦 Getting Started

### Prerequisites
* Node.js 18.x or higher
* npm or pnpm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SM-ROD/admin-dashboard.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_API_URL=https://backend-vr5u.onrender.com
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔄 Backend Integration & Mock Data

Currently, the project uses a **Service Layer Abstraction**. 
*   All data displayed is currently **Mock Data** located in the `services/` folder.
*   The architecture is built to be "Plug-and-Play." Once the NestJS backend is ready, integration involves simply uncommenting the Axios calls in the service files.

## 📈 Roadmap

- [x] Phase 1: Foundation & Auth
- [x] Phase 2: Fleet Management & Tables
- [x] Phase 3: Live Mapping & Telemetry Simulation
- [x] Phase 4: Alert Center & Incident Response
- [ ] Phase 5: Driver Pool & Facial Data Management
- [ ] Phase 6: System Analytics & Reporting

## 📄 License
Internal Project - All Rights Reserved.