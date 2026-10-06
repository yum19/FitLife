<div align="center">

# 💪 FitLife

### A complete sports & nutrition coaching platform

Mobile app for clients, coaches and nutritionists, plus a web dashboard for administrators.

![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB?logo=react&logoColor=white)
![React](https://img.shields.io/badge/Dashboard-React.js-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Azure](https://img.shields.io/badge/Cloud-Azure%20VM-0078D4?logo=microsoftazure&logoColor=white)

</div>

---

## 📖 Table of Contents

- [About the project](#-about-the-project)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Diagrams](#-diagrams)
- [Tech stack](#-tech-stack)
- [Getting started](#-getting-started)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🎯 About the project

**FitLife** is a full-stack platform for planning and tracking workouts and nutrition. It was designed and built during an engineering internship at **Catalyze Teck** (ESPRIT, 2024/2025).

Existing apps such as MyFitnessPal or Nike Training Club lock advanced options behind paid plans and give administrators no complete management dashboard. They also lack mobile/web synchronization and analysis tools for coaches. FitLife answers these limits with two interfaces:

| Interface | Built with | For |
|-----------|-----------|-----|
| 📱 **Mobile app** | React Native | Clients, coaches and nutritionists |
| 🖥️ **Web dashboard** | React.js | Administrators only |

Both talk to one **Node.js / Express** API backed by **MongoDB**.

---

## ✨ Features

### 👤 Client
- Follow workout programs and sessions
- Track progress (weight, measurements, BMI, BMR)
- Consult nutrition plans (meals, foods, macros)
- Find nearby gyms on a map
- Browse the product catalog (supplements, sports equipment), with favorites and cart
- Contact coaches and nutritionists, view their profiles, request a consultation and leave feedback

### 🏋️ Coach & 🥗 Nutritionist
- Manage a professional profile (certifications, specialties, availability, hourly rate)
- Reply to client messages
- Manage follow-up and consultation requests
- Create training programs / meal plans for clients

### 🛠️ Administrator (web dashboard)
- Manage administrators, coaches, nutritionists and clients
- Manage the sport & nutrition catalog
- Gym map
- Global statistics and activity charts

### 🔐 Common
- Secure authentication, password reset, role-based access (client, coach, nutritionist, admin)

---

## 📸 Screenshots

### Web dashboard (admin)

<p align="center">
  <img src="assets/web-login.png" alt="Admin login" width="48%"/>
  <img src="assets/web-dashboard.png" alt="Admin dashboard" width="48%"/>
</p>

### Mobile app

<p align="center">
  <img src="assets/mobile-auth-1.png" alt="Onboarding screens" width="48%"/>
  <img src="assets/mobile-auth-2.png" alt="Sign in, profile and profile edition" width="48%"/>
</p>

<p align="center">
  <img src="assets/mobile-home.png" alt="Home, trainings and product detail" width="70%"/>
</p>

---

## 🏗️ Architecture

<p align="center">
  <img src="assets/architecture.png" alt="FitLife architecture" width="750"/>
</p>

```mermaid
flowchart LR
    U["Users"] -- HTTPS --> N["Nginx<br/>(Azure VM)"]
    N --> F["Frontend<br/>React dashboard"]
    N <--> B["Backend<br/>Node.js + Express"]
    M["Mobile app<br/>React Native"] -- REST API --> B
    B --> D[("MongoDB")]
    NSG["NSG<br/>(network security)"] -.-> N
    NSG --> MON["Monitoring"]
```

---

## 📐 Diagrams

### Use case diagram

<p align="center">
  <img src="assets/use-case.png" alt="Global use case diagram" width="750"/>
</p>

### Use cases by role (simplified)

```mermaid
flowchart LR
    CL(("Client"))
    CO(("Coach /<br/>Nutritionist"))
    AD(("Admin"))
    AUTH["Authentication"]

    subgraph FitLife
        C1["View sport plan"]
        C2["View nutrition plan"]
        C3["Track progress"]
        C4["Locate gyms"]
        C5["Browse products<br/>favorites / cart"]
        C6["Contact coaches & nutritionists"]
        C7["Request consultation + feedback"]
        P1["Manage professional profile"]
        P2["Reply to client messages"]
        P3["Manage consultation requests"]
        A1["Manage users"]
        A2["Manage products"]
        A3["View statistics"]
    end

    CL --> C1 & C2 & C3 & C4 & C5 & C6 & C7
    CO --> P1 & P2 & P3
    AD --> A1 & A2 & A3
    C1 & C2 & C3 & C4 & C5 & C6 & C7 & P1 & P2 & P3 & A1 & A2 & A3 -. include .-> AUTH
```

### Authentication flow

```mermaid
flowchart TD
    A(["Open app / dashboard"]) --> B["Enter email & password"]
    B --> C{"Valid credentials?"}
    C -- No --> D["Show error"] --> E{"Forgot password?"}
    E -- Yes --> F["Reset password"] --> B
    E -- No --> B
    C -- Yes --> G{"Role?"}
    G -- Client --> H["Mobile: client space"]
    G -- Coach --> I["Mobile: coach space"]
    G -- Nutritionist --> J["Mobile: nutritionist space"]
    G -- Admin --> K["Web: admin dashboard"]
```

### Consultation flow

```mermaid
sequenceDiagram
    actor C as Client
    participant A as FitLife API
    actor P as Coach / Nutritionist

    C->>A: Browse coach & nutritionist profiles
    C->>A: Request a consultation
    A-->>P: New consultation request
    P->>A: Approve request (date, price)
    A-->>C: Consultation confirmed
    Note over C,P: Messages, programs and meal plans
    P->>A: Complete consultation
    C->>A: Add feedback (rating + comment)
```

### Workout session flow

```mermaid
flowchart LR
    A["Sport program<br/>(objective, level, weekly frequency)"] --> B["Session<br/>(date, status)"]
    B --> C["Exercises<br/>(sets, reps, weights)"]
    C --> D["Complete session"]
    D --> E["Progress calculated"]
    E --> F["Progression saved<br/>(weight, measurements)"]
```

### Class diagram

<p align="center">
  <img src="assets/class-diagram.png" alt="FitLife class diagram" width="900"/>
</p>

```mermaid
classDiagram
    class User {
        +int userId
        +String email
        +String motDePasse
        +String nom
        +String prenom
        +int age
        +String sexe
        +float taille
        +float poids
    }
    class Client {
        +String objectif
        +String niveauActivite
        +String[] allergies
    }
    class Admin
    class Coach {
        +String[] certifications
        +String[] specialites
        +float tarifHoraire
        +boolean disponible
    }
    class Nutritionniste {
        +String[] certifications
        +String[] specialites
        +float tarifHoraire
        +boolean disponible
    }
    User <|-- Client
    User <|-- Admin
    User <|-- Coach
    User <|-- Nutritionniste
```

### Entity-relationship diagram

```mermaid
erDiagram
    CLIENT ||--o{ PROGRESSION : records
    CLIENT ||--o{ PROGRAMME_SPORT : follows
    CLIENT ||--o{ PLAN_NUTRITION : follows
    CLIENT ||--o{ CONSULTATION : requests
    COACH ||--o{ CONSULTATION : approves
    NUTRITIONNISTE ||--o{ CONSULTATION : approves
    CONSULTATION ||--o{ FEEDBACK : has

    PROGRAMME_SPORT ||--o{ SEANCE : contains
    SEANCE }o--o{ EXERCICE : includes

    PLAN_NUTRITION ||--o{ REPAS : contains
    REPAS }o--o{ ALIMENT : includes

    CLIENT ||--o| PANIER : owns
    PANIER }o--o{ PRODUIT : holds
    CLIENT ||--o{ FAVORI : saves
    FAVORI }o--|| PRODUIT : targets

    USER }o--o{ SALLE_DE_SPORT : consults

    PROGRESSION {
        int progressionId PK
        date dateEnregistrement
        float poids
        object mensurations
    }
    PROGRAMME_SPORT {
        int planId PK
        string objectif
        string niveau
        int frequenceHebdomadaire
        boolean isActive
    }
    SEANCE {
        int sessionId PK
        date sessionDate
        int duree
        string status
        string notes
    }
    EXERCICE {
        int exerciceId PK
        string nom
        string muscleGroup
        string materiel
        string difficulte
        string videoUrl
    }
    PLAN_NUTRITION {
        int planId PK
        int caloriesJournalieres
        float proteines
        float glucides
        float lipides
    }
    REPAS {
        int repasId PK
        string typeRepas
        date dateRepas
        int caloriesTotal
    }
    ALIMENT {
        int alimentId PK
        string nom
        float caloriesPour100g
        float proteinesPour100g
        float glucidesPour100g
        float lipidesPour100g
    }
    CONSULTATION {
        int consultationId PK
        datetime dateRendezVous
        string statut
        float prix
    }
    FEEDBACK {
        int feedbackId PK
        int note
        string commentaire
    }
    PRODUIT {
        int produitId PK
        string nom
        string categorie
        string marque
        float prix
    }
    PANIER {
        int panierId PK
        float prixTotal
    }
    SALLE_DE_SPORT {
        int salleId PK
        string nom
        string adresse
        float latitude
        float longitude
    }
```

---

## 🧰 Tech stack

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native |
| Web dashboard | React.js |
| Backend / API | Node.js, Express.js |
| Database | MongoDB |
| Cloud & hosting | Azure Virtual Machine (Linux), Nginx, NSG, monitoring |
| Tools | Git & GitHub, Postman, Figma, draw.io |

---

## 🚀 Getting started

<!-- TODO: adapt folder names and commands to your repository. -->

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Android Studio / Xcode, or a physical device, for the mobile app

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/fitlife.git
cd fitlife

# 2. Backend
cd backend
npm install
cp .env.example .env      # set your MongoDB URI, JWT secret, ...
npm run dev

# 3. Admin dashboard (web)
cd ../dashboard
npm install
npm run dev               # http://localhost:5173

# 4. Mobile app
cd ../mobile
npm install
npx react-native run-android
```

### Environment variables (example)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitlife
JWT_SECRET=change_me
```

---

## ☁️ Deployment

FitLife is deployed on an **Azure Virtual Machine** (Linux, B2s v2: 2 vCPU, 8 GB RAM):

- **Nginx** serves the React dashboard and acts as the entry point over HTTPS
- The **Node.js / Express** backend runs on the same VM and connects to **MongoDB**
- An Azure **Network Security Group (NSG)** restricts network access
- **Monitoring** follows the health of the VM

---

## 🗺️ Roadmap

- 🤖 AI-based workout recommendations
- 🥗 AI-personalized nutrition plans
- 📊 Advanced analytics for coaches
- 🎨 More personalization options

---

<div align="center">

**FitLife** · Train smarter, eat better 🚀

</div>
